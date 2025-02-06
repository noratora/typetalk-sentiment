import { ERROR_MESSAGES } from "@/app/lib/constants";
import { fetchMessages } from "@/app/lib/data";
import { auth } from "@/auth";
import { Session } from "@auth/core/types";
import { NextRequest } from "next/server";
import { format } from "util";
import { z } from "zod";

const validationSchema = z.object({
  topicId: z.number().int(),
  from: z.number().int().optional(),
});

interface NextAuthRequest extends NextRequest {
  auth: Session | null;
}

// NOTE: 2024-03-21 Dynamic Route Segments で Auth.js を使う場合、そのままだとパスパラメーターを渡せなかったため、以下のリンクを参考に実装した。
// https://github.com/nextauthjs/next-auth/discussions/9426#discussioncomment-7911695
export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      topicId: string;
    }>;
  }
): Promise<Response> {
  const resolvedParams = await context.params;

  // NOTE: 2024-04-11 環境変数 AUTH_URL が設定されている場合、 request から 認証情報が取得できないため、以下のリンクを参考に実装した。
  // https://github.com/nextauthjs/next-auth/discussions/9426#discussioncomment-8072123
  return auth(async (authRequest: NextAuthRequest) => {
    // 認証情報を取得する
    const session = authRequest.auth;
    if (!session) {
      return Response.json(
        { title: ERROR_MESSAGES.NOT_AUTHENTICATED },
        { status: 401 }
      );
    }
    const accessToken = session.access_token;

    // 入力パラメータ
    const searchParams = request.nextUrl.searchParams;
    const parsed = validationSchema.safeParse({
      topicId: Number(resolvedParams.topicId),
      from: searchParams.get("from")
        ? Number(searchParams.get("from"))
        : undefined,
    });

    if (!parsed.success) {
      const errorMessage = parsed.error.errors
        .map((err) => `${err.path.join(".")}:${err.message}`)
        .join(", ");

      return Response.json(
        {
          title: format(ERROR_MESSAGES.VALIDATION_ERROR, errorMessage),
        },
        { status: 400 }
      );
    }

    const { topicId, from } = parsed.data;

    // メッセージ一覧を取得する
    try {
      const result = await fetchMessages(accessToken, topicId, from);
      return Response.json(result);
    } catch (error) {
      return Response.json(
        { title: ERROR_MESSAGES.MESSAGE_FETCH_FAILED },
        { status: 500 }
      );
    }
  })(request, { params: resolvedParams }) as Promise<Response>;
}

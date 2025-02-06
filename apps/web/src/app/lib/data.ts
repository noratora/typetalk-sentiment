import "server-only";

import { ERROR_MESSAGES } from "@/app/lib/constants";
import { HttpResponseError, ResourceFetchError } from "@/app/lib/errors";
import { logger } from "@/app/lib/logger";
import {
  ErrorResponse,
  GetMessagesResponse,
  GetSpacesResponse,
  GetTopicsResponse,
} from "@/app/lib/types";
import { buildUrl } from "@/app/lib/url-utils";
import { env } from "@/env/server";

/**
 * APIからデータを取得する汎用関数
 * @template T APIから取得するデータの型
 * @param endpoint APIのエンドポイント
 * @param accessToken アクセストークン
 * @returns APIから取得したデータ
 * @throws {HttpResponseError} APIがエラーレスポンスを返した場合
 * @throws {ResourceFetchError} ネットワークエラーなどの予期せぬエラーが発生した場合
 */
async function fetchFromApi<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const method = "GET";

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        "x-typetalk-token": accessToken,
      },
    });

    if (!response.ok) {
      const errorResponse = (await response.json()) as ErrorResponse;
      throw new HttpResponseError(
        errorResponse.title,
        endpoint,
        method,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    const requestContext = {
      endpoint,
      method,
    };

    if (error instanceof HttpResponseError) {
      logger.error(ERROR_MESSAGES.API_RESPONSE_ERROR, error, {
        ...requestContext,
        statusCode: error.status,
      });
      throw error;
    }

    const originalError =
      error instanceof Error ? error : new Error(String(error));
    const wrappedError = new ResourceFetchError(
      ERROR_MESSAGES.DATA_FETCH,
      endpoint
    );
    wrappedError.cause = originalError;
    logger.error(ERROR_MESSAGES.DATA_FETCH, wrappedError, requestContext);
    throw wrappedError;
  }
}

/**
 * 組織一覧を取得する
 * @param accessToken アクセストークン
 * @returns 組織一覧のレスポンス
 * @throws {HttpResponseError | ResourceFetchError} データ取得に失敗した場合
 */
export async function fetchSpaces(
  accessToken: string
): Promise<GetSpacesResponse> {
  const url = buildUrl(env.BACKEND_HOST + "/spaces");
  return await fetchFromApi<GetSpacesResponse>(url, accessToken);
}

/**
 * トピック一覧を取得する
 * @param accessToken アクセストークン
 * @param spaceKey 組織キー
 * @returns トピック一覧のレスポンス
 * @throws {HttpResponseError | ResourceFetchError} データ取得に失敗した場合
 */
export async function fetchTopics(
  accessToken: string,
  spaceKey: string
): Promise<GetTopicsResponse> {
  const url = buildUrl(env.BACKEND_HOST + "/topics", {
    space_key: spaceKey,
  });
  return await fetchFromApi<GetTopicsResponse>(url, accessToken);
}

/**
 * メッセージ一覧を取得する
 * @param accessToken アクセストークン
 * @param topicId トピックID
 * @param from 開始位置
 * @returns メッセージ一覧のレスポンス
 * @throws {HttpResponseError | ResourceFetchError} データ取得に失敗した場合
 */
export async function fetchMessages(
  accessToken: string,
  topicId: number,
  from?: number
): Promise<GetMessagesResponse> {
  const url = buildUrl(env.BACKEND_HOST + `/topics/${topicId}/messages`, {
    from_id: from,
  });
  return await fetchFromApi<GetMessagesResponse>(url, accessToken);
}

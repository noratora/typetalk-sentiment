import { GET } from "@/app/api/topics/[topicId]/messages/route";
import { ERROR_MESSAGES } from "@/app/lib/constants";
import { fetchMessages } from "@/app/lib/data";
import { auth } from "@/auth";
import { NextRequest } from "next/server";
import { format } from "util";

// モックの設定
vi.mock("@/app/lib/data", () => ({
  fetchMessages: vi.fn(),
}));

// Auth.jsのauthモジュールのモック
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// メッセージ一覧取得API
describe("GET /api/topics/[topicId]/messages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 検証に使用しない共通のモックデータ
  const mockAccessToken = "mock-token";
  const mockTopicId = "123";

  // 正常系
  describe("happy cases", () => {
    // メッセージ一覧取得APIを呼び出した場合、指定したトピックのメッセージ一覧が取得される
    describe("When calling message list API then returns messages for the specified topic", () => {
      beforeEach(() => {
        // 認証済み状態のモックを設定
        vi.mocked(auth).mockImplementationOnce(
          (callback: any) => (request: NextRequest) =>
            callback({ auth: { access_token: mockAccessToken } })
        );
      });

      // メッセージ一覧取得APIを呼び出した場合、fetchMessagesの戻り値がレスポンスとして返される
      it("when calling message list API then returns fetchMessages result as response", async () => {
        // Arrange
        const testResponse = {
          topic: { id: 123, name: "テストトピック" },
          hasNext: false,
          posts: [
            {
              id: 1,
              message: "テストメッセージ",
              updatedAt: new Date().toISOString(),
              account: {
                id: 1,
                name: "テストユーザー",
                imageUrl: "http://example.com/image.jpg",
              },
            },
          ],
        };
        vi.mocked(fetchMessages).mockResolvedValueOnce(testResponse);
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams(),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: "123",
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(200);
        expect(responseBody).toEqual(testResponse);
        expect(fetchMessages).toHaveBeenCalledWith(
          mockAccessToken,
          123, // fetchMessagesは topicId を数値として受け取るため、"123" -> 123 に変換される
          undefined // from パラメータが指定されていないため、undefined が渡される
        );
      });

      // fromパラメータを指定した場合、fetchMessagesがその値で呼び出される
      it("when from parameter is provided then fetchMessages is called with the specified value", async () => {
        // Arrange
        vi.mocked(fetchMessages).mockResolvedValueOnce({} as any);
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams("from=456"),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: "123",
          }),
        };

        // Act
        await GET(request, context);

        // Assert
        expect(fetchMessages).toHaveBeenCalledWith(
          mockAccessToken,
          123,
          456 // from パラメータが指定されているため、456 が渡される
        );
      });
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // 認証エラー
    describe("authentication error", () => {
      // 未ログイン状態でアクセスすると、401エラーが返される
      it("when user is not authenticated then returns 401 error", async () => {
        // Arrange
        vi.mocked(auth).mockImplementationOnce(
          (callback: any) => (request: NextRequest) => callback({ auth: null })
        );
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams(),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: mockTopicId,
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(401);
        expect(responseBody).toEqual({
          title: ERROR_MESSAGES.NOT_AUTHENTICATED,
        });
      });
    });

    // バリデーションエラー
    describe("validation error", () => {
      beforeEach(() => {
        // 認証済み状態のモックを設定
        vi.mocked(auth).mockImplementationOnce(
          (callback: any) => (request: NextRequest) =>
            callback({ auth: { access_token: mockAccessToken } })
        );
      });

      // トピックIDに文字列を指定すると、400エラーが返される
      it("when topicId is non-numeric string then returns 400 error", async () => {
        // Arrange
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams(),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: "invalid",
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          title: format(
            ERROR_MESSAGES.VALIDATION_ERROR,
            "topicId:Expected number, received nan"
          ),
        });
      });

      // トピックIDに小数を指定すると、400エラーが返される
      it("when topicId is float number then returns 400 error", async () => {
        // Arrange
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams(),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: "123.45",
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          title: format(
            ERROR_MESSAGES.VALIDATION_ERROR,
            "topicId:Expected integer, received float"
          ),
        });
      });

      // fromパラメータに文字列を指定すると、400エラーが返される
      it("when from parameter is non-numeric string then returns 400 error", async () => {
        // Arrange
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams("from=invalid"),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: mockTopicId,
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          title: format(
            ERROR_MESSAGES.VALIDATION_ERROR,
            "from:Expected number, received nan"
          ),
        });
      });

      // fromパラメータに小数を指定すると、400エラーが返される
      it("when from parameter is float number then returns 400 error", async () => {
        // Arrange
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams("from=123.45"),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: mockTopicId,
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          title: format(
            ERROR_MESSAGES.VALIDATION_ERROR,
            "from:Expected integer, received float"
          ),
        });
      });
    });

    // メッセージ取得エラー
    describe("message fetch error", () => {
      beforeEach(() => {
        // 認証済み状態のモックを設定
        vi.mocked(auth).mockImplementationOnce(
          (callback: any) => (request: NextRequest) =>
            callback({ auth: { access_token: mockAccessToken } })
        );
      });

      // メッセージ取得時にサーバーエラーが発生すると、500エラーが返される
      it("when fetchMessages throws error then returns 500 error", async () => {
        // Arrange
        vi.mocked(fetchMessages).mockRejectedValueOnce(
          new Error("Fetch error")
        );
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams(),
          },
        } as NextRequest;
        const context = {
          params: Promise.resolve({
            topicId: mockTopicId,
          }),
        };

        // Act
        const response = await GET(request, context);
        const responseBody = await response.json();

        // Assert
        expect(response.status).toBe(500);
        expect(responseBody).toEqual({
          title: ERROR_MESSAGES.MESSAGE_FETCH_FAILED,
        });
      });
    });
  });
});

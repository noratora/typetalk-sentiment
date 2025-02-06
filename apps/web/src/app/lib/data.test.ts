import { fetchMessages, fetchSpaces, fetchTopics } from "@/app/lib/data";
import { HttpResponseError, ResourceFetchError } from "@/app/lib/errors";
import { ErrorResponse } from "@/app/lib/types";
import { env } from "@/env/server";

// サーバーサイド専用モジュールのモック
vi.mock("server-only", () => ({}));

// 環境変数のモック
vi.mock("@/env/server", () => ({
  env: {
    BACKEND_HOST: "http://mock-backend.com",
    LOG_LEVEL: "info",
  },
}));

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.resetAllMocks();
});

// 検証に使用しない共通のモックデータ
const mockAccessToken = "mock-token";
const mockSpaceKey = "mock-space";
const mockTopicId = 123;
const mockErrorResponse = {
  ok: false,
  status: 400,
  json: () => Promise.resolve({ title: "" } as ErrorResponse),
};

describe("fetchSpaces", () => {
  // 正常系
  describe("happy cases", () => {
    // APIが組織一覧のレスポンスを返した場合、期待通りの組織一覧が取得される
    it("when API returns organization list response then returns expected organization list", async () => {
      // Arrange
      const testAccessToken = "test-token";
      const testResponse = {
        spaces: [
          { key: "space1", name: "テスト組織1" },
          { key: "space2", name: "テスト組織2" },
        ],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(testResponse),
      });

      // Act
      const result = await fetchSpaces(testAccessToken);

      // Assert
      expect(result).toEqual(testResponse);
      expect(global.fetch).toHaveBeenCalledWith(`${env.BACKEND_HOST}/spaces`, {
        method: "GET",
        headers: {
          "x-typetalk-token": testAccessToken,
        },
      });
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // APIがエラーレスポンスを返した場合、HttpResponseErrorがスローされる
    it("when API returns error response then HttpResponseError is thrown", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockErrorResponse);

      // Act & Assert
      await expect(fetchSpaces(mockAccessToken)).rejects.toThrowError(
        HttpResponseError
      );
    });

    // 予期せぬエラーが発生した場合、ResourceFetchErrorがスローされる
    it("when unexpected error occurs then ResourceFetchError is thrown", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Unexpected error"));

      // Act & Assert
      await expect(fetchSpaces(mockAccessToken)).rejects.toThrowError(
        ResourceFetchError
      );
    });

    // 非Errorオブジェクトの例外が発生した場合、ResourceFetchErrorでラップされてスローされる
    it("when non-Error object exception occurs then ResourceFetchError is thrown with wrapped error", async () => {
      // Arrange
      mockFetch.mockRejectedValue("Unexpected string error");

      // Act & Assert
      await expect(fetchSpaces(mockAccessToken)).rejects.toSatisfy((error) => {
        return (
          error instanceof ResourceFetchError &&
          error.name === "ResourceFetchError" &&
          error.cause instanceof Error &&
          error.cause.message === "Unexpected string error"
        );
      });
    });
  });
});

describe("fetchTopics", () => {
  // 正常系
  describe("happy cases", () => {
    // APIがトピック一覧のレスポンスを返した場合、期待通りのトピック一覧が取得される
    it("when API returns topic list response then returns expected topic list", async () => {
      // Arrange
      const testAccessToken = "test-token";
      const testSpaceKey = "test-space";
      const testResponse = {
        topics: [{ id: 1, name: "テストトピック" }],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(testResponse),
      });

      // Act
      const result = await fetchTopics(testAccessToken, testSpaceKey);

      // Assert
      expect(result).toEqual(testResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${env.BACKEND_HOST}/topics?space_key=${testSpaceKey}`,
        {
          method: "GET",
          headers: {
            "x-typetalk-token": testAccessToken,
          },
        }
      );
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // APIがエラーレスポンスを返した場合、HttpResponseErrorがスローされる
    it("when API returns error response then HttpResponseError is thrown", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockErrorResponse);

      // Act & Assert
      await expect(
        fetchTopics(mockAccessToken, mockSpaceKey)
      ).rejects.toThrowError(HttpResponseError);
    });

    // 予期せぬエラーが発生した場合、ResourceFetchErrorがスローされる
    it("when unexpected error occurs then ResourceFetchError is thrown", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Unexpected error"));

      // Act & Assert
      await expect(
        fetchTopics(mockAccessToken, mockSpaceKey)
      ).rejects.toThrowError(ResourceFetchError);
    });
  });
});

describe("fetchMessages", () => {
  // 正常系
  describe("happy cases", () => {
    // APIがメッセージ一覧のレスポンスを返した場合、期待通りのメッセージ一覧が取得される
    it("when API returns message list response then returns expected message list", async () => {
      // Arrange
      const testAccessToken = "test-token";
      const testTopicId = 123;
      const testResponse = {
        topic: { id: testTopicId, name: "テストトピック" },
        posts: [{ id: 1, message: "テストメッセージ" }],
        hasNext: false,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(testResponse),
      });

      // Act
      const result = await fetchMessages(testAccessToken, testTopicId);

      // Assert
      expect(result).toEqual(testResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${env.BACKEND_HOST}/topics/${testTopicId}/messages`,
        {
          method: "GET",
          headers: {
            "x-typetalk-token": testAccessToken,
          },
        }
      );
    });

    // fromパラメータが指定された場合、クエリパラメーターfrom_idが付与されたURLでAPIが呼び出される
    it("when from parameter is specified then API is called with URL with query parameter from_id", async () => {
      // Arrange
      const testAccessToken = "test-token";
      const testTopicId = 123;
      const testFrom = 456;
      const testResponse = {
        topic: { id: testTopicId, name: "テストトピック" },
        posts: [{ id: 1, message: "テストメッセージ" }],
        hasNext: false,
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(testResponse),
      });

      // Act
      const result = await fetchMessages(
        testAccessToken,
        testTopicId,
        testFrom
      );

      // Assert
      expect(result).toEqual(testResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `${env.BACKEND_HOST}/topics/${testTopicId}/messages?from_id=${testFrom}`,
        {
          method: "GET",
          headers: {
            "x-typetalk-token": testAccessToken,
          },
        }
      );
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // APIがエラーレスポンスを返した場合、HttpResponseErrorがスローされる
    it("when API returns error response then HttpResponseError is thrown", async () => {
      // Arrange
      mockFetch.mockResolvedValue(mockErrorResponse);

      // Act & Assert
      await expect(
        fetchMessages(mockAccessToken, mockTopicId)
      ).rejects.toThrowError(HttpResponseError);
    });

    // 予期せぬエラーが発生した場合、ResourceFetchErrorがスローされる
    it("when unexpected error occurs then ResourceFetchError is thrown", async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error("Unexpected error"));

      // Act & Assert
      await expect(
        fetchMessages(mockAccessToken, mockTopicId)
      ).rejects.toThrowError(ResourceFetchError);
    });
  });
});

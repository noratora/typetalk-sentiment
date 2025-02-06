import { ERROR_MESSAGES } from "@/app/lib/constants";
import { ErrorResponse } from "@/app/lib/types";
import { useMessages } from "@/app/spaces/[spaceKey]/topics/[topicId]/messages/hooks/useMessages";
import { act, renderHook } from "@testing-library/react";

// useToastのモック
const mockShowToast = vi.fn();
vi.mock("@/app/contexts/toast-provider", () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

describe("useMessages", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // fetchのモック
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  // 検証に使用しない共通のモックデータ
  const mockInitialTopic = { id: 123, name: "テストトピック" };
  const mockInitialAccount = {
    id: 1,
    name: "テストユーザー",
    imageUrl: "http://example.com/image.jpg",
  };
  const mockInitialMessages = {
    topic: mockInitialTopic,
    hasNext: true,
    posts: [
      {
        id: 1,
        message: "初期メッセージ",
        updatedAt: new Date().toISOString(),
        account: mockInitialAccount,
      },
    ],
  };
  const mockAdditionalMessages = {
    hasNext: false,
    posts: [{ id: 2, message: "追加メッセージ" }],
  };

  // 初期状態
  describe("initial state", () => {
    // 指定された初期値でpostsとhasNextが設定され、isLoadingはfalseが設定される
    it("when hook is initialized with initial values then posts and hasNext are set to specified values and isLoading is set to false", () => {
      // Arrange
      const testInitialMessages = {
        topic: mockInitialTopic,
        hasNext: true,
        posts: [
          {
            id: 1,
            message: "テストメッセージ",
            updatedAt: new Date().toISOString(),
            account: mockInitialAccount,
          },
        ],
      };

      // Act
      const { result } = renderHook(() => useMessages(testInitialMessages));

      // Assert
      expect(result.current.posts).toEqual(testInitialMessages.posts);
      expect(result.current.hasNext).toBe(true);
      expect(result.current.isLoading).toBe(false); // isLoadingの初期値は false である
    });
  });

  describe("loadMoreMessages", () => {
    // 正常系
    describe("happy cases", () => {
      // メッセージ読み込み時に新しいメッセージが追加され、hasNextがAPIレスポンスの値で更新される
      it("when messages are loaded then new messages are added and hasNext is updated to API response value", async () => {
        // Arrange
        const testInitialMessages = {
          topic: mockInitialTopic,
          hasNext: true,
          posts: [
            {
              id: 1,
              message: "初期メッセージ",
              updatedAt: new Date().toISOString(),
              account: mockInitialAccount,
            },
          ],
        };
        const testAdditionalMessages = {
          hasNext: false,
          posts: [{ id: 2, message: "追加メッセージ" }],
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(testAdditionalMessages),
        });
        const { result } = renderHook(() => useMessages(testInitialMessages));

        // Act
        await act(async () => {
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(result.current.posts).toEqual([
          ...testInitialMessages.posts, // 初期メッセージ1件
          ...testAdditionalMessages.posts, // 追加メッセージ1件
        ]);

        expect(result.current.hasNext).toBe(false); // 追加メッセージでhasNextがfalseに更新される
      });

      // メッセージ読み込み中はisLoadingがtrueとなり、完了後にfalseになる
      it("when loading messages then isLoading becomes true and when completed then becomes false", async () => {
        // Arrange
        // Promiseの解決を手動制御するためのモック設定
        let resolveApiCall: (value: unknown) => void;
        mockFetch.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveApiCall = resolve;
            })
        );
        const { result } = renderHook(() => useMessages(mockInitialMessages));

        // Act & Assert
        // ローディング開始
        act(() => {
          // 非同期処理を開始するが、まだPromiseは解決しない
          result.current.loadMoreMessages();
        });
        expect(result.current.isLoading).toBe(true); // API呼び出し中はローディング状態になる

        // ローディング完了
        await act(async () => {
          // 手動でPromiseを解決する
          resolveApiCall!({
            ok: true,
            json: () => Promise.resolve(mockAdditionalMessages),
          });
        });
        expect(result.current.isLoading).toBe(false); // API呼び出し完了後はローディング状態が解除される
      });

      // 取得したメッセージに重複がある場合、重複を除いて新しいメッセージのみが追加される
      it("when retrieved messages have duplicates then only new messages are added without duplicates", async () => {
        // Arrange
        const testInitialPost = {
          id: 1,
          message: "初期メッセージ",
          updatedAt: new Date().toISOString(),
          account: mockInitialAccount,
        };
        const testInitialMessages = {
          topic: mockInitialTopic,
          hasNext: true,
          posts: [testInitialPost],
        };
        const testAdditionalMessages = {
          hasNext: true,
          posts: [
            testInitialPost, // 既存メッセージと重複
            { id: 2, message: "新しいメッセージ" }, // 新規メッセージ
          ],
        };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(testAdditionalMessages),
        });
        const { result } = renderHook(() => useMessages(testInitialMessages));

        // Act
        await act(async () => {
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(result.current.posts.length).toBe(2);
        expect(result.current.posts[0].id).toBe(1); // 既存メッセージ
        expect(result.current.posts[1].id).toBe(2); // 新規メッセージのみ追加される
      });

      // メッセージを連続して読み込んだ場合、全てのメッセージが取得順に追加され、hasNextが最後のレスポンス値に設定される
      it("when messages are loaded consecutively then all messages are added in retrieval order and hasNext is set to last response value", async () => {
        // Arrange
        const testInitialMessages = {
          topic: mockInitialTopic,
          hasNext: true,
          posts: [
            {
              id: 1,
              message: "初期メッセージ",
              updatedAt: new Date().toISOString(),
              account: mockInitialAccount,
            },
          ],
        };
        const testAdditionalMessages1 = {
          posts: [{ id: 2, message: "新しいメッセージ1" }],
          hasNext: true,
        };
        const testAdditionalMessages2 = {
          posts: [{ id: 3, message: "新しいメッセージ2" }],
          hasNext: false,
        };
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(testAdditionalMessages1),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(testAdditionalMessages2),
          });
        const { result } = renderHook(() => useMessages(testInitialMessages));

        // Act
        await act(async () => {
          await result.current.loadMoreMessages();
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(result.current.posts).toEqual([
          testInitialMessages.posts[0], // 初期メッセージ
          testAdditionalMessages1.posts[0], // 1回目の追加メッセージ
          testAdditionalMessages2.posts[0], // 2回目の追加メッセージ
        ]);
        expect(result.current.hasNext).toBe(false); // 最後のレスポンスのhasNextでfalseに更新される
      });

      // メッセージ読み込み中に新しい読み込みリクエストが呼び出された場合、後続のリクエストは無視される
      it("when new load request is called during message loading then subsequent requests are ignored", async () => {
        // Arrange
        const { result } = renderHook(() => useMessages(mockInitialMessages));

        // Act & Assert
        // 1回目の読み込みを開始
        act(() => {
          result.current.loadMoreMessages();
        });

        // 読み込み中の状態であることを確認
        expect(result.current.isLoading).toBe(true);

        // 読み込み中に追加のリクエストを試みる
        await act(async () => {
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(mockFetch).toHaveBeenCalledTimes(1); // 2回目のリクエストは無視され、APIは1回しか呼び出されない
      });
    });

    // 異常系
    describe("unhappy cases", () => {
      // APIがエラーレスポンスを返した場合、HttpResponseErrorがスローされ、そのメッセージがトースト表示される
      it("when API returns error response then HttpResponseError is thrown and error message is displayed as toast", async () => {
        // Arrange
        const testErrorTitle = "API error message";
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () =>
            Promise.resolve({ title: testErrorTitle } as ErrorResponse),
        });
        const { result } = renderHook(() => useMessages(mockInitialMessages));

        // Act
        await act(async () => {
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(mockShowToast).toHaveBeenCalledWith(testErrorTitle, "error");
        expect(result.current.isLoading).toBe(false);
      });

      // Errorインスタンスがスローされた場合、エラーメッセージがトースト表示される
      it("when Error instance is thrown then error message is displayed as toast", async () => {
        // Arrange
        mockFetch.mockRejectedValueOnce(new Error("Network error"));
        const { result } = renderHook(() => useMessages(mockInitialMessages));

        // Act
        await act(async () => {
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(mockShowToast).toHaveBeenCalledWith("Network error", "error");
        expect(result.current.isLoading).toBe(false);
      });

      // Error以外の値がスローされた場合、予期せぬエラーとしてトースト表示される
      it("when non-Error value is thrown then unexpected error is displayed as toast", async () => {
        // Arrange
        mockFetch.mockRejectedValueOnce("Unexpected string error");
        const { result } = renderHook(() => useMessages(mockInitialMessages));

        // Act
        await act(async () => {
          await result.current.loadMoreMessages();
        });

        // Assert
        expect(mockShowToast).toHaveBeenCalledWith(
          ERROR_MESSAGES.UNEXPECTED,
          "error"
        );
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});

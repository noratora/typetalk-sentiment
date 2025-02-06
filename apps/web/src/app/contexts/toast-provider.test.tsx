import { ToastProvider, useToast } from "@/app/contexts/toast-provider";
import { ProviderRequiredError } from "@/app/lib/errors";
import {
  act,
  cleanup,
  renderHook,
  screen,
  within,
} from "@testing-library/react";

describe("ToastProvider", () => {
  // タイマーのモック化
  vi.useFakeTimers();

  beforeEach(() => {
    vi.clearAllTimers();
    cleanup();
  });

  // 正常系
  describe("happy cases", () => {
    // トースト通知が表示されていない場合、トースト要素は存在しない
    it("when no toast is displayed then toast element does not exist", () => {
      // Arrange & Act
      renderHook(() => useToast(), { wrapper: ToastProvider });

      // Assert
      const logContainer = screen.getByRole("log");
      expect(logContainer).toBeEmptyDOMElement();
    });

    // トースト通知が表示されていない場合、トースト要素は存在しない
    it("when showToast is called then toast is displayed with specified message and type", () => {
      // Arrange
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });
      const logContainer = screen.getByRole("log");
      const withinLog = within(logContainer);

      // Act
      act(() => {
        result.current.showToast("テストメッセージ", "success");
      });

      // Assert
      expect(withinLog.getByText("テストメッセージ")).toBeInTheDocument();
    });

    // エラータイプのトースト通知の場合、role='alert'属性が付与される
    it("when toast type is error then role='alert' attribute is added", () => {
      // Arrange
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });
      const logContainer = screen.getByRole("log");
      const withinLog = within(logContainer);

      // Act
      act(() => {
        result.current.showToast("エラーメッセージ", "error");
      });

      // Assert
      const alert = withinLog.getByRole("alert");
      expect(alert).toHaveTextContent("エラーメッセージ");
    });

    // トースト通知が表示されてから5秒後に自動的に非表示になる
    it("when toast is displayed then it automatically hides after 5 seconds", () => {
      // Arrange
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });
      const logContainer = screen.getByRole("log");
      const withinLog = within(logContainer);

      // Act
      act(() => {
        result.current.showToast("テストメッセージ", "success");
      });

      // Assert - トースト表示の確認
      expect(withinLog.getByText("テストメッセージ")).toBeInTheDocument();

      // Act - 4秒経過
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      // Assert - 4秒後もまだ表示されていることを確認
      expect(withinLog.getByText("テストメッセージ")).toBeInTheDocument();

      // Act - さらに1秒経過(計5秒)
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Assert - 5秒後に非表示になることを確認
      expect(withinLog.queryByText("テストメッセージ")).not.toBeInTheDocument();
    });

    // 複数のトースト通知が表示された場合、それぞれが独立して5秒後に非表示になる
    it("when multiple toasts are displayed then each hides independently after 5 seconds", () => {
      // Arrange
      const { result } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });
      const logContainer = screen.getByRole("log");
      const withinLog = within(logContainer);

      // Act - 1つ目のトースト表示
      act(() => {
        result.current.showToast("メッセージ1", "success");
      });

      // Assert - 1つ目のトースト表示確認
      expect(withinLog.getByText("メッセージ1")).toBeInTheDocument();

      // Act - 2秒経過後、2つ目のトースト表示
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      act(() => {
        result.current.showToast("メッセージ2", "error");
      });

      // Assert - 両方のトースト表示確認
      expect(withinLog.getByText("メッセージ1")).toBeInTheDocument();
      expect(withinLog.getByText("メッセージ2")).toBeInTheDocument();

      // Act - さらに3秒経過(1つ目のトーストが消える)
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Assert - 1つ目消失、2つ目表示確認
      expect(withinLog.queryByText("メッセージ1")).not.toBeInTheDocument();
      expect(withinLog.getByText("メッセージ2")).toBeInTheDocument();

      // Act - さらに2秒経過(2つ目のトーストも消える)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Assert - 両方のトースト消失確認
      expect(withinLog.queryByText("メッセージ2")).not.toBeInTheDocument();
    });

    // アンマウント時に全てのタイマーがクリアされる
    it("when component unmounts then all timers are cleared", () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const { result, unmount } = renderHook(() => useToast(), {
        wrapper: ToastProvider,
      });
      const logContainer = screen.getByRole("log");
      const withinLog = within(logContainer);

      // Act - 1つ目のトースト表示
      act(() => {
        result.current.showToast("メッセージ1", "success");
      });

      // Act - 少し時間をおいて2つ目のトースト表示
      act(() => {
        vi.advanceTimersByTime(100); // 適当な間隔を空ける
        result.current.showToast("メッセージ2", "error");
      });

      // Assert - トーストが表示されていることを確認
      expect(withinLog.getByText("メッセージ1")).toBeInTheDocument();
      expect(withinLog.getByText("メッセージ2")).toBeInTheDocument();

      // Act - アンマウント
      unmount();

      // Assert - clearTimeoutが2回呼ばれたことを確認(トースト2つ分)
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);

      clearTimeoutSpy.mockRestore();
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // ToastProviderの外部でuseToastが使用された場合、ProviderRequiredErrorがスローされる
    it("when useToast is used outside ToastProvider then ProviderRequiredError is thrown", () => {
      // Act & Assert
      expect(() => renderHook(() => useToast())).toThrowError(
        ProviderRequiredError
      );
    });
  });
});

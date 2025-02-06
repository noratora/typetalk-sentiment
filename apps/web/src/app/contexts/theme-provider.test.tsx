import ThemeProvider, { useTheme } from "@/app/contexts/theme-provider";
import { ProviderRequiredError } from "@/app/lib/errors";
import { act, renderHook } from "@testing-library/react";

describe("ThemeProvider", () => {
  // ローカルストレージのモック
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  };
  Object.defineProperty(window, "localStorage", {
    value: mockLocalStorage,
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 正常系
  describe("happy cases", () => {
    // ローカルストレージにテーマが保存されていない場合、デフォルトテーマ(light)が設定される
    it("when theme is not stored in localStorage then default theme (light) is set", () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue(null);

      // Act
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Assert
      expect(result.current.theme).toBe("light");
    });

    // ローカルストレージにテーマが保存されている場合、保存されているテーマが読み込まれる
    it("when theme is stored in localStorage then stored theme is loaded", () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue("dark");

      // Act
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Assert
      expect(result.current.theme).toBe("dark");
    });

    // toggleThemeが呼び出された場合、テーマが切り替わりローカルストレージに保存される
    it("when toggleTheme is called then theme is switched and saved to localStorage", () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue("light");
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Act
      act(() => {
        result.current.toggleTheme();
      });

      // Assert
      expect(result.current.theme).toBe("dark");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "dark");
    });

    // テーマが切り替えられた場合、ローカルストレージが更新される
    it("when theme is toggled then localStorage is updated with new theme", () => {
      // Arrange
      mockLocalStorage.getItem.mockReturnValue("light");
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      // Act & Assert
      act(() => {
        result.current.toggleTheme(); // light -> dark
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "dark");

      act(() => {
        result.current.toggleTheme(); // dark -> light
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("theme", "light");
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // ThemeProviderの外部でuseThemeが使用された場合、ProviderRequiredErrorがスローされる
    it("when useTheme is used outside ThemeProvider then ProviderRequiredError is thrown", () => {
      // Act & Assert
      expect(() => renderHook(() => useTheme())).toThrowError(
        ProviderRequiredError
      );
    });
  });
});

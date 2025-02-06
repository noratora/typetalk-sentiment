import { InvalidParameterError } from "@/app/lib/errors";
import { buildUrl } from "@/app/lib/url-utils";

describe("buildUrl", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 正常系
  describe("happy cases", () => {
    // パラメータを指定した場合、クエリ文字列が付加されたURLが返される
    describe("when parameters are specified, then returns URL with query string", () => {
      // 単純なキーと値のペア
      describe("simple key-value pairs", () => {
        // キーと値のペアのパラメータを指定すると、URLクエリ文字列の標準形式に従って変換されたURLが返される
        it.each([
          [
            // 文字列パラメータ
            "string parameter",
            { key: "value" },
            "/api/test?key=value",
          ],
          [
            // 数値パラメータ
            "number parameter",
            { key: 123 },
            "/api/test?key=123",
          ],
          [
            // 複数パラメータ
            "multiple parameters",
            { key1: "value1", key2: 123 },
            "/api/test?key1=value1&key2=123",
          ],
        ])(
          "when %s is provided then returns URL with query string",
          (_, params, expected) => {
            // Arrange
            const path = "/api/test";

            // Act
            const result = buildUrl(path, params);

            // Assert
            expect(result).toBe(expected);
          }
        );
      });

      // 配列を含むパラメータ
      describe("parameters with arrays", () => {
        // 配列を含むパラメータを指定すると、配列の各要素が同じキー名で複数のkey=value形式に展開されたクエリ文字列が付加されたURLが返される
        it.each([
          [
            // 配列パラメータ
            "array parameter",
            { tag: ["javascript", "typescript"] },
            "/api/test?tag=javascript&tag=typescript",
          ],
          [
            // 数値配列パラメータ
            "number array parameter",
            { id: [1, 2, 3] },
            "/api/test?id=1&id=2&id=3",
          ],
          [
            // 単一値と配列を混在させたパラメータ
            "mixed single and array parameters",
            {
              category: "programming",
              tag: ["javascript", "typescript"],
              page: 1,
            },
            "/api/test?category=programming&tag=javascript&tag=typescript&page=1",
          ],
        ])(
          "when %s is provided then returns URL with expanded query string",
          (_, params, expected) => {
            // Arrange
            const path = "/api/test";

            // Act
            const result = buildUrl(path, params);

            // Assert
            expect(result).toBe(expected);
          }
        );
      });

      // 特殊文字を含むパラメータ
      describe("parameters with special characters", () => {
        // 特殊文字を含むパラメータを指定すると、URLエンコード形式に変換されたクエリ文字列が付加されたURLが返される
        it.each([
          [
            // スペースと日本語を含むパラメータ
            "parameters with spaces and Japanese",
            { key: "value with spaces", japanese: "日本語" },
            // URLエンコード後: スペース は "+" に変換される, "日本語" は "%E6%97%A5%E6%9C%AC%E8%AA%9E" に変換される
            "/api/test?key=value+with+spaces&japanese=%E6%97%A5%E6%9C%AC%E8%AA%9E",
          ],
          [
            // スペースと日本語を含む配列要素
            "array parameters with spaces and Japanese",
            { tags: ["tag with space", "タグ"] },
            // URLエンコード後: スペース は "+" に変換される, "タグ" は "%E3%82%BF%E3%82%B0" に変換される
            "/api/test?tags=tag+with+space&tags=%E3%82%BF%E3%82%B0",
          ],
        ])(
          "when %s are provided then returns URL with encoded values",
          (_, params, expected) => {
            // Arrange
            const path = "/api/test";

            // Act
            const result = buildUrl(path, params);

            // Assert
            expect(result).toBe(expected);
          }
        );
      });

      // 特定のパラメータ値
      describe("specific parameter values", () => {
        // 特殊な値(空文字列や0など)のパラメータを指定すると、値をそのままの形でクエリ文字列に変換したURLが返される
        it.each([
          [
            // 空文字列のパラメータ値
            "empty string parameter value",
            { key: "" },
            "/api/test?key=",
          ],
          [
            // 数値0のパラメータ値
            "number 0 parameter value",
            { count: 0 },
            "/api/test?count=0",
          ],
        ])(
          "when %s is provided then returns URL with the value as-is",
          (_, params, expected) => {
            // Arrange
            const path = "/api/test";

            // Act
            const result = buildUrl(path, params);

            // Assert
            expect(result).toBe(expected);
          }
        );
      });
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // 値を持たないパラメータを指定した場合、クエリ文字列に追加されずURLが返される
    describe("when parameters with no value are specified, then returns URL without query string", () => {
      // 値を持たないパラメータを指定すると、そのパラメータを除外したURLが返される
      it.each([
        [
          // パラメータがundefined
          "parameter is undefined",
          undefined,
          "/api/test",
        ],
        [
          // パラメータが空オブジェクト
          "parameter is empty object",
          {},
          "/api/test",
        ],
        [
          // パラメータ値がundefined
          "parameter value is undefined",
          { key1: "value1", key2: undefined, key3: 123 },
          "/api/test?key1=value1&key3=123",
        ],
      ])(
        "when %s then returns URL without query string",
        (_, params, expected) => {
          // Arrange
          const path = "/api/test";

          // Act
          const result = buildUrl(path, params);

          // Assert
          expect(result).toBe(expected);
        }
      );
    });

    // パスに無効な値を指定した場合、エラーがスローされる
    describe("when invalid path is specified, then throws InvalidParameterError", () => {
      // 空のパスでInvalidParameterErrorがスローされる
      it("when path is empty then throws InvalidParameterError", () => {
        // Arrange
        const path = "";
        const expectedMessage = "パラメータ「path」の値「」は無効です。";

        // Act & Assert
        expect(() => buildUrl(path)).toThrowError(InvalidParameterError);
      });
    });
  });
});

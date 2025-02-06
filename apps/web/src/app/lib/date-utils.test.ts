import { ERROR_MESSAGES } from "@/app/lib/constants";
import { formatDate } from "@/app/lib/date-utils";
import { InvalidDateError } from "@/app/lib/errors";
import { format } from "util";

describe("formatDate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // 正常系: ISO 8601形式の日付文字列をJSTの'yyyy/MM/dd HH:mm'形式にフォーマットする
  describe("happy cases: when ISO 8601 date string is provided then formats to JST 'yyyy/MM/dd HH:mm'", () => {
    // ISO 8601形式の日付文字列をJSTの'yyyy/MM/dd HH:mm'形式にフォーマットする
    it.each([
      [
        // UTCの日付文字列
        "UTC",
        "2023-04-01T12:00:00Z",
        "2023/04/01 21:00",
      ],
      [
        // JSTの日付文字列
        "JST",
        "2023-01-01T00:00:00+09:00",
        "2023/01/01 00:00",
      ],
      [
        // UTC+00:00の日付文字列
        "UTC+00:00",
        "2023-01-01T15:00:00+00:00",
        "2023/01/02 00:00",
      ],
      [
        // 正のオフセットを持つタイムゾーンの日付文字列
        "positive offset timezone",
        "2023-01-01T12:00:00+03:00",
        "2023/01/01 18:00",
      ],
      [
        // 負のオフセットを持つタイムゾーンの日付文字列
        "negative offset timezone",
        "2023-01-01T12:00:00-05:00",
        "2023/01/02 02:00",
      ],
    ])(
      "when %s date string is provided then formats to JST 'yyyy/MM/dd HH:mm'",
      (_, input, expected) => {
        // Act
        const result = formatDate(input);

        // Assert
        expect(result).toBe(expected);
      }
    );

    // ミリ秒を含む日付文字列'2023-04-01T12:00:00.123Z'を'2023/04/01 21:00'にフォーマットし、ミリ秒を無視する
    it("when date string with milliseconds '2023-04-01T12:00:00.123Z' is provided then formats to '2023/04/01 21:00' ignoring milliseconds", () => {
      // Arrange
      const input = "2023-04-01T12:00:00.123Z";
      const expected = "2023/04/01 21:00"; // UTC 12:00 + 9時間 = JST 21:00、ミリ秒は無視

      // Act
      const result = formatDate(input);

      // Assert
      expect(result).toBe(expected);
    });

    // うるう年の日付'2020-02-29T12:00:00Z'を'2020/02/29 21:00'にフォーマットする
    it("when leap year date '2020-02-29T12:00:00Z' is provided then formats to '2020/02/29 21:00'", () => {
      // Arrange
      const input = "2020-02-29T12:00:00Z";
      const expected = "2020/02/29 21:00"; // UTC 12:00 + 9時間 = JST 21:00

      // Act
      const result = formatDate(input);

      // Assert
      expect(result).toBe(expected);
    });
  });

  // 異常系
  describe("unhappy cases", () => {
    // 無効な日付文字列が渡された場合、InvalidDateErrorがスローされる
    it.each([
      [
        // 無効な日付文字列
        "invalid date",
        "invalid-date",
      ],
      [
        // 空文字列
        "empty string",
        "",
      ],
      [
        // ISO 8601形式でない日付文字列
        "non-ISO-8601 format",
        "2023/04/01",
      ],
      [
        // 存在しない日付
        "non-existent date",
        "2023-02-30T00:00:00Z",
      ],
    ])("when %s is provided then throws InvalidDateError", (_, input) => {
      // Arrange
      const expectedMessage = format(ERROR_MESSAGES.INVALID_DATE, input);

      // Act & Assert
      expect(() => formatDate(input)).toThrowError(InvalidDateError);
    });
  });
});

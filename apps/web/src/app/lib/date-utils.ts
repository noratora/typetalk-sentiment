import { InvalidDateError } from "@/app/lib/errors";
import { TZDate } from "@date-fns/tz";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const JST_TIMEZONE = "Asia/Tokyo";
const DATE_FORMAT = "yyyy/MM/dd HH:mm";

/**
 * ISO 8601形式の日付文字列をJSTの'yyyy/MM/dd HH:mm'形式にフォーマットする
 *
 * @param {string} dateString - ISO 8601形式の日付文字列(例: "2023-04-01T12:00:00Z")
 * @returns {string} "yyyy/MM/dd HH:mm"形式でフォーマットされたJST日時文字列
 * @throws {InvalidDateError} 無効な日付文字列が渡された場合
 */
export function formatDate(dateString: string): string {
  try {
    const jstDate = new TZDate(parseISO(dateString), JST_TIMEZONE);
    return format(jstDate, DATE_FORMAT, { locale: ja });
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) {
      const wrappedError = new InvalidDateError(dateString);
      wrappedError.cause = error;
      throw wrappedError;
    }
    throw error;
  }
}

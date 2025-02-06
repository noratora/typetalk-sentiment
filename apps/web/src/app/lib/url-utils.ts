import { InvalidParameterError } from "@/app/lib/errors";

/**
 * URLを構築する
 * @param path URLのパス(空文字列は不可)
 * @param params クエリパラメータ。値として文字列、数値、またはそれらの配列を指定可能
 * @returns 構築されたURL
 * @throws {InvalidParameterError} URLのパスが空文字列の場合
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | (string | number)[] | undefined>
): string {
  if (!path) {
    throw new InvalidParameterError("path", path);
  }

  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, String(v)));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

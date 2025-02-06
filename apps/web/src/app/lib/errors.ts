import { ERROR_MESSAGES } from "@/app/lib/constants";
import { format } from "util";

/**
 * アプリケーション固有のエラーの基底クラス
 * すべてのカスタムエラークラスの親クラスとして使用します
 * @param message エラーメッセージ
 */
export abstract class AppBaseError extends Error {
  readonly name: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * HTTP通信に関連するエラーの基底クラス
 * APIリクエストやデータフェッチに関連するエラーの親クラスとして使用します
 * @param message エラーメッセージ
 * @param endpoint エラーが発生したAPIのエンドポイント
 * @param method エラーが発生したAPIのメソッド
 */
export abstract class HttpError extends AppBaseError {
  readonly endpoint: string;
  readonly method: string;

  constructor(message: string, endpoint: string, method: string) {
    super(message);
    this.endpoint = endpoint;
    this.method = method;
  }
}

/**
 * バリデーション関連エラーの基底クラス
 * 入力値の検証に関連するエラーの親クラスとして使用します
 * @param message エラーメッセージ
 */
export abstract class ValidationError extends AppBaseError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * HTTPレスポンスのエラーを表すクラス
 * HTTPレスポンスが正常でない場合に使用します
 * @param message エラーメッセージ
 * @param endpoint エラーが発生したAPIのエンドポイント
 * @param method エラーが発生したAPIのメソッド
 * @param status HTTPステータスコード
 */
export class HttpResponseError extends HttpError {
  readonly status: number;

  constructor(
    message: string,
    endpoint: string,
    method: string,
    status: number
  ) {
    const errorMessage = message.trim() || ERROR_MESSAGES.API_RESPONSE_ERROR;
    super(errorMessage, endpoint, method);
    this.status = status;
  }
}

/**
 * リソース取得時のエラーを表すクラス
 * HttpResponseError以外の予期せぬエラーを扱う場合に使用します
 * @param message エラーメッセージ
 * @param endpoint エラーが発生したAPIのエンドポイント
 */
export class ResourceFetchError extends HttpError {
  constructor(message: string, endpoint: string) {
    const errorMessage = message.trim() || ERROR_MESSAGES.DATA_FETCH;
    super(errorMessage, endpoint, "GET");
  }
}

/**
 * 無効なパラメータが指定された場合のエラーを表すクラス
 * @param paramName パラメータ名
 * @param value 無効と判定された値
 */
export class InvalidParameterError extends ValidationError {
  constructor(paramName: string, value: string) {
    super(format(ERROR_MESSAGES.INVALID_PARAMETER, paramName, value));
  }
}

/**
 * 無効な日付文字列を扱うエラーを表すクラス
 * @param dateString 無効と判定された日付文字列
 */
export class InvalidDateError extends ValidationError {
  constructor(dateString: string) {
    super(format(ERROR_MESSAGES.INVALID_DATE, dateString));
  }
}

/**
 * Reactコンテキストプロバイダーの外部でフックが使用された場合のエラーを表すクラス
 * @param hookName プロバイダー外で使用されたフックの名前
 * @param providerName 必要なプロバイダーの名前
 */
export class ProviderRequiredError extends AppBaseError {
  constructor(hookName: string, providerName: string) {
    super(format(ERROR_MESSAGES.PROVIDER_REQUIRED, hookName, providerName));
  }
}

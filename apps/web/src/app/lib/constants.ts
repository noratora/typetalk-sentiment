/** ページタイトル */
export const PAGE_TITLES = {
  SPACE_LIST: "組織一覧",
  TOPIC_LIST: "トピック一覧",
  MESSAGE_LIST: "メッセージ一覧",
} as const;

/** エラーメッセージ */
export const ERROR_MESSAGES = {
  UNEXPECTED: "予期しないエラーが発生しました。",
  API_RESPONSE_ERROR: "APIがエラーレスポンスを返しました。",
  DATA_FETCH: "データの取得に失敗しました。",
  MESSAGE_FETCH_FAILED: "メッセージの取得に失敗しました。",
  INVALID_DATE: "無効な日付文字列です: %s。",
  NOT_AUTHENTICATED: "認証されていません。",
  INVALID_PARAMETER: "パラメータ「%s」の値「%s」は無効です。",
  VALIDATION_ERROR: "パラメータの検証に失敗しました: %s。",
  PROVIDER_REQUIRED: "%sは%s内で使用する必要があります。",
} as const;

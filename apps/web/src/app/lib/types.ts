/**
 * APIエラーレスポンスを表すスキーマ
 */
export interface ErrorResponse {
  title: string;
}

/**
 * Typetalkのアカウントを表すスキーマ
 */
export interface Account {
  id: number;
  name: string;
  imageUrl: string;
}

/**
 * Typetalkの組織を表すスキーマ
 */
export interface Space {
  key: string;
  name: string;
  imageUrl: string;
}

/**
 * Typetalkのトピックを表すスキーマ
 */
export interface Topic {
  id: number;
  name: string;
  description?: string | null;
}

export enum Sentiment {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE",
  MIXED = "MIXED",
  NEUTRAL = "NEUTRAL",
}

/**
 * Typetalkのポストを表すスキーマ
 */
export interface Post {
  id: number;
  message: string;
  updatedAt: string;
  account: Account;
  sentiment?: Sentiment | null; // 感情分析が未実行の場合はnull
}

/**
 * 組織一覧取得APIレスポンス
 */
export interface GetSpacesResponse {
  spaces: Space[];
}

/**
 * トピック一覧取得APIレスポンス
 */
export interface GetTopicsResponse {
  topics: Topic[];
}

/**
 * メッセージ一覧取得APIレスポンス
 */
export interface GetMessagesResponse {
  topic: Topic;
  hasNext: boolean;
  posts: Post[];
}

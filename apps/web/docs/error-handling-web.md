# Typetalk Sentiment Web エラーハンドリング方針

## 目次

1. [エラーの種類](#エラーの種類)
2. [エラー表示のUIガイドライン](#エラー表示のuiガイドライン)
3. [APIエラーの処理](#apiエラーの処理)
4. [ログ記録](#ログ記録)
5. [関連ドキュメント](#関連ドキュメント)

## エラーの種類

Typetalk Sentiment Webで発生する主なエラーを以下のように分類し、適切に処理する。その他のエラーについては実装コードを参照すること。

1. APIエラー
    - 発生箇所:バックエンドAPIとの通信時
    - 検知方法:[HttpResponseError](../src/app/lib/errors.ts)クラスで統一的に検知
    - 主な処理方針:
        - メッセージ一覧取得エラー:[トースト通知](../src/app/contexts/toast-provider.tsx)
        - その他のAPIエラー:[エラーページ](../src/app/error.tsx)表示

2. 入力値検証エラー
    - 発生箇所:ユーザー入力値の検証時
    - 検知方法:[zodスキーマ](../src/app/api/topics/[topicId]/messages/route.ts)による型安全な検証
    - 主な処理方針:エラー箇所を明示し、正しい入力方法を提示する

3. 認証エラー
    - 発生箇所:保護されたリソースへのアクセス時
    - 検知方法:[auth.config.ts](../src/auth.config.ts)による認証状態の確認
    - 主な処理方針:ログインページへリダイレクトし、認証後に元の操作を再開可能とする

## エラー表示のUIガイドライン

エラー表示には以下の2つのコンポーネントを用いる:

1. トースト通知
    - 用途:一時的な通知が必要なエラーの表示
    - 実装:[toast-provider.tsx](../src/app/contexts/toast-provider.tsx)
    - 表示内容:エラーメッセージ(自動で消滅)

2. エラーハンドラー
    - 用途:予期せぬエラーのフォールバックUI
    - 実装:[error-handler.tsx](../src/app/components/error/error-handler.tsx)
    - 表示内容:エラーメッセージとリカバリーオプション
    - 内部実装:[error-alert.tsx](../src/app/components/error/error-alert.tsx)を使用してエラーを表示

## APIエラーの処理

Next.js App RouterにおけるAPIエラー処理を以下のように実装する

1. サーバーコンポーネントでのエラー処理
    - [error.tsx](../src/app/error.tsx)でエラーバウンダリを実装
    - エラーページを表示してユーザーに通知

2. クライアントコンポーネントでのエラー処理
    - エラーレスポンスの形式

        ```json
        {
        "title": "エラータイトル"
        }
        ```

    - [HttpResponseError](../src/app/lib/errors.ts)クラスでラップ
    - エラーメッセージは[ERROR_MESSAGES](../src/app/lib/constants.ts)で定義
    - 処理例:[useMessages](../src/app/spaces/[spaceKey]/topics/[topicId]/messages/hooks/useMessages.ts)

## ログ記録

エラー発生時のログはpinoロガーを使用してJSON形式で記録される。

### 記録される情報

1. 基本情報(必須)
   - タイムスタンプ(ISO 8601形式)
   - ログレベル
   - メッセージ

2. エラー詳細
   - エラーオブジェクト
     - エラーメッセージ
     - スタックトレース
   - エラーの種類(HttpResponseError、ResourceFetchErrorなど)

3. リクエスト情報
   - エンドポイント
   - HTTPメソッド
   - ステータスコード(APIエラーの場合)

### ログの出力例

```json
{
  "level": "error",
  "time": "2024-01-20T12:34:56.789Z",
  "msg": "APIがエラーレスポンスを返しました。",
  "err": {
    "type": "HttpResponseError",
    "message": "Unauthorized",
    "stack": "..."
  },
  "endpoint": "/api/topics",
  "method": "GET",
  "statusCode": 401
}
```

### 実装の詳細

- ロガーの実装: [logger.ts](../src/app/lib/logger.ts)
- APIエラー処理の実装: [data.ts](../src/app/lib/data.ts)

## 関連ドキュメント

- [共通のエラーハンドリング](../../../docs/error-handling-root.md)
- [バックエンドのエラーハンドリング](../../api/docs/error-handling-api.md)

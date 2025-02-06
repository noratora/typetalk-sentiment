# Typetalk Sentiment API エラーハンドリング方針

## 目次

1. [エラーの種類](#エラーの種類)
2. [グローバルエラーハンドラ](#グローバルエラーハンドラ)
3. [カスタム例外クラス](#カスタム例外クラス)
4. [外部サービスのエラーハンドリング](#外部サービスのエラーハンドリング)
5. [エラーレスポンスの形式](#エラーレスポンスの形式)
6. [ログ記録](#ログ記録)
7. [関連ドキュメント](#関連ドキュメント)

## エラーの種類

バックエンドAPIで発生する可能性のある主なエラーの種類は以下の通りである

1. バリデーションエラー: クライアントからの不正な入力データによるエラー ([validation_exception_handler](../src/exceptions/exception_handlers.py))
2. 認証エラー: 無効なトークンや認証情報によるエラー ([TypetalkAPIError](../src/infrastructure/typetalk/exceptions.py))
3. 外部サービスエラー:
   - Typetalk API: [TypetalkAPIError](../src/infrastructure/typetalk/typetalk_api.py)
   - Amazon Comprehend: [ComprehendError](../src/infrastructure/aws/comprehend/aws_comprehend_api.py)
4. 内部サーバーエラー: 予期しない例外や内部的な処理エラー ([unexpected_exception_handler](../src/exceptions/exception_handlers.py))
5. その他のHTTPエラー: [custom_http_exception_handler](../src/exceptions/exception_handlers.py)で処理

各エラーの種類に応じて、[main.py](../src/main.py)で登録された例外ハンドラによって適切なHTTPステータスコードとエラーメッセージが返される。

## グローバルエラーハンドラ

FastAPIでのグローバルエラーハンドラは、アプリケーション全体で発生する例外を捕捉し、一貫したエラーレスポンスを生成する。

グローバルエラーハンドラの登録は[add_exception_handlers](../src/main.py)関数で行われ、各ハンドラの実装は[exception_handlers.py](../src/exceptions/exception_handlers.py)で定義される。

主な機能:

1. 例外の種類に応じた適切なHTTPステータスコードとエラーメッセージの設定
2. [logger.py](../src/core/logger/logger.py)を使用したエラー情報のログ記録
3. アプリケーション全体で一貫したJSONフォーマットのエラーレスポンス

実装の詳細については[exception_handlers.py](../src/exceptions/exception_handlers.py)を参照すること。

## カスタム例外クラス

プロジェクト固有のエラー状況に対応するためのカスタム例外クラスを定義している。主なカスタム例外クラスは以下の通りである

1. `AppBaseError`: [exceptions.py](../src/exceptions/exceptions.py)で定義される基底例外クラス。

2. `TypetalkAPIError`: [typetalk/exceptions.py](../src/infrastructure/typetalk/exceptions.py)で定義される例外クラス。
   - 属性:
     - `status_code`: HTTPステータスコード
     - `content`: エラーレスポンスの内容
     - `detail`: エラーの詳細情報

3. `ComprehendError`: [aws/comprehend/exceptions.py](../src/infrastructure/aws/comprehend/exceptions.py)で定義される例外クラス。
   - 属性:
     - `error_type`: エラーの種類
     - `message`: エラーメッセージ
     - `status_code`: HTTPステータスコード

## 外部サービスのエラーハンドリング

本プロジェクトで使用する外部サービスとそのエラーハンドリングについて説明する。

### Typetalk API

[typetalk_api.py](../src/infrastructure/typetalk/typetalk_api.py)で実装される。

- 用途: 組織、トピック、メッセージデータの取得
- エラー処理:
  - HTTPエラーを[TypetalkAPIError](../src/infrastructure/typetalk/exceptions.py)に変換
  - ステータスコード、レスポンス内容、エラー詳細を保持

### Amazon Comprehend

[aws_comprehend_api.py](../src/infrastructure/aws/comprehend/aws_comprehend_api.py)で実装される。

- 用途: メッセージの感情分析
- エラー処理:
  - AWS SDK例外を[ComprehendError](../src/infrastructure/aws/comprehend/exceptions.py)に変換
  - エラータイプ、メッセージ、ステータスコードを保持
  - バッチサイズ制限やテキストサイズ制限の事前検証

## エラーレスポンスの形式

本APIのエラーレスポンス形式は、RFC 9457 "Problem Details for HTTP APIs" を参考にカスタマイズしたものである。エラーレスポンスの実装は[exception_handlers.py](../src/exceptions/exception_handlers.py)で定義される。

APIがエラーを返す場合、以下の形式でJSONレスポンスが返される:

### 1. Typetalk APIエラー

[typetalk_error_handler](../src/exceptions/exception_handlers.py)で処理される。

```json
{
  "title": "Typetalk API request failed.",
  "detail": "エラーの詳細 (Typetalk APIから返された場合)"
}
```

### 2. AWS Comprehendエラー

[comprehend_error_handler](../src/exceptions/exception_handlers.py)で処理される。

```json
{
  "title": "AWS Comprehend API error occurred.",
  "detail": "エラーの詳細メッセージ"
}
```

### 3. バリデーションエラー

[validation_exception_handler](../src/exceptions/exception_handlers.py)で処理される。

```json
{
  "title": "Validation error occurred.",
  "errors": [
    {
      "name": "エラーが発生したフィールド名",
      "reason": "エラーの理由"
    }
  ]
}
```

### 4. 予期せぬエラー

[unexpected_exception_handler](../src/exceptions/exception_handlers.py)で処理される。

```json
{
  "title": "A system error has occurred."
}
```

### RFC 9457との関係

本APIのエラーレスポンス形式は、RFC 9457の以下の要素を採用している

- `title`: 人間が読める短い概要を提供
- `detail`: (一部のエラーで) より詳細な説明を提供

一方で、以下の点でRFC 9457とは異なるアプローチを取っている

- `type` フィールド (問題の種類を示すURI) は使用していない
- `status` フィールドの代わりに、HTTPレスポンスのステータスコードを使用している
- バリデーションエラーの場合、`errors` 配列を使用して詳細なエラー情報を提供している

## ログ記録

エラー発生時のログは[JsonFormatter](../src/core/logger/formatter.py)によってJSON形式で記録される。共通のログ記録方針は[error-handling-root.md](../../../docs/error-handling-root.md#ログ記録)で定義される。

### 記録される情報

1. 基本情報(必須)
   - タイムスタンプ (ISO 8601形式、ミリ秒まで)
   - ログレベル
   - メッセージ

2. エラー詳細
   - ファイルパス
   - 行番号
   - 関数名
   - スタックトレース

ログの設定は[logger.py](../src/core/logger/logger.py)で`log_config.json`から読み込まれ、環境変数`LOG_LEVEL`によってログレベルが制御される。

### ログの出力例

```json
{
  "datetime": "2023-05-01T12:34:56.789+09:00",
  "levelname": "ERROR",
  "msg": "Typetalk API request failed: Invalid token",
  "pathname": "/app/src/infrastructure/typetalk/typetalk_api.py",
  "lineno": 42,
  "funcName": "get_topics",
  "traceback": [
    "Traceback (most recent call last):",
    "  File \"/app/src/infrastructure/typetalk/typetalk_api.py\", line 42, in get_topics",
    "    response = self._session.get(url, headers=headers)",
    "requests.exceptions.ConnectionError: HTTPSConnectionPool(host='typetalk.com', port=443): Max retries exceeded"
  ]
}
```

各エラーハンドラでのログ記録の実装は[exception_handlers.py](../src/exceptions/exception_handlers.py)を参照すること。

## 関連ドキュメント

- [共通のエラーハンドリング](../../../docs/error-handling-root.md)
- [フロントエンドのエラーハンドリング](../../web/docs/error-handling-web.md)

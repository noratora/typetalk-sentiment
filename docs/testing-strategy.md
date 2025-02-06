# テスト戦略概要

## 目次

1. [概要](#概要)
2. [テスト環境](#テスト環境)
3. [モック戦略](#モック戦略)
4. [手動E2Eテスト](#手動e2eテスト)
5. [サブシステム別テストドキュメント](#サブシステム別テストドキュメント)

## 概要

このドキュメントは、Typetalk Sentimentプロジェクトのテスト戦略を定義するものである。主に以下の内容を説明する。

1. テスト環境の全体像
    - ローカル開発環境とステージング環境の使い分け
    - Typetalk Sentimentシステムの共通モックサーバー構成

2. 手動E2Eテストの詳細
    - Typetalk Sentiment Web、Typetalk Sentiment API、外部サービスの連携確認手順
    - 確認項目と判断基準

3. 品質保証プロセス
    - パフォーマンス確認方法
    - セキュリティチェック項目

各サブシステムのテスト実装については、以下のドキュメントで詳細を説明する。

- Typetalk Sentiment API: [Typetalk Sentiment API テスト方針](../apps/api/docs/testing-api.md)
- Typetalk Sentiment Web: [Typetalk Sentiment Web テスト方針](../apps/web/docs/testing-web.md)

## テスト環境

### 1. ローカル開発環境

開発者のマシン上で実行する環境である。

用途:

- 各サブシステムの自動テスト実行
- 手動E2Eテスト実施

特徴:

- モックと実サービスの柔軟な切り替え
- 迅速なフィードバック
- 開発者の作業効率最大化

### 2. ステージング環境

本番に近い環境でのテスト実行環境である。

用途:

- 本番デプロイ前の最終E2Eテスト
- 実サービスとの連携確認
- パフォーマンステスト実施

特徴:

- 本番環境に近い状態でのテスト
- 実サービス連携の問題早期発見
- デプロイプロセスの検証

## モック戦略

プロジェクトのモック戦略は以下の2つで構成する。

### Typetalk APIモックサーバー (Mockoon)

```yaml:compose.yaml
services:
  typetalk-api-mock:
    container_name: typetalk-api-mock
    image: mockoon/cli:6.2.0
    volumes:
      - ./mockoon/typetalk-api.json:/data:readonly
    ports:
      - 3010:3010
```

用途:

- ローカル開発環境で開発、テスト時のTypetalk API代替

特徴:

- Docker環境での提供
- Typetalk APIレスポンスのモック化
- 設定ファイルによる挙動制御

### サブシステム固有のモック

各サブシステムのモック実装の詳細については、以下のドキュメントを参照すること。

- Typetalk Sentiment API: [Typetalk Sentiment API テスト方針](../apps/api/docs/testing-api.md#モックの方針)
- Typetalk Sentiment Web: [Typetalk Sentiment Web テスト方針](../apps/web/docs/testing-web.md#モックの方針)

## 手動E2Eテスト

Typetalk Sentiment Web、Typetalk Sentiment API、外部サービスの連携を確認する。

### 1. テスト実施環境

#### ローカル開発環境

- 開発中の機能確認
- 外部サービス (Typetalk API、Amazon Comprehend) のモック利用

#### ステージング環境

- リリース前の最終確認
- Typetalk APIとAmazon Comprehendの利用

### 2. 確認項目

#### ユーザーフロー

- ログインから画面遷移までの一連の流れ
- 主要機能の動作
  - トピック一覧の表示と選択
  - メッセージ一覧の表示
  - 感情分析の実行と結果表示
- APIリクエスト/レスポンスの確認
- 複数ブラウザでの動作確認

#### UI/UX

- デザイン一貫性
  - 色、フォント、スペーシング
  - レスポンシブ対応
- 操作性
  - ボタン・フォームの配置
  - 操作フロー
    - 画面遷移の一貫性
    - エラー時のフィードバック
    - 操作の中断と再開
    - 操作後のフィードバック

#### データ表示とエラーハンドリング

- APIデータの正確な表示
- ローディング状態の表示
- エラーメッセージの表示

### 3. テスト実施パターン

#### ローカル開発環境での実施パターン

- パターン1: Typetalk Sentiment API + 外部サービスモック
  - AWS Comprehend: バックエンド組み込みモック (詳細は[Typetalk Sentiment API テスト方針](../apps/api/docs/testing-api.md#外部サービス連携)を参照)
  - Typetalk API: Mockoonによるモックサーバー
- パターン2: Typetalk Sentiment API + Typetalk API/Amazon Comprehend
  - 外部サービスへの実際のAPI呼び出し

#### ステージング環境での実施パターン

- Typetalk Sentiment APIからTypetalk API/Amazon Comprehendへの実API呼び出し
- 本番環境に近い状態での最終確認

### 4. サブシステムの役割

#### Typetalk Sentiment Web

- ユーザーインターフェース
  - 画面表示と遷移の正常性
  - フォーム入力とバリデーション
  - エラー表示
- Typetalk Sentiment APIとの通信
  - リクエスト送信とレスポンス処理
  - エラーハンドリング

#### Typetalk Sentiment API

- APIエンドポイント
  - リクエスト処理とレスポンス生成
  - バリデーションとエラー処理
- 外部サービス連携
  - Amazon Comprehend: 感情分析実行
  - Typetalk API: データ取得

#### Typetalk Sentiment Infrastructure

- 環境提供
  - 各サブシステムの稼働確認
  - ネットワーク接続確認

## サブシステム別テストドキュメント

各サブシステムの詳細なテスト方針については、以下のドキュメントを参照すること:

- Typetalk Sentiment API: [Typetalk Sentiment API テスト方針](../apps/api/docs/testing-api.md)
  - ユニットテスト実装
  - インテグレーションテスト実装
  - モック実装の詳細
- Typetalk Sentiment Web: [Typetalk Sentiment Web テスト方針](../apps/web/docs/testing-web.md)
  - ユニットテスト実装
  - UIコンポーネントテスト実装
  - モック実装の詳細

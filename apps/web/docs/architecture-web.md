# Typetalk Sentiment Web アーキテクチャ概要

## 目次

1. [アプリケーション概要](#アプリケーション概要)
2. [技術スタック](#技術スタック)
3. [アプリケーション構成](#アプリケーション構成)
4. [外部サービスとの連携](#外部サービスとの連携)
5. [Typetalk Sentiment APIとの通信](#typetalk-sentiment-apiとの通信)
6. [関連ドキュメント](#関連ドキュメント)

## アプリケーション概要

Typetalk Sentiment Webは、Typetalkのメッセージデータを取得し、感情分析結果を視覚化するWebアプリケーションである。このアプリケーションは、Typetalk Sentiment APIと連携してメッセージの感情分析結果を提供する。

## 技術スタック

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- daisyUI
- Auth.js
- Vitest
- React Testing Library

バージョン情報の詳細は [package.json](../package.json) を参照すること。

## アプリケーション構成

### アプリケーション構成要素

本アプリケーションは、以下の4つの主要な構成要素で構成される。

1. ページコンポーネント ([src/app/spaces](../src/app/spaces/))
   - 画面の構築とデータの表示を担当
   - スペース、トピック、メッセージの階層構造で管理

   例: メッセージ一覧機能

   ```sh
   spaces/[spaceKey]/topics/[topicId]/messages/
   ├── components/           # メッセージ表示用コンポーネント
   ├── hooks/useMessages.ts  # メッセージデータの取得・管理
   └── page.tsx              # ページコンポーネント
   ```

2. APIエンドポイント ([src/app/api](../src/app/api/))
   - 認証処理とメッセージ取得を担当

   ```sh
   api/
   ├── auth/[...nextauth]/route.ts  # 認証ハンドラー
   └── topics/[topicId]/messages/   # メッセージ取得API
       ├── route.test.ts
       └── route.ts
   ```

3. 共通UI要素 ([src/app/components](../src/app/components/))
   - アプリケーション全体で使用するUIコンポーネント

   ```sh
   components/
   ├── elements/    # 基本UI要素
   ├── error/       # エラー表示
   ├── icons/       # アイコン
   └── layout/      # レイアウト
   ```

4. グローバル機能
   - 状態管理 ([src/app/contexts](../src/app/contexts/))
     - テーマ管理
     - トースト通知
   - ユーティリティ ([src/app/lib](../src/app/lib/))
     - APIクライアント
     - エラーハンドリング
     - 共通ロジック

### 処理フロー

本アプリケーションは、以下の2つのパターンでデータを取得・表示する。

1. サーバーコンポーネントでのデータ取得
   - スペース一覧やトピック一覧など、ページ表示に必要な初期データの取得に使用
   - サーバーサイドでデータを取得しHTMLを生成

    ```mermaid
    sequenceDiagram
        participant User as ユーザー
        participant Browser as ブラウザ
        participant Page as サーバーコンポーネント
        participant API as Typetalk Sentiment API

        User->>Browser: URL アクセス
        Browser->>Page: リクエスト
        Note over Page: セッション確認
        Page->>API: 初期データ取得
        API-->>Page: レスポンス
        Page-->>Browser: 初期HTML生成・送信
        Browser-->>User: ページ表示
    ```

2. クライアントコンポーネントでのデータ取得
   - メッセージ一覧など、ページ表示後のユーザーの操作に応じたデータ取得が必要な処理に使用
   - Route Handlersを経由してデータを取得しUIを更新

    ```mermaid
    sequenceDiagram
        participant User as ユーザー
        participant Page as クライアントコンポーネント
        participant Hook as useMessages
        participant Handler as Route Handler
        participant API as Typetalk Sentiment API

        Note over User,API: ページ表示後
        User->>Page: スクロール/更新操作
        Page->>Hook: データ取得要求
        Hook->>Handler: APIリクエスト
        Note over Handler: セッション確認
        Handler->>API: データ取得
        API-->>Handler: レスポンス
        Handler-->>Hook: データ
        Hook-->>Page: 表示用データ
        Page-->>User: UI更新
    ```

## 外部サービスとの連携

### Typetalk API

本アプリケーションはTypetalk APIと以下の方法で連携する。

1. Typetalkアプリケーションとの連携
   - OAuth認証用のクライアントID/シークレットを使用
   - Typetalkアカウントによるログイン認証

2. アクセストークンの利用
   - OAuth認証で取得したアクセストークンをAPIリクエストに付与

## Typetalk Sentiment APIとの通信

本アプリケーションは、Typetalk Sentiment APIとの通信処理を [src/app/lib/data.ts](../src/app/lib/data.ts) に集約している。

## 関連ドキュメント

- [Typetalk Sentiment システムアーキテクチャ概要](../../../docs/system-architecture.md)
- [Typetalk Sentiment API アーキテクチャ概要](../../api/docs/architecture-api.md)

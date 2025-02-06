# Typetalk Sentiment Web

## 概要

Typetalk Sentiment Webは、チャットメッセージの感情分析結果を視覚化するフロントエンドアプリケーションである。
詳細な技術仕様については[Typetalk Sentiment Web アーキテクチャ概要](docs/architecture-web.md)を参照すること。

## 機能概要

Typetalk Sentiment Webは、以下の主要な機能を提供する。

1. ユーザー認証
   - Typetalk OAuth認証による安全なアクセス制御
2. 組織とトピックの一覧表示
   - ユーザーが所属する組織の一覧表示
   - 組織内のトピック一覧表示
3. メッセージの表示と感情分析結果の視覚化
   - メッセージ内容、投稿者、投稿日時の表示
   - 感情（ポジティブ、ネガティブ、ニュートラル、複雑）の視覚的な表現

## 前提条件

以下の認証情報が必要である。

- Typetalk OAuth認証情報
  - クライアントID
  - クライアントシークレット

## 開発の始め方

環境構築の手順は[ローカル開発環境のセットアップ](../../docs/setup.md)を参照すること。

アプリケーションは`http://localhost:3000`で実行される。

## 関連ドキュメント

- [Typetalk Sentiment Web アーキテクチャ概要](docs/architecture-web.md)
- [Typetalk Sentiment Web エラーハンドリング方針](docs/error-handling-web.md)
- [Typetalk Sentiment Web テスト方針](docs/testing-web.md)
- [Typetalk Sentiment Web コーディング規約](docs/coding-standards-web.md)

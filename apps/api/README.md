# Typetalk Sentiment API

## 概要

Typetalk Sentiment APIは、チャットメッセージの感情分析を行うバックエンドAPIである。
詳細な技術仕様については[Typetalk Sentiment API アーキテクチャ概要](docs/architecture-api.md)を参照すること。

## 機能概要

Typetalk Sentiment APIは、以下の主要な機能を提供する。

1. 組織一覧の取得: ユーザーが所属するTypetalk組織の一覧を取得する。
2. トピック一覧の取得: 指定された組織内のトピック一覧を取得する。
3. メッセージ取得と感情分析: 指定されたトピック内のメッセージを取得し、各メッセージの感情分析を行う。

これらの機能は、Typetalk APIとAmazon Comprehendを利用して実現している。

## 前提条件

以下の認証情報が必要である。

- Typetalk APIトークン
- AWS認証情報（Amazon Comprehend用）
  - AWS SSO または
  - IAMアクセスキー認証

## 開発の始め方

環境構築の手順は[ローカル開発環境のセットアップ](../../docs/setup.md)を参照すること。

アプリケーションは`http://localhost:8080`で実行される。

## 関連ドキュメント

- [Typetalk Sentiment API アーキテクチャ概要](docs/architecture-api.md)
- [Typetalk Sentiment API エラーハンドリング方針](docs/error-handling-api.md)
- [Typetalk Sentiment API テスト方針](docs/testing-api.md)
- [Typetalk Sentiment API コーディング規約](docs/coding-standards-api.md)

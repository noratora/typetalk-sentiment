# Typetalk Sentiment Infrastructure

## 概要

Typetalk Sentimentシステムのインフラストラクチャを管理するCDKプロジェクトである。

Typetalk Sentiment WebとTypetalk Sentiment APIの実行基盤とCI/CDパイプラインを提供する。

## デプロイメント構成

1. 共有インフラストラクチャ (ap-northeast-1, us-east-1)
   - Route 53ホストゾーン
   - クロスリージョン連携用のSSMパラメータ

2. シークレット管理 (ap-northeast-1)
   - アプリケーション認証情報
   - API認証情報

3. アプリケーションパイプライン
   - CloudFront/ACM証明書 (us-east-1)
   - アプリケーションリソース (ap-northeast-1)
   - CI/CDパイプライン

## プロジェクト構造

```sh
/
├── bin/                    # CDKアプリケーションのエントリーポイント
│   ├── shared-infrastructure.ts    # 共有インフラ用
│   ├── secrets-manager.ts          # シークレット管理用
│   └── typetalk-sentiment.ts       # メインアプリケーション用
├── lib/
│   ├── stack/            # CDKスタック定義
│   ├── stage/            # デプロイステージ定義
│   └── construct/        # 共通コンストラクト
├── parameter-types.ts    # パラメータ型定義
├── parameter.ts          # 環境別パラメータ設定
└── docs/                 # ドキュメント
```

## 関連ドキュメント

- [Typetalk Sentiment インフラストラクチャ アーキテクチャ概要](docs/deployment-architecture.md)
- [開発環境デプロイ手順書](docs/deployment-guide-dev.md)

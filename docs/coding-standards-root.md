# 共通コーディング規約

このドキュメントは、Typetalk Sentimentプロジェクト全体に適用される共通のコーディング規約を定義する。各サブシステム固有の規約については、それぞれのドキュメントを参照すること。

## 目次

1. [コーディングスタイル](#コーディングスタイル)
2. [サブシステム固有の規約](#サブシステム固有の規約)

## コーディングスタイル

本プロジェクトでは、コーディングスタイルの一貫性を保つために `.editorconfig` ファイルを使用する。

- プロジェクトルートに基本設定を含む `.editorconfig` ファイルを配置する。
- 各サブシステム (apps/api, apps/web, infra/iac/cdk) には個別の `.editorconfig` ファイルで言語固有の設定を定義する。

## サブシステム固有の規約

- [Typetalk Sentiment API コーディング規約](../apps/api/docs/coding-standards-api.md)
- [Typetalk Sentiment Web コーディング規約](../apps/web/docs/coding-standards-web.md)

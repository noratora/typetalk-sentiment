# ローカル開発環境のセットアップ

本ドキュメントは、Typetalk Sentimentプロジェクトの開発環境セットアップ手順を定義したものである。

## 目次

1. [前提条件](#前提条件)
2. [初期設定](#初期設定)
3. [開発コンテナの使用](#開発コンテナの使用)
4. [サブシステム別セットアップ](#サブシステム別セットアップ)

## 前提条件

以下のツールをインストールすること

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [VSCode用拡張機能 Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

各ツールのインストール手順は公式ドキュメントを参照すること。

開発を開始する前に、以下のコマンドでDockerの起動状態を確認すること。

```sh
docker version
```

Server セクションが表示されていれば、Dockerは正常に起動している。
エラーが発生する場合は、Dockerデーモンの起動を確認すること。

## 初期設定

### リポジトリのクローン

1. ターミナルを開く

2. プロジェクトをクローンする

   ```sh
   git clone https://github.com/noratora/typetalk-sentiment.git
   ```

3. プロジェクトのルートディレクトリに移動する

   ```sh
   cd typetalk-sentiment
   ```

### 環境変数の設定

プロジェクトルートディレクトリで以下のスクリプトを実行し、各サブシステムの環境変数ファイルを作成する。

※ Windows環境の場合は、Git BashやWSL2など、bashが利用可能な環境で実行すること。

```sh
bash scripts/setup-env.sh
```

または、以下の手順で手動でファイルをコピーする。

1. Typetalk Sentiment API

   ```sh
   cp apps/api/.env.example apps/api/.env
   cp apps/api/.env.aws.example apps/api/.env.aws
   ```

2. Typetalk Sentiment Web

   ```sh
   cp apps/web/.env.local.example apps/web/.env.local
   ```

3. Typetalk Sentiment Infrastructure

   ```sh
   cp infra/iac/cdk/.env.example infra/iac/cdk/.env
   ```

コピーした各環境設定ファイルを開き、ファイル内のコメントを参考に必要な値を設定すること。

### AWS認証設定

開発コンテナはホストマシンの ~/.aws/ ディレクトリを自動的にマウントする。

AWS SSOを使用している場合は、以下のコマンドでログインする

```sh
aws sso login
```

注意: アクセスキー方式を使用する場合は、各サブシステムの環境変数ファイルで設定すること。

## 開発コンテナの使用

このプロジェクトはVSCode Remote Containersを使用する。各サブシステム (Typetalk Sentiment API、Typetalk Sentiment Web、Typetalk Sentiment Infrastructure) には専用の開発コンテナが用意されている。

1. VSCodeでプロジェクトのルートフォルダを開く
2. 左下のアイコン (`><`) をクリックし、「Reopen in Container (コンテナーで再度開く)」を選択する
3. 表示されるリストから作業したいサブシステムを選択する
4. VSCodeが開発コンテナをビルドし、選択したコンテナに接続する (初回のビルドには数分を要する)

詳細なセットアップ手順については、「[サブシステム別セットアップ](#サブシステム別セットアップ)」セクションを参照すること。

### サブシステム用開発コンテナの切り替え

異なるサブシステム用開発コンテナで作業する場合は、VSCodeの左下のアイコン (`><`) をクリックし、「Reopen in Container (コンテナーで再度開く)」を選択して、目的のサブシステムを選択する。

### 複数のサブシステム用開発コンテナの同時使用

1. VSCodeでプロジェクトのルートフォルダを開く
2. 左下のアイコン (`><`) をクリックし、「Reopen in Container (コンテナーで再度開く)」を選択し、接続したいサブシステムを選択する
3. 新しいVSCodeウィンドウを開き、同じプロジェクトのルートフォルダを開く
4. 手順2を繰り返し、別のサブシステムを選択する

詳細は[VSCode公式ドキュメント](https://code.visualstudio.com/remote/advancedcontainers/connect-multiple-containers)を参照すること。

## サブシステム別セットアップ

### Typetalk Sentiment API のセットアップ

1. VSCodeでプロジェクトのルートフォルダを開く

2. 左下のアイコン (`><`) をクリックし、「Reopen in Container (コンテナーで再度開く)」を選択する

3. 表示されるリストから「api」を選択する

4. コンテナのビルドが完了するまで待つ (初回のビルドには数分を要する)

コンテナの詳細な構成については [Dockerfile](../apps/api/Dockerfile) の `develop-stage` を参照すること。

アプリケーションは <http://localhost:8080> でアクセス可能である。

補足:

- コードの変更は自動的にホストマシンと同期される
- コードの変更は自動的に反映される
- 依存関係の追加時は `poetry add` コマンドを使用する

### Typetalk Sentiment Web のセットアップ

1. VSCodeでプロジェクトのルートフォルダを開く

2. 左下のアイコン (`><`) をクリックし、「Reopen in Container (コンテナーで再度開く)」を選択する

3. 表示されるリストから「web」を選択する

4. コンテナのビルドが完了するまで待つ (初回のビルドには数分を要する)

コンテナの詳細な構成については [Dockerfile](../apps/web/Dockerfile) の `develop-stage` を参照すること。

アプリケーションは <http://localhost:3000> でアクセス可能である。

補足:

- コードの変更は自動的にホストマシンと同期される
- コードの変更は自動的に反映される
- node_modules は専用のボリュームを使用するため、ホストマシンの node_modules とは独立している

### Typetalk Sentiment Infrastructure のセットアップ

1. VSCodeでプロジェクトのルートフォルダを開く

2. 左下のアイコン (`><`) をクリックし、「Reopen in Container (コンテナーで再度開く)」を選択する

3. 表示されるリストから「iac」を選択する

4. コンテナのビルドが完了するまで待つ (初回のビルドには数分を要する)

コンテナの詳細な構成については [Dockerfile](../infra/iac/cdk/Dockerfile) を参照すること。

補足:

- コードの変更は自動的にホストマシンと同期される
- node_modules は専用のボリュームを使用するため、ホストマシンの node_modules とは独立している

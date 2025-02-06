# 開発環境デプロイ手順書

## 目次

1. [目的](#目的)
2. [前提条件](#前提条件)
3. [事前準備](#事前準備)
4. [デプロイ手順](#デプロイ手順)
5. [動作確認](#動作確認)
6. [クリーンアップ](#クリーンアップ)

## 目的

本手順書は、Typetalk Sentiment Infrastructureの開発環境を AWS上に構築するための手順を定義したものである。
本手順に従うことで、アプリケーションの実行に必要なインフラ環境と継続的デプロイメントの仕組みを構築できる。

## 前提条件

1. [ローカル開発環境のセットアップ](../../../../docs/setup.md)を完了していること。

2. AWS環境要件
    - AdministratorAccess権限を持つIAMユーザー/ロール
        - bootstrap処理の実行に必要
        - AWS CDKの公式推奨事項に準拠
    - 参考: [AWS CDK Security Guide](https://github.com/aws/aws-cdk/wiki/Security-And-Safety-Dev-Guide#policies-for-bootstrapping)

3. 独自ドメイン
    - 任意のドメインレジストラで取得したドメインを使用する
    - DNSレコード設定が可能であること

## 事前準備

### 1. Lambda同時実行数の制限緩和申請

新規の AWS アカウント では、同時実行数のデフォルト制限が10に設定されている。
Lambda関数の同時実行数のデフォルト制限を引き上げるため、Service Quotasで制限緩和申請を行う。

1. Service Quotasコンソールにアクセス

   - <https://console.aws.amazon.com/servicequotas/home/services/lambda/quotas>

2. 制限緩和の申請
   1. 「Concurrent executions」を選択
   2. 「アカウントレベルでの引き上げをリクエスト」を選択
   3. 新しい制限値を入力: `1000`

3. 現在の制限値の確認

   ```bash
   aws service-quotas get-service-quota \
     --service-code lambda \
     --quota-code L-B99A9384
   ```

### 2. パラメータファイルの設定

[parameter.ts](../parameter.ts)に開発環境用の設定値を定義すること。
ファイル内のTODOコメント [設定必須] を検索し、各項目を設定すること。

注: GitHub接続のARN設定については、「6. GitHub接続の設定」の手順で作成・設定するため、この時点では設定しなくて問題ない。

必須設定項目の確認方法

```bash
grep -r "TODO \[設定必須\]" infra/iac/cdk/parameter.ts
```

1. システム共通設定 (systemParameter)
   - 共有リソース用AWSアカウントID
   - Route 53で管理する独自ドメイン

2. 開発環境設定 (devParameter)
   - 開発環境用AWSアカウントID
   - GitHubリポジトリ情報

設定値の詳細については、[parameter.ts](../parameter.ts)ファイル内のTODOコメントを参照すること。

### 3. 環境変数の設定

環境変数の設定はホストマシンで行うこと。開発コンテナはこの設定を起動時に読み込む。
環境変数ファイル ( [infra/iac/cdk/.env](../.env) ) に以下の値を設定すること。

```sh
# デプロイ先の環境名
# parameter.tsのdevParameterを使用するため、devを指定
TARGET_ENV=dev

# AWS認証設定 (いずれかを選択)
# 方法1: AWS SSO (推奨)
# AWS CLIのプロファイル名を指定。~/.aws/configに設定されているプロファイル名と一致させる
AWS_PROFILE=<プロファイル名>

# 方法2: IAMアクセスキー
# AWS IAMコンソールで発行したアクセスキーを使用する場合
# AWS_DEFAULT_REGION=ap-northeast-1
# AWS_ACCESS_KEY_ID=<アクセスキー>
# AWS_SECRET_ACCESS_KEY=<シークレットキー>
```

設定のポイント

- TARGET_ENV: 開発環境用のパラメータセットを指定する
- AWS認証: SSOまたはIAMアクセスキーのいずれかを選択する
  - SSO推奨の理由: セキュリティ強化とアクセスキー管理の負荷軽減のため

### 4. Typetalkアプリケーションの設定

OAuth認証を使用するため、Typetalkアプリケーションを作成する。

1. アプリケーションの作成
   1. [parameter.ts](../parameter.ts)の`devParameter.domainName`の値を確認
   2. [Typetalkの開発者設定画面](https://typetalk.com/my/develop/applications)を開く
   3. 新規アプリケーションを作成
      - アプリケーション名:

        ```txt
        Typetalk Sentiment Dev
        ```

      - Grant Type:
        - `Authorization Code` を選択

      - ホームページ URLを設定：

        ```plaintext
        https://{devParameter.domainName}
        ```

        例: devParameter.domainName が dev.example.com の場合

        ```plaintext
        https://dev.example.com
        ```

      - リダイレクトURLを設定：

        ```plaintext
        https://{devParameter.domainName}/api/auth/callback/typetalk
        ```

        例: devParameter.domainName が dev.example.com の場合

        ```plaintext
        https://dev.example.com/api/auth/callback/typetalk
        ```

   4. 作成完了時に表示される以下の値を確認
      - クライアントID
      - クライアントシークレット

      これらの値は後続の「シークレット値の準備」で使用する

### 5. シークレット値の準備

デプロイ時にシークレットマネージャーに保存する値を準備すること。

1. Basic認証の値の作成
   1. ユーザー名とパスワードを決定
   2. `username:password`形式の文字列を作成
   3. Base64エンコードを実行

      ```bash
      echo -n "username:password" | base64
      ```

   4. 出力された値をメモ

2. Auth.js用のシークレット値の生成
   以下のいずれかの方法で生成:

   ```bash
   openssl rand -hex 32
   ```

   または
   <https://generate-secret.vercel.app/32> にアクセス

3. Typetalk認証情報の準備
   1. TypetalkアプリケーションのクライアントID
   2. Typetalkアプリケーションのクライアントシークレット

4. その他のシークレット値の準備
   - フロントエンドAPI用のシークレットキー（任意の文字列）

準備が必要な値の一覧:

```json
{
  "authSecret": "Auth.js用のシークレット値",
  "authTypetalkId": "TypetalkアプリケーションのクライアントID",
  "authTypetalkSecret": "Typetalkアプリケーションのクライアントシークレット",
  "frontendApiSecretKey": "フロントエンドAPI用のシークレットキー",
  "basicAuthEncoded": "Base64エンコードしたBasic認証文字列"
}
```

注: これらの値は後続の「シークレットマネージャーリソースのデプロイ」で使用する

### 6. GitHub接続の設定

parameter.tsに設定したGitHubリポジトリ情報を使用して、AWSコンソールでGitHub接続を作成すること。

1. GitHub接続の作成
   - AWSコンソール → CodePipeline → 設定 → 接続から実施
   - 接続名: `TypetalkSentiment-Dev-GitHub` など、識別可能な名前を設定
   - GitHubリポジトリ: parameter.tsのgithubOwnerとgithubRepoの値を使用
   - [GitHub接続の公式ドキュメント](https://docs.aws.amazon.com/ja_jp/codepipeline/latest/userguide/connections-github.html#connections-github-console)に従って設定
   - 接続完了後、接続ARNをメモする (形式: arn:aws:codeconnections:region:account:connection/xxx)

2. 接続ARNの設定
   - [parameter.ts](../parameter.ts)の`devParameter.pipelineConfig.codeConnectionsArn`に、メモした接続ARNを設定する

理由: CodePipelineがGitHubからソースコードを取得するために必要

### 7. パラメータ変更の反映

1. parameter.tsの変更をコミット
   以下の設定値の変更をコミットする:
   - devParameter.domainName
   - devParameter.pipelineConfig.githubOwner
   - devParameter.pipelineConfig.githubRepo
   - devParameter.pipelineConfig.codeConnectionsArn

2. リモートリポジトリへのプッシュ

```bash
git add infra/iac/cdk/parameter.ts
git commit -m "update: 開発環境用CDKパラメータの設定"
git push origin develop
```

## デプロイ手順

### 1. 開発コンテナの起動

1. VSCodeでプロジェクトのルートディレクトリを開く
2. コマンドパレットから「`Dev Containers: ReOpen in Container`」を選択
3. 「iac」コンテナを選択する
   - インフラ構築用の開発環境が含まれている
   - AWS CLI、CDK等の必要なツールが事前インストールされている
   - 初回はコンテナのビルドが実行されるため、数分程度かかる

4. 必要なツールのインストール確認

ターミナルで以下のコマンドを実行し、各ツールが使用可能な状態であることを確認する

```bash
aws --version
npx cdk --version
```

### 2. AWS認証の設定

1. 認証方式に応じた準備
   - AWS SSO認証の場合のみ、以下のコマンドを実行

     ```bash
     aws sso login
     ```

   - IAMアクセスキーの場合は実行不要 (環境変数で設定済み)

2. 認証状態の確認 (全ての認証方式で実行)

```bash
aws sts get-caller-identity
```

出力例:

```json
{
    "UserId": "AROA1EXAMPLE:user.name",
    "Account": "123456789012",
    "Arn": "arn:aws:sts::123456789012:assumed-role/role-name/user.name"
}
```

以下を確認すること。

- Account: パラメータファイルで設定したAWSアカウントIDと一致
- Arn: 適切な権限を持つロール/ユーザーであること

### 3. CDKデプロイ環境の準備

CDKを使用したデプロイに必要なリソースを各環境に作成する。
環境とリージョンごとに異なる役割があるため、それぞれでブートストラップが必要である。
ブートストラップコマンドは冪等性があり、既存環境に対して実行しても安全である。

リージョンごとの役割:

- ap-northeast-1 (メインリージョン)
  - パイプライン、Lambda、API Gateway等のサービスをデプロイ
  - Route 53ホストゾーンを作成

- us-east-1 (CloudFront証明書用)
  - CloudFrontのACM証明書を作成
  - Route 53ホストゾーンIDをパラメータストアに保存

使用する値:

- DEPLOY_ACCOUNT_ID: [parameter.ts](../parameter.ts)の`systemParameter.env.account`に設定したAWSアカウントID

実行手順:

1. cdk.jsonのディレクトリに移動

```bash
cd /workspaces/infra/iac/cdk/
```

2. AWSアカウントのブートストラップを実行

```bash
npx cdk bootstrap aws://DEPLOY_ACCOUNT_ID/ap-northeast-1 aws://DEPLOY_ACCOUNT_ID/us-east-1
```

注:

- コマンドの実行には数分を要する

実行結果の確認:

- 「 ✅ Environment aws://<ACCOUNT-NUMBER>/<REGION> bootstrapped. 」のメッセージが表示される
- 各アカウント・リージョンの組み合わせで成功メッセージを確認する

### 4. 共有インフラリソースのデプロイ

システム全体で共有するRoute 53ホストゾーンをデプロイする。
このリソースは、開発環境と本番環境の両方で使用される。

1. スタックの合成

```bash
npx cdk synth --app "npx ts-node --prefer-ts-exts bin/shared-infrastructure.ts"
```

2. デプロイの実行

```bash
npx cdk deploy --app "npx ts-node --prefer-ts-exts bin/shared-infrastructure.ts" --all --require-approval never
```

3. デプロイ完了の確認

    - Route 53
        - 指定したドメイン名のホストゾーンが作成されていること
        - NSレコードとSOAレコードが自動生成されていること

    - SSMパラメータストア
        - リージョン: us-east-1
        - AWSマネジメントコンソールのSSMパラメータストアで、作成されたパラメータを確認
        - 値: Route 53ホストゾーンIDが保存されていること

### 5. Route53ホストゾーンのNSレコード設定

作成したホストゾーンのNSレコードを、ドメインレジストラに設定する。

1. Route53のNSレコード確認
   - AWSマネジメントコンソールでRoute 53を開く
   - 作成されたホストゾーンを選択
   - NSタイプのレコードに表示される4つのネームサーバーをメモ

2. ドメインレジストラでの設定
   - 使用しているドメインレジストラの管理画面でネームサーバーの設定を開く
   - Route 53で確認したネームサーバーを全て登録

3. 設定の確認
   - [parameter.ts](../parameter.ts)の`systemParameter.baseDomainName`で設定したドメインに対して以下を実行

```bash
dig NS DOMAIN_NAME
```

確認ポイント:

- Route 53で確認したネームサーバーと一致すること
- ANSWER SECTIONにNSレコードが表示されること
- Route 53のネームサーバーが返却されることを確認

### 6. シークレットマネージャーリソースのデプロイ

開発環境用のシークレット値を管理するリソースをデプロイする。

1. スタックの合成

```bash
npx cdk synth --app "npx ts-node --prefer-ts-exts bin/secrets-manager.ts"
```

2. デプロイの実行

```bash
npx cdk deploy --app "npx ts-node --prefer-ts-exts bin/secrets-manager.ts" --all --require-approval never
```

3. シークレット値の設定
   - Secrets Manager > シークレット で、デプロイされたシークレットを選択
   - 「シークレットの値を取得する」を選択
   - 「編集する」を選択
   - 以下のJSONフォーマットで値を設定

```json
{
  "authSecret": "NextAuth.jsのシークレット値 (任意の文字列) ",
  "authTypetalkId": "TypetalkアプリケーションのクライアントID",
  "authTypetalkSecret": "Typetalkアプリケーションのクライアントシークレット",
  "frontendApiSecretKey": "フロントエンドAPIのシークレットキー (任意の文字列) ",
  "basicAuthEncoded": "Basic認証のBase64エンコードされた文字列 (username:password形式) "
}
```

4. 設定の確認
   - シークレット値がキー/値で保存されていること

### 7. パイプラインのデプロイ

開発環境用のデプロイパイプラインを構築する。

1. スタックの合成

```bash
npx cdk synth
```

2. スタックのリスト

```bash
npx cdk list
```

3. デプロイの実行

```bash
npx cdk deploy --all --require-approval never
```

4. パイプラインの確認
   1. CodePipeline でパイプラインを表示
   2. 以下のステージが順次実行されることを確認
      - Source: GitHubからソースコードの取得
      - Build: CDKアプリケーションのビルド
      - UpdatePipeline: パイプラインの更新
      - Assets: デプロイ用アセットの作成
      - TypetalkSentiment-Dev: アプリケーションリソースのデプロイ
   3. 全てのステージが緑色 (Succeeded) になることを確認

注: パイプラインの初回実行には15-20分程度を要する

## 動作確認

### 1. バックエンドの確認

1. ヘルスチェックエンドポイントの確認
   1. parameter.tsの`devParameter.domainName`で設定したドメインに対して以下を実行

      ```bash
      curl https://api.DOMAIN_NAME/healthcheck
      ```

   2. 以下の応答を確認
      - ステータスコード: 200
      - レスポンスボディ: `{"message":"success"}`

### 2. フロントエンドの確認

1. ブラウザでの動作確認
   1. アクセス確認
      - URL: https://DOMAIN_NAME にアクセス
      - Basic認証のダイアログが表示されること
   2. Basic認証
      - シークレットマネージャーに設定したBasic認証のユーザー名とパスワードを入力
      - 認証が成功しアプリケーションの画面が表示されること
   3. Typetalk認証
      - [Typetalkで始める]ボタンをクリック
      - Typetalkの認証画面に遷移すること
      - 認証後、アプリケーションにリダイレクトされること

## クリーンアップ

### 1. アプリケーションリソースの削除

1. CloudFormationコンソールで以下のスタックを手動で削除
    - ap-northeast-1 リージョン
        - TypetalkSentiment-Dev-Service
    - us-east-1 リージョン
        - TypetalkSentiment-Dev-CloudFrontAcm

2. 削除の確認
   - 両スタックが削除されていることを確認

### 2. クロスリージョンレプリケーションバケットを空にする

1. S3バケットの確認と空にする
   1. AWSマネジメントコンソールでS3サービスに移動
   2. AWSリージョンが「米国東部 (バージニア北部) us-east-1」で`typetalksentimentdev` で始まるバケットにチェックをつける
   3. 「空にする」をクリック
   4. 確認画面で「完全に削除」と入力
   5. 「空にする」をクリック

2. 削除の確認
   - バケットが空になっていることを確認

### 3. パイプラインの削除

1. パイプラインスタックの削除

   ```bash
   npx cdk destroy --all
   ```

2. 削除の確認
   - CloudFormation でスタックが削除されていること

### 4. シークレットマネージャーリソースの削除

1. シークレットの削除

   ```bash
   npx cdk destroy --app "npx ts-node --prefer-ts-exts bin/secrets-manager.ts" --all
   ```

2. 削除の確認
   - CloudFormation でスタックが削除されていること

### 5. 共有インフラリソースの削除

1. Route 53レコードの削除
   - ホストゾーンを選択
   - NSレコードとSOAレコード以外の全レコードを選択して削除

2. 共有インフラスタックの削除

   ```bash
   npx cdk destroy --app "npx ts-node --prefer-ts-exts bin/shared-infrastructure.ts" --all
   ```

3. 削除の確認
   - Route 53 のホストゾーンが削除されていること
   - SSMパラメータストアのパラメータが削除されていること

# スタンドアロンデプロイ手順書

## 目次

1. [目的](#目的)
2. [前提条件](#前提条件)
3. [事前準備](#事前準備)
4. [デプロイ手順](#デプロイ手順)
5. [動作確認](#動作確認)
6. [クリーンアップ](#クリーンアップ)

## 目的

本手順書は、Typetalk Sentiment Infrastructureをスタンドアロン方式で AWS上に構築するための手順を定義したものである。
このスタンドアロン方式では、継続的デプロイメントのパイプラインを構築せず、かつRoute53を使用せずに、一時的な検証や開発目的のために直接リソースをデプロイする方法を説明する。
本手順に従うことで、最小限の設定でアプリケーションの実行に必要なインフラ環境を構築できる。

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

2. 開発環境設定 (devParameter)
   - 開発環境で使用する独自ドメイン
   - 開発環境用AWSアカウントID
   - スタンドアロンデプロイでは、GitHub関連の設定は不要

3. スタンドアロンデプロイ固有の設定
   - `devParameter.useRoute53`を`false`に設定すること

   ```typescript
   useRoute53: false, // スタンドアロンデプロイではRoute53を使用しない
   ```

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

### 6. パラメータ設定の確認

スタンドアロンデプロイを実行する前に、以下のパラメータが正しく設定されていることを確認する。

1. 必須パラメータの確認
   - [parameter.ts](../parameter.ts)の`devParameter.domainName`が正しく設定されていること
   - [parameter.ts](../parameter.ts)の`devParameter.useRoute53`が`false`に設定されていること
   - [parameter.ts](../parameter.ts)の`systemParameter.env.account`が正しいAWSアカウントIDに設定されていること

注: スタンドアロンデプロイではGitHubリポジトリへのコミットやプッシュは不要である。ローカルでの設定変更のみで十分である。

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

- us-east-1 (CloudFront証明書用)
  - CloudFrontのACM証明書を作成

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

### 4. シークレットマネージャーリソースのデプロイ

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

### 5. スタンドアロンのデプロイ

開発環境をスタンドアロンで構築する。

1. スタックの合成

```bash
npx cdk synth --app "npx ts-node --prefer-ts-exts bin/typetalk-sentiment-standalone.ts"
```

2. スタックのリスト

```bash
npx cdk list --app "npx ts-node --prefer-ts-exts bin/typetalk-sentiment-standalone.ts"
```

3. デプロイの実行

```bash
npx cdk deploy "TypetalkSentiment-Dev/*" --app "npx ts-node --prefer-ts-exts bin/typetalk-sentiment-standalone.ts"
```

または承認なしでデプロイする場合

```bash
npx cdk deploy "TypetalkSentiment-Dev/*" --app "npx ts-node --prefer-ts-exts bin/typetalk-sentiment-standalone.ts" --require-approval never
```

4. 証明書のDNS検証

デプロイ中、AWS Certificate Manager (ACM)のDNS検証が必要なため、以下のような状態でデプロイが一時停止する

```plaintext
CREATE_IN_PROGRESS | AWS::CloudFormation::Stack
CREATE_IN_PROGRESS | AWS::CertificateManager::Certificate
```

このとき、以下の手順でDNS検証を完了させること

    1. **デプロイプロセスを中断せずに**、別のターミナルウィンドウまたはブラウザで作業を行う

    2. AWS Management Consoleにログインし、Certificate Managerに移動する
        <https://console.aws.amazon.com/acm/>

    3. 作成中の証明書を選択し、「ドメイン」セクションを確認する

    4. 表示されているCNAMEレコード情報をメモする
        - 名前: _x1.api.example.com のような形式
        - 値: _x2.acm-validations.aws のような形式

    5. ドメインレジストラの管理画面で上記のCNAMEレコードを追加する

    6. DNS変更が反映されるまで待つ

    7. DNS検証が完了すると、実行中だったCDKデプロイプロセスが自動的に進行を再開する

`DOMAIN_NAME` と `api.DOMAIN_NAME` の2つのドメインに対して、それぞれ証明書の検証が必要になるため、上記の手順を2回実行する必要がある。

5. デプロイ完了後の設定

デプロイ完了後、自身のドメインレジストラにて CloudFront と API Gateway に設定する独自ドメイン用に CNAMEレコードを登録する

- CloudFront: `DOMAIN_NAME`
- API Gateway: `api.DOMAIN_NAME`

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

### 3. シークレットマネージャーリソースの削除

1. シークレットの削除

   ```bash
   npx cdk destroy --app "npx ts-node --prefer-ts-exts bin/secrets-manager.ts" --all
   ```

2. 削除の確認
   - CloudFormation でスタックが削除されていること

### 4. ドメインレジストラでのDNSレコードの削除

1. ドメインレジストラの管理画面にアクセス
2. スタンドアロンデプロイ用に追加したCNAMEレコードを削除
   - CloudFront用のCNAMEレコード
   - API Gateway用のCNAMEレコード
   - 証明書検証用のCNAMEレコード

3. 削除の確認
   - DNSレコードが正常に削除されていることを確認

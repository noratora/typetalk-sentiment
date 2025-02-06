import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigwv2i from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { BackendConfig } from "../../parameter-types";

export interface BackendProps {
  domainName: string;
  backendConfig: BackendConfig;
  hostedZone?: route53.IHostedZone;
}

export class Backend extends Construct {
  public readonly api: apigwv2.HttpApi;

  constructor(scope: Construct, id: string, props: BackendProps) {
    super(scope, id);

    const backendConfig = props.backendConfig;

    // AWS Lambda
    const apiFunctionConfig = backendConfig.apiFunction;
    const apiFunctionEnvironment = apiFunctionConfig.environment;
    const apiFunction = new lambda.DockerImageFunction(this, "ApiFunction", {
      // cdk のルートディレクトリからの相対パスで指定
      code: lambda.DockerImageCode.fromImageAsset("../../../apps/api/", {
        target: "deploy-stage",
      }),
      description: "Backend",
      timeout: cdk.Duration.seconds(apiFunctionConfig.memorySize),
      memorySize: apiFunctionConfig.memorySize,
      environment: {
        APP_ENV: apiFunctionEnvironment.appEnv,
        LOG_CONFIG_FILE: apiFunctionEnvironment.logConfigFile,
        LOGGER_NAME: apiFunctionEnvironment.loggerName,
        LOG_LEVEL: apiFunctionEnvironment.logLevel,
        USE_MOCK_AWS_COMPREHEND_API:
          apiFunctionEnvironment.useMockAwsComprehendApi,
        TYPETALK_API_BASE_URL: apiFunctionEnvironment.typetalkApiBaseUrl,
      },
      logRetention: apiFunctionConfig.logRetention,
    });

    // AWS Lambda に Amazon Comprehend のアクセス権限を付与する
    apiFunction.addToRolePolicy(
      // https://docs.aws.amazon.com/ja_jp/service-authorization/latest/reference/list_amazoncomprehend.html
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["comprehend:BatchDetectSentiment"],
        resources: ["*"],
      }),
    );

    // ACM
    // hostedZoneが提供されている場合はRoute53 DNS検証を使用し、提供されていない場合は手動DNS検証を使用する
    // 手動DNS検証の場合、デプロイ中にAWS Management ConsoleまたはAWS CLIで証明書の検証情報を確認し、
    // DNSレコードを設定する必要がある
    const apiCertificate = new acm.Certificate(this, "ApiCertificate", {
      domainName: "api." + props.domainName,
      subjectAlternativeNames: [`*.api.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });

    // カスタムドメイン名を定義
    const apiDomainName = new apigwv2.DomainName(this, "ApiDomainName", {
      domainName: "api." + props.domainName,
      certificate: apiCertificate,
    });

    // Amazon API Gateway HTTP APIの定義
    const apiGatewayConfig = backendConfig.apiGateway;
    this.api = new apigwv2.HttpApi(this, "Api", {
      apiName: "backendApi",
      defaultIntegration: new apigwv2i.HttpLambdaIntegration(
        "BackendApiHttpLambdaIntegration",
        apiFunction,
      ),
      defaultDomainMapping: {
        domainName: apiDomainName,
      },
    });
    // デフォルトステージにスロットリング設定を追加
    const stage = this.api.defaultStage!;
    const cfnStage = stage.node.defaultChild as apigwv2.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingBurstLimit: apiGatewayConfig.throttlingBurstLimit,
      throttlingRateLimit: apiGatewayConfig.throttlingRateLimit,
    };

    if (props.hostedZone) {
      // Route53 Alias Record
      const apiRoute53RecordSetProps = {
        zone: props.hostedZone,
        recordName: "api." + props.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.ApiGatewayv2DomainProperties(
            apiDomainName.regionalDomainName,
            apiDomainName.regionalHostedZoneId,
          ),
        ),
      };
      new route53.ARecord(this, "ApiARecord", apiRoute53RecordSetProps);
      new route53.AaaaRecord(this, "ApiAaaaRecord", apiRoute53RecordSetProps);
    }
  }
}

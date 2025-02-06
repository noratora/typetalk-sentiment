import * as cdk from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as apigwv2i from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cf from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { FrontendConfig } from "../../parameter-types";

/** 認証情報 */
interface AuthParameters {
  /** フロントエンドのNextjs(Auth.js)で用いるシークレット値 */
  authSecret: string;
  /** Typetalk OAuthのID */
  authTypetalkId: string;
  /** Typetalk OAuthのシークレット */
  authTypetalkSecret: string;
  /** フロントエンドAPIのシークレットキー */
  frontendApiSecretKey: string;
  /** Basic認証のエンコード済み文字列 */
  basicAuthEncoded: string;
}

export interface FrontendProps {
  cloudFrontCertificate: acm.ICertificate;
  backendApi: apigwv2.HttpApi;
  hostedZone?: route53.IHostedZone;
  systemName: string;
  envName: string;
  domainName: string;
  frontendConfig: FrontendConfig;
}

export class Frontend extends Construct {
  constructor(scope: Construct, id: string, props: FrontendProps) {
    super(scope, id);

    const frontendConfig = props.frontendConfig;

    // 認証情報を取得する
    const authParams = this.getAuthParameters(props.systemName, props.envName);

    // フロントエンド用のLambda関数
    const apiFunctionConfig = frontendConfig.apiFunction;
    const apiFunctionBuildArgs = apiFunctionConfig.buildArgs;
    const apiFunctionEnvironment = apiFunctionConfig.environment;
    const apiFunction = new lambda.DockerImageFunction(this, "ApiFunction", {
      code: lambda.DockerImageCode.fromImageAsset("../../../apps/web/", {
        target: "deploy-stage",
        buildArgs: {
          // Next.jsのビルド時にはダミー値を使用する環境変数
          AUTH_SECRET: "dummy-secret",
          AUTH_TYPETALK_ID: "dummy-id",
          AUTH_TYPETALK_SECRET: "dummy-secret",
          BACKEND_HOST: "dummy-host",
          // Next.jsのビルド時に使用する環境変数
          IMAGES_REMOTE_PATTERNS: apiFunctionBuildArgs.imagesRemotePatterns,
          ALLOWED_ORIGINS: apiFunctionBuildArgs.allowedOrigins,
        },
      }),
      description: "Frontend",
      timeout: cdk.Duration.seconds(apiFunctionConfig.timeout),
      memorySize: apiFunctionConfig.memorySize,
      environment: {
        AUTH_SECRET: authParams.authSecret,
        AUTH_TYPETALK_ID: authParams.authTypetalkId,
        AUTH_TYPETALK_SECRET: authParams.authTypetalkSecret,
        BACKEND_HOST: props.backendApi.apiEndpoint,
        AUTH_URL: `https://${props.domainName}`,
        AUTH_TRUST_HOST: "true",
        LOG_LEVEL: apiFunctionEnvironment.logLevel,
      },
      logRetention: apiFunctionConfig.logRetention,
    });

    // Lambda オーソライザー用関数を作成
    const apiAuthorizerFunction = new lambda.Function(
      this,
      "ApiAuthorizerFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset("lambda/authorizer"),
        handler: "index.handler",
        description: "Frontend API Authorizer",
        environment: {
          SECRET_KEY: authParams.frontendApiSecretKey,
        },
      },
    );

    // Lambdaオーソライザーを作成
    const apiAuthorizer = new HttpLambdaAuthorizer(
      "ApiAuthorizer",
      apiAuthorizerFunction,
      {
        identitySource: ["$request.header.secretkey"],
        responseTypes: [HttpLambdaResponseType.SIMPLE], // Define if returns simple and/or iam response
      },
    );

    // Amazon API Gateway HTTP APIの定義
    const apiGatewayConfig = frontendConfig.apiGateway;
    const frontendApi = new apigwv2.HttpApi(this, "Api", {
      apiName: "frontendApi",
      defaultIntegration: new apigwv2i.HttpLambdaIntegration(
        "ApiHttpLambdaIntegration",
        apiFunction,
      ),
      defaultAuthorizer: apiAuthorizer,
    });
    // デフォルトステージにスロットリング設定を追加
    const stage = frontendApi.defaultStage!;
    const cfnStage = stage.node.defaultChild as apigwv2.CfnStage;
    cfnStage.defaultRouteSettings = {
      throttlingBurstLimit: apiGatewayConfig.throttlingBurstLimit,
      throttlingRateLimit: apiGatewayConfig.throttlingRateLimit,
    };

    // CloudFront Functions のコードを動的に生成する
    const basicAuthFunctionCode = `
      /**
       * Basic認証を行う CloudFront Functions の関数。
       */
      function handler(event) {
        const request = event.request;
        const headers = request.headers;

        // echo -n user:pass | base64
        const authEncoded = "${authParams.basicAuthEncoded}";

        if (
          typeof headers.authorization === "undefined" ||
          headers.authorization.value !== \`Basic \${authEncoded}\`
        ) {
          return {
            statusCode: 401,
            statusDescription: "Unauthorized",
            headers: { "www-authenticate": { value: "Basic" } },
          };
        }

        return request;
      }
    `;

    // CloudFront Functions
    const cloudFrontBasicAuthFunction = new cf.Function(
      this,
      "CloudFrontBasicAuthFunction",
      {
        functionName: `${props.systemName}-${props.envName}-basic-auth`,
        code: cf.FunctionCode.fromInline(basicAuthFunctionCode),
        runtime: cf.FunctionRuntime.JS_2_0,
        comment: "Basic認証を行う CloudFront Functions",
      },
    );

    // CloudFront Origin
    const originApi = new origins.HttpOrigin(
      `${frontendApi.apiId}.execute-api.${
        cdk.Stack.of(this).region
      }.amazonaws.com`,
      {
        customHeaders: {
          secretkey: authParams.frontendApiSecretKey,
        },
      },
    );

    // CloudFront Distribution
    const cloudFrontDistribution = new cf.Distribution(
      this,
      "CloudFrontDistribution",
      {
        defaultBehavior: {
          origin: originApi,
          allowedMethods: cf.AllowedMethods.ALLOW_ALL,
          cachePolicy: cf.CachePolicy.CACHING_DISABLED, // Recommended for API Gateway
          originRequestPolicy:
            cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER, // Recommended for API Gateway
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          functionAssociations: [
            {
              function: cloudFrontBasicAuthFunction,
              eventType: cf.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
        certificate: props.cloudFrontCertificate,
        domainNames: [props.domainName],
      },
    );

    if (props.hostedZone) {
      // Route53 Alias Record
      const cloudFrontRoute53RecordSetProps = {
        zone: props.hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(cloudFrontDistribution),
        ),
      };
      new route53.ARecord(
        this,
        "CloudFrontARecord",
        cloudFrontRoute53RecordSetProps,
      );
      new route53.AaaaRecord(
        this,
        "CloudFrontAaaaRecord",
        cloudFrontRoute53RecordSetProps,
      );
    }
  }

  /**
   * 認証情報を取得する
   *
   * @param systemName - システム名
   * @param envName - 環境名
   * @returns 認証情報
   */
  getAuthParameters(systemName: string, envName: string): AuthParameters {
    const secretId = `/${systemName}/${envName}/Secrets`;

    const authSecret = cdk.SecretValue.secretsManager(secretId, {
      jsonField: "authSecret",
    }).unsafeUnwrap();
    const authTypetalkId = cdk.SecretValue.secretsManager(secretId, {
      jsonField: "authTypetalkId",
    }).unsafeUnwrap();
    const authTypetalkSecret = cdk.SecretValue.secretsManager(secretId, {
      jsonField: "authTypetalkSecret",
    }).unsafeUnwrap();
    const frontendApiSecretKey = cdk.SecretValue.secretsManager(secretId, {
      jsonField: "frontendApiSecretKey",
    }).unsafeUnwrap();
    const basicAuthEncoded = cdk.SecretValue.secretsManager(secretId, {
      jsonField: "basicAuthEncoded",
    }).unsafeUnwrap();

    return {
      authSecret,
      authTypetalkId,
      authTypetalkSecret,
      frontendApiSecretKey,
      basicAuthEncoded,
    };
  }
}

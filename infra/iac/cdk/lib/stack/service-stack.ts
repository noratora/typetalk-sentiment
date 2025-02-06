import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";
import { Backend } from "../construct/backend";
import { Frontend } from "../construct/frontend";

interface ServiceStackProps extends cdk.StackProps {
  cloudFrontCertificate: acm.ICertificate;
  parameter: AppParameter;
}

export class ServiceStack extends cdk.Stack {
  public readonly backend: Backend;
  public readonly frontend: Frontend;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    // パラメータを展開する
    const { systemName, envName, domainName, backendConfig, frontendConfig } =
      props.parameter;

    // Route53の使用有無を取得（デフォルトはfalse）
    const useRoute53 = props.parameter.useRoute53 ?? false;

    // ホストゾーンの取得（Route53使用時のみ）
    let hostedZone: route53.IHostedZone | undefined;

    if (useRoute53) {
      try {
        // SSMパラメータストアからホストゾーンIDを取得する
        const hostedZoneId = ssm.StringParameter.valueForStringParameter(
          this,
          `/${systemName}/Route53/HostedZoneId`,
        );

        // 事前に作成済みのRoute53ホストゾーンを取得する
        hostedZone = route53.HostedZone.fromHostedZoneAttributes(
          this,
          "HostedZone",
          {
            hostedZoneId: hostedZoneId,
            zoneName: domainName,
          },
        );
      } catch (error) {
        throw new Error(`Route53ホストゾーンの取得に失敗しました: ${error}`);
      }
    }

    // バックエンドの構築
    this.backend = new Backend(this, "Backend", {
      domainName: domainName,
      backendConfig: backendConfig,
      hostedZone: hostedZone,
    });

    // フロントエンドの構築
    this.frontend = new Frontend(this, "Frontend", {
      cloudFrontCertificate: props.cloudFrontCertificate,
      backendApi: this.backend.api,
      hostedZone: hostedZone,
      systemName: systemName,
      envName: envName,
      domainName: domainName,
      frontendConfig: frontendConfig,
    });

    // Route53使用状況の出力
    new cdk.CfnOutput(this, "UsingRoute53", {
      value: useRoute53 ? "Yes" : "No",
      description: "Route53の使用状況",
    });
  }
}

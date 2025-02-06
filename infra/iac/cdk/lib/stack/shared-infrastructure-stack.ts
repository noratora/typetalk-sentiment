import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";

/**
 * 共有インフラスタックのプロパティ
 */
interface SharedInfrastructureStackProps extends cdk.StackProps {
  /** アプリケーション設定 */
  parameter: AppParameter;
}

/**
 * 共有インフラスタック
 * - Route 53 Hosted Zone
 * - SSM Parameter Store による各種IDの共有
 */
export class SharedInfrastructureStack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(
    scope: Construct,
    id: string,
    props: SharedInfrastructureStackProps,
  ) {
    super(scope, id, props);

    const { systemName, domainName: hostedZoneName } = props.parameter;

    // Route 53 Hosted Zone の作成
    // NSレコードをドメインレジストラに設定する作業は手動で行う
    this.hostedZone = new route53.PublicHostedZone(this, "SharedHostedZone", {
      zoneName: hostedZoneName,
      comment: `Shared hosted zone for ${systemName}`,
    });

    // ホストゾーンIDを SSM Parameter Store に保存
    new ssm.StringParameter(this, "Route53HostedZoneId", {
      parameterName: `/${systemName}/Route53/HostedZoneId`,
      stringValue: this.hostedZone.hostedZoneId,
      description: `Hosted Zone ID for ${hostedZoneName}`,
      tier: ssm.ParameterTier.STANDARD,
      allowedPattern: "^Z[A-Z0-9]+$", // Hosted Zone ID の形式チェック
    });
    // ホストゾーン名をSSM Parameter Store に保存
    new ssm.StringParameter(this, "Route53HostedZoneName", {
      parameterName: `/${systemName}/Route53/HostedZoneName`,
      stringValue: hostedZoneName,
      description: `Hosted Zone Name (${hostedZoneName})`,
      tier: ssm.ParameterTier.STANDARD,
    });

    // スタックの出力値を定義
    new cdk.CfnOutput(this, "HostedZoneId", {
      value: this.hostedZone.hostedZoneId,
      description: "Route 53 Hosted Zone ID",
      exportName: `${systemName}-hosted-zone-id`,
    });
    new cdk.CfnOutput(this, "HostedZoneName", {
      value: this.hostedZone.zoneName,
      description: "Route 53 Hosted Zone Name",
      exportName: `${systemName}-hosted-zone-name`,
    });
  }
}

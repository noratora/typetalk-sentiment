import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { Certificate } from "../construct/certificate";

export interface CloudFrontAcmStackProps extends cdk.StackProps {
  systemName: string;
  domainName: string;
  useRoute53?: boolean;
}

export class CloudFrontAcmStack extends cdk.Stack {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: CloudFrontAcmStackProps) {
    super(scope, id, props);

    // Route53の使用有無を取得（デフォルトはfalse）
    const useRoute53 = props.useRoute53 ?? false;

    // ホストゾーンの取得（Route53使用時のみ）
    let hostedZone: route53.IHostedZone | undefined;

    if (useRoute53) {
      try {
        // SSMパラメータストアからホストゾーンIDを取得する
        const hostedZoneId = ssm.StringParameter.valueForStringParameter(
          this,
          `/${props.systemName}/Route53/HostedZoneId`,
        );

        // 事前に作成済みのRoute53ホストゾーンを取得する
        hostedZone = route53.HostedZone.fromHostedZoneAttributes(
          this,
          "HostedZone",
          {
            hostedZoneId: hostedZoneId,
            zoneName: props.domainName,
          },
        );
      } catch (error) {
        throw new Error(`Route53ホストゾーンの取得に失敗しました: ${error}`);
      }
    }

    // 証明書の構築
    const certificateConstruct = new Certificate(this, "Certificate", {
      domainName: props.domainName,
      hostedZone: hostedZone,
    });

    // 証明書の参照を保存
    this.certificate = certificateConstruct.certificate;

    // Route53使用状況の出力
    new cdk.CfnOutput(this, "UsingRoute53", {
      value: useRoute53 ? "Yes" : "No",
      description: "Route53の使用状況",
    });
  }
}

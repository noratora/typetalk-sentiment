import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface CloudFrontAcmStackProps extends cdk.StackProps {
  systemName: string;
  domainName: string;
  // hostedZoneId: string;
}

export class CloudFrontAcmStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: CloudFrontAcmStackProps) {
    super(scope, id, props);

    // SSMパラメータストア から hostedZoneId を取得する
    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      `/${props.systemName}/Route53/HostedZoneId`,
    );

    // 事前に作成済みの Route53 Hosted Zone を取得する
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: hostedZoneId,
        zoneName: props.domainName,
      },
    );

    // ACM
    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      subjectAlternativeNames: [`*.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });
  }
}

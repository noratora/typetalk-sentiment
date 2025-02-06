import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export interface CertificateProps {
  domainName: string;
  hostedZone?: route53.IHostedZone;
}

export class Certificate extends Construct {
  public readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateProps) {
    super(scope, id);

    // ACM
    // hostedZoneが提供されている場合はRoute53 DNS検証を使用し、提供されていない場合は手動DNS検証を使用する
    // 手動DNS検証の場合、デプロイ中にAWS Management ConsoleまたはAWS CLIで証明書の検証情報を確認し、
    // DNSレコードを設定する必要がある
    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      subjectAlternativeNames: [`*.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });
  }
}

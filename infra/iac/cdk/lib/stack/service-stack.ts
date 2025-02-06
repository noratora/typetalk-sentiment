import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";
import { Backend } from "../construct/backend";
import { Frontend } from "../construct/frontend";

interface ServiceStackProps extends cdk.StackProps {
  cloudFrontCertificate: acm.Certificate;
  parameter: AppParameter;
}

export class ServiceStack extends cdk.Stack {
  public readonly backend: Backend;
  public readonly frontend: Frontend;

  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    // parameterを展開する
    const { systemName, envName, domainName, backendConfig, frontendConfig } =
      props.parameter;

    // SSMパラメータストア から hostedZoneId を取得する
    const hostedZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      `/${systemName}/Route53/HostedZoneId`,
    );

    // 事前に作成済みの Route53 Hosted Zone を取得する
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        hostedZoneId: hostedZoneId,
        zoneName: domainName,
      },
    );

    this.backend = new Backend(this, "Backend", {
      domainName: domainName,
      backendConfig: backendConfig,
      hostedZone: hostedZone,
    });

    this.frontend = new Frontend(this, "Frontend", {
      cloudFrontCertificate: props.cloudFrontCertificate,
      backendApi: this.backend.api,
      hostedZone: hostedZone,
      systemName: systemName,
      envName: envName,
      domainName: domainName,
      frontendConfig: frontendConfig,
    });
  }
}

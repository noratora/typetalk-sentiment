import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";

interface SsmHostedZoneIdStackProps extends cdk.StackProps {
  parameter: AppParameter;
  /** ホストゾーンID */
  hostedZoneId: string;
}
export class SsmHostedZoneIdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SsmHostedZoneIdStackProps) {
    super(scope, id, props);

    const { systemName, domainName: hostedZoneName } = props.parameter;

    // ホストゾーンIDを SSM Parameter Store に保存
    new ssm.StringParameter(this, "Route53HostedZoneId", {
      parameterName: `/${systemName}/Route53/HostedZoneId`,
      stringValue: props.hostedZoneId,
      description: `Hosted Zone ID for ${hostedZoneName}`,
      tier: ssm.ParameterTier.STANDARD,
      allowedPattern: "^Z[A-Z0-9]+$", // Hosted Zone ID の形式チェック
    });
  }
}

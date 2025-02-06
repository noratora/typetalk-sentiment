import * as cdk from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";

interface SecretsManagerStackProps extends cdk.StackProps {
  parameter: AppParameter;
}

/**
 * 環境固有のシークレット値を管理するスタック
 */
export class SecretsManagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecretsManagerStackProps) {
    super(scope, id, props);

    const { systemName, envName } = props.parameter;

    const secretId = `/${systemName}/${envName}/Secrets`;

    new secretsmanager.Secret(this, "Secret", {
      secretName: secretId,
    });
  }
}

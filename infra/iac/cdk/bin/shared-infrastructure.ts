#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { SharedInfrastructureStack } from "../lib/stack/shared-infrastructure-stack";
import { SsmHostedZoneIdStack } from "../lib/stack/ssm-hosted-zone-id-stack";
import { systemParameter } from "../parameter";

const app = new cdk.App();

// システム共通設定を取得する
const parameter = systemParameter;

const sharedInfrastructureStack = new SharedInfrastructureStack(
  app,
  parameter.systemName + "SharedInfrastructure",
  {
    env: {
      account: parameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
      region: parameter.env?.region || process.env.CDK_DEFAULT_REGION,
    },
    // parameterから取得するもの
    parameter,
  },
);

// NOTE: CloudFront 用の ACM で使用するため、ホストゾーンIDをにバージニア北部リージョンのパラメータストアに保存する
new SsmHostedZoneIdStack(app, parameter.systemName + "SsmHostedZoneIdStack", {
  env: {
    account: parameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  crossRegionReferences: true,
  parameter,
  hostedZoneId: sharedInfrastructureStack.hostedZone.hostedZoneId,
});

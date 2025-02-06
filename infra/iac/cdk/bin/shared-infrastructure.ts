#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import "source-map-support/register";
import { SharedInfrastructureStack } from "../lib/stack/shared-infrastructure-stack";
import { SsmHostedZoneIdStack } from "../lib/stack/ssm-hosted-zone-id-stack";
import { getParameter } from "../parameter";

// 環境変数の読み込み
dotenv.config();

const app = new cdk.App();

const envKey = process.env.TARGET_ENV as string;
// 指定した環境のパラメータを取得する
const parameter = getParameter(envKey);

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

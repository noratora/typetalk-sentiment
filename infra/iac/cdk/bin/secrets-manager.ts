#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { SecretsManagerStack } from "../lib/stack/secrets-manager-stack";
import { getParameter } from "../parameter";

const app = new cdk.App();

const envKey = process.env.TARGET_ENV as string;
// 指定した環境のパラメータを取得する
const parameter = getParameter(envKey);

// Secrets Managerスタックの構築
// 環境固有のシークレット値を管理
new SecretsManagerStack(
  app,
  parameter.systemName + parameter.envName + "Secrets",
  {
    env: {
      account: parameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
      region: parameter.env?.region || process.env.CDK_DEFAULT_REGION,
    },
    parameter,
  },
);

#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { IConstruct } from "constructs";
import * as dotenv from "dotenv";
import { PipelineStack } from "../lib/stack/pipeline-stack";
import { getParameter } from "../parameter";

// 環境変数の読み込み
dotenv.config();

const app = new cdk.App();

const envKey = process.env.TARGET_ENV as string;
// 指定した環境のパラメータを取得する
const parameter = getParameter(envKey);

// CDKのパイプラインスタックを構築する
new PipelineStack(app, `${parameter.systemName}${parameter.envName}Pipeline`, {
  env: {
    account: parameter.env?.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: parameter.env?.region || process.env.CDK_DEFAULT_REGION,
  },
  parameter,
});

// すべてのリソースに削除ポリシーを適用する
class EnforceDeletionPolicy implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // 基本的な削除ポリシーの設定
    if (node instanceof cdk.CfnResource) {
      node.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }
  }
}

// 環境に応じて、削除ポリシーを適用する
if (envKey === "dev") {
  cdk.Aspects.of(app).add(new EnforceDeletionPolicy());
}

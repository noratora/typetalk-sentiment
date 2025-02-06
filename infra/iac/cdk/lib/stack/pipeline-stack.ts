import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";
import { ApplicationStage } from "../stage/application-stage";

interface PipelineStackProps extends cdk.StackProps {
  parameter: AppParameter;
}

/** CDKのCI/CDパイプラインを構築するスタック */
export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { parameter } = props;

    // CI/CDパイプラインの構築
    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      pipelineName: `${parameter.systemName}-${parameter.envName}-Pipeline`,
      // CDKの合成ステップ
      synth: new pipelines.ShellStep("Synth", {
        // GitHubリポジトリをソースとして設定
        input: pipelines.CodePipelineSource.connection(
          parameter.pipelineConfig.githubRepo,
          parameter.pipelineConfig.githubBranch,
          {
            // 事前に作成したConnectionのARNを指定
            connectionArn: parameter.pipelineConfig.codeConnectionsArn,
          },
        ),
        // CDKアプリケーションのビルドコマンド
        commands: [
          "cd infra/iac/cdk",
          "npm ci",
          "npm run build",
          "npx cdk synth",
        ],
        // ビルド結果の出力先ディレクトリ
        primaryOutputDirectory: "infra/iac/cdk/cdk.out",
        // 環境変数の設定
        env: {
          TARGET_ENV: parameter.targetEnv,
        },
      }),
      // アーティファクトバケットの設定
      artifactBucket: new s3.Bucket(
        this,
        `${parameter.systemName}-${parameter.envName}-ArtifactBucket`,
        {
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          autoDeleteObjects: true,
        },
      ),
    });

    // アプリケーションのデプロイ
    const stage = new ApplicationStage(
      this,
      `${parameter.systemName}-${parameter.envName}`,
      {
        parameter: parameter,
      },
    );

    // パラメータの設定に基づいて手動承認ステップを追加
    if (parameter.pipelineConfig.requiresManualApproval) {
      pipeline.addStage(stage, {
        pre: [
          new pipelines.ManualApprovalStep(
            `Approve-${parameter.systemName}-${parameter.envName}-Deploy`,
          ),
        ],
      });
    } else {
      pipeline.addStage(stage);
    }
  }
}

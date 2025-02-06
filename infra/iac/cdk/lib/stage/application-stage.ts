import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppParameter } from "../../parameter-types";
import { CloudFrontAcmStack } from "../stack/cloud-front-acm-stack";
import { ServiceStack } from "../stack/service-stack";

interface ApplicationStageProps extends cdk.StageProps {
  parameter: AppParameter;
}

/**
 * アプリケーションのインフラストラクチャを定義するステージクラス
 */
export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    // CloudFront用のACM証明書スタックの構築
    // NOTE: CloudFront 用の ACM はバージニア北部リージョンに作成する必要があるため別スタックで定義する
    const cloudFrontAcm = new CloudFrontAcmStack(this, "CloudFrontAcm", {
      env: {
        account: props.parameter.env.account,
        // バージニア北部固定
        region: "us-east-1",
      },
      crossRegionReferences: true,
      systemName: props.parameter.systemName,
      domainName: props.parameter.domainName,
      useRoute53: props.parameter.useRoute53,
    });

    // メインのサービススタックの構築
    new ServiceStack(this, "Service", {
      env: {
        account: props.parameter.env.account,
        region: props.parameter.env.region,
      },
      crossRegionReferences: true,
      cloudFrontCertificate: cloudFrontAcm.certificate,
      parameter: props.parameter,
    });
  }
}

import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { AppParameter, SystemParameter } from "./parameter-types";

/** システム共通設定 */
export const systemParameter: SystemParameter = {
  env: {
    // TODO [設定必須]: デプロイ環境のAWSアカウントID（12桁の数字）を設定してください
    account: "123456789012",
    region: "ap-northeast-1",
  },
  systemName: "TypetalkSentiment",
};
// TODO [設定必須]: 開発環境で使用する独自ドメインを設定してください
const devDomainName = "dev.example.com";

/** 開発環境の設定 */
export const devParameter: AppParameter = {
  env: systemParameter.env,
  systemName: systemParameter.systemName,
  targetEnv: "dev",
  envName: "Dev",
  domainName: devDomainName,
  useRoute53: true,
  pipelineConfig: {
    requiresManualApproval: false, // 開発環境は自動デプロイ
    // TODO [設定必須]: GitHubの組織名またはユーザー名を設定してください
    githubOwner: "my-org",
    // TODO [設定必須]: 組織名/リポジトリ名の形式で設定してください
    githubRepo: "my-org/my-repo",
    githubBranch: "develop",
    // TODO [設定必須]: AWS CodePipelineで作成したGitHub接続のARNを設定してください
    // 形式: arn:aws:codeconnections:ap-northeast-1:123456789012:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    codeConnectionsArn:
      "arn:aws:codeconnections:ap-northeast-1:123456789012:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
  backendConfig: {
    apiFunction: {
      timeout: 30,
      memorySize: 256,
      environment: {
        appEnv: "production",
        logConfigFile: "log_config/log_config_lambda.json",
        loggerName: "console_logger",
        logLevel: "INFO",
        useMockAwsComprehendApi: "false",
        typetalkApiBaseUrl: "https://typetalk.com",
      },
      logRetention: RetentionDays.THREE_MONTHS,
    },
    apiGateway: {
      throttlingBurstLimit: 100,
      throttlingRateLimit: 50,
    },
  },
  frontendConfig: {
    apiFunction: {
      timeout: 30,
      memorySize: 256,
      buildArgs: {
        imagesRemotePatterns:
          '[{ "protocol": "https", "hostname": "typetalk.com" },{ "protocol": "https", "hostname": "apps.nulab.com" }]',
        allowedOrigins: `${devDomainName},*.${devDomainName}`,
      },
      environment: {
        logLevel: "info",
      },
      logRetention: RetentionDays.THREE_MONTHS,
    },
    apiGateway: {
      throttlingBurstLimit: 100,
      throttlingRateLimit: 50,
    },
  },
};

// TODO [設定必須]: 本番環境で使用する独自ドメインを設定してください
const prodDomainName = "tts.noratora.com";

/** 本番環境の設定 */
export const prodParameter: AppParameter = {
  env: systemParameter.env,
  systemName: systemParameter.systemName,
  targetEnv: "prod",
  envName: "Prod",
  domainName: prodDomainName,
  useRoute53: true,
  pipelineConfig: {
    requiresManualApproval: true, // 本番環境は手動承認必要
    // TODO [設定必須]: GitHubの組織名またはユーザー名を設定してください
    githubOwner: "my-org",
    // TODO [設定必須]: 組織名/リポジトリ名の形式で設定してください
    githubRepo: "my-org/my-repo",
    githubBranch: "main",
    // TODO [設定必須]: AWS CodePipelineで作成したGitHub接続のARNを設定してください
    codeConnectionsArn:
      "arn:aws:codeconnections:ap-northeast-1:123456789012:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
  backendConfig: {
    apiFunction: {
      timeout: 30,
      memorySize: 256,
      environment: {
        appEnv: "production",
        logConfigFile: "log_config/log_config_lambda.json",
        loggerName: "console_logger",
        logLevel: "INFO",
        useMockAwsComprehendApi: "false",
        typetalkApiBaseUrl: "https://typetalk.com",
      },
      logRetention: RetentionDays.THREE_MONTHS,
    },
    apiGateway: {
      throttlingBurstLimit: 100,
      throttlingRateLimit: 50,
    },
  },
  frontendConfig: {
    apiFunction: {
      timeout: 30,
      memorySize: 256,
      buildArgs: {
        imagesRemotePatterns:
          '[{ "protocol": "https", "hostname": "typetalk.com" },{ "protocol": "https", "hostname": "apps.nulab.com" }]',
        allowedOrigins: `${prodDomainName},*.${prodDomainName}`,
      },
      environment: {
        logLevel: "info",
      },
      logRetention: RetentionDays.THREE_MONTHS,
    },
    apiGateway: {
      throttlingBurstLimit: 100,
      throttlingRateLimit: 50,
    },
  },
};

/** 環境パラメータのマップ */
export const parameterMap = new Map<string, AppParameter>([
  ["dev", devParameter],
  ["prod", prodParameter],
]);

/**
 * 環境パラメータを取得する
 * @param envKey - 環境キー（"dev" または "prod"）
 * @returns 指定された環境のパラメータ
 * @throws 未対応の環境が指定された場合
 */
export const getParameter = (envKey: string): AppParameter => {
  const parameter = parameterMap.get(envKey);
  if (parameter === undefined) {
    throw new Error(`environment ${envKey} is not supported.`);
  }
  return parameter;
};

import { Environment } from "aws-cdk-lib";
import { RetentionDays } from "aws-cdk-lib/aws-logs";

/** システム共通設定 */
export interface SystemParameter {
  /** デプロイ環境 */
  env: Environment;
  /** システム名 */
  systemName: string;
}

/** アプリケーション設定 */
export interface AppParameter extends SystemParameter {
  /** デプロイ対象の環境名 */
  targetEnv: string;
  /** 環境名 */
  envName: string;
  /** ドメイン名 */
  domainName: string;
  /** Route53を使用するかどうか */
  useRoute53: boolean;
  /** パイプライン設定 */
  pipelineConfig: PipelineConfig;
  /** バックエンド設定 */
  backendConfig: BackendConfig;
  /** フロントエンド設定 */
  frontendConfig: FrontendConfig;
}

/** パイプライン設定 */
export interface PipelineConfig {
  /** 手動承認ステップが必要かどうか */
  requiresManualApproval: boolean;
  /** リポジトリのオーナー */
  githubOwner: string;
  /** リポジトリ名 */
  githubRepo: string;
  /** デプロイ対象のブランチ */
  githubBranch: string;
  /** GitHub接続Arn */
  codeConnectionsArn: string;
}

/** バックエンド設定 */
export interface BackendConfig {
  /** Lambda */
  apiFunction: {
    timeout: number;
    memorySize: number;
    environment: {
      appEnv: string;
      logConfigFile: string;
      loggerName: string;
      logLevel: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
      useMockAwsComprehendApi: string;
      typetalkApiBaseUrl: string;
    };
    logRetention: RetentionDays;
  };
  /** apiGateway */
  apiGateway: {
    throttlingBurstLimit: number;
    throttlingRateLimit: number;
  };
}

/** フロントエンド設定 */
export interface FrontendConfig {
  /** Lambda */
  apiFunction: {
    timeout: number;
    memorySize: number;
    buildArgs: {
      imagesRemotePatterns: string;
      allowedOrigins: string;
    };
    environment: {
      logLevel: "debug" | "info" | "warn" | "error";
    };
    logRetention: RetentionDays;
  };
  /** apiGateway */
  apiGateway: {
    /** バーストレート制限 */
    throttlingBurstLimit: number;
    /** 1秒あたりのリクエスト制限 */
    throttlingRateLimit: number;
  };
}

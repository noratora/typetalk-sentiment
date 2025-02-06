import createJiti from "jiti";
import { fileURLToPath } from "node:url";
const jiti = createJiti(fileURLToPath(import.meta.url));
// .envファイルから設定値を読み込むために dotenv/config をインポートする
import "dotenv/config";

// https://env.t3.gg/docs/nextjs
// Import env here to validate during build. Using jiti we can import .ts files :)
jiti("./src/env/client");

// 許可する外部画像のホスト情報
const imagesRemotePatterns = process.env.IMAGES_REMOTE_PATTERNS
  ? JSON.parse(process.env.IMAGES_REMOTE_PATTERNS)
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windwos + Docker 環境で Fast Refresh が機能しない問題のワークアラウンド start
  // https://github.com/vercel/next.js/issues/36774#issuecomment-1211818610
  webpack: (config, context) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
  // Windwos + Docker 環境で Fast Refresh が機能しない問題のワークアラウンド end

  // https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
  images: {
    remotePatterns: [...imagesRemotePatterns],
  },

  // https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
  output: "standalone",
  // https://env.t3.gg/docs/nextjs
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],

  // https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#allowedorigins
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(","),
    },
  },
};

export default nextConfig;

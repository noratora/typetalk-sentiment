import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    /** next-auth のシークレットキー */
    AUTH_SECRET: z.string().min(1),
    /** Typetalk OAuth の client_id */
    AUTH_TYPETALK_ID: z.string().min(1),
    /** Typetalk OAuth の client_secret */
    AUTH_TYPETALK_SECRET: z.string().min(1),
    /** バックエンドAPIのホスト。 */
    BACKEND_HOST: z.string().min(1),
    /** ログレベル */
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  },
  experimental__runtimeEnv: {},
});

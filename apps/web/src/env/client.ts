// https://env.t3.gg/docs/nextjs

import { createEnv } from "@t3-oss/env-nextjs";
// import { z } from "zod";

export const env = createEnv({
  client: {
    // NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    // NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
  },
});

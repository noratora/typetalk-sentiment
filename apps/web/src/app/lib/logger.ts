import "server-only";

import { env } from "@/env/server";
import pino from "pino";

interface LogContext {
  [key: string]: unknown;
}

const pinoLogger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export const logger = {
  debug: (message: string, context?: LogContext) => {
    pinoLogger.debug({ msg: message, ...context });
  },
  info: (message: string, context?: LogContext) => {
    pinoLogger.info({ msg: message, ...context });
  },
  warn: (message: string, context?: LogContext) => {
    pinoLogger.warn({ msg: message, ...context });
  },
  error: (message: string, error: Error, context?: LogContext) => {
    pinoLogger.error({
      msg: message,
      err: error,
      ...context,
    });
  },
};

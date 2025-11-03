/* eslint-disable no-console */

export const logger = {
  info: (...args: any[]) => console.log("[INFO]", ...args),
  error: (...args: any[]) => console.error("[ERROR]", ...args),
  warn: (...args: any[]) => console.warn("[WARN]", ...args),
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log("[DEBUG]", ...args);
    }
  },
};

export default logger;

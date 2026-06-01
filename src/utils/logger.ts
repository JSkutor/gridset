const shouldMuteInfoLogs = import.meta.env.MODE === 'test';

export const appLogger = {
  info: (...args: unknown[]): void => {
    if (!shouldMuteInfoLogs) {
      console.info(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};

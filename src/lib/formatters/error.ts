import pc from "picocolors";

export const formatError = (message: string): string =>
  pc.red(`Error: ${message}`);

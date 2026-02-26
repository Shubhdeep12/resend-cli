import pc from "picocolors";

export const formatSuccess = (message: string): string =>
  pc.green(`Success: ${message}`);

import Table from "cli-table3";
import pc from "picocolors";

export const formatTable = (head: string[], rows: string[][]) => {
  const table = new Table({
    head: head.map((h) => pc.cyan(h)),
    style: {
      head: [],
      border: [],
    },
  });

  table.push(...rows);
  return table.toString();
};

export const formatError = (message: string) => {
  return pc.red(`Error: ${message}`);
};

export const formatSuccess = (message: string) => {
  return pc.green(`Success: ${message}`);
};

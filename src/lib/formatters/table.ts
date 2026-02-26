import Table from "cli-table3";
import pc from "picocolors";

export const formatTable = (head: string[], rows: string[][]): string => {
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

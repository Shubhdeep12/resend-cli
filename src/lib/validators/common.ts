export const parseString = (value: string): string => value;

export const parseLimit = (value: string): number => {
  const n = Number(value);
  if (Number.isNaN(n) || n < 1 || n > 100) {
    throw new Error("--limit must be a number between 1 and 100");
  }
  return n;
};

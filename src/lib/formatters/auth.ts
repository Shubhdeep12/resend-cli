export const maskApiKey = (key: string): string => {
  if (key.length <= 10) return `${key.slice(0, 4)}***`;
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
};

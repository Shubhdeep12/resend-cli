import type { SavedKey } from "../types/index.js";

export const getDefaultAddKeyName = (saved: SavedKey[]): string => {
  return saved.some((item) => item.name === "default")
    ? `key-${saved.length + 1}`
    : "default";
};

export const getDefaultLoginName = (
  saved: SavedKey[],
  selectedKeyName: string | undefined,
): string => {
  if (saved.length === 0) return "default";
  return selectedKeyName?.trim() || "default";
};

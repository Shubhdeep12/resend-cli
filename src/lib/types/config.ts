export interface ConfigSchema {
  keys?: Record<string, string>;
  selectedKeyName?: string;
  apiKey?: string;
  defaultFrom?: string;
  profile?: string;
  lastVersionCheckAt?: number;
}

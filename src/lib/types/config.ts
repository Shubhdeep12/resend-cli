export interface ConfigSchema {
  keys?: Record<string, string>;
  selectedKeyName?: string;
  apiKey?: string;
  defaultFrom?: string;
  profile?: string;
  /** Timestamp of last version check (for upgrade notice throttle). */
  lastVersionCheckAt?: number;
}

export const MESSAGES = {
  apiKeyMissing:
    "API key not found. Set RESEND_API_KEY (env or .env) or run `resend auth login`.",
  noSavedKeys: "No saved keys. Run `resend auth login` to add one.",
  envOverrideHint:
    "RESEND_API_KEY is set and overrides saved keys for this process.",
  envLogoutHint:
    "RESEND_API_KEY is currently active from environment. Unset it to log out from env-based auth.",
} as const;

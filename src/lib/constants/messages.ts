export const MESSAGES = {
  apiKeyMissing:
    "API key not found. Please run `resend auth login` or set RESEND_API_KEY environment variable.",
  noSavedKeys: "No saved keys. Run `resend auth login` to add one.",
  envOverrideHint:
    "RESEND_API_KEY is set and overrides saved keys for this process.",
  envLogoutHint:
    "RESEND_API_KEY is currently active from environment. Unset it to log out from env-based auth.",
} as const;

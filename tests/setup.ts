/**
 * Runs before any test file. Ensures the fetch mock is enabled before the
 * Resend SDK (loaded via app in command specs) captures global fetch.
 */
import "./test-utils/enable-fetch-mock.js";

// Disable CLI version checks during tests to avoid external network calls
// and keep CLI output deterministic for snapshots.
process.env.RESEND_CLI_NO_VERSION_CHECK = "1";

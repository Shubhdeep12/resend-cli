/**
 * Runs before any test file. Ensures the fetch mock is enabled before the
 * Resend SDK (loaded via app in command specs) captures global fetch.
 */
import "./test-utils/enable-fetch-mock.js";

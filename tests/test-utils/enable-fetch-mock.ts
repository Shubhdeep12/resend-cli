/**
 * Enables the global fetch mock so the Resend SDK (loaded later via app) uses it.
 * Used by tests/setup.ts so the mock is active before any test file loads.
 * Command specs also import cli-mocks which re-exports disableFetchMocks.
 */
import { vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";

const fetchMock = createFetchMock(vi as Parameters<typeof createFetchMock>[0]);
fetchMock.enableMocks();

/** Re-enable the fetch mock (e.g. in beforeEach) so it is active in the current context. */
export function enableFetchMocks(): void {
  fetchMock.enableMocks();
}

export function disableFetchMocks(): void {
  fetchMock.disableMocks();
}

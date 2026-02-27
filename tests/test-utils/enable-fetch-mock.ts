/**
 * Enables the global fetch mock so the Resend SDK (loaded later via app) uses it.
 * Used by tests/setup.ts so the mock is active before any test file loads.
 * Command specs also import cli-mocks which re-exports disableFetchMocks.
 */
import { vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";

const fetchMocker = createFetchMock(
  vi as Parameters<typeof createFetchMock>[0],
);
fetchMocker.enableMocks();

export function disableFetchMocks(): void {
  fetchMocker.disableMocks();
}

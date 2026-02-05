import type { MockParams } from 'vitest-fetch-mock';

export interface MockFetchOptions extends MockParams {}

/**
 * Mock successful JSON response.
 */
export function mockSuccessResponse<T>(
  data: T,
  options: MockFetchOptions = {},
): void {
  const { headers = {}, status = 200, ...rest } = options;
  fetchMock.mockOnce(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
    ...rest,
  });
}

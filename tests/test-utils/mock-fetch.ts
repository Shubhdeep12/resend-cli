import type { MockParams } from "vitest-fetch-mock";

export interface MockFetchOptions extends MockParams {}

/** API error shape (matches resend SDK ErrorResponse). */
export interface ErrorResponse {
  name: string;
  message: string;
  statusCode: number | null;
}

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
    headers: { "content-type": "application/json", ...headers },
    ...rest,
  });
}

/**
 * Mock API error response (422, 404, 401, 500).
 */
export function mockErrorResponse(
  error: ErrorResponse,
  options: MockFetchOptions = {},
): void {
  const { headers = {}, status = error.statusCode ?? 422, ...rest } = options;
  fetchMock.mockOnce(JSON.stringify(error), {
    status,
    headers: { "content-type": "application/json", ...headers },
    ...rest,
  });
}

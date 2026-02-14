import { vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";
import { DUMMY_API_KEY } from "./helpers.js";

vi.mock("#/lib/config.js", () => ({
  config: {
    get apiKey() {
      return process.env.RESEND_API_KEY ?? DUMMY_API_KEY;
    },
    set apiKey(_: string | undefined) {},
    get defaultFrom() {
      return undefined;
    },
    set defaultFrom(_: string | undefined) {},
    get profile() {
      return "default";
    },
    clear: vi.fn(),
  },
}));

vi.mock("@clack/prompts", () => ({
  default: {},
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(() => false),
  text: vi.fn().mockResolvedValue(DUMMY_API_KEY),
  note: vi.fn(),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

const fetchMocker = createFetchMock(
  vi as Parameters<typeof createFetchMock>[0],
);
fetchMocker.enableMocks();

export function disableFetchMocks(): void {
  fetchMocker.disableMocks();
}

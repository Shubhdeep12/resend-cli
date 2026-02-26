import { vi } from "vitest";
import createFetchMock from "vitest-fetch-mock";
import { DUMMY_API_KEY } from "./helpers.js";

const inMemoryKeys: Record<string, string> = { default: DUMMY_API_KEY };
let selectedKeyName: string | undefined = "default";

vi.mock("#/lib/config.js", () => ({
  config: {
    get apiKey() {
      return (
        process.env.RESEND_API_KEY ??
        (selectedKeyName ? inMemoryKeys[selectedKeyName] : undefined)
      );
    },
    set apiKey(value: string | undefined) {
      if (!value) return;
      inMemoryKeys.default = value;
      selectedKeyName = "default";
    },
    get defaultFrom() {
      return undefined;
    },
    set defaultFrom(_: string | undefined) {},
    get profile() {
      return "default";
    },
    get selectedKeyName() {
      return selectedKeyName;
    },
    saveKey(name: string, key: string) {
      inMemoryKeys[name] = key;
    },
    getKey(name: string) {
      return inMemoryKeys[name];
    },
    listKeys() {
      return Object.entries(inMemoryKeys).map(([name, key]) => ({ name, key }));
    },
    selectKey(name: string) {
      if (!(name in inMemoryKeys)) return false;
      selectedKeyName = name;
      return true;
    },
    removeKey(name: string) {
      if (!(name in inMemoryKeys)) return false;
      delete inMemoryKeys[name];
      if (selectedKeyName === name) {
        selectedKeyName = Object.keys(inMemoryKeys)[0];
      }
      return true;
    },
    clearSavedKeys() {
      for (const key of Object.keys(inMemoryKeys)) {
        delete inMemoryKeys[key];
      }
      selectedKeyName = undefined;
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

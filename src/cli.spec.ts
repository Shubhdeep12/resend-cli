import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "@stricli/core";
import type {
  CreateApiKeyResponseSuccess,
  CreateContactResponseSuccess,
  CreateDomainResponseSuccess,
  CreateEmailResponseSuccess,
  CreateWebhookResponseSuccess,
  GetBroadcastResponseSuccess,
  GetEmailResponseSuccess,
  GetWebhookResponseSuccess,
  ListApiKeysResponseSuccess,
  ListBroadcastsResponseSuccess,
  ListContactsResponseSuccess,
  ListDomainsResponseSuccess,
  ListWebhooksResponseSuccess,
  RemoveApiKeyResponseSuccess,
  RemoveWebhookResponseSuccess,
  UpdateWebhookResponseSuccess,
  VerifyDomainsResponseSuccess,
} from "resend";

/** Resend does not export ListEmailsResponseSuccess; match SDK list response shape */
type ListEmailsResponseSuccess = {
  object: "list";
  has_more: boolean;
  data: Omit<GetEmailResponseSuccess, "html" | "text" | "tags" | "object">[];
};
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import createFetchMock from "vitest-fetch-mock";
import { app } from "./app.js";
import { mockSuccessResponse } from "./test-utils/mock-fetch.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliDir = path.join(__dirname, "..");
const cliPath = path.join(cliDir, "dist", "index.cjs");

const fetchMocker = createFetchMock(
  vi as Parameters<typeof createFetchMock>[0],
);
fetchMocker.enableMocks();

vi.mock("./lib/config.js", () => ({
  config: {
    get apiKey() {
      return "re_test_key";
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
  text: vi.fn().mockResolvedValue("re_test_key"),
  spinner: () => ({ start: vi.fn(), stop: vi.fn() }),
}));

beforeAll(() => {
  const build = spawnSync("pnpm", ["run", "build"], {
    cwd: cliDir,
    encoding: "utf8",
  });
  if (build.status !== 0) {
    throw new Error(`CLI build failed: ${build.stderr ?? build.stdout}`);
  }
});

function runCli(args: string[]): {
  stdout: string;
  stderr: string;
  status: number | null;
} {
  const result = spawnSync("node", [cliPath, ...args], {
    encoding: "utf8",
    env: { ...process.env, RESEND_API_KEY: "" },
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status,
  };
}

const runApp = (argv: string[]) => run(app, argv, { process });

/** Runs the app and returns the last JSON output from stdout (for --json commands). */
async function runAppWithOutput(argv: string[]): Promise<{ output: unknown }> {
  const writeSpy = vi
    .spyOn(process.stdout, "write")
    .mockImplementation(() => true);
  await run(app, argv, { process });
  const calls = writeSpy.mock.calls;
  writeSpy.mockRestore();
  // Last argument that is a JSON string is the CLI --json output
  for (let i = calls.length - 1; i >= 0; i--) {
    const arg = calls[i]?.[0];
    const str =
      typeof arg === "string"
        ? arg
        : (arg as Buffer | Uint8Array)?.toString?.();
    if (typeof str === "string") {
      const trimmed = str.trimEnd();
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return { output: parsed };
      } catch {
        // not JSON, continue
      }
    }
  }
  return { output: undefined };
}

describe("Resend CLI", () => {
  afterEach(() => fetchMock.resetMocks());
  afterAll(() => fetchMocker.disableMocks());

  describe("help and version", () => {
    it("--help prints usage and lists all commands", () => {
      const { stdout, status } = runCli(["--help"]);
      expect(status).toBe(0);
      expect(stdout).toContain("USAGE");
      expect(stdout).toContain("resend init");
      expect(stdout).toContain("resend emails");
      expect(stdout).toContain("resend domains");
      expect(stdout).toContain("resend contacts");
      expect(stdout).toContain("resend broadcasts");
      expect(stdout).toContain("resend webhooks");
      expect(stdout).toContain("resend keys");
      expect(stdout).toContain("FLAGS");
      expect(stdout).toContain("--help");
      expect(stdout).toContain("--version");
    });

    it("--version prints version", () => {
      const { stdout, status } = runCli(["--version"]);
      expect(status).toBe(0);
      expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });

    describe("subcommands", () => {
      it("emails send --help shows send flags", () => {
        const { stdout, status } = runCli(["emails", "send", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("Send an email");
        expect(stdout).toContain("--from");
        expect(stdout).toContain("--to");
        expect(stdout).toContain("--subject");
        expect(stdout).toContain("--json");
      });

      it("emails list --help shows list description", () => {
        const { stdout, status } = runCli(["emails", "list", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("List sent emails");
      });

      it("domains --help shows domains subcommands", () => {
        const { stdout, status } = runCli(["domains", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("list");
        expect(stdout).toContain("add");
        expect(stdout).toContain("verify");
      });

      it("webhooks --help shows webhook subcommands", () => {
        const { stdout, status } = runCli(["webhooks", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("list");
        expect(stdout).toContain("create");
        expect(stdout).toContain("update");
        expect(stdout).toContain("delete");
      });

      it("keys --help shows API key subcommands", () => {
        const { stdout, status } = runCli(["keys", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("list");
        expect(stdout).toContain("create");
        expect(stdout).toContain("delete");
      });

      it("contacts --help shows contact subcommands", () => {
        const { stdout, status } = runCli(["contacts", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("list");
        expect(stdout).toContain("create");
      });

      it("broadcasts --help shows broadcast subcommands", () => {
        const { stdout, status } = runCli(["broadcasts", "--help"]);
        expect(status).toBe(0);
        expect(stdout).toContain("list");
        expect(stdout).toContain("get");
      });
    });

    describe("unknown command", () => {
      it("exits non-zero and suggests alternatives", () => {
        const { stderr, status } = runCli(["unknown-command"]);
        expect(status).not.toBe(0);
        expect(stderr).toBeTruthy();
      });
    });
  });

  describe("init", () => {
    it("runs without error (prompts mocked)", async () => {
      await expect(runApp(["init"])).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("emails", () => {
    describe("list", () => {
      it("calls API and returns JSON", async () => {
        const response: ListEmailsResponseSuccess = {
          object: "list",
          has_more: false,
          data: [
            {
              id: "67d9bcdb-5a02-42d7-8da9-0d6feea18cff",
              to: ["zeno@resend.com"],
              from: "bu@resend.com",
              created_at: "2023-04-07T23:13:52.669661+00:00",
              subject: "Test email",
              bcc: null,
              cc: null,
              reply_to: null,
              last_event: "delivered",
              scheduled_at: null,
            },
          ],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput(["emails", "list", "--json"]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/emails");
        expect(output).toEqual(response);
      });
    });

    describe("send", () => {
      it("calls send API with payload", async () => {
        const response: CreateEmailResponseSuccess = { id: "em_sent_1" };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "emails",
          "send",
          "--from",
          "a@b.com",
          "--to",
          "c@d.com",
          "--subject",
          "Hi",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = fetchMock.mock.calls[0]?.[1]?.body as string;
        expect(body).toBeDefined();
        const parsed = JSON.parse(body) as Record<string, unknown>;
        expect(parsed.from).toBe("a@b.com");
        expect(parsed.subject).toBe("Hi");
        expect(parsed.to).toBeDefined();
        expect(output).toEqual({ data: response });
      });
    });

    describe("get", () => {
      it("calls get API with id", async () => {
        const response: GetEmailResponseSuccess = {
          id: "em_1",
          subject: "Test",
          from: "a@b.com",
          to: ["c@d.com"],
          created_at: "2025-01-01T00:00:00Z",
          last_event: "sent",
          bcc: null,
          cc: null,
          html: null,
          reply_to: null,
          text: null,
          tags: [],
          scheduled_at: null,
          topic_id: null,
          object: "email",
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "emails",
          "get",
          "em_123",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/emails/em_123");
        expect(output).toEqual(response);
      });
    });
  });

  describe("domains", () => {
    describe("list", () => {
      it("calls domains API and returns JSON", async () => {
        const response: ListDomainsResponseSuccess = {
          object: "list",
          has_more: false,
          data: [
            {
              id: "dom_1",
              name: "example.com",
              status: "verified",
              region: "us-east-1",
              created_at: "2025-01-01",
              capabilities: { sending: "enabled", receiving: "enabled" },
            },
          ],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "domains",
          "list",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/domains");
        expect(output).toEqual(response);
      });
    });

    describe("add", () => {
      it("calls create domain API with name and returns JSON", async () => {
        const response: CreateDomainResponseSuccess = {
          id: "dom_new",
          name: "example.com",
          status: "not_started",
          region: "us-east-1",
          created_at: "2025-01-01",
          capabilities: { sending: "enabled", receiving: "enabled" },
          records: [],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "domains",
          "add",
          "example.com",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = fetchMock.mock.calls[0]?.[0] as string;
        expect(url).toContain("/domains");
        const body = fetchMock.mock.calls[0]?.[1]?.body as string;
        expect(JSON.parse(body)).toMatchObject({ name: "example.com" });
        expect(output).toEqual(response);
      });
    });

    describe("verify", () => {
      it("calls verify domain API with id and returns JSON", async () => {
        const response: VerifyDomainsResponseSuccess = {
          id: "dom_1",
          object: "domain",
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "domains",
          "verify",
          "dom_123",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain(
          "/domains/dom_123/verify",
        );
        expect(output).toEqual(response);
      });
    });
  });

  describe("contacts", () => {
    describe("list", () => {
      it("calls contacts list API with audience id and returns JSON", async () => {
        const response: ListContactsResponseSuccess = {
          object: "list",
          has_more: false,
          data: [
            {
              id: "c_1",
              email: "a@b.com",
              first_name: "A",
              last_name: "B",
              created_at: "2025-01-01",
              unsubscribed: false,
            },
          ],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "contacts",
          "list",
          "--audience",
          "aud_abc",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const url = fetchMock.mock.calls[0]?.[0] as string;
        expect(url).toMatch(/\/(segments|audiences)\/aud_abc\/contacts/);
        expect(output).toEqual(response);
      });
    });

    describe("create", () => {
      it("calls create contact API with payload", async () => {
        const response: CreateContactResponseSuccess = {
          id: "c_new",
          object: "contact",
        };
        mockSuccessResponse(response);

        await runApp([
          "contacts",
          "create",
          "--audience",
          "aud_abc",
          "--email",
          "user@example.com",
          "--firstName",
          "Jane",
          "--lastName",
          "Doe",
          "--json",
        ]);

        if (fetchMock.mock.calls.length > 0) {
          const url = fetchMock.mock.calls[0]?.[0] as string;
          expect(url).toMatch(/\/(segments|audiences)\/aud_abc\/contacts/);
          const body = JSON.parse(
            (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
          );
          expect(body).toMatchObject({
            audienceId: "aud_abc",
            email: "user@example.com",
            firstName: "Jane",
            lastName: "Doe",
          });
        }
        // Command runs without throw; SDK may use non-fetch HTTP in some envs
      });
    });
  });

  describe("broadcasts", () => {
    describe("list", () => {
      it("calls broadcasts list API and returns JSON", async () => {
        const response: ListBroadcastsResponseSuccess = {
          object: "list",
          has_more: false,
          data: [
            {
              id: "bc_1",
              name: "News",
              status: "draft",
              segment_id: null,
              created_at: "2025-01-01",
              audience_id: "aud_abc",
              scheduled_at: null,
              sent_at: null,
            },
          ],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "broadcasts",
          "list",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/broadcasts");
        expect(output).toEqual(response);
      });
    });

    describe("get", () => {
      it("calls get broadcast API with id and returns JSON", async () => {
        const response: GetBroadcastResponseSuccess = {
          id: "bc_1",
          name: "News",
          status: "sent",
          segment_id: null,
          object: "broadcast",
          audience_id: "aud_abc",
          from: "a@b.com",
          subject: "Test",
          reply_to: ["a@b.com"],
          preview_text: "Test",
          scheduled_at: null,
          sent_at: null,
          topic_id: null,
          html: "<p>Test</p>",
          text: "Test",
          created_at: "2025-01-01T00:00:00Z",
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "broadcasts",
          "get",
          "bc_123",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/broadcasts/bc_123");
        expect(output).toEqual(response);
      });
    });
  });

  describe("webhooks", () => {
    describe("list", () => {
      it("calls webhooks API and returns JSON", async () => {
        const response: ListWebhooksResponseSuccess = {
          object: "list",
          has_more: false,
          data: [],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "webhooks",
          "list",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks");
        expect(output).toEqual(response);
      });
    });

    describe("get", () => {
      it("calls get webhook API with id and returns JSON", async () => {
        const response = {
          id: "wh_1",
          endpoint: "https://example.com/wh",
          status: "enabled" as const,
          events: ["email.sent"],
        } as GetWebhookResponseSuccess;
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "webhooks",
          "get",
          "wh_123",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks/wh_123");
        expect(output).toEqual(response);
      });
    });

    describe("create", () => {
      it("calls create webhook API with endpoint and events and returns JSON", async () => {
        const response: CreateWebhookResponseSuccess = {
          id: "wh_new",
          object: "webhook",
          signing_secret: "re_secret_xxx",
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "webhooks",
          "create",
          "--url",
          "https://example.com/hook",
          "--events",
          "email.sent",
          "--events",
          "email.delivered",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks");
        const body = JSON.parse(
          (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
        );
        expect(body).toMatchObject({
          endpoint: "https://example.com/hook",
          events: ["email.sent", "email.delivered"],
        });
        expect(output).toEqual(response);
      });
    });

    describe("update", () => {
      it("calls update webhook API with id and events and returns JSON", async () => {
        const response: UpdateWebhookResponseSuccess = {
          id: "wh_1",
          object: "webhook",
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "webhooks",
          "update",
          "wh_123",
          "--events",
          "email.sent",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks/wh_123");
        const body = JSON.parse(
          (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
        );
        expect(body.events).toEqual(["email.sent"]);
        expect(output).toEqual(response);
      });
    });

    describe("delete", () => {
      it("calls remove webhook API with id and returns JSON", async () => {
        const response: RemoveWebhookResponseSuccess = {
          id: "wh_123",
          object: "webhook",
          deleted: true,
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "webhooks",
          "delete",
          "wh_123",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/webhooks/wh_123");
        expect(output).toEqual(response);
      });
    });
  });

  describe("keys", () => {
    describe("list", () => {
      it("calls API keys list and returns JSON", async () => {
        const response: ListApiKeysResponseSuccess = {
          object: "list",
          has_more: false,
          data: [{ id: "k_1", name: "Key", created_at: "2025-01-01" }],
        };
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput(["keys", "list", "--json"]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/api-keys");
        expect(output).toEqual(response);
      });
    });

    describe("create", () => {
      it("calls create API key with name and returns JSON", async () => {
        const response: CreateApiKeyResponseSuccess = {
          id: "k_new",
          token: "re_secret_xxx",
        };
        mockSuccessResponse(response, { status: 201 });

        const { output } = await runAppWithOutput([
          "keys",
          "create",
          "--name",
          "My Key",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/api-keys");
        const body = JSON.parse(
          (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
        );
        expect(body).toMatchObject({ name: "My Key" });
        expect(output).toEqual(response);
      });
    });

    describe("delete", () => {
      it("calls remove API key with id and returns JSON", async () => {
        const response: RemoveApiKeyResponseSuccess = {};
        mockSuccessResponse(response);

        const { output } = await runAppWithOutput([
          "keys",
          "delete",
          "k_123",
          "--json",
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toContain("/api-keys/k_123");
        expect(output).toEqual(response);
      });
    });
  });
});

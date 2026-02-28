import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { app } from "#/app.js";
import { disableFetchMocks, enableFetchMocks, resetConfigMock } from "../test-utils/cli-mocks.js";
import {
  runApp,
  runAppWithOutput,
  runAppWithStdout,
} from "../test-utils/helpers.js";
import {
  mockErrorResponse,
  mockSuccessResponse,
} from "../test-utils/mock-fetch.js";
import {
  emails as emailSnapshots,
  errors,
  listEmpty,
} from "../test-utils/snapshots.js";

describe("Emails", () => {
  beforeEach(() => {
    enableFetchMocks();
    resetConfigMock();
  });
  afterEach(() => fetchMock.resetMocks());
  afterAll(disableFetchMocks);

  describe("send", () => {
    it("sends email and returns data with id", async () => {
      mockSuccessResponse(emailSnapshots.sendId);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "send",
        "--from",
        "bu@resend.com",
        "--to",
        "zeno@resend.com",
        "--subject",
        "Hello World",
        "--html",
        "<h1>Hello world</h1>",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails",
      );
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
      const body = JSON.parse(
        (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
      );
      expect(body).toMatchObject({
        from: "bu@resend.com",
        to: "zeno@resend.com",
        subject: "Hello World",
        html: "<h1>Hello world</h1>",
      });
      expect(output).toMatchInlineSnapshot(`
        {
          "data": {
            "id": "71cdfe68-cf79-473a-a9d7-21f91db6a526",
          },
        }
      `);
    });

    it("sends email with multiple to (comma-separated)", async () => {
      mockSuccessResponse(emailSnapshots.sendIdAlt);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "send",
        "--from",
        "admin@resend.com",
        "--to",
        "bu@resend.com,zeno@resend.com",
        "--subject",
        "Hi",
        "--text",
        "Hello",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(
        (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
      );
      expect(body.to).toEqual(["bu@resend.com", "zeno@resend.com"]);
      expect(output).toMatchObject({
        data: { id: "124dc0f1-e36c-417c-a65c-e33773abc768" },
      });
    });

    it("sends correct request body for cc, bcc, replyTo", async () => {
      mockSuccessResponse(emailSnapshots.sendIdShort);
      await runAppWithOutput(app, [
        "emails",
        "send",
        "--from",
        "a@b.com",
        "--to",
        "c@d.com",
        "--subject",
        "S",
        "--html",
        "<p>H</p>",
        "--cc",
        "cc1@x.com",
        "--cc",
        "cc2@x.com",
        "--bcc",
        "bcc@x.com",
        "--replyTo",
        "r@x.com",
        "--json",
      ]);
      const body = JSON.parse(
        (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
      );
      expect(body.cc).toEqual(["cc1@x.com", "cc2@x.com"]);
      expect(Array.isArray(body.bcc) ? body.bcc : [body.bcc]).toEqual([
        "bcc@x.com",
      ]);
      expect(
        Array.isArray(body.reply_to) ? body.reply_to : [body.reply_to],
      ).toEqual(["r@x.com"]);
    });

    it("returns CLI error output when API returns 422 (invalid from)", async () => {
      mockErrorResponse(errors.invalidParameter, { status: 422 });
      const { output } = await runAppWithOutput(app, [
        "emails",
        "send",
        "--from",
        "resend.com",
        "--to",
        "bu@resend.com",
        "--subject",
        "Hi",
        "--text",
        "Hi",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(output).toMatchInlineSnapshot(`
        {
          "error": {
            "message": "Invalid \`from\` field. The email address needs to follow the \`email@example.com\` or \`Name <email@example.com>\` format",
            "name": "invalid_parameter",
            "statusCode": 422,
          },
        }
      `);
    });

    it("returns CLI error output when API returns 404 (template not found)", async () => {
      mockErrorResponse(errors.templateNotFound, { status: 404 });
      const { output } = await runAppWithOutput(app, [
        "emails",
        "send",
        "--template",
        "invalid-template-123",
        "--to",
        "user@example.com",
        "--json",
      ]);
      expect(output).toMatchObject({
        error: {
          name: "not_found",
          message: "Template not found",
          statusCode: 404,
        },
      });
    });

    it("returns CLI error output when API returns 401", async () => {
      mockErrorResponse(errors.invalidApiKey, { status: 401 });
      const { output } = await runAppWithOutput(app, [
        "emails",
        "list",
        "--json",
      ]);
      expect(output).toMatchObject({
        error: expect.objectContaining({
          name: "invalid_api_key",
          statusCode: 401,
        }),
      });
    });
  });

  describe("list", () => {
    it("calls GET /emails and returns list JSON", async () => {
      mockSuccessResponse(emailSnapshots.list);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "list",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails",
      );
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
      expect(output).toEqual(emailSnapshots.list);
    });

    it("calls endpoint with limit query param", async () => {
      mockSuccessResponse(listEmpty);
      await runAppWithOutput(app, [
        "emails",
        "list",
        "--limit",
        "10",
        "--json",
      ]);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails?limit=10",
      );
    });

    it("calls endpoint with after cursor", async () => {
      mockSuccessResponse(listEmpty);
      await runAppWithOutput(app, [
        "emails",
        "list",
        "--after",
        "cursor123",
        "--json",
      ]);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails?after=cursor123",
      );
    });

    it("calls endpoint with before cursor", async () => {
      mockSuccessResponse(listEmpty);
      await runAppWithOutput(app, [
        "emails",
        "list",
        "--before",
        "cursor123",
        "--json",
      ]);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails?before=cursor123",
      );
    });

    it("on API error prints error message (no --json)", async () => {
      mockErrorResponse(errors.invalidApiKey);
      const { stdout } = await runAppWithStdout(app, ["emails", "list"]);
      expect(fetchMock).toHaveBeenCalled();
      expect(stdout).toContain("Invalid API key");
    });
  });

  describe("get", () => {
    it("calls GET /emails/:id and returns email JSON", async () => {
      mockSuccessResponse(emailSnapshots.get);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "get",
        "67d9bcdb-5a02-42d7-8da9-0d6feea18cff",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails/67d9bcdb-5a02-42d7-8da9-0d6feea18cff",
      );
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("GET");
      expect(output).toEqual(emailSnapshots.get);
    });

    it("returns CLI error when email not found (404)", async () => {
      mockErrorResponse(errors.notFound, { status: 404 });
      const { output } = await runAppWithOutput(app, [
        "emails",
        "get",
        "61cda979-919d-4b9d-9638-c148b93ff410",
        "--json",
      ]);
      expect(output).toMatchObject({
        error: {
          name: "not_found",
          message: "Email not found",
          statusCode: 404,
        },
      });
    });
  });

  describe("update", () => {
    it("calls PATCH /emails/:id with scheduled_at body", async () => {
      mockSuccessResponse(emailSnapshots.update);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "update",
        "em_123",
        "--scheduledAt",
        "2025-02-01T12:00:00Z",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails/em_123",
      );
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("PATCH");
      const body = JSON.parse(
        (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
      );
      expect(body.scheduled_at).toBe("2025-02-01T12:00:00Z");
      expect(output).toMatchObject({ data: { id: "em_123" } });
    });
  });

  describe("cancel", () => {
    it("calls POST /emails/:id/cancel and returns data", async () => {
      mockSuccessResponse(emailSnapshots.cancel);
      const { output } = await runAppWithOutput(app, [
        "emails",
        "cancel",
        "em_123",
        "--json",
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        "https://api.resend.com/emails/em_123/cancel",
      );
      expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
      expect(output).toMatchObject({ data: { id: "em_123" } });
    });
  });

  describe("batch", () => {
    it("sends batch payload from --file and returns data/errors shape", async () => {
      mockSuccessResponse(emailSnapshots.batch);
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const os = await import("node:os");
      const filePath = path.join(
        os.tmpdir(),
        `resend-batch-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
      );
      await fs.writeFile(
        filePath,
        JSON.stringify([
          { from: "a@b.com", to: "x@y.com", subject: "A", html: "<p>A</p>" },
          { from: "a@b.com", to: "z@y.com", subject: "B", html: "<p>B</p>" },
        ]),
      );
      try {
        const { output } = await runAppWithOutput(app, [
          "emails",
          "batch",
          "--file",
          filePath,
          "--json",
        ]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0]?.[0]).toBe(
          "https://api.resend.com/emails/batch",
        );
        expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
        const body = JSON.parse(
          (fetchMock.mock.calls[0]?.[1]?.body as string) ?? "{}",
        );
        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(2);
        expect(body[0]).toMatchObject({
          from: "a@b.com",
          to: "x@y.com",
          subject: "A",
        });
        expect(output).toEqual(emailSnapshots.batch);
      } finally {
        await fs.unlink(filePath).catch(() => {});
      }
    });
  });
});

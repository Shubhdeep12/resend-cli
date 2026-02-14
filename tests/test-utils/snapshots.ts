/**
 * Central mock data for CLI unit tests.
 * Typed with Resend SDK types so when the SDK changes, type errors surface here.
 */
import type {
  CancelEmailResponseSuccess,
  CreateApiKeyResponseSuccess,
  CreateContactResponseSuccess,
  CreateDomainResponseSuccess,
  CreateEmailResponseSuccess,
  CreateSegmentResponseSuccess,
  CreateWebhookResponseSuccess,
  ErrorResponse,
  GetEmailResponseSuccess,
  GetSegmentResponseSuccess,
  GetWebhookResponseSuccess,
  ListApiKeysResponseSuccess,
  ListBroadcastsResponseSuccess,
  ListContactsResponseSuccess,
  ListDomainsResponseSuccess,
  ListSegmentsResponseSuccess,
  ListTemplatesResponseSuccess,
  ListTopicsResponseSuccess,
  ListWebhooksResponseSuccess,
  RemoveApiKeyResponseSuccess,
  RemoveWebhookResponseSuccess,
  UpdateEmailResponseSuccess,
  UpdateWebhookResponseSuccess,
} from "resend";
import type {
  GetBroadcastResponseSuccess,
  ListContactPropertiesResponseSuccess,
  GetContactPropertyResponseSuccess,
  CreateContactPropertyResponseSuccess,
  RemoveSegmentResponseSuccess,
  RemoveTopicResponseSuccess,
  CreateTopicResponseSuccess,
  GetTopicResponseSuccess,
  VerifyDomainsResponseSuccess,
  CreateTemplateResponseSuccess,
  GetTemplateResponseSuccess,
  DuplicateTemplateResponseSuccess,
  PublishTemplateResponseSuccess,
  RemoveTemplateResponseSuccess,
  UpdateTemplateResponseSuccess,
} from "resend";

/** API error payloads (Resend ErrorResponse). */
export const errors = {
  invalidParameter: {
    name: "invalid_parameter",
    message:
      'Invalid `from` field. The email address needs to follow the `email@example.com` or `Name <email@example.com>` format',
    statusCode: 422,
  } satisfies ErrorResponse,
  notFound: {
    name: "not_found",
    message: "Email not found",
    statusCode: 404,
  } satisfies ErrorResponse,
  templateNotFound: {
    name: "not_found",
    message: "Template not found",
    statusCode: 404,
  } satisfies ErrorResponse,
  invalidApiKey: {
    name: "invalid_api_key",
    message: "Invalid API key",
    statusCode: 401,
  } satisfies ErrorResponse,
};

/** Empty list response (reusable for any list endpoint). */
export const listEmpty = {
  object: "list" as const,
  has_more: false,
  data: [],
};

/** Emails */
export const emails = {
  sendId: { id: "71cdfe68-cf79-473a-a9d7-21f91db6a526" } satisfies CreateEmailResponseSuccess,
  sendIdAlt: { id: "124dc0f1-e36c-417c-a65c-e33773abc768" } satisfies CreateEmailResponseSuccess,
  sendIdShort: { id: "em_1" } satisfies CreateEmailResponseSuccess,
  /** Matches Resend ListEmailsResponseSuccess shape (object, has_more, data). */
  list: {
    object: "list" as const,
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
        last_event: "delivered" as const,
        scheduled_at: null,
      },
    ],
  },
  get: {
    object: "email" as const,
    id: "67d9bcdb-5a02-42d7-8da9-0d6feea18cff",
    to: ["zeno@resend.com"],
    from: "bu@resend.com",
    created_at: "2023-04-07T23:13:52.669661+00:00",
    subject: "Test email",
    html: "<p>hello hello</p>",
    text: null,
    bcc: null,
    cc: null,
    reply_to: null,
    last_event: "delivered" as const,
    scheduled_at: null,
  } satisfies GetEmailResponseSuccess,
  update: {
    id: "em_123",
    object: "email" as const,
  } satisfies UpdateEmailResponseSuccess,
  cancel: { id: "em_123", object: "email" as const } satisfies CancelEmailResponseSuccess,
  /** Batch response (data + errors when batchValidation is permissive). */
  batch: {
    data: [{ id: "em_1" }, { id: "em_2" }],
    errors: [] as { index: number; message: string }[],
  },
};

/** Domains */
export const domains = {
  list: {
    object: "list" as const,
    has_more: false,
    data: [
      {
        id: "dom_1",
        name: "example.com",
        status: "verified" as const,
        region: "us-east-1",
        created_at: "2025-01-01",
        capabilities: { sending: "enabled", receiving: "enabled" },
      },
    ],
  } satisfies ListDomainsResponseSuccess,
  create: {
    id: "dom_new",
    name: "example.com",
    status: "not_started" as const,
    region: "us-east-1",
    created_at: "2025-01-01",
    capabilities: { sending: "enabled", receiving: "enabled" },
    records: [],
  } satisfies CreateDomainResponseSuccess,
  verify: { id: "dom_1", object: "domain" as const } satisfies VerifyDomainsResponseSuccess,
};

/** Contacts */
export const contacts = {
  list: {
    object: "list" as const,
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
  } satisfies ListContactsResponseSuccess,
  create: { id: "c_new", object: "contact" as const } satisfies CreateContactResponseSuccess,
};

/** API keys */
export const apiKeys = {
  list: {
    object: "list" as const,
    has_more: false,
    data: [{ id: "k_1", name: "Key", created_at: "2025-01-01" }],
  } satisfies ListApiKeysResponseSuccess,
  create: { id: "k_new", token: "re_secret_xxx" } satisfies CreateApiKeyResponseSuccess,
  remove: {} satisfies RemoveApiKeyResponseSuccess,
};

/** Topics */
export const topics = {
  list: {
    data: [
      {
        id: "topic_1",
        name: "News",
        description: "Newsletter",
        default_subscription: "opt_out" as const,
        created_at: "2025-01-01T00:00:00Z",
      },
    ],
  } satisfies ListTopicsResponseSuccess,
  get: {
    id: "topic_1",
    name: "News",
    description: "Newsletter",
    default_subscription: "opt_out" as const,
    created_at: "2025-01-01T00:00:00Z",
  } satisfies GetTopicResponseSuccess,
  create: { id: "topic_new" } satisfies CreateTopicResponseSuccess,
  remove: {
    id: "topic_123",
    object: "topic" as const,
    deleted: true,
  } satisfies RemoveTopicResponseSuccess,
};

/** Webhooks */
export const webhooks = {
  list: { object: "list" as const, has_more: false, data: [] } satisfies ListWebhooksResponseSuccess,
  get: {
    id: "wh_1",
    object: "webhook" as const,
    created_at: "2025-01-01T00:00:00Z",
    status: "enabled" as const,
    endpoint: "https://example.com/wh",
    events: ["email.sent"],
    signing_secret: "re_secret_xxx",
  } satisfies GetWebhookResponseSuccess,
  create: {
    id: "wh_new",
    object: "webhook" as const,
    signing_secret: "re_secret_xxx",
  } satisfies CreateWebhookResponseSuccess,
  update: { id: "wh_1", object: "webhook" as const } satisfies UpdateWebhookResponseSuccess,
  remove: {
    id: "wh_123",
    object: "webhook" as const,
    deleted: true,
  } satisfies RemoveWebhookResponseSuccess,
};

/** Templates */
export const templates = {
  list: {
    object: "list" as const,
    has_more: false,
    data: [
      {
        id: "tmpl_1",
        name: "Welcome",
        status: "published" as const,
        alias: null,
        updated_at: "2025-01-01T00:00:00Z",
        created_at: "2025-01-01T00:00:00Z",
        published_at: "2025-01-01T00:00:00Z",
      },
    ],
  } satisfies ListTemplatesResponseSuccess,
  get: {
    id: "tmpl_1",
    name: "Welcome",
    status: "published" as const,
    subject: "Welcome",
    from: "noreply@example.com",
    object: "template" as const,
    html: "",
    text: null,
    variables: null,
    alias: null,
    reply_to: null,
    published_at: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    has_unpublished_versions: false,
    current_version_id: "v1",
  } satisfies GetTemplateResponseSuccess,
  create: { id: "tmpl_new", object: "template" as const } satisfies CreateTemplateResponseSuccess,
  update: { id: "tmpl_123", object: "template" as const } satisfies UpdateTemplateResponseSuccess,
  remove: {
    id: "tmpl_123",
    object: "template" as const,
    deleted: true,
  } satisfies RemoveTemplateResponseSuccess,
  duplicate: { id: "tmpl_copy", object: "template" as const } satisfies DuplicateTemplateResponseSuccess,
  publish: { id: "tmpl_123", object: "template" as const } satisfies PublishTemplateResponseSuccess,
};

/** Segments */
export const segments = {
  list: {
    object: "list" as const,
    has_more: false,
    data: [{ id: "seg_1", name: "Segment A", created_at: "2025-01-01" }],
  } satisfies ListSegmentsResponseSuccess,
  get: {
    id: "seg_1",
    name: "Segment A",
    created_at: "2025-01-01",
    object: "segment" as const,
  } satisfies GetSegmentResponseSuccess,
  create: { id: "seg_new", object: "segment" as const, name: "Segment A" } satisfies CreateSegmentResponseSuccess,
  remove: {
    id: "seg_123",
    object: "segment" as const,
    deleted: true,
  } satisfies RemoveSegmentResponseSuccess,
};

/** Contact properties */
export const contactProperties = {
  list: {
    object: "list" as const,
    has_more: false,
    data: [
      {
        id: "cp_1",
        key: "first_name",
        type: "string" as const,
        fallback_value: null,
        created_at: "2025-01-01",
      },
    ],
  } satisfies ListContactPropertiesResponseSuccess,
  get: {
    id: "cp_1",
    key: "first_name",
    type: "string" as const,
    fallback_value: null,
    created_at: "2025-01-01",
    object: "contact_property" as const,
  } satisfies GetContactPropertyResponseSuccess,
  create: { id: "cp_new", object: "contact_property" as const } satisfies CreateContactPropertyResponseSuccess,
  remove: {
    id: "cp_123",
    object: "contact_property" as const,
    deleted: true,
  } satisfies import("resend").RemoveContactPropertyResponseSuccess,
};

/** Broadcasts */
export const broadcasts = {
  list: {
    object: "list" as const,
    has_more: false,
    data: [
      {
        id: "bc_1",
        name: "News",
        status: "draft" as const,
        segment_id: null,
        created_at: "2025-01-01",
        audience_id: "aud_abc",
        scheduled_at: null,
        sent_at: null,
      },
    ],
  } satisfies ListBroadcastsResponseSuccess,
  get: {
    id: "bc_1",
    name: "News",
    status: "sent" as const,
    segment_id: null,
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
    object: "broadcast" as const,
  } satisfies GetBroadcastResponseSuccess,
};

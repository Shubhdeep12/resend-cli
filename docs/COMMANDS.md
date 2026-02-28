# Command Reference

<!-- AUTO-GENERATED: run `pnpm docs:generate` -->

This file is generated from CLI `--help` output.

## resend auth

Manage local CLI authentication

**Usage**

```bash
resend auth login [--key value] [--name value]
resend auth logout [--name value] [--all]
resend auth whoami
resend auth list
resend auth select <name>
resend auth --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `login`: Save/select an API key for CLI usage
- `logout`: Remove saved key(s) from local CLI config
- `whoami`: Show current auth source and selected key
- `list`: List saved API keys
- `select`: Select the active saved API key

## resend auth login

Save/select an API key for CLI usage

**Usage**

```bash
resend auth login [--key value] [--name value]
resend auth login --help
```

**Flags**

```text
-k [--key]   Resend API key (starts with re_)
-n [--name]  Name for this saved key
-h  --help   Print help information and exit
```

## resend auth logout

Remove saved key(s) from local CLI config

**Usage**

```bash
resend auth logout [--name value] [--all]
resend auth logout --help
```

**Flags**

```text
-n [--name]          Remove a specific saved key name
[--all/--no-all]  Remove all saved keys
-h  --help           Print help information and exit
```

## resend auth whoami

Show current auth source and selected key

**Usage**

```bash
resend auth whoami
resend auth whoami --help
```

**Flags**

```text
-h --help  Print help information and exit
```

## resend auth list

List saved API keys

**Usage**

```bash
resend auth list
resend auth list --help
```

**Flags**

```text
-h --help  Print help information and exit
```

## resend auth select

Select the active saved API key

**Usage**

```bash
resend auth select <name>
resend auth select --help
```

**Flags**

```text
-h --help  Print help information and exit
```

## resend emails

Manage and send transactional emails

**Usage**

```bash
resend emails send [--from value] [--to value] [--subject value] [--html value] [--text value] [--cc value]... [--bcc value]... [--reply-to value]... [--tags value] [--scheduled-at value] [--topic-id value] [--headers value] [--attach value]... [--template value] [--template-variables value] [--idempotency-key value] [--json]
resend emails list [--limit value] [--after value] [--before value] [--json]
resend emails get [--json] <id>
resend emails update (--scheduled-at value) [--json] <id>
resend emails cancel [--json] <id>
resend emails batch [--file value] [--validation value] [--idempotency-key value] [--json]
resend emails attachments list|get ...
resend emails receiving list|get|forward|attachments ...
resend emails --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `send`: Send an email (supports cc, bcc, reply-to, tags, schedule, attachments, template)
- `list`: List sent emails (supports pagination: --limit, --after, --before)
- `get`: Get email details
- `update`: Reschedule a scheduled email (update scheduled send time)
- `cancel`: Cancel a scheduled email (not yet sent)
- `batch`: Send a batch of emails from JSON file or stdin (array of send payloads)
- `attachments`: List/get attachments for sent emails (metadata + URL only)
- `receiving`: List/get/forward received (inbound) emails

## resend emails send

Send an email (supports cc, bcc, reply-to, tags, schedule, attachments, template)

**Usage**

```bash
resend emails send [--from value] [--to value] [--subject value] [--html value] [--text value] [--cc value]... [--bcc value]... [--reply-to value]... [--tags value] [--scheduled-at value] [--topic-id value] [--headers value] [--attach value]... [--template value] [--template-variables value] [--idempotency-key value] [--json]
resend emails send --help
```

**Flags**

```text
-f [--from]                Sender email address
-t [--to]                  Recipient(s); comma-separated for multiple
-s [--subject]             Email subject
[--html]                HTML content
[--text]                Plain text content
[--cc]...               CC address(es); comma-separated or repeat flag
[--bcc]...              BCC address(es); comma-separated or repeat flag
-r [--reply-to]...         Reply-To address(es); comma-separated or repeat flag
[--tags]                Tags as JSON array: [{"name":"key","value":"val"}]
[--scheduled-at]        Schedule send time (ISO 8601)
[--topic-id]            Topic ID for subscription-based sending
[--headers]             Custom headers as JSON object
[--attach]...           Path to file to attach (repeat for multiple)
[--template]            Template ID (use with template-variables)
[--template-variables]  Template variables as JSON object
[--idempotency-key]     Idempotency key for deduplication
[--json/--no-json]      Output results as JSON
-h  --help                 Print help information and exit
```

## resend emails list

List sent emails (supports pagination: --limit, --after, --before)

**Usage**

```bash
resend emails list [--limit value] [--after value] [--before value] [--json]
resend emails list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this email ID
[--before]          Cursor: get items before this email ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend emails get

Get email details

**Usage**

```bash
resend emails get [--json] <id>
resend emails get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend emails update

Reschedule a scheduled email (update scheduled send time)

**Usage**

```bash
resend emails update (--scheduled-at value) [--json] <id>
resend emails update --help
```

**Flags**

```text
-s  --scheduled-at     New scheduled time (ISO 8601, e.g. 2024-08-05T11:52:01.858Z)
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend emails cancel

Cancel a scheduled email (not yet sent)

**Usage**

```bash
resend emails cancel [--json] <id>
resend emails cancel --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend emails batch

Send a batch of emails from JSON file or stdin (array of send payloads)

**Usage**

```bash
resend emails batch [--file value] [--validation value] [--idempotency-key value] [--json]
resend emails batch --help
```

**Flags**

```text
-f [--file]             Path to JSON file with array of email payloads
-v [--validation]       strict or permissive
[--idempotency-key]  Idempotency key for the batch
[--json/--no-json]   Output results as JSON
-h  --help              Print help information and exit
```

## resend emails attachments

List/get attachments for sent emails (metadata + URL only)

**Usage**

```bash
resend emails attachments list [--limit value] [--after value] [--before value] [--json] <emailId>
resend emails attachments get [--json] <emailId> <attachmentId>
resend emails attachments --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List attachments for a sent email
- `get`: Get attachment metadata and download URL (sent email)

## resend emails attachments list

List attachments for a sent email

**Usage**

```bash
resend emails attachments list [--limit value] [--after value] [--before value] [--json] <emailId>
resend emails attachments list --help
```

**Flags**

```text
[--limit]           Max items (1-100)
[--after]           Cursor after ID
[--before]          Cursor before ID
[--json/--no-json]  Output as JSON
-h  --help             Print help information and exit
```

## resend emails attachments get

Get attachment metadata and download URL (sent email)

**Usage**

```bash
resend emails attachments get [--json] <emailId> <attachmentId>
resend emails attachments get --help
```

**Flags**

```text
[--json/--no-json]  Output as JSON
-h  --help             Print help information and exit
```

## resend emails receiving

List/get/forward received (inbound) emails

**Usage**

```bash
resend emails receiving list [--limit value] [--after value] [--before value] [--json]
resend emails receiving get [--json] <id>
resend emails receiving forward [--email-id value] [--to value] [--from value] [--passthrough] [--text value] [--html value] [--json]
resend emails receiving attachments list|get ...
resend emails receiving --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List received/inbound emails
- `get`: Get a received/inbound email
- `forward`: Forward a received email (emailId, to, from required)
- `attachments`: List/get attachments for received emails (metadata + URL only)

## resend emails receiving list

List received/inbound emails

**Usage**

```bash
resend emails receiving list [--limit value] [--after value] [--before value] [--json]
resend emails receiving list --help
```

**Flags**

```text
[--limit]           Max items (1-100)
[--after]           Cursor after ID
[--before]          Cursor before ID
[--json/--no-json]  Output as JSON
-h  --help             Print help information and exit
```

## resend emails receiving get

Get a received/inbound email

**Usage**

```bash
resend emails receiving get [--json] <id>
resend emails receiving get --help
```

**Flags**

```text
[--json/--no-json]  Output as JSON
-h  --help             Print help information and exit
```

## resend emails receiving forward

Forward a received email (emailId, to, from required)

**Usage**

```bash
resend emails receiving forward [--email-id value] [--to value] [--from value] [--passthrough] [--text value] [--html value] [--json]
resend emails receiving forward --help
```

**Flags**

```text
[--email-id]                      Receiving email ID to forward
[--to]                            Recipient(s); comma-separated
[--from]                          Sender address
[--passthrough/--no-passthrough]  Forward as-is (default true)
[--text]                          Custom text body (if passthrough false)
[--html]                          Custom HTML body (if passthrough false)
[--json/--no-json]                Output as JSON
-h  --help                           Print help information and exit
```

## resend emails receiving attachments

List/get attachments for received emails (metadata + URL only)

**Usage**

```bash
resend emails receiving attachments list [--limit value] [--after value] [--before value] [--json] <emailId>
resend emails receiving attachments get [--json] <emailId> <attachmentId>
resend emails receiving attachments --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List attachments for a received email
- `get`: Get attachment metadata and download URL (received email)

## resend emails receiving attachments list

List attachments for a received email

**Usage**

```bash
resend emails receiving attachments list [--limit value] [--after value] [--before value] [--json] <emailId>
resend emails receiving attachments list --help
```

**Flags**

```text
[--limit]           Max items (1-100)
[--after]           Cursor after ID
[--before]          Cursor before ID
[--json/--no-json]  Output as JSON
-h  --help             Print help information and exit
```

## resend emails receiving attachments get

Get attachment metadata and download URL (received email)

**Usage**

```bash
resend emails receiving attachments get [--json] <emailId> <attachmentId>
resend emails receiving attachments get --help
```

**Flags**

```text
[--json/--no-json]  Output as JSON
-h  --help             Print help information and exit
```

## resend domains

Manage sending domains

**Usage**

```bash
resend domains list [--limit value] [--after value] [--before value] [--json]
resend domains get [--json] <id>
resend domains add [--region value] [--custom-return-path value] [--capabilities value] [--open-tracking] [--click-tracking] [--tls value] [--json] <name>
resend domains update [--click-tracking] [--open-tracking] [--tls value] [--capabilities value] [--json] <id>
resend domains remove [--json] <id>
resend domains verify [--json] <id>
resend domains --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List domains (supports pagination)
- `get`: Get domain details
- `add`: Add a new domain
- `update`: Update domain settings
- `remove`: Remove a domain
- `verify`: Verify a domain

## resend domains list

List domains (supports pagination)

**Usage**

```bash
resend domains list [--limit value] [--after value] [--before value] [--json]
resend domains list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend domains get

Get domain details

**Usage**

```bash
resend domains get [--json] <id>
resend domains get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend domains add

Add a new domain

**Usage**

```bash
resend domains add [--region value] [--custom-return-path value] [--capabilities value] [--open-tracking] [--click-tracking] [--tls value] [--json] <name>
resend domains add --help
```

**Flags**

```text
[--region]                              Region (us-east-1, eu-west-1, sa-east-1, ap-northeast-1)
[--custom-return-path]                  Custom return path subdomain
[--capabilities]                        Capabilities JSON e.g. {"sending":"enabled","receiving":"disabled"}
[--open-tracking/--no-open-tracking]    Enable open tracking
[--click-tracking/--no-click-tracking]  Enable click tracking
[--tls]                                 TLS: enforced or opportunistic
[--json/--no-json]                      Output results as JSON
-h  --help                                 Print help information and exit
```

## resend domains update

Update domain settings

**Usage**

```bash
resend domains update [--click-tracking] [--open-tracking] [--tls value] [--capabilities value] [--json] <id>
resend domains update --help
```

**Flags**

```text
[--click-tracking/--no-click-tracking]  Enable or disable click tracking
[--open-tracking/--no-open-tracking]    Enable or disable open tracking
[--tls]                                 TLS: enforced or opportunistic
[--capabilities]                        Capabilities JSON e.g. {"sending":"enabled","receiving":"disabled"}
[--json/--no-json]                      Output results as JSON
-h  --help                                 Print help information and exit
```

## resend domains remove

Remove a domain

**Usage**

```bash
resend domains remove [--json] <id>
resend domains remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend domains verify

Verify a domain

**Usage**

```bash
resend domains verify [--json] <id>
resend domains verify --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts

Manage contacts and segment/topic membership

**Usage**

```bash
resend contacts list [--segment-id value] [--limit value] [--after value] [--before value] [--json]
resend contacts get [--id value] [--email value] [--json] [<id-or-email>]
resend contacts create (--email value) [--first-name value] [--last-name value] [--unsubscribed] [--properties value] [--segments value] [--topics value] [--json]
resend contacts update [--id value] [--email value] [--first-name value] [--last-name value] [--unsubscribed] [--properties value] [--json] [<id-or-email>]
resend contacts remove [--json] <id-or-email>
resend contacts segments add|list|remove ...
resend contacts topics list|update ...
resend contacts --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List contacts (optionally in a segment); supports pagination
- `get`: Get a contact by ID or email
- `create`: Create a contact (use --segments to add to segments)
- `update`: Update a contact
- `remove`: Remove a contact
- `segments`: Manage contact segment membership
- `topics`: Manage contact topic subscriptions

## resend contacts list

List contacts (optionally in a segment); supports pagination

**Usage**

```bash
resend contacts list [--segment-id value] [--limit value] [--after value] [--before value] [--json]
resend contacts list --help
```

**Flags**

```text
-s [--segment-id]      Segment ID to list contacts in
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts get

Get a contact by ID or email

**Usage**

```bash
resend contacts get [--id value] [--email value] [--json] [<id-or-email>]
resend contacts get --help
```

**Flags**

```text
[--id]              Contact ID
[--email]           Contact email
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts create

Create a contact (use --segments to add to segments)

**Usage**

```bash
resend contacts create (--email value) [--first-name value] [--last-name value] [--unsubscribed] [--properties value] [--segments value] [--topics value] [--json]
resend contacts create --help
```

**Flags**

```text
-e  --email                            Contact email
-f [--first-name]                      First name
-l [--last-name]                       Last name
[--unsubscribed/--no-unsubscribed]  Mark as unsubscribed
[--properties]                      Custom properties JSON e.g. {"key":"value"}
[--segments]                        Segment IDs JSON array e.g. ["seg_xxx"]
[--topics]                          Topics JSON array e.g. [{"id":"topic_xxx","subscription":"opt_in"}]
[--json/--no-json]                  Output results as JSON
-h  --help                             Print help information and exit
```

## resend contacts update

Update a contact

**Usage**

```bash
resend contacts update [--id value] [--email value] [--first-name value] [--last-name value] [--unsubscribed] [--properties value] [--json] [<id-or-email>]
resend contacts update --help
```

**Flags**

```text
[--id]                              Contact ID
[--email]                           Contact email
[--first-name]                      First name
[--last-name]                       Last name
[--unsubscribed/--no-unsubscribed]  Unsubscribed
[--properties]                      Properties JSON
[--json/--no-json]                  Output results as JSON
-h  --help                             Print help information and exit
```

## resend contacts remove

Remove a contact

**Usage**

```bash
resend contacts remove [--json] <id-or-email>
resend contacts remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts segments

Manage contact segment membership

**Usage**

```bash
resend contacts segments add [--contact-id value] [--email value] [--segment-id value] [--json] [<id-or-email>] [<segment-id>]
resend contacts segments list [--contact-id value] [--email value] [--limit value] [--after value] [--before value] [--json] [<id-or-email>]
resend contacts segments remove [--contact-id value] [--email value] [--segment-id value] [--json] [<id-or-email>] [<segment-id>]
resend contacts segments --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `add`: Add a contact to a segment
- `list`: List segments for a contact
- `remove`: Remove a contact from a segment

## resend contacts segments add

Add a contact to a segment

**Usage**

```bash
resend contacts segments add [--contact-id value] [--email value] [--segment-id value] [--json] [<id-or-email>] [<segment-id>]
resend contacts segments add --help
```

**Flags**

```text
[--contact-id]      Contact ID
[--email]           Contact email
[--segment-id]      Segment ID to add contact to
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts segments list

List segments for a contact

**Usage**

```bash
resend contacts segments list [--contact-id value] [--email value] [--limit value] [--after value] [--before value] [--json] [<id-or-email>]
resend contacts segments list --help
```

**Flags**

```text
[--contact-id]      Contact ID
[--email]           Contact email
[--limit]           Max items (1-100)
[--after]           Cursor after
[--before]          Cursor before
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts segments remove

Remove a contact from a segment

**Usage**

```bash
resend contacts segments remove [--contact-id value] [--email value] [--segment-id value] [--json] [<id-or-email>] [<segment-id>]
resend contacts segments remove --help
```

**Flags**

```text
[--contact-id]      Contact ID
[--email]           Contact email
[--segment-id]      Segment ID to remove from
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts topics

Manage contact topic subscriptions

**Usage**

```bash
resend contacts topics list [--id value] [--email value] [--limit value] [--after value] [--before value] [--json] [<id-or-email>]
resend contacts topics update [--id value] [--email value] [--topics value] [--json] [<id-or-email>]
resend contacts topics --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List topic subscriptions for a contact
- `update`: Update contact topic subscriptions

## resend contacts topics list

List topic subscriptions for a contact

**Usage**

```bash
resend contacts topics list [--id value] [--email value] [--limit value] [--after value] [--before value] [--json] [<id-or-email>]
resend contacts topics list --help
```

**Flags**

```text
[--id]              Contact ID
[--email]           Contact email
[--limit]           Max items (1-100)
[--after]           Cursor after
[--before]          Cursor before
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contacts topics update

Update contact topic subscriptions

**Usage**

```bash
resend contacts topics update [--id value] [--email value] [--topics value] [--json] [<id-or-email>]
resend contacts topics update --help
```

**Flags**

```text
[--id]              Contact ID
[--email]           Contact email
[--topics]          Topics JSON e.g. [{"id":"topic_xxx","subscription":"opt_in"}]
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend broadcasts

Manage marketing broadcasts

**Usage**

```bash
resend broadcasts list [--limit value] [--after value] [--before value] [--json]
resend broadcasts get [--json] <id>
resend broadcasts create [--name value] [--segment-id value] [--from value] [--subject value] [--html value] [--text value] [--html-file value] [--reply-to value] [--preview-text value] [--topic-id value] [--send] [--scheduled-at value] [--json]
resend broadcasts send [--scheduled-at value] [--json] <id>
resend broadcasts update [--name value] [--segment-id value] [--from value] [--subject value] [--html value] [--text value] [--html-file value] [--reply-to value] [--preview-text value] [--topic-id value] [--json] <id>
resend broadcasts remove [--json] <id>
resend broadcasts --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List broadcasts (supports pagination)
- `get`: Get broadcast details
- `create`: Create a broadcast (draft or send now)
- `send`: Send a draft broadcast
- `update`: Update a draft broadcast
- `remove`: Remove a broadcast

## resend broadcasts list

List broadcasts (supports pagination)

**Usage**

```bash
resend broadcasts list [--limit value] [--after value] [--before value] [--json]
resend broadcasts list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend broadcasts get

Get broadcast details

**Usage**

```bash
resend broadcasts get [--json] <id>
resend broadcasts get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend broadcasts create

Create a broadcast (draft or send now)

**Usage**

```bash
resend broadcasts create [--name value] [--segment-id value] [--from value] [--subject value] [--html value] [--text value] [--html-file value] [--reply-to value] [--preview-text value] [--topic-id value] [--send] [--scheduled-at value] [--json]
resend broadcasts create --help
```

**Flags**

```text
[--name]            Broadcast name
[--segment-id]      Segment ID to send to
-f [--from]            Sender email address
-s [--subject]         Email subject
[--html]            HTML content
[--text]            Plain text content
[--html-file]       Path to HTML file
[--reply-to]        Reply-to address(es), comma-separated
[--preview-text]    Preview text snippet
[--topic-id]        Topic ID
[--send/--no-send]  Send immediately (default: create as draft)
[--scheduled-at]    Schedule send time (ISO 8601 or relative)
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend broadcasts send

Send a draft broadcast

**Usage**

```bash
resend broadcasts send [--scheduled-at value] [--json] <id>
resend broadcasts send --help
```

**Flags**

```text
[--scheduled-at]    Schedule send time (ISO 8601 or relative)
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend broadcasts update

Update a draft broadcast

**Usage**

```bash
resend broadcasts update [--name value] [--segment-id value] [--from value] [--subject value] [--html value] [--text value] [--html-file value] [--reply-to value] [--preview-text value] [--topic-id value] [--json] <id>
resend broadcasts update --help
```

**Flags**

```text
[--name]            Broadcast name
[--segment-id]      Segment ID
[--from]            Sender email
[--subject]         Subject
[--html]            HTML content
[--text]            Plain text content
[--html-file]       Path to HTML file
[--reply-to]        Reply-to, comma-separated
[--preview-text]    Preview text
[--topic-id]        Topic ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend broadcasts remove

Remove a broadcast

**Usage**

```bash
resend broadcasts remove [--json] <id>
resend broadcasts remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend webhooks

Manage webhooks for email events

**Usage**

```bash
resend webhooks list [--limit value] [--after value] [--before value] [--json]
resend webhooks get [--json] <id>
resend webhooks create [--url value] [--endpoint value] [--events value]... [--json]
resend webhooks update [--endpoint value] [--status value] [--events value]... [--json] <id>
resend webhooks delete [--json] <id>
resend webhooks --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List all webhooks (supports pagination)
- `get`: Get webhook details
- `create`: Create a new webhook (--url/--endpoint required; --events optional)
- `update`: Update a webhook (endpoint, status, or events)
- `delete`: Delete a webhook

## resend webhooks list

List all webhooks (supports pagination)

**Usage**

```bash
resend webhooks list [--limit value] [--after value] [--before value] [--json]
resend webhooks list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend webhooks get

Get webhook details

**Usage**

```bash
resend webhooks get [--json] <id>
resend webhooks get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend webhooks create

Create a new webhook (--url/--endpoint required; --events optional)

**Usage**

```bash
resend webhooks create [--url value] [--endpoint value] [--events value]... [--json]
resend webhooks create --help
```

**Flags**

```text
-u [--url]             Webhook endpoint URL
[--endpoint]        Webhook endpoint URL (same as --url)
-e [--events]...       Event types (variadic). Valid: email.sent, email.scheduled, email.delivered, email.delivery_delayed, email.complained, email.bounced, email.opened, email.clicked, email.received, email.failed, email.suppressed, contact.created, contact.updated, contact.deleted, domain.created, domain.updated, domain.deleted
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend webhooks update

Update a webhook (endpoint, status, or events)

**Usage**

```bash
resend webhooks update [--endpoint value] [--status value] [--events value]... [--json] <id>
resend webhooks update --help
```

**Flags**

```text
[--endpoint]        New webhook endpoint URL
[--status]          Status: enabled or disabled
-e [--events]...       Event types to listen for
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend webhooks delete

Delete a webhook

**Usage**

```bash
resend webhooks delete [--json] <id>
resend webhooks delete --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend keys

Manage API keys

**Usage**

```bash
resend keys list [--limit value] [--after value] [--before value] [--json]
resend keys delete [--json] <id>
resend keys --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List all API keys (supports pagination)
- `delete`: Delete an API key

## resend keys list

List all API keys (supports pagination)

**Usage**

```bash
resend keys list [--limit value] [--after value] [--before value] [--json]
resend keys list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend keys delete

Delete an API key

**Usage**

```bash
resend keys delete [--json] <id>
resend keys delete --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend segments

Manage segments

**Usage**

```bash
resend segments list [--limit value] [--after value] [--before value] [--json]
resend segments get [--json] <id>
resend segments create [--name value] [--json]
resend segments remove [--json] <id>
resend segments --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List segments (supports pagination)
- `get`: Get segment by ID
- `create`: Create a segment (--name required)
- `remove`: Remove a segment

## resend segments list

List segments (supports pagination)

**Usage**

```bash
resend segments list [--limit value] [--after value] [--before value] [--json]
resend segments list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend segments get

Get segment by ID

**Usage**

```bash
resend segments get [--json] <id>
resend segments get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend segments create

Create a segment (--name required)

**Usage**

```bash
resend segments create [--name value] [--json]
resend segments create --help
```

**Flags**

```text
-n [--name]            Segment name
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend segments remove

Remove a segment

**Usage**

```bash
resend segments remove [--json] <id>
resend segments remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend topics

Manage topics (subscription preferences)

**Usage**

```bash
resend topics list [--json]
resend topics get [--json] <id>
resend topics create [--name value] [--default-subscription value] [--description value] [--json]
resend topics update [--name value] [--description value] [--json] <id>
resend topics remove [--json] <id>
resend topics --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List all topics
- `get`: Get topic by ID
- `create`: Create a topic (--name and --default-subscription required)
- `update`: Update a topic (--name and/or --description)
- `remove`: Remove a topic

## resend topics list

List all topics

**Usage**

```bash
resend topics list [--json]
resend topics list --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend topics get

Get topic by ID

**Usage**

```bash
resend topics get [--json] <id>
resend topics get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend topics create

Create a topic (--name and --default-subscription required)

**Usage**

```bash
resend topics create [--name value] [--default-subscription value] [--description value] [--json]
resend topics create --help
```

**Flags**

```text
-n [--name]                  Topic name
-d [--default-subscription]  opt_in or opt_out
[--description]           Topic description
[--json/--no-json]        Output results as JSON
-h  --help                   Print help information and exit
```

## resend topics update

Update a topic (--name and/or --description)

**Usage**

```bash
resend topics update [--name value] [--description value] [--json] <id>
resend topics update --help
```

**Flags**

```text
-n [--name]            Topic name
[--description]     Topic description
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend topics remove

Remove a topic

**Usage**

```bash
resend topics remove [--json] <id>
resend topics remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contact-properties

Manage contact properties

**Usage**

```bash
resend contact-properties list [--limit value] [--after value] [--before value] [--json]
resend contact-properties get [--json] <id>
resend contact-properties create [--key value] [--type value] [--fallback-value value] [--json]
resend contact-properties update [--fallback-value value] [--json] <id>
resend contact-properties remove [--json] <id>
resend contact-properties --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List contact properties (supports pagination)
- `get`: Get contact property by ID
- `create`: Create a contact property (--key and --type required)
- `update`: Update a contact property (--fallback-value)
- `remove`: Remove a contact property

## resend contact-properties list

List contact properties (supports pagination)

**Usage**

```bash
resend contact-properties list [--limit value] [--after value] [--before value] [--json]
resend contact-properties list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contact-properties get

Get contact property by ID

**Usage**

```bash
resend contact-properties get [--json] <id>
resend contact-properties get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contact-properties create

Create a contact property (--key and --type required)

**Usage**

```bash
resend contact-properties create [--key value] [--type value] [--fallback-value value] [--json]
resend contact-properties create --help
```

**Flags**

```text
-k [--key]             Property key
-t [--type]            string or number
[--fallback-value]  Fallback value (string or number)
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contact-properties update

Update a contact property (--fallback-value)

**Usage**

```bash
resend contact-properties update [--fallback-value value] [--json] <id>
resend contact-properties update --help
```

**Flags**

```text
[--fallback-value]  New fallback value
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend contact-properties remove

Remove a contact property

**Usage**

```bash
resend contact-properties remove [--json] <id>
resend contact-properties remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates

Manage email templates (HTML only; no React)

**Usage**

```bash
resend templates list [--limit value] [--after value] [--before value] [--json]
resend templates get [--json] <id>
resend templates create [--name value] [--html value] [--html-file value] [--subject value] [--text value] [--from value] [--alias value] [--reply-to value] [--variables value] [--json]
resend templates update [--name value] [--html value] [--html-file value] [--subject value] [--text value] [--from value] [--alias value] [--reply-to value] [--variables value] [--json] <id>
resend templates remove [--json] <id>
resend templates duplicate [--json] <id>
resend templates publish [--json] <id>
resend templates --help
```

**Flags**

```text
-h --help  Print help information and exit
```

**Subcommands**

- `list`: List templates (supports pagination)
- `get`: Get template by ID
- `create`: Create a template (--name and --html or --html-file required)
- `update`: Update a template
- `remove`: Remove a template
- `duplicate`: Duplicate a template
- `publish`: Publish a template

## resend templates list

List templates (supports pagination)

**Usage**

```bash
resend templates list [--limit value] [--after value] [--before value] [--json]
resend templates list --help
```

**Flags**

```text
-l [--limit]           Max items to return (1-100)
[--after]           Cursor: get items after this ID
[--before]          Cursor: get items before this ID
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates get

Get template by ID

**Usage**

```bash
resend templates get [--json] <id>
resend templates get --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates create

Create a template (--name and --html or --html-file required)

**Usage**

```bash
resend templates create [--name value] [--html value] [--html-file value] [--subject value] [--text value] [--from value] [--alias value] [--reply-to value] [--variables value] [--json]
resend templates create --help
```

**Flags**

```text
-n [--name]            Template name
[--html]            HTML content
[--html-file]       Path to HTML file
[--subject]         Default subject
[--text]            Plain text content
[--from]            Default from address
[--alias]           Template alias
[--reply-to]        Reply-To (comma-separated or JSON array)
[--variables]       Variables as JSON array
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates update

Update a template

**Usage**

```bash
resend templates update [--name value] [--html value] [--html-file value] [--subject value] [--text value] [--from value] [--alias value] [--reply-to value] [--variables value] [--json] <id>
resend templates update --help
```

**Flags**

```text
-n [--name]            Template name
[--html]            HTML content
[--html-file]       Path to HTML file
[--subject]         Default subject
[--text]            Plain text content
[--from]            Default from address
[--alias]           Template alias
[--reply-to]        Reply-To
[--variables]       Variables as JSON array
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates remove

Remove a template

**Usage**

```bash
resend templates remove [--json] <id>
resend templates remove --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates duplicate

Duplicate a template

**Usage**

```bash
resend templates duplicate [--json] <id>
resend templates duplicate --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

## resend templates publish

Publish a template

**Usage**

```bash
resend templates publish [--json] <id>
resend templates publish --help
```

**Flags**

```text
[--json/--no-json]  Output results as JSON
-h  --help             Print help information and exit
```

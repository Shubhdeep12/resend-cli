# Basic Email Examples

Simple examples to get started with the Resend CLI.

## Send a Basic Email

### HTML Email
```bash
resend emails send \
  --from "onboarding@yourdomain.com" \
  --to "user@example.com" \
  --subject "Welcome to Our App!" \
  --html "<h1>Welcome!</h1><p>Thanks for signing up.</p>"
```

### Plain Text Email
```bash
resend emails send \
  --from "noreply@yourdomain.com" \
  --to "user@example.com" \
  --subject "Password Reset" \
  --text "Click here to reset your password: https://app.com/reset"
```

### HTML + Text (Best Practice)
```bash
resend emails send \
  --from "newsletters@yourdomain.com" \
  --to "subscriber@example.com" \
  --subject "Weekly Newsletter" \
  --html "<h2>This week's updates</h2><p>Check out what's new...</p>" \
  --text "This week's updates: Check out what's new..."
```

## List Recent Emails

```bash
# Pretty table output
resend emails list

# JSON output (for scripts/AI agents)
resend emails list --json

# Parse with jq
resend emails list --json | jq '.data[] | {id, subject, status}'
```

## Get Email Details

```bash
# Get specific email
resend emails get <email_id>

# JSON output
resend emails get <email_id> --json

# Check delivery status with jq
resend emails list --json | jq '.data[] | select(.status == "delivered")'
```

## Working with Domains

### List Your Domains
```bash
resend domains list
```

### Add a New Domain
```bash
resend domains add newsletter.yourdomain.com
```

### Verify Domain
```bash
resend domains verify <domain_id>
```

### Check Domain Status
```bash
resend domains list --json | jq '.data[] | {name, status}'
```

## Manage Contacts

### Create a Contact
```bash
resend contacts create \
  --audience <audience_id> \
  --email "newuser@example.com" \
  --first-name "John" \
  --last-name "Doe"
```

### List Contacts
```bash
resend contacts list --audience <audience_id>

# JSON output
resend contacts list --audience <audience_id> --json
```

## Webhooks

### List Webhooks
```bash
resend webhooks list
```

### Create Webhook
```bash
resend webhooks create \
  --url "https://yourdomain.com/webhooks/resend" \
  --events email.delivered email.bounced email.complained
```

### Get Webhook Details
```bash
resend webhooks get <webhook_id> --json
```

## API Keys

### List API Keys
```bash
resend keys list
```

### Create API Key
```bash
resend keys create \
  --name "CI/CD Pipeline" \
  --permission "sending_access"
```

**Important:** Save the API key token immediately - it won't be shown again.

### Delete API Key
```bash
resend keys delete <key_id>
```

## Pro Tips

### 1. Use JSON for Scripting
Always add `--json` when using in scripts or with AI agents:
```bash
result=$(resend emails send --from "..." --to "..." --subject "..." --html "..." --json)
email_id=$(echo $result | jq -r '.data.id')
echo "Email sent with ID: $email_id"
```

### 2. Environment Variables
Set API key as env var for security:
```bash
export RESEND_API_KEY="re_your_key"
# Now all commands work without --api-key flag
```

### 3. Pipe to jq for Filtering
```bash
# Find all bounced emails
resend emails list --json | jq '.data[] | select(.status == "bounced")'

# Get email count by status
resend emails list --json | jq '.data | group_by(.status) | map({status: .[0].status, count: length})'
```

## Next Steps

- **AI Agent Debugging**: See [02-ai-agent-debugging.md](./02-ai-agent-debugging.md)
- **CI/CD Integration**: See [03-ci-cd-integration.sh](./03-ci-cd-integration.sh)
- **Monitoring**: See [04-monitoring.md](./04-monitoring.md)

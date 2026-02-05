# AI Agent Debugging Examples

How AI coding agents (Claude Code, Cursor, GitHub Copilot, etc.) can use Resend CLI to autonomously debug email delivery issues.

## Use Case 1: User Reports Missing Email

**Scenario**: A user reports they didn't receive a password reset email.

### Agent Workflow

```bash
# Step 1: Search for the email
resend emails list --json | \
  jq '.data[] | select(.to | contains("user@example.com")) | select(.subject | contains("password reset"))'

# Step 2: Get detailed status
EMAIL_ID="<found_email_id>"
resend emails get $EMAIL_ID --json

# Step 3: Analyze the result
# Possible outcomes:
# - status: "delivered" → Email was delivered, check spam folder
# - status: "bounced" → Invalid email address or mailbox full
# - status: "complained" → User marked previous emails as spam
# - No result → Email was never sent (application bug)
```

### Agent Decision Tree

```javascript
// Pseudocode for AI agent logic
const emailStatus = JSON.parse(cliOutput);

if (!emailStatus) {
  return "Email was never sent. Check application logs for send failure.";
}

switch(emailStatus.status) {
  case "delivered":
    return "Email was delivered. User should check spam/junk folder.";
  
  case "bounced":
    return `Email bounced. Reason: ${emailStatus.bounce_reason}. 
            Suggestion: Verify email address is correct and mailbox isn't full.`;
  
  case "complained":
    return "User previously marked emails as spam. Domain reputation may be affected.";
  
  case "pending":
    return "Email is still being processed. Wait a few minutes and check again.";
}
```

## Use Case 2: Automated Bounce Analysis

**Scenario**: AI agent monitors bounces and categorizes them.

```bash
#!/bin/bash
# AI agent runs this periodically

# Get all bounced emails from today
BOUNCED=$(resend emails list --json | \
  jq '[.data[] | select(.status == "bounced")] | length')

if [ $BOUNCED -gt 10 ]; then
  echo "High bounce rate detected: $BOUNCED bounces today"
  
  # Analyze bounce reasons
  resend emails list --json | \
    jq '.data[] | select(.status == "bounced") | .bounce_reason' | \
    sort | uniq -c | sort -rn
  
  # AI suggests: "Most bounces are 'mailbox full'. 
  # Consider implementing retry logic with exponential backoff."
fi
```

## Use Case 3: Domain Reputation Check

**Scenario**: Agent checks if domain is properly configured before sending emails.

```bash
# Check domain verification status
DOMAIN_STATUS=$(resend domains list --json | \
  jq -r '.data[] | select(.name == "yourdomain.com") | .status')

if [ "$DOMAIN_STATUS" != "verified" ]; then
  echo "Domain not verified. Emails will fail."
  
  # Get DNS records to show user
  resend domains list --json | \
    jq '.data[] | select(.name == "yourdomain.com") | .records'
  
  # AI suggests: "Add these DNS records to your domain registrar, 
  # then run: resend domains verify <domain_id>"
fi
```

## Use Case 4: Webhook Debugging

**Scenario**: Webhooks aren't being received.

```bash
# List webhooks
resend webhooks list --json

# Check specific webhook status
WEBHOOK_ID="<webhook_id>"
resend webhooks get $WEBHOOK_ID --json

# AI analyzes:
# - Is the endpoint URL correct?
# - Are the right events subscribed?
# - Is the webhook status active?

# Suggestion from AI:
echo "Webhook endpoint: https://yourapi.com/webhooks/resend"
echo "Make sure this endpoint is:"
echo "  1. Publicly accessible (not localhost)"
echo "  2. Responds with 200 OK"
echo "  3. Can handle POST requests"
```

## Use Case 5: Template Testing

**Scenario**: Developer is building a new email template and wants immediate feedback.

```bash
# Send test email
RESULT=$(resend emails send \
  --from "test@yourdomain.com" \
  --to "dev@yourdomain.com" \
  --subject "Order Confirmation #12345" \
  --html "<h1>Order Confirmed!</h1><p>Your order #12345 is on the way.</p>" \
  --json)

# Extract email ID
EMAIL_ID=$(echo $RESULT | jq -r '.data.id')

echo "Test email sent: $EMAIL_ID"
echo "Check your inbox at dev@yourdomain.com"

# Wait a bit and check status
sleep 5
resend emails get $EMAIL_ID --json | jq '.status'

# AI monitors and reports:
# "Email delivered successfully in 2.3 seconds"
```

## Use Case 6: Broadcast Campaign Validation

**Scenario**: Marketing team wants to send a broadcast. AI validates before sending.

```bash
# List broadcasts
DRAFTS=$(resend broadcasts list --json | \
  jq '.data[] | select(.status == "draft")')

# For each draft, AI checks:
# 1. Is there a subject?
# 2. Is there content (HTML or text)?
# 3. Is a segment selected or is it going to all contacts?

BROADCAST_ID="<broadcast_id>"
BROADCAST=$(resend broadcasts get $BROADCAST_ID --json)

# AI validation logic
HAS_SUBJECT=$(echo $BROADCAST | jq -r '.subject != null')
HAS_CONTENT=$(echo $BROADCAST | jq -r '.html != null or .text != null')
HAS_SEGMENT=$(echo $BROADCAST | jq -r '.segment_id != null')

if [ "$HAS_SUBJECT" = "true" ] && [ "$HAS_CONTENT" = "true" ]; then
  echo "Broadcast ready to send"
  
  # AI asks: "Send now or schedule?"
  # Human response: "Schedule for tomorrow 9am"
  
  # AI executes:
  # resend broadcasts send $BROADCAST_ID --schedule "tomorrow at 9am"
else
  echo "Broadcast incomplete. Missing subject or content."
fi
```

## AI Agent Best Practices

### 1. Always Use JSON Output
```bash
# Good: parseable by AI
resend emails get $ID --json

# Bad: human-formatted, hard to parse
resend emails get $ID
```

### 2. Handle Errors Gracefully
```bash
RESULT=$(resend emails send ... --json 2>&1)

if echo "$RESULT" | jq -e '.error' > /dev/null; then
  ERROR_MSG=$(echo "$RESULT" | jq -r '.error.message')
  echo "Error sending email: $ERROR_MSG"
  # AI suggests fix based on error message
else
  echo "Success!"
fi
```

### 3. Chain Commands for Complex Workflows
```bash
# Multi-step debugging
EMAIL=$(resend emails list --json | jq '.data[0]')
EMAIL_ID=$(echo $EMAIL | jq -r '.id')
DETAILS=$(resend emails get $EMAIL_ID --json)

# AI analyzes all data together to provide comprehensive suggestion
```

### 4. Monitor Metrics Over Time
```bash
# AI runs this daily
TODAY_SENT=$(resend emails list --json | jq '[.data[]] | length')
TODAY_BOUNCED=$(resend emails list --json | jq '[.data[] | select(.status == "bounced")] | length')
BOUNCE_RATE=$(echo "scale=2; $TODAY_BOUNCED / $TODAY_SENT * 100" | bc)

echo "Bounce rate: $BOUNCE_RATE%"

if (( $(echo "$BOUNCE_RATE > 5.0" | bc -l) )); then
  echo "Bounce rate above 5%. Investigating..."
  # AI suggests actions
fi
```

## Next Steps

See [04-monitoring.md](./04-monitoring.md) for production monitoring patterns.

# Bulk Operations & Contact Management

Managing large numbers of contacts, segments, and broadcast campaigns efficiently.

## Contact Management

### Import Contacts from CSV

```bash
# CSV format: email,first_name,last_name
# example.csv:
# john@example.com,John,Doe
# jane@example.com,Jane,Smith

AUDIENCE_ID="your_audience_id"

# Read CSV and create contacts
tail -n +2 contacts.csv | while IFS=, read -r email first last; do
  echo "Creating contact: $email"
  
  resend contacts create \
    --audience "$AUDIENCE_ID" \
    --email "$email" \
    --first-name "$first" \
    --last-name "$last" \
    --json
  
  # Rate limiting - wait 100ms between requests
  sleep 0.1
done

echo "Import complete"
```

### Export Contacts to CSV

```bash
# Export all contacts from audience
AUDIENCE_ID="your_audience_id"

resend contacts list --audience "$AUDIENCE_ID" --json | \
  jq -r '.data[] | [.email, .first_name, .last_name, .created_at] | @csv' \
  > contacts_export_$(date +%Y%m%d).csv

echo "Exported contacts to contacts_export_$(date +%Y%m%d).csv"
```

### Bulk Update Contacts

```bash
# Update multiple contacts based on criteria
AUDIENCE_ID="your_audience_id"

# Get all contacts
CONTACTS=$(resend contacts list --audience "$AUDIENCE_ID" --json)

# Filter contacts (example: update unsubscribed status)
echo "$CONTACTS" | jq -r '.data[] | select(.email | contains("@example.com")) | .id' | \
while read -r contact_id; do
  echo "Updating contact: $contact_id"
  
  # Note: Actual update command depends on Resend API capabilities
  # This is a placeholder for the pattern
  
  sleep 0.1  # Rate limiting
done
```

## Broadcast Campaigns

### Create Broadcast from Template

```bash
AUDIENCE_ID="your_audience_id"

# Create broadcast
BROADCAST=$(resend broadcasts create \
  --from "newsletter@yourdomain.com" \
  --subject "Weekly Newsletter - $(date +%B %d, %Y)" \
  --html "$(cat newsletter_template.html)" \
  --audience "$AUDIENCE_ID" \
  --json)

BROADCAST_ID=$(echo "$BROADCAST" | jq -r '.data.id')

echo "Created broadcast: $BROADCAST_ID"
```

### Test Before Sending

```bash
BROADCAST_ID="your_broadcast_id"

# Send test to your own email
resend broadcasts test "$BROADCAST_ID" \
  --to "test@yourdomain.com" \
  --json

echo "Test email sent! Check your inbox before proceeding."
read -p "Press Enter to send to all subscribers..."
```

### Schedule Broadcast

```bash
BROADCAST_ID="your_broadcast_id"

# Schedule for tomorrow at 9 AM
resend broadcasts send "$BROADCAST_ID" \
  --schedule "tomorrow at 9am" \
  --json

echo "Broadcast scheduled"
```

### Monitor Broadcast Performance

```bash
BROADCAST_ID="your_broadcast_id"

# Get broadcast details
resend broadcasts get "$BROADCAST_ID" --json | \
  jq '{
    subject: .subject,
    status: .status,
    sent_count: .sent_count,
    delivered_count: .delivered_count,
    opened_count: .opened_count,
    clicked_count: .clicked_count
  }'
```

## Segment Management

### Create Dynamic Segments

```bash
# Create segment for active users
resend segments create \
  --name "Active Users" \
  --description "Users who opened emails in last 30 days"

# Note: Segment rules depend on Resend API capabilities
```

### List All Segments

```bash
resend segments list --json | \
  jq -r '.data[] | "\(.name): \(.contact_count) contacts"'
```

## Bulk Email Operations

### Send Personalized Emails to Multiple Recipients

```bash
# Read from CSV: email,name,order_id
tail -n +2 orders.csv | while IFS=, read -r email name order_id; do
  echo "Sending order confirmation to: $email"
  
  resend emails send \
    --from "orders@yourdomain.com" \
    --to "$email" \
    --subject "Order Confirmation #$order_id" \
    --html "<h1>Hi $name!</h1><p>Your order #$order_id is confirmed.</p>" \
    --json
  
  # Rate limiting
  sleep 0.2
done
```

### Batch Send API

```bash
# Create batch.json file:
# {
#   "emails": [
#     {
#       "from": "sender@example.com",
#       "to": "user1@example.com",
#       "subject": "Subject 1",
#       "html": "<p>Content 1</p>"
#     },
#     {
#       "from": "sender@example.com",
#       "to": "user2@example.com",
#       "subject": "Subject 2",
#       "html": "<p>Content 2</p>"
#     }
#   ]
# }

# Send batch (if API supports it)
resend emails batch --file batch.json --json
```

## Advanced Patterns

### A/B Testing Broadcasts

```bash
#!/bin/bash
# Send two versions to test which performs better

AUDIENCE_ID="your_audience_id"

# Version A
BROADCAST_A=$(resend broadcasts create \
  --from "newsletter@yourdomain.com" \
  --subject "🎉 Special Offer Inside!" \
  --html "$(cat version_a.html)" \
  --audience "$AUDIENCE_ID" \
  --json)

# Version B
BROADCAST_B=$(resend broadcasts create \
  --from "newsletter@yourdomain.com" \
  --subject "Limited Time Deal for You" \
  --html "$(cat version_b.html)" \
  --audience "$AUDIENCE_ID" \
  --json)

# Send each version to 10% of audience (manual segmentation required)
echo "Created variants:"
echo "A: $(echo $BROADCAST_A | jq -r '.data.id')"
echo "B: $(echo $BROADCAST_B | jq -r '.data.id')"
```

### Automated Re-engagement Campaign

```bash
#!/bin/bash
# Re-engage users who haven't opened emails in 90 days

AUDIENCE_ID="your_audience_id"

# Get all contacts
CONTACTS=$(resend contacts list --audience "$AUDIENCE_ID" --json)

# Filter inactive contacts (requires custom logic)
INACTIVE=$(echo "$CONTACTS" | jq '[.data[] | select(.last_opened < (now - 7776000))]')

echo "Found $(echo $INACTIVE | jq 'length') inactive contacts"

# Create re-engagement broadcast
BROADCAST=$(resend broadcasts create \
  --from "hello@yourdomain.com" \
  --subject "We miss you! Here's what's new" \
  --html "$(cat reengagement_template.html)" \
  --json)

echo "Re-engagement campaign created: $(echo $BROADCAST | jq -r '.data.id')"
```

### Progressive Contact Enrichment

```bash
#!/bin/bash
# Gradually enrich contact data

AUDIENCE_ID="your_audience_id"

# Get contacts missing first name
CONTACTS=$(resend contacts list --audience "$AUDIENCE_ID" --json | \
  jq '.data[] | select(.first_name == null or .first_name == "")')

echo "Contacts needing enrichment: $(echo $CONTACTS | jq '. | length')"

# For each contact, fetch data from your CRM and update
# (requires additional data source)
```

## Data Hygiene

### Remove Bounced Contacts

```bash
#!/bin/bash
# Clean up contacts that consistently bounce

AUDIENCE_ID="your_audience_id"

# Get all bounced emails from last 30 days
BOUNCED_EMAILS=$(resend emails list --json | \
  jq -r '.data[] | select(.status == "bounced") | .to' | \
  sort | uniq)

# Get contacts in audience
CONTACTS=$(resend contacts list --audience "$AUDIENCE_ID" --json)

# Remove contacts that match bounced emails
echo "$BOUNCED_EMAILS" | while read -r email; do
  CONTACT_ID=$(echo "$CONTACTS" | jq -r ".data[] | select(.email == \"$email\") | .id")
  
  if [ -n "$CONTACT_ID" ]; then
    echo "Removing bounced contact: $email (ID: $CONTACT_ID)"
    resend contacts delete "$CONTACT_ID"
    sleep 0.1
  fi
done
```

### Deduplicate Contacts

```bash
#!/bin/bash
# Find and remove duplicate email addresses

AUDIENCE_ID="your_audience_id"

resend contacts list --audience "$AUDIENCE_ID" --json | \
  jq -r '.data | group_by(.email) | .[] | select(length > 1) | 
         "Duplicate: \(.[0].email) - \(length) instances"'

# Manual review recommended before deletion
```

## Performance Tips

### Parallel Processing

```bash
#!/bin/bash
# Process contacts in parallel (use with caution)

AUDIENCE_ID="your_audience_id"

# Export contacts
resend contacts list --audience "$AUDIENCE_ID" --json > contacts.json

# Split into chunks and process in parallel
jq -c '.data[]' contacts.json | \
  xargs -P 5 -I {} bash -c 'echo "Processing: $(echo {} | jq -r .email)"'
```

### Rate Limiting Best Practices

```bash
# Respect rate limits with exponential backoff
send_with_retry() {
  local max_retries=3
  local retry_count=0
  local wait_time=1
  
  while [ $retry_count -lt $max_retries ]; do
    RESULT=$(resend emails send "$@" --json 2>&1)
    
    if echo "$RESULT" | jq -e '.error' > /dev/null; then
      ERROR=$(echo "$RESULT" | jq -r '.error.message')
      
      if [[ $ERROR == *"rate limit"* ]]; then
        echo "Rate limited. Waiting ${wait_time}s..."
        sleep $wait_time
        wait_time=$((wait_time * 2))
        retry_count=$((retry_count + 1))
      else
        echo "Error: $ERROR"
        return 1
      fi
    else
      echo "$RESULT"
      return 0
    fi
  done
  
  echo "Max retries exceeded"
  return 1
}
```

## Next Steps

- Review [04-monitoring.md](./04-monitoring.md) for health monitoring
- Check [02-ai-agent-debugging.md](./02-ai-agent-debugging.md) for debugging tips

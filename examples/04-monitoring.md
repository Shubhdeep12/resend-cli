# Email Monitoring & Alerting

Patterns for monitoring email health, detecting issues, and setting up alerts.

## Monitoring Bounce Rates

### Daily Bounce Rate Check

```bash
#!/bin/bash
# Run this daily via cron

EMAILS=$(resend emails list --json)
TOTAL=$(echo "$EMAILS" | jq '.data | length')
BOUNCED=$(echo "$EMAILS" | jq '[.data[] | select(.status == "bounced")] | length')

if [ "$TOTAL" -eq 0 ]; then
  echo "No emails sent today"
  exit 0
fi

BOUNCE_RATE=$(echo "scale=2; $BOUNCED / $TOTAL * 100" | bc)

echo "📊 Bounce Rate: $BOUNCE_RATE% ($BOUNCED/$TOTAL emails)"

# Alert if bounce rate > 5%
if (( $(echo "$BOUNCE_RATE > 5.0" | bc -l) )); then
  echo "🚨 HIGH BOUNCE RATE ALERT!"
  
  # Get bounce reasons
  echo "Top bounce reasons:"
  resend emails list --json | \
    jq -r '.data[] | select(.status == "bounced") | .bounce_reason' | \
    sort | uniq -c | sort -rn | head -5
  
  # Send alert email or Slack notification here
fi
```

### Categorize Bounce Reasons

```bash
# Analyze bounce patterns
resend emails list --json | \
  jq '.data[] | select(.status == "bounced")' | \
  jq -s 'group_by(.bounce_reason) | map({reason: .[0].bounce_reason, count: length}) | sort_by(.count) | reverse'

# Example output:
# [
#   {"reason": "mailbox_full", "count": 15},
#   {"reason": "invalid_address", "count": 8},
#   {"reason": "domain_not_found", "count": 3}
# ]
```

## Complaint Monitoring

### Track Spam Complaints

```bash
# Get all spam complaints
COMPLAINTS=$(resend emails list --json | \
  jq '[.data[] | select(.status == "complained")]')

COMPLAINT_COUNT=$(echo "$COMPLAINTS" | jq 'length')

echo "Spam complaints: $COMPLAINT_COUNT"

if [ "$COMPLAINT_COUNT" -gt 0 ]; then
  echo "Spam complaints detected"
  
  # List emails that were marked as spam
  echo "$COMPLAINTS" | jq -r '.[] | "\(.to) - \(.subject)"'
  
  # Action: Review email content, check domain reputation
fi
```

## Delivery Monitoring

### Check Average Delivery Time

```bash
# Monitor email delivery speed
resend emails list --json | \
  jq -r '.data[] | select(.status == "delivered") | 
         {sent: .created_at, delivered: .last_event.created_at} |
         ((.delivered | fromdateiso8601) - (.sent | fromdateiso8601))'

# Calculate average
resend emails list --json | \
  jq '[.data[] | select(.status == "delivered") | 
       {sent: .created_at, delivered: .last_event.created_at} |
       ((.delivered | fromdateiso8601) - (.sent | fromdateiso8601))] | 
       add / length'
```

### Real-time Delivery Dashboard

```bash
#!/bin/bash
# Simple dashboard - run in terminal

while true; do
  clear
  echo "==================================="
  echo "   RESEND EMAIL DASHBOARD"
  echo "==================================="
  echo "Last updated: $(date)"
  echo ""
  
  STATS=$(resend emails list --json | jq '.data')
  
  TOTAL=$(echo "$STATS" | jq 'length')
  DELIVERED=$(echo "$STATS" | jq '[.[] | select(.status == "delivered")] | length')
  BOUNCED=$(echo "$STATS" | jq '[.[] | select(.status == "bounced")] | length')
  PENDING=$(echo "$STATS" | jq '[.[] | select(.status == "pending")] | length')
  
  echo "Total Emails: $TOTAL"
  echo "Delivered: $DELIVERED"
  echo "Bounced: $BOUNCED"
  echo "⏳ Pending: $PENDING"
  echo ""
  
  if [ "$TOTAL" -gt 0 ]; then
    DELIVERY_RATE=$(echo "scale=1; $DELIVERED / $TOTAL * 100" | bc)
    echo "Delivery Rate: $DELIVERY_RATE%"
  fi
  
  sleep 30  # Update every 30 seconds
done
```

## Domain Health Checks

### Verify All Domains

```bash
#!/bin/bash
# Check all domains are verified

DOMAINS=$(resend domains list --json)

echo "Domain Verification Status:"
echo "$DOMAINS" | jq -r '.data[] | "\(.name): \(.status)"'

# Alert on unverified domains
UNVERIFIED=$(echo "$DOMAINS" | jq '[.data[] | select(.status != "verified")] | length')

if [ "$UNVERIFIED" -gt 0 ]; then
  echo ""
  echo "$UNVERIFIED unverified domain(s)"
  echo "$DOMAINS" | jq -r '.data[] | select(.status != "verified") | .name'
fi
```

## Webhook Health Monitoring

### Check Webhook Response Times

```bash
# Ensure webhooks are configured and active
WEBHOOKS=$(resend webhooks list --json)

echo "Active Webhooks:"
echo "$WEBHOOKS" | jq -r '.data[] | "\(.endpoint) - Events: \(.events | join(", "))"'

INACTIVE=$(echo "$WEBHOOKS" | jq '[.data[] | select(.status != "active")] | length')

if [ "$INACTIVE" -gt 0 ]; then
  echo "$INACTIVE inactive webhook(s)"
fi
```

## Alerting Integration

### Send Slack Alert on High Bounce Rate

```bash
#!/bin/bash
# Integrate with Slack

SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

send_slack_alert() {
  local message="$1"
  
  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"$message\"}"
}

# Check bounce rate
BOUNCE_RATE=$(resend emails list --json | \
  jq -r '(.data | map(select(.status == "bounced")) | length) / (.data | length) * 100')

if (( $(echo "$BOUNCE_RATE > 5.0" | bc -l) )); then
  send_slack_alert "🚨 High bounce rate detected: ${BOUNCE_RATE}%"
fi
```

### PagerDuty Integration

```bash
#!/bin/bash
# Trigger PagerDuty alert

PAGERDUTY_KEY="your_integration_key"

trigger_pagerduty() {
  local summary="$1"
  local severity="$2"  # critical, error, warning, info
  
  curl -X POST https://events.pagerduty.com/v2/enqueue \
    -H 'Content-Type: application/json' \
    -d "{
      \"routing_key\": \"$PAGERDUTY_KEY\",
      \"event_action\": \"trigger\",
      \"payload\": {
        \"summary\": \"$summary\",
        \"severity\": \"$severity\",
        \"source\": \"resend-cli-monitor\"
      }
    }"
}

# Example: Alert on delivery failures
FAILED=$(resend emails list --json | \
  jq '[.data[] | select(.status == "failed")] | length')

if [ "$FAILED" -gt 10 ]; then
  trigger_pagerduty "Email delivery failures: $FAILED emails failed" "error"
fi
```

## Scheduled Monitoring with Cron

```bash
# Add to crontab (crontab -e)

# Check bounce rate every hour
0 * * * * /path/to/check-bounce-rate.sh >> /var/log/resend-monitor.log 2>&1

# Daily domain verification check (9 AM)
0 9 * * * /path/to/verify-domains.sh

# Weekly email health report (Monday 8 AM)
0 8 * * 1 /path/to/weekly-email-report.sh | mail -s "Weekly Email Report" admin@company.com
```

## Metrics Export

### Export to CSV for Analysis

```bash
# Export email data to CSV
resend emails list --json | \
  jq -r '.data[] | [.id, .to, .subject, .status, .created_at] | @csv' \
  > emails_$(date +%Y%m%d).csv

echo "Exported emails to emails_$(date +%Y%m%d).csv"
```

### Send to Analytics Platform

```bash
# Send metrics to your analytics platform (e.g., Datadog, New Relic)

STATS=$(resend emails list --json | jq '{
  total: (.data | length),
  delivered: ([.data[] | select(.status == "delivered")] | length),
  bounced: ([.data[] | select(.status == "bounced")] | length),
  pending: ([.data[] | select(.status == "pending")] | length)
}')

# Post to Datadog (example)
# curl -X POST "https://api.datadoghq.com/api/v1/series" \
#   -H "DD-API-KEY: $DD_API_KEY" \
#   -d "{ ... }"
```

## Production Monitoring Checklist

- [ ] Set up hourly bounce rate checks
- [ ] Monitor spam complaints daily
- [ ] Verify all domains weekly
- [ ] Check webhook status daily
- [ ] Export metrics for long-term analysis
- [ ] Set up alerts for bounce rate > 5%
- [ ] Monitor delivery time trends
- [ ] Track domain reputation scores

## Next Steps

See [05-bulk-operations.md](./05-bulk-operations.md) for managing contacts and broadcasts at scale.

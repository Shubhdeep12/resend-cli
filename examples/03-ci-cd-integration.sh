#!/bin/bash
# CI/CD Integration Examples for Resend CLI
# Use this in GitHub Actions, GitLab CI, Jenkins, etc.

set -e # Exit on error

echo "Resend CLI - CI/CD integration examples"

#############################################
# Example 1: Verify Domain Before Deployment
#############################################
echo "\nExample 1: Verify domain configuration"

verify_domain() {
  local domain_name="$1"
  
  echo "Checking domain: $domain_name"
  
  # Get domain status
  DOMAIN_STATUS=$(resend domains list --json | \
    jq -r ".data[] | select(.name == \"$domain_name\") | .status")
  
  if [ "$DOMAIN_STATUS" = "verified" ]; then
    echo "Domain $domain_name is verified"
    return 0
  else
    echo "Domain $domain_name is NOT verified (status: $DOMAIN_STATUS)"
    echo "Please verify domain before deploying email features"
    return 1
  fi
}

# Usage in CI:
# verify_domain "yourdomain.com" || exit 1

#############################################
# Example 2: Test Email Sending
#############################################
echo "\nExample 2: Test email delivery in CI"

test_email_delivery() {
  local from="$1"
  local to="$2"
  
  echo "Sending test email from $from to $to"
  
  # Send test email
  RESULT=$(resend emails send \
    --from "$from" \
    --to "$to" \
    --subject "[CI/CD] Email Test - $(date)" \
    --html "<h1>Test Email</h1><p>Build: ${CI_BUILD_ID:-local}</p>" \
    --json)
  
  # Check if send was successful
  if echo "$RESULT" | jq -e '.error' > /dev/null; then
    ERROR_MSG=$(echo "$RESULT" | jq -r '.error.message')
    echo "Failed to send test email: $ERROR_MSG"
    return 1
  fi
  
  EMAIL_ID=$(echo "$RESULT" | jq -r '.data.id')
  echo "Test email sent successfully. ID: $EMAIL_ID"
  
  # Wait and verify delivery
  echo "Waiting 5 seconds for delivery..."
  sleep 5
  
  STATUS=$(resend emails get $EMAIL_ID --json | jq -r '.status')
  echo "Email status: $STATUS"
  
  if [ "$STATUS" = "delivered" ]; then
    echo "Email delivered successfully"
    return 0
  else
    echo "Email not yet delivered (status: $STATUS)"
    return 0 # Don't fail CI for slow delivery
  fi
}

# Usage in CI:
# test_email_delivery "noreply@yourdomain.com" "test@yourdomain.com"

#############################################
# Example 3: Validate Webhooks Configuration
#############################################
echo "\nExample 3: Validate webhook setup"

validate_webhooks() {
  local expected_endpoint="$1"
  
  echo "Checking webhook configuration..."
  
  # Get all webhooks
  WEBHOOKS=$(resend webhooks list --json)
  
  # Check if expected endpoint exists
  WEBHOOK_EXISTS=$(echo "$WEBHOOKS" | \
    jq -r ".data[] | select(.endpoint == \"$expected_endpoint\") | .id")
  
  if [ -z "$WEBHOOK_EXISTS" ]; then
    echo "Webhook for $expected_endpoint not found"
    echo "Creating webhook..."
    
    resend webhooks create \
      --url "$expected_endpoint" \
      --events email.delivered email.bounced email.complained \
      --json
    
    echo "Webhook created"
  else
    echo "Webhook already exists: $WEBHOOK_EXISTS"
  fi
}

# Usage in CI:
# validate_webhooks "https://api.yourdomain.com/webhooks/resend"

#############################################
# Example 4: Check API Key Permissions
#############################################
echo "\nExample 4: Verify API key permissions"

check_api_key() {
  echo "Checking API key configuration..."
  
  # Try to list emails (requires sending_access)
  if resend emails list --json > /dev/null 2>&1; then
    echo "API key has valid permissions"
  else
    echo "API key is invalid or has insufficient permissions"
    exit 1
  fi
}

# Usage in CI:
# check_api_key

#############################################
# Example 5: Monitor Bounce Rate
#############################################
echo "\nExample 5: Monitor email bounce rate"

check_bounce_rate() {
  local max_bounce_percent="${1:-5}" # Default 5%
  
  echo "Checking bounce rate (threshold: ${max_bounce_percent}%)..."
  
  # Get recent emails
  EMAILS=$(resend emails list --json)
  
  TOTAL=$(echo "$EMAILS" | jq '.data | length')
  BOUNCED=$(echo "$EMAILS" | jq '[.data[] | select(.status == "bounced")] | length')
  
  if [ "$TOTAL" -eq 0 ]; then
    echo "No emails found in recent history"
    return 0
  fi
  
  BOUNCE_RATE=$(echo "scale=2; $BOUNCED / $TOTAL * 100" | bc)
  
  echo "Bounce rate: $BOUNCE_RATE% ($BOUNCED/$TOTAL)"
  
  if (( $(echo "$BOUNCE_RATE > $max_bounce_percent" | bc -l) )); then
    echo "Bounce rate ${BOUNCE_RATE}% exceeds threshold ${max_bounce_percent}%"
    return 1
  else
    echo "Bounce rate within acceptable range"
    return 0
  fi
}

# Usage in CI:
# check_bounce_rate 5 || exit 1

#############################################
# Example 6: GitHub Actions Integration
#############################################

# .github/workflows/test-email.yml
# -----------------------------------
# name: Test Email Delivery
# 
# on:
#   push:
#     branches: [main, develop]
#   pull_request:
# 
# jobs:
#   test-email:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v3
#       
#       - name: Install Resend CLI
#         run: npm install -g @shubh/resend-cli
#       
#       - name: Test Email Delivery
#         env:
#           RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
#         run: |
#           # Verify domain
#           resend domains list --json | \
#             jq -r '.data[] | select(.name == "yourdomain.com") | .status'
#           
#           # Send test email
#           resend emails send \
#             --from "ci@yourdomain.com" \
#             --to "test@yourdomain.com" \
#             --subject "CI Test" \
#             --html "<p>Build: ${{ github.run_number }}</p>" \
#             --json

#############################################
# Example 7: GitLab CI Integration
#############################################

# .gitlab-ci.yml
# -----------------------------------
# stages:
#   - test
# 
# test_email:
#   stage: test
#   image: node:20
#   before_script:
#     - npm install -g @shubh/resend-cli
#   script:
#     - resend domains list
#     - |
#       resend emails send \
#         --from "ci@yourdomain.com" \
#         --to "test@yourdomain.com" \
#         --subject "GitLab CI Test" \
#         --html "<p>Build: $CI_PIPELINE_ID</p>" \
#         --json
#   only:
#     - main

echo "\nAll CI/CD examples completed"

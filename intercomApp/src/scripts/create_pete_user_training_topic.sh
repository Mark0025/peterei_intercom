#!/bin/bash

# Load environment variables robustly
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

# Set test data (edit as needed)
EXTERNAL_ID="test-curl-001"
TITLE="Test Topic from shell script"
NOW=$(date +%s)

# Set admin email (change or extend this for other admins as needed)
CREATED_BY_ADMIN_EMAIL="mark@peterei.com"
# To allow for multiple admins, you could use a comma-separated string or an array if your schema supports it.

# Build JSON payload safely
JSON=$(cat <<EOF
{
  "external_id": "$EXTERNAL_ID",
  "external_created_at": $NOW,
  "external_updated_at": $NOW,
  "custom_attributes": {
    "Title": "$TITLE",
    "created_by_admin_email": "$CREATED_BY_ADMIN_EMAIL"
  }
}
EOF
)

# Make the API request
curl -i -X POST "https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Intercom-Version: 2.13" \
  -d "$JSON"
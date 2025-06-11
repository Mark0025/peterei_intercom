#!/bin/bash

# Load environment variables from intercomApp/.env
set -a
source intercomApp/.env
set +a

# Set test data (edit as needed)
EXTERNAL_ID="test-curl-001"
TITLE="Test Topic from shell script"
NOW=$(date +%s)

# Build JSON payload safely
JSON=$(cat <<EOF
{
  "external_id": "$EXTERNAL_ID",
  "external_created_at": $NOW,
  "external_updated_at": $NOW,
  "custom_attributes": {
    "Title": "$TITLE"
  }
}
EOF
)

# Make the API request
curl -i -X POST "https://api.intercom.io/custom_object_instances/PeteUserTraingTopic" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Intercom-Version: 2.13" \
  -d "$JSON"
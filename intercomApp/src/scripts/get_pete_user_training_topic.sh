#!/bin/bash

# Usage: bash get_pete_user_training_topic.sh <EXTERNAL_ID>

if [ -z "$1" ]; then
  echo "Usage: $0 <EXTERNAL_ID>"
  exit 1
fi

EXTERNAL_ID="$1"

# Load environment variables robustly
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

curl -i -X GET \
  "https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?external_id=$EXTERNAL_ID" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Intercom-Version: 2.13" \
  -H "Accept: application/json" 
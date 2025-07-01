#!/bin/bash

# Usage: bash get_all_pete_user_training_topics.sh

# Load environment variables robustly
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

curl -i -X GET \
  "https://api.intercom.io/custom_object_instances/custom-objects/Pete_Training_Topic" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Intercom-Version: 2.13" \
  -H "Accept: application/json" 
#!/bin/bash

# Usage: bash update_user_training_topic.sh <USER_ID|EMAIL> <NEW_TOPIC>
# You can provide either the Intercom Contact ID or the user's email address as the first argument.

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <USER_ID|EMAIL> <NEW_TOPIC>"
  exit 1
fi

IDENTIFIER="$1"
NEW_TOPIC="$2"

# Load environment variables
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

LOG_DIR="$SCRIPT_DIR/responses/logs"
mkdir -p "$LOG_DIR"

# If the identifier contains '@', treat it as an email and look up the Intercom Contact ID
if [[ "$IDENTIFIER" == *"@"* ]]; then
  EMAIL="$IDENTIFIER"
  LOOKUP_LOG_FILE="$LOG_DIR/lookup_user_id_${EMAIL//[@.]/_}.log"
  echo "Looking up Intercom Contact ID for email: $EMAIL..."
  RESPONSE=$(curl -s -X GET "https://api.intercom.io/contacts?email=$EMAIL" \
    -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
    -H "Accept: application/json")
  echo "$RESPONSE" > "$LOOKUP_LOG_FILE"
  USER_ID=$(echo "$RESPONSE" | jq -r '.contacts[0].id')
  if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
    echo "Error: No Intercom user found for email $EMAIL. See $LOOKUP_LOG_FILE for details."
    exit 1
  fi
  echo "Found Intercom Contact ID: $USER_ID"
else
  USER_ID="$IDENTIFIER"
fi

LOG_FILE="$LOG_DIR/update_user_training_topic_${USER_ID}.log"

echo "Updating user_training_topic for user $USER_ID to '$NEW_TOPIC'..."

JSON_PAYLOAD=$(jq -n --arg topic "$NEW_TOPIC" '{custom_attributes: {user_training_topic: $topic}}')

curl -i -X PUT \
  "https://api.intercom.io/contacts/$USER_ID" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  | tee "$LOG_FILE"

echo "Response logged to $LOG_FILE" 
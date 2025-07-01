#!/bin/bash

# Usage: bash update_company_petetraining.sh <COMPANY_ID> <NEW_VALUE>

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <COMPANY_ID> <NEW_VALUE>"
  exit 1
fi

COMPANY_ID="$1"
NEW_VALUE="$2"

# Load environment variables
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

LOG_DIR="$SCRIPT_DIR/responses/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/update_company_petetraining_${COMPANY_ID}.log"

echo "Updating petetraining for company $COMPANY_ID to '$NEW_VALUE'..."

JSON_PAYLOAD=$(jq -n --arg value "$NEW_VALUE" '{custom_attributes: {petetraining: $value}}')

curl -i -X PUT \
  "https://api.intercom.io/companies/$COMPANY_ID" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  | tee "$LOG_FILE"

echo "Response logged to $LOG_FILE" 
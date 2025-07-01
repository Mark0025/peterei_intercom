#!/bin/bash

# Usage: bash get_contact_id_by_email.sh <EMAIL>

if [ -z "$1" ]; then
  echo "Usage: $0 <EMAIL>"
  exit 1
fi

EMAIL="$1"

# Load environment variables
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

curl -s -X POST "https://api.intercom.io/contacts/search" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"query\": {\"field\": \"email\", \"operator\": \"=\", \"value\": \"$EMAIL\"}}" \
  | jq '.data[] | {id, email}' 
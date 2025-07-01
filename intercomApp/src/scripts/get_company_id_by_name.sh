#!/bin/bash

# Usage: bash get_company_id_by_name.sh "<COMPANY_NAME>"

if [ -z "$1" ]; then
  echo "Usage: $0 \"<COMPANY_NAME>\""
  exit 1
fi

COMPANY_NAME="$1"

# Load environment variables
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

curl -s -X POST "https://api.intercom.io/companies/search" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d "{\"query\": {\"field\": \"name\", \"operator\": \"=\", \"value\": \"$COMPANY_NAME\"}}" \
  | jq '.companies[] | {id, name}' 
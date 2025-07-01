#!/bin/bash

# Usage: bash get_admin_by_id.sh <ADMIN_ID>

if [ -z "$1" ]; then
  echo "Usage: $0 <ADMIN_ID>"
  exit 1
fi

ADMIN_ID="$1"

# Load environment variables robustly
set -a
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../.env"
set +a

curl -i -X GET \
  "https://api.intercom.io/admins/$ADMIN_ID" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Intercom-Version: 2.13" 
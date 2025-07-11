#!/bin/bash

# Pete Intercom App Endpoint Health Check
# Checks core health/status endpoints and prints results (✅/❌)

BASE_URL="http://localhost:4000"
LOG_FILE="endpoint_health_check.log"

endpoints=(
  "/health"
  "/api/intercom/cache/status"
  "/api/intercom/contacts/test"
)

echo "--- Pete Intercom App Endpoint Health Check ---" > $LOG_FILE
ALL_PASS=true

for endpoint in "${endpoints[@]}"; do
  url="$BASE_URL$endpoint"
  echo -n "Checking $url ... " | tee -a $LOG_FILE
  response=$(curl -s -w "%{http_code}" "$url" -o tmp_response.json)
  http_code=$(tail -c 3 <<< "$response")
  body=$(cat tmp_response.json)
  if [[ "$http_code" == "200" ]]; then
    echo "✅ ($http_code)" | tee -a $LOG_FILE
    echo "  Response: $body" >> $LOG_FILE
  else
    echo "❌ ($http_code)" | tee -a $LOG_FILE
    echo "  ERROR: $body" >> $LOG_FILE
    ALL_PASS=false
  fi
  rm -f tmp_response.json
  echo "" >> $LOG_FILE
  sleep 0.5
done

if $ALL_PASS; then
  echo -e "\nAll endpoint health checks passed ✅" | tee -a $LOG_FILE
else
  echo -e "\nSome endpoint health checks failed ❌" | tee -a $LOG_FILE
fi 
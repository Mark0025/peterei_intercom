#!/bin/bash

# Load environment variables
set -a
source intercomApp/.env
set +a

# Make the API call and save the response
curl -s -X GET \
  "https://api.intercom.io/me" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Intercom-Version: 2.13" \
  -o intercomApp/src/scripts/responses/me_response.json

# Print the response
cat intercomApp/src/scripts/responses/me_response.json 
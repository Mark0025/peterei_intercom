# Setting Up an Intercom Data Connector for PeteUserTrainingTopic

## Overview

You can use Intercom Data Connectors to fetch live data from your custom objects (like `PeteUserTrainingTopic`) and make it available in the Intercom UI, Workflows, or Fin. This is done by configuring an API connection that uses the Intercom REST API.

---

## Mermaid Diagram: Data Connector Flow

```mermaid
sequenceDiagram
  participant Intercom_UI as Intercom UI (Data Connector)
  participant API as Intercom REST API
  participant CustomObject as PeteUserTrainingTopic

  Intercom_UI->>API: GET /custom_object_instances/PeteUserTrainingTopic?external_id={external_id}
  API->>CustomObject: Fetch PeteUserTrainingTopic by external_id
  CustomObject-->>API: Return object data (JSON)
  API-->>Intercom_UI: Return object data (JSON)
```

---

## API Request Details

- **Method:** `GET`
- **URL:**
  ```
  https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?external_id={external_id}
  ```
  Replace `{external_id}` with the actual external ID you want to fetch.

---

## Required HTTP Headers

| Header Name             | Value (example)          | Purpose                                |
| ----------------------- | ------------------------ | -------------------------------------- |
| Authorization           | Bearer YOUR_ACCESS_TOKEN | Authenticates the request              |
| Intercom-Version        | 2.13                     | Ensures compatibility with API version |
| Content-Type (optional) | application/json         | (For POST/PUT, not needed for GET)     |

**Example:**

```http
Authorization: Bearer dG9rOjU0YWE3MGI3X2E3OTBfNGY2OF85ZTAxX2RiNzlhM2FjNzgyZDoxOjA=
Intercom-Version: 2.13
```

---

## Authentication

- **You must use a valid Intercom access token** (Personal Access Token or OAuth token) in the `Authorization` header.
- This token should be the same as what you have in your `.env` file (`INTERCOM_ACCESS_TOKEN`).
- The token must have permission to access custom objects in your Intercom workspace.

**Why is authentication required?**

- To ensure only authorized apps and users can access or modify your Intercom data.
- To protect sensitive customer and business information.

---

## Example cURL Command

```bash
curl -X GET "https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?external_id=test-curl-001" \
  -H "Authorization: Bearer $INTERCOM_ACCESS_TOKEN" \
  -H "Intercom-Version: 2.13"
```

---

## Setting Up in the Intercom UI

1. **Go to:**  
   `Settings > Integrations > Data connectors`
2. **Create a new Data Connector** and choose API connection.
3. **Set Method:** `GET`
4. **Set URL:**
   ```
   https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?external_id={{external_id}}
   ```
   (You can use Intercom variables for dynamic values.)
5. **Add HTTP Headers:**
   - `Authorization: Bearer YOUR_ACCESS_TOKEN` (copy from your `.env`)
   - `Intercom-Version: 2.13`
6. **Test the connection** to ensure you get a 200 OK and the expected JSON response.

---

## Fetching by external_id, Latest, or All Instances

### 1. Fetch a Specific Instance by external_id

To fetch a specific `PeteUserTrainingTopic` instance, use the `external_id` query parameter:

```
https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?external_id={external_id}
```

- Replace `{external_id}` with the value you want to retrieve.
- This returns the object with that external_id, if it exists.

### 2. Fetch All Instances

To fetch all instances of the custom object type:

```
https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic
```

- This returns a paginated list of all `PeteUserTrainingTopic` objects.
- You can use pagination parameters (`per_page`, `starting_after`, etc.) as needed.

**Example:**

```
https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?per_page=50
```

### 3. Fetch the Latest Instance

Intercom's API does not have a direct "latest" filter, but you can:

- Fetch all (or a page of) instances, then sort by `created_at` or `updated_at` in your code or workflow.
- Use the `per_page` parameter to limit results and process the most recent one.

**Example:**

```
https://api.intercom.io/custom_object_instances/PeteUserTrainingTopic?per_page=1
```

- This will return the first instance in the default sort order (usually by creation date, but check the API docs for your version).

### 4. Using in Data Connector Setup

- In the Data Connector UI, you can pass variables for `external_id` or omit it to fetch all.
- For dynamic queries, use Intercom variables (e.g., `{{external_id}}`) in the URL.
- For all instances, leave off the `external_id` parameter.

**Note:**

- Always consider pagination if you expect many results.
- Filtering and sorting may need to be handled in your workflow or code after fetching the data.

---

## References

- [Intercom Data Connectors Guide](https://www.intercom.com/help/en/articles/6298282-how-to-set-up-data-connectors-for-workflows-and-inbox)
- [Intercom Custom Object API Reference](https://developers.intercom.com/docs/references/rest-api/api.intercom.io/custom-object-instances/custom_object_instance)

---

**Summary:**

- Use your `.env` access token in the Authorization header.
- Set up the Data Connector as shown to fetch your custom object data securely and reliably.

---

## Troubleshooting: media_type_not_acceptable Error

### Error Message

```
{
  "errors": [
    {
      "code": "media_type_not_acceptable",
      "message": "The Accept header should send a media type of application/json"
    }
  ],
  "type": "error.list"
}
```

### What Does This Mean?

- The Intercom API requires that you explicitly set the `Accept` header to `application/json` in your request.
- This tells the API that you expect a JSON response, which is required for Data Connectors and most API integrations.

### How to Fix

- **Add the following header to your Data Connector or API request:**

| Header Name | Value            | Purpose                        |
| ----------- | ---------------- | ------------------------------ |
| Accept      | application/json | Request a JSON response format |

**Example (all required headers):**

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
Intercom-Version: 2.13
Accept: application/json
```

- In the Intercom Data Connector UI, add a new key-value pair under HTTP Headers:
  - **Key:** `Accept`
  - **Value:** `application/json`

### Why Is This Required?

- The Intercom API enforces content negotiation for security and consistency.
- Data Connectors, Fin Tasks, and Workflows all expect JSON-formatted data for mapping and processing attributes ([Intercom Docs](https://www.intercom.com/help/en/articles/10546434-how-attributes-can-power-your-fin-tasks-workflows-and-data-connectors#h_49620d27ba)).

### Summary Table: Required Headers

| Header Name      | Value             | Required For           |
| ---------------- | ----------------- | ---------------------- |
| Authorization    | Bearer YOUR_TOKEN | All API requests       |
| Intercom-Version | 2.13              | All API requests       |
| Accept           | application/json  | All API requests       |
| Content-Type     | application/json  | POST/PUT requests only |

---

**Always include the `Accept: application/json` header in your Data Connector and API requests to avoid this error and ensure proper data handling in Intercom.**

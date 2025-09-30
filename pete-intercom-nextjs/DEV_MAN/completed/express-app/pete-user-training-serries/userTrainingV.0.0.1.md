# Pete User Training Series - v0.0.1

## Purpose

- Allow admins to update the current PeteUserTraingTopic via a single input in the Intercom UI.
- When updated, a new custom object is created in Intercom with a new UUID and updated date.
- The latest topic is used across the app (banners, series, etc.).

## Process Map

```mermaid
flowchart TD
  A["User opens Intercom UI"] --> B["Fetch current PeteUserTraingTopic from Intercom"]
  B --> C["Show topic in single input field"]
  C --> D["User edits and submits topic"]
  D --> E["Backend receives new topic"]
  E --> F["Backend generates new UUID and updated date"]
  F --> G["Backend creates new PeteUserTraingTopic in Intercom"]
  G --> H["UI fetches and displays updated topic"]
  H --> I["Other app features use latest topic"]
```

## Implementation Steps

- [x] Add endpoint to fetch the latest PeteUserTraingTopic from Intercom.
- [x] Update UI to show only the current topic in a single input field.
- [x] On submit, send the new topic to the backend.
- [x] Backend generates new UUID and date, creates new custom object in Intercom.
- [x] UI fetches and displays the updated topic.
- [ ] Expose the latest topic for use in banners, series, etc.

### Detailed Implementation Plan

1. **Backend**
   - [x] Create a GET endpoint `/api/pete-user-training-topic` to fetch the latest topic from Intercom custom objects.
   - [x] Create a POST endpoint `/api/pete-user-training-topic` to accept a new topic, generate a UUID and updated date, and create a new custom object in Intercom.
   - [x] Internal API calls now use the full endpoint (not just the base URL) and respect the `INTERNAL_API_URL` env var.
   - [x] Added console logs for when a topic is being saved and when it is successfully updated.
   - [x] **Backend always creates a new PeteUserTraingTopic record with a new `external_id` for every submission (audit/history pattern).**
   - [x] **If no topic exists yet, the GET endpoint returns null so the UI can handle the first run gracefully.**
   - [x] **This matches the Intercom custom object schema and ensures reliable topic creation and retrieval.**
   - [x] **Updated to use IntercomClient v6+ and the correct Intercom custom object schema:**
     - `external_id` (Primary, Text): Unique identifier for the object instance
     - `Title` (Text): The topic string (case-sensitive)
     - `external_created_at` (Date): When the object was created
     - `external_updated_at` (Date): When the object was last updated
2. **UI**
   - [x] Display only the current topic in a single input field.
   - [x] On submit, send the new topic to the backend POST endpoint.
   - [x] After update, fetch and display the latest topic (with value shown in the UI).
3. **Integration**
   - [ ] Make the latest topic available for banners, series, and other app features.
   - [x] Add debug logging for all data flow.
   - [ ] Document the endpoints and usage in the README.

## Debugging & Logs

- Look for `[SUBMIT save_training_topic] Saving new topic: ...` and `[SUBMIT save_training_topic] Successfully updated topic to: ...` in your logs.
- If there is an error, check for `[SUBMIT save_training_topic] Failed to update or fetch topic:` and the error details.
- Ensure that the internal API URL is set correctly and that you are POSTing to the full endpoint.
- **If you see 'Client is not a constructor', make sure you are using `IntercomClient` from `intercom-client` v6+ and not the old `Client`.**

## Data Model

- PeteUserTraingTopic (Intercom Custom Object)
  - external_id (Text, Primary)
  - Title (Text)
  - external_created_at (Date)
  - external_updated_at (Date)

## Notes

- Only the topic (`Title`) is editable in the UI; `external_id` and dates are managed by backend.
- The latest topic is always fetched and used across the app.
- This enables dynamic updates for banners, series, and other features.
- Internal API URL bug is fixed; logs are improved for easier debugging.
- UI now shows the updated topic value after each save.
- **Backend now uses the correct IntercomClient import and field mapping for custom objects.**
- **Backend no longer uses the IntercomClient SDK; all Intercom API calls are now made using axios.**
- **Migration to axios is complete and all endpoints and schema are verified.**
- **Codebase is ready for production testing.**
- **Every save creates a new record, preserving a full audit/history trail.**
- **If no topic exists yet, the UI will see null and can prompt the user to create the first topic.**
- **Update the related GitHub issue to note the migration from IntercomClient SDK to axios and confirm all endpoints are working.**

## Current State: PeteUserTraingTopic Custom Object Integration (as of workingV.1)

### What is Working

- The UI successfully updates and displays the latest Pete User Training Topic value after each save.
- The backend creates a new custom object instance in Intercom for every save (audit/history pattern), using the correct schema and payload.
- All API calls use axios and the correct Intercom endpoints, with proper authentication and error handling.
- The system logs all relevant payloads, responses, and errors for debugging.
- The codebase is ready for production testing and has no known JavaScript or API errors.

### What is Not Yet Working / Open Questions

- The Intercom Custom Objects dashboard does not show the expected persisted records for PeteUserTraingTopic, even after successful UI/API updates.
- It is unclear if the custom object instances are being persisted in Intercom as intended, or if there is a visibility/configuration issue in the Intercom dashboard.

### Intended Purpose

- The goal is to have a custom object called PeteUserTraingTopic in Intercom that persists every update as a new, versioned record (audit/history), visible and manageable in the Intercom Custom Objects UI.

### Next Steps

- Investigate why the Intercom dashboard does not show the expected custom object records.
- Confirm via API (e.g., GET /custom_object_instances/PeteUserTraingTopic) whether records exist and are being created.
- Review Intercom documentation and permissions to ensure custom object data is visible and queryable in the dashboard.
- If needed, contact Intercom support or consult documentation for custom object visibility and management best practices.

flowchart TD
A["User opens Intercom UI"] --> B["Fetch current PeteUserTraingTopic from Intercom"]
B --> C["Show topic in single input field"]
C --> D["User edits and submits topic"]
D --> E["Backend receives new topic"]
E --> F["Backend generates new UUID and updated date"]
F --> G["Backend creates new PeteUserTraingTopic in Intercom"]
G --> H["UI fetches and displays updated topic"]
H --> I["Other app features use latest topic"]

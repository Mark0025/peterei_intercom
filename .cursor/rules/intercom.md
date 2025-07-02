# Intercom Integration Rules & Best Practices

## 1. Use the Official Intercom SDK (intercom-client)

- Always use the latest supported version of `intercom-client` (currently v6+).
- Import as `const { IntercomClient } = require('intercom-client');`.
- Do not use deprecated `Client` import or legacy methods.

## 2. Custom Object Schema Compliance

- Always match field names and types to the Intercom custom object definition (case-sensitive!).
  - Example: `external_id` (Text, Primary), `Title` (Text), `external_created_at` (Date), `external_updated_at` (Date).
- For custom attributes, use the `custom_attributes` object in API calls.
- Use Unix timestamps (seconds) for all date fields.

## 3. Creating vs. Updating Custom Objects

- Decide on your pattern:
  - **Audit/History:** Always create a new record with a new `external_id` (recommended for traceability).
  - **Singleton:** Use a fixed `external_id` and always update the same record (no history).
- Be explicit in code and documentation about which pattern you are using.

## 4. Error Handling & Null Safety

- Always handle the case where no custom object exists yet (return `null` or a clear response, not a 404 error).
- Log all errors with context and details for debugging.
- Never expose sensitive error details to the UI.

## 5. Environment Variables

- Store all Intercom API tokens and secrets in environment variables (never hardcode).
- Use `INTERNAL_API_URL` for internal API calls; always check and respect this variable.

## 6. Logging & Debugging

- Add clear console logs for all Intercom API calls (saving, updating, fetching, errors).
- Use unique log prefixes (e.g., `[SUBMIT save_training_topic]`) for traceability.

## 7. Documentation & Code Comments

- Reference the Intercom API docs in comments where relevant:
  - https://developers.intercom.com/intercom-api-reference/reference
  - https://developers.intercom.com/canvas-kit-reference/reference/components
- Document all custom object schemas and API usage in the relevant plan or README files.

## 8. Security & Permissions

- Ensure your Intercom app has the required permissions for all endpoints you use.
- Never log or expose API tokens or secrets.

## 9. Testing & Validation

- Test all endpoints for both the "first run" (no data) and normal operation.
- Validate that new records appear in the Intercom UI as expected.

## 10. General Best Practices

- Keep all Intercom integration logic modular and well-commented.
- Prefer explicit, readable code over clever or "magic" solutions.
- Review and update these rules as Intercom or your app evolves.

## 11. Extensibility & Safe Feature Addition

- All new features (attributes, workflows, series, endpoints) must:
  - Use a modular utility for all Intercom API calls (do not duplicate API logic).
  - Log all actions and errors using the logger utility.
  - Include a test script or manual test instructions for new endpoints/features.
  - Be documented in the README and DEV_MAN (usage, input/output, example logs).
  - Not break existing attribute update flows or logging. Breaking changes must be versioned and documented.
- All new Canvas Kit UI must use only approved components and follow accessibility and request/response best practices.
- All new dependencies must be added to the correct package.json and documented in the commit message.
- Review and update these rules after each major feature or refactor to reflect new best practices.

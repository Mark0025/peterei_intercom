# Pete Intercom APP 

FOR UPDATING PETE TRAINING



## Quick Start (Local Development)

From the project root, run:

```sh
./start.sh
```

This will:

- Install dependencies (if needed)
- Start the Node.js app
- Start ngrok and fetch the public URL
- Write webhook endpoints to `webhook.txt`

## Using pnpm (Optional)

You can also run:

```sh
pnpm start
```

This will do the same as `./start.sh` (see below for setup).

## Production/Cloud Deployment

- The app is in the `intercomApp/` directory.
- In production, set the `NODE_ENV=production` and provide a `PUBLIC_URL` if needed.
- The app will skip ngrok and use the provided public URL for webhooks.

## Project Structure

- `intercomApp/` — Main app code, scripts, and dependencies
- `start.sh` — Root-level launcher (runs everything from the right place)
- `webhook.txt` — Auto-generated with the latest webhook endpoints

## Troubleshooting

- Always run from the root directory using `./start.sh` or `pnpm start`.
- If you see errors about missing scripts or files, check that you have the latest code and are in the correct directory.

---

For more details, see `intercomApp/README.md` and `intercomApp/plan.md`.

# peterei_intercom

# Cursor Rules: Intercom Canvas Kit (@canvaskit.mdc)

## 1. Only Use Documented Canvas Kit Components

- Only use components, objects, and properties explicitly documented in the [Canvas Kit Reference](https://developers.intercom.com/canvas-kit-reference/reference/components).
- Do not invent, guess, or use undocumented types, properties, or values.
- If a component or property is not in the docs, it is not allowed.

## 2. Strict Request/Response Model

- All endpoints must accept POST requests from Intercom and respond with valid Canvas Kit JSON.
- Every response to `/initialize` or `/submit` must include a `canvas` object with a `content` property containing an array of components.
- The structure must match the documentation exactly (e.g., `canvas: { content: { components: [...] } }`).

## 3. Component Action Rules

- Only use supported action types: `submit`, `open_url`, or `post_message`.
- For buttons, use only `id` and `action: { type: "submit" }` (or other allowed types).
- Do not use unsupported fields like `value` or custom action types.
- Each actionable component must have a unique `id`.

## 4. Context and Location

- Always check the `context` and `current_canvas` objects in the request payload to determine what to display.
- Only implement logic for supported locations (Messenger Home, Inbox, etc.).
- Do not assume or hardcode context; always use the payload.

## 5. Initialize and Submit Flows

- Implement both `/initialize` and `/submit` endpoints.
- `/initialize` returns the initial UI (e.g., form, buttons).
- `/submit` processes input and returns the next UI or confirmation.
- Always return a valid Canvas Kit response, even on error.

## 6. Secure Webhook Practices

- Validate the `X-Body-Signature` header on all incoming requests using HMAC-SHA256 and your Intercom app's client secret.
- Never process requests without signature validation.
- Do not log or expose secrets.

## 7. Minimal and Secure Data Storage

- Store only what is necessary for the flow, using the `stored_data` property in the canvas response if needed.
- Do not store sensitive user data unless absolutely required and always comply with privacy best practices.

## 8. User Experience

- Keep flows simple: clear text, minimal steps, actionable buttons.
- Use `event: { type: "completed" }` in the response when onboarding or a flow is finished.
- Use `style: "error"` for error messages, and always provide actionable next steps.

## 9. Accessibility & Responsiveness

- All text must be readable and all actions accessible via keyboard and screen readers.
- Test the UI in all supported Intercom contexts.

## 10. No Custom Scripts or External Libraries

- Do not include custom JavaScript or external libraries in Canvas Kit responses.
- Only use built-in Canvas Kit components and properties.

## 11. Documentation & Comments

- Comment code to indicate which Canvas Kit model or best practice is being followed.
- Reference the relevant section of the [Canvas Kit documentation](https://developers.intercom.com/docs/canvas-kit) in comments.

## 12. Error Handling

- All errors must be caught and returned as Canvas Kit error components, never as raw errors or stack traces.
- Use `style: "error"` and clear, actionable error messages.

## 13. JSON Validation

- All outgoing JSON must be validated to match the Canvas Kit schema before sending.
- No extra fields, typos, or undocumented properties.

## 14. Version Control

- All changes to Canvas Kit logic must be tracked and reviewed for compliance with these rules.

---

**Reference:**

- [Intercom Canvas Kit Docs](https://developers.intercom.com/docs/canvas-kit)

# Status

![Intercom UI Status](https://img.shields.io/badge/Intercom%20UI-working-brightgreen)

- [x] Intercom Canvas Kit UI renders and works (as of tag `intercom-ui-working-v1`)
- [ ] Data storage and response testing in progress

# How to Test

1. Open the Intercom Inbox or Messenger and add the Pete Intercom App.
2. Verify that the UI renders with the onboarding and training buttons.
3. Click each button and confirm the correct UI and actions.
4. Check server logs for `[DEBUG] CanvasKit response` to verify outgoing payloads.
5. Submit forms and verify data is stored as expected (see below).

# Next Steps

- [ ] Test all Canvas Kit endpoint responses for correctness
- [ ] Verify where and how data is stored (Intercom custom objects, local DB, etc.)
- [ ] Add automated tests for endpoints
- [ ] Document data flow in README

# Milestone

- UI confirmed working in Intercom as of tag `intercom-ui-working-v1` (2024-06-07)

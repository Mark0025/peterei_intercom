# Pete Intercom APP 

FOR UPDATING PETE TRAINING



## Quick Start (Local Development)

**IMPORTANT:** This project uses Next.js 15 and is located in `pete-intercom-nextjs/` directory.

From the project root, run:

```sh
cd pete-intercom-nextjs && pnpm dev
```

This will:
- Start the Next.js development server on `http://localhost:4000`
- Enable Turbopack for faster builds
- Auto-reload on file changes

**CRITICAL:** Always use `pnpm`, never npm or yarn.

## Production/Cloud Deployment

The app is deployed on Render:
- **Production URL:** https://pete-intercom.onrender.com
- Set `NODE_ENV=production` in environment
- Configure all required environment variables (see CLAUDE.md)
- Admin routes protected by Clerk authentication (@peterei.com only)

## Project Structure

```
pete-intercom-app/
├── pete-intercom-nextjs/          # Next.js 15 application (CURRENT)
│   ├── src/
│   │   ├── app/                  # App Router pages & API routes
│   │   ├── components/           # React components
│   │   ├── actions/              # Server Actions
│   │   ├── services/             # Three AI agents
│   │   ├── lib/                  # Utilities & integrations
│   │   └── types/                # TypeScript definitions
│   ├── DEV_MAN/                  # Documentation
│   └── package.json              # Dependencies (pnpm)
├── CLAUDE.md                     # Main documentation file
└── README.md                     # This file
```

**Legacy directories removed:**
- `intercomApp/` - Old Express app (migrated to Next.js, deleted)
- `start.sh` - No longer needed

## Key Features (October 2025)

### Three AI Agents
- **LangGraph Agent** - General help & data queries with conversation history
- **Conversation Agent** - Support conversation pattern analysis
- **Onboarding Agent** - Strategic questionnaire discovery

### Persistent Conversation History
- localStorage-based frontend persistence
- Unique guest user tracking
- Admin logging system with CRUD operations
- History sidebar with session resume
- Backend file-based logging

### Admin Dashboard
- 19+ protected admin routes (Clerk auth required)
- AI conversation management at `/admin/settings/ai`
- Logs viewer at `/admin/logs`
- Onboarding insights and questionnaire tools
- Contact/company management

### Canvas Kit Integration
- Intercom Messenger & Inbox support
- Strict Canvas Kit component compliance
- HMAC-SHA256 signature validation
- Server Actions for all Canvas Kit logic

## Troubleshooting

- Always use `pnpm dev` from `pete-intercom-nextjs/` directory
- Check `.env` file has all required environment variables
- Admin routes require @peterei.com Clerk authentication
- For health checks: `cd pete-intercom-nextjs/src/scripts && ./endpoint_health_check.sh`

---

For complete documentation, see:
- **CLAUDE.md** - Main documentation file (comprehensive)
- **pete-intercom-nextjs/DEV_MAN/** - Detailed technical docs
- **pete-intercom-nextjs/DEV_MAN/AI_Architecture/** - AI agents documentation

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

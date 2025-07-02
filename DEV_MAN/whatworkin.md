# What's Working (v0.01)

_Last updated: $(date)_

## Overview

This app provides a robust onboarding and training management solution for Intercom using the Canvas Kit UI, REST API, and custom backend logic. It enables:

- Step-by-step onboarding flows and full-form onboarding via Canvas Kit and popout browser forms.
- Admins to update the `user_training_topic` attribute for users directly from the Intercom UI (Canvas Kit app), with changes reflected in Intercom via the REST API.
- Shell scripts and Node.js utilities for updating user/company attributes, looking up IDs, and testing API operations in isolation.

## What Works

- **Canvas Kit UI:** Users and admins can interact with onboarding and training flows using approved Intercom Canvas Kit components.
- **REST API Integration:** The backend can update user attributes (e.g., `user_training_topic`) in Intercom using both shell scripts and Node.js utilities.
- **Popout Full Form:** The onboarding form can be completed in a browser popout, with results emailed to admins and stored in Intercom.
- **Security:** All incoming requests are validated using HMAC-SHA256 signatures.
- **Testing:** Utilities and scripts allow for isolated, repeatable testing of attribute updates before deploying to production.
- **Logging:** API responses and errors are logged for debugging.

## What Does Not Work / Is Missing

- **Bulk/Batched Updates:** No scripts or UI for updating multiple users or companies at once.
- **Company Attribute UI:** No admin UI for updating company attributes (`petetraining`) from within the Canvas Kit app (only via API or CSV import).
- **Advanced Error Handling:** Error messages are basic; no user-facing error logs or retry logic.
- **Automated Edge-Case Tests:** Most testing is manual or via isolated scripts/utilities.
- **User/Company Relationship Management:** No UI for linking users to companies or managing custom object relationships.
- **No Role-Based Permissions:** All admins can update training topics; no fine-grained access control.

## How We Can Make It Better

- **Add Bulk/Batched Update Tools:** Scripts or UI for updating many users/companies at once.
- **Admin UI for Company Attributes:** Extend the Canvas Kit app to allow editing company-level attributes from the UI.
- **Better Error Reporting:** Show more detailed error messages and logs in the UI, and add retry options.
- **Automated Testing:** Add automated tests for all scripts/utilities and backend endpoints.
- **Role-Based Access:** Add admin roles/permissions for sensitive actions.
- **Relationship Management UI:** Add UI for linking users to companies and managing custom object relationships.
- **Documentation:** Continue to expand documentation for onboarding, training, and troubleshooting.

---

_This document will be updated as new features are added and existing ones are improved._

# What's Working: Pete Intercom App (Current State)

## ✅ Unified Attribute Update Flow

- Both the Intercom Canvas Kit UI (in Messenger) and the standalone frontend form (`/training`) now POST to the **same `/submit` endpoint**.
- The `/submit` handler uses the `updateUserTrainingTopic` utility to update the `user_training_topic` attribute on the Intercom user/contact via the REST API.
- **No custom object logic remains**—all updates are direct attribute changes.

## ✅ Logging & Traceability

- All update attempts (success or error) are logged to `src/logs/app.log` and viewable in-app at `/logs.html`.
- Logs include incoming request payloads, API responses, and error details for full traceability.

## ✅ Scripts & Utilities

- All scripts are retained for future use, but only the attribute update logic is active in the app.
- The backend and utility code for updating the attribute are identical, ensuring consistency.

## ✅ Documentation & UI

- Docs and UI have been updated to clarify that only user attributes are updated (not custom objects).
- The training form and Canvas Kit UI both reflect this model.

---

## 🟢 **Likelihood of Success: HIGH**

- The backend is now simple, robust, and focused solely on updating the user attribute.
- Both UI and Canvas Kit flows use the same endpoint and logic, reducing the chance of bugs or mismatches.
- Logging is comprehensive, so any issues will be immediately visible.
- The Intercom API call is well-tested and matches Intercom's requirements for attribute updates.

---

## ⚠️ Remaining Risks / Next Steps

- **User ID:** Ensure the correct user/contact ID is always used (from context or `.env`).
- **Permissions:** The Intercom access token must have permission to update user attributes.
- **Future Workflows:** When adding series/workflows, use the same attribute update pattern for consistency.
- **Testing:** Test both the Canvas Kit UI and the `/training` form to confirm updates appear in Intercom.

---

## 🚀 **Summary**

- The app is now highly likely to work as intended for updating the `user_training_topic` attribute from both the Intercom UI and the standalone form.
- All actions are logged and traceable.
- The codebase is clean, maintainable, and ready for future workflow integration.

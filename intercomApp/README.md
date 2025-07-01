# Intercom CanvasKit Onboarding App

## Overview

This app provides a structured onboarding flow for Intercom users using the Intercom Canvas Kit. It collects key information from customers via a series of questions and updates Intercom company attributes accordingly. The app is designed to be secure, compliant with Intercom's best practices, and easy to extend for additional onboarding or training needs.

---

## Features

- **Interactive Onboarding:** Presents users with a series of onboarding questions, grouped by section.
- **Canvas Kit UI:** Uses only approved Intercom Canvas Kit components for Messenger and Inbox.
- **Custom Attribute Sync:** Updates Intercom company custom attributes with onboarding answers.
- **Security:** Validates all incoming requests using HMAC-SHA256 signatures.
- **Easy Configuration:** Onboarding questions are managed in `src/onboarding_questions.json`.
- **Sample Q&A:** Example onboarding Q&A in `qa.json` for reference or testing.

---

## Directory Structure

- `src/index.js` — Main Express app and Canvas Kit logic
- `src/onboarding_questions.json` — All onboarding questions, grouped by section
- `qa.json` — Example onboarding Q&A
- `public/` — Static assets (optional)

---

## Deploying to Render (Production/Cloud)

1. **Create a new Web Service on Render:**

   - Connect your GitHub repo or upload your code.
   - Set the root directory to `intercomApp/`.

2. **Set environment variables in Render's dashboard:**

   - `INTERCOM_CLIENT_SECRET` — Your Intercom app's client secret
   - `INTERCOM_ACCESS_TOKEN` — Your Intercom access token
   - `EMAIL_USER` and `EMAIL_PASS` — For onboarding email notifications (Gmail recommended)
   - `PORT` — (Optional) Defaults to 4000 if not set
   - `PUBLIC_URL` — The public URL Render assigns to your service (e.g., `https://your-app.onrender.com`)

3. **Build & Start Command:**

   - Build command: (leave blank or use `pnpm install`/`npm install`)
   - Start command: `./start.sh`

4. **Configure Intercom Webhooks:**
   - Set your Intercom Canvas Kit webhook URLs to:
     - `https://your-app.onrender.com/initialize`
     - `https://your-app.onrender.com/submit`

---

## Local Development (Optional)

1. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```
2. **Configure environment variables:**
   - Create a `.env` file in the root of `intercomApp/` with:
     ```env
     INTERCOM_CLIENT_SECRET=your_intercom_client_secret
     INTERCOM_ACCESS_TOKEN=your_intercom_access_token
     EMAIL_USER=your_gmail_address
     EMAIL_PASS=your_gmail_app_password
     PORT=4000 # or your preferred port
     PUBLIC_URL=http://localhost:4000
     ```
3. **Run the app:**
   ```bash
   ./start.sh
   # or
   npm start
   # or
   pnpm start
   ```
4. **Expose your app to Intercom:**
   - For local testing, use a tool like [ngrok](https://ngrok.com/) to expose your local server (not needed on Render).

---

## Endpoints

- `POST /initialize` — Returns the first onboarding question as a Canvas Kit JSON object.
- `POST /submit` — Handles form submissions, advances to the next question, and updates Intercom company attributes.
- `GET /popout` — Serves the full onboarding form in a browser window (for popout mode).
- `POST /popout-submit` — Handles full-form submissions from the popout window.

---

## How the App Works

- **Onboarding Flow:**

  - Questions are defined in `src/onboarding_questions.json` and grouped by section.
  - Each question is presented as a Canvas Kit form component.
  - Answers are stored in Intercom as custom attributes for the company.
  - Users can complete onboarding step-by-step or via a popout full form.

- **Popout Flow:**

  - The "Show popout" button in the Canvas UI triggers a popout window with the full onboarding form (`/popout`).
  - Submitting the popout form sends results via email and updates Intercom.

- **Security:**
  - All incoming requests are validated using the `X-Body-Signature` header and your Intercom client secret (HMAC-SHA256).
  - Only approved Canvas Kit components are used.

---

## Pete User Training: Recurring Scheduled Message

To ensure users are reminded about Pete User Training every Wednesday at 11am, set up a recurring scheduled message (Post or Email) in Intercom. Banners cannot be scheduled, so use Intercom's Series or scheduling features for this purpose.

See the full guide: [`DEV_MAN/banner/bannerv2.md`](../DEV_MAN/banner/bannerv2.md)

---

## References

- [Intercom Canvas Kit Reference](https://developers.intercom.com/canvas-kit-reference/reference/components)
- [Intercom: Send messages on a recurring schedule](https://www.intercom.com/help/en/articles/5376247-send-messages-on-a-recurring-schedule)

---

_For more onboarding and automation best practices, see the DEV_MAN documentation in the project root._

---

## Recent Changes and Additions (Post-Last Git Push)

### New Scripts for Intercom API Operations

- **src/scripts/update_user_training_topic.sh**: Bash script to update the `user_training_topic` custom attribute for a user/contact in Intercom. Accepts either a user ID or email, looks up the contact if needed, and logs the API response.
- **src/scripts/get_contact_id_by_email.sh**: Bash script to look up an Intercom contact ID by email using the Search API. Useful for finding the correct user ID for updates.
- **src/scripts/update_company_petetraining.sh**: Bash script to update the `petetraining` custom attribute for a company in Intercom. Accepts company ID and new value, logs the API response.
- **src/scripts/get_company_id_by_name.sh**: Bash script to look up an Intercom company ID by company name using the Search API.
- **src/scripts/get_all_pete_user_training_topics.sh**: Bash script to fetch all Pete User Training Topic custom object instances from Intercom for debugging or auditing.

### New Utilities for Node.js Backend

- **src/utils/updateUserTrainingTopic.js**: Node.js utility function to update the `user_training_topic` attribute for a user/contact in Intercom via the REST API. Accepts user ID and topic, returns the API response, and throws on error. Used for backend integration and testing.
- **src/utils/test_updateUserTrainingTopic.js**: Node.js test script to call the above utility with a sample user ID and topic. Prints the result or error to the console. Used to verify the utility in isolation before backend integration.

### Backend Integration

- **src/index.js**: The `/submit` handler now imports and uses the `updateUserTrainingTopic` utility. When the `save_training_topic` action is triggered in the Canvas Kit UI, the backend extracts the user ID from the request context and updates the `user_training_topic` attribute for that user in Intercom. Success and error messages are shown in the UI.

### Why These Changes Were Made

- To enable admins to update the Pete User Training Topic for users directly from the Intercom Canvas Kit app UI, not just via scripts.
- To provide robust, testable, and reusable utilities for updating user and company attributes in Intercom.
- To allow for isolated testing of attribute updates before deploying to production (Render).
- To follow Intercom Canvas Kit best practices for backend logic and UI feedback.

### What We Have

- Fully tested shell scripts for updating user and company attributes and for looking up IDs.
- Node.js utility and test script for updating user training topics.
- Backend logic in the Canvas Kit app to update user training topics from the UI.

### What We Do Not Have

- Bulk update scripts for multiple users/companies at once (can be added if needed).
- Automated tests for all edge cases (manual and isolated tests have been performed).
- UI for updating company attributes (current focus is on user attributes).

---

**For more details on usage, see the comments in each script or utility.**

---

## For the Latest Status and Improvements

A detailed, versioned log of what the app does, what works, what doesn't, and how it can be improved is now maintained in:

- `DEV_MAN/whatworkin.md`

Please reference that file for the most up-to-date summary of app capabilities, limitations, and roadmap.

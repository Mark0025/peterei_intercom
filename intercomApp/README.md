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

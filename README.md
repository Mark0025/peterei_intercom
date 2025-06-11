# Pete Intercom Onboarding App

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

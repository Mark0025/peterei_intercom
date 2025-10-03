# Daily Event Archival Cron Setup

This document explains how to set up the daily event archival system to preserve user activity data before Intercom deletes it.

## 🚨 Why This Matters

**Intercom Retention Policy:**
- **Visitor data** (including events/page views) is **deleted after 9 months of inactivity**
- The Events API only returns events from the **last 90 days**
- Without archival, you lose historical user behavior data critical for onboarding analysis

## Architecture Overview

```
Daily Cron Job
    ↓
GET /api/cron/archive-events
    ↓
archiveAllUserEvents() - Server Action
    ↓
Fetches events for all contacts from Intercom
    ↓
Stores in data/event-archives/
    ├── daily/events-YYYY-MM-DD.json
    └── by-contact/{contact_id}.json
```

## Setup Options

### Option 1: Render.com Cron Jobs (Recommended for Render deployments)

1. **Create a Cron Job in Render Dashboard:**
   - Go to your Render dashboard
   - Click "New" → "Cron Job"
   - Name: "Pete Intercom Event Archive"
   - Command:
     ```bash
     curl -X GET "https://your-app.onrender.com/api/cron/archive-events" \
       -H "Authorization: Bearer ${CRON_SECRET}"
     ```
   - Schedule: `0 2 * * *` (2 AM daily)
   - Instance Type: Starter ($0.07/hour when running)

2. **Add CRON_SECRET to Environment Variables:**
   ```bash
   CRON_SECRET=your-random-secret-here-generate-with-openssl
   ```
   Generate with: `openssl rand -base64 32`

3. **Test the cron job:**
   ```bash
   curl -X GET "http://localhost:4000/api/cron/archive-events" \
     -H "Authorization: Bearer your-cron-secret"
   ```

### Option 2: Vercel Cron (For Vercel deployments)

1. **Create `vercel.json` in project root:**
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/archive-events",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```

2. **Add CRON_SECRET to Vercel Environment Variables:**
   - Dashboard → Settings → Environment Variables
   - Add: `CRON_SECRET=your-random-secret`

3. **Vercel automatically handles authentication** for scheduled cron jobs

### Option 3: GitHub Actions (Platform-agnostic)

1. **Create `.github/workflows/archive-events.yml`:**
   ```yaml
   name: Daily Event Archive

   on:
     schedule:
       - cron: '0 2 * * *'  # 2 AM UTC daily
     workflow_dispatch:  # Allow manual trigger

   jobs:
     archive:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Event Archive
           run: |
             curl -X GET "${{ secrets.APP_URL }}/api/cron/archive-events" \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               -f -s -o /dev/null -w "%{http_code}"
   ```

2. **Add GitHub Secrets:**
   - `APP_URL`: Your production URL (e.g., `https://your-app.onrender.com`)
   - `CRON_SECRET`: Generated secret

### Option 4: Self-Hosted with node-cron

1. **Install node-cron:**
   ```bash
   pnpm add node-cron
   pnpm add -D @types/node-cron
   ```

2. **Create `src/cron/scheduler.ts`:**
   ```typescript
   import cron from 'node-cron';
   import { archiveAllUserEvents } from '@/actions/archive-events';

   export function startCronJobs() {
     // Run daily at 2 AM
     cron.schedule('0 2 * * *', async () => {
       console.log('[Cron] Starting daily event archive...');
       await archiveAllUserEvents();
     });

     console.log('[Cron] Scheduler started - daily archive at 2 AM');
   }
   ```

3. **Add to your server startup** (e.g., `src/app/layout.tsx` or custom server):
   ```typescript
   import { startCronJobs } from '@/cron/scheduler';

   if (process.env.NODE_ENV === 'production') {
     startCronJobs();
   }
   ```

## Testing

### Manual Test via Admin Dashboard

1. Visit: `/admin/user-activity`
2. Click "Run Archive Now"
3. Check logs in `/admin/logs`

### Manual Test via API

```bash
# Local testing
curl -X GET "http://localhost:4000/api/cron/archive-events" \
  -H "Authorization: Bearer your-cron-secret" \
  -v

# Production testing
curl -X GET "https://your-app.onrender.com/api/cron/archive-events" \
  -H "Authorization: Bearer your-cron-secret" \
  -v
```

Expected response:
```json
{
  "success": true,
  "message": "Event archival completed",
  "stats": {
    "contactsProcessed": 42,
    "totalEvents": 1234,
    "duration": "45.23s",
    "archiveFile": "/path/to/data/event-archives/daily/events-2025-10-03.json"
  }
}
```

## Monitoring & Verification

### 1. Check Archive Files

```bash
ls -lah data/event-archives/daily/
ls -lah data/event-archives/by-contact/
```

### 2. View Logs

- Admin Dashboard: `/admin/logs`
- Log file: `pete-intercom-nextjs/logs/api.log`
- Search for: `[Archive]` or `[Cron]`

### 3. Set Up Alerts (Optional)

**Slack/Discord Webhook on Failure:**

Add to `archive-events.ts`:
```typescript
if (!result.success) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Event archive failed: ${result.error}`
    })
  });
}
```

## Environment Variables Required

```bash
# .env file
INTERCOM_ACCESS_TOKEN=your_intercom_token
CRON_SECRET=your_generated_secret  # Generate with: openssl rand -base64 32

# Optional: For alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

## Data Retention & Storage

### Storage Structure

```
data/event-archives/
├── daily/
│   ├── events-2025-10-03.json
│   ├── events-2025-10-04.json
│   └── ...
└── by-contact/
    ├── {contact_id_1}.json
    ├── {contact_id_2}.json
    └── ...
```

### Archive File Format

**Daily Archive (`events-YYYY-MM-DD.json`):**
```json
{
  "archived_at": "2025-10-03T02:00:00.000Z",
  "total_contacts": 42,
  "total_events": 1234,
  "archives": [
    {
      "contact_id": "abc123",
      "email": "user@example.com",
      "name": "John Doe",
      "archived_at": 1696305600000,
      "data_period_start": 1688529600000,
      "data_period_end": 1696305600000,
      "events": [...],
      "page_views": [...],
      "event_summaries": [...]
    }
  ]
}
```

### Storage Considerations

**Estimate:**
- ~1 KB per event
- 100 events/user = ~100 KB/user
- 1000 users = ~100 MB daily
- Annual storage: ~36 GB

**Recommendation:**
- Set up automated backups to S3/R2
- Compress old archives (gzip reduces by ~80%)
- Archive cleanup after 2+ years if needed

## Troubleshooting

### Issue: "CRON_SECRET not configured"

**Solution:** Add to `.env`:
```bash
CRON_SECRET=$(openssl rand -base64 32)
```

### Issue: "401 Unauthorized"

**Solution:** Ensure Authorization header matches:
```bash
Authorization: Bearer your-exact-cron-secret
```

### Issue: "Rate limit exceeded"

**Solution:** The archival includes 100ms delays between contacts. If still hitting limits:
- Increase delay in `intercom-events.ts` (line with `setTimeout`)
- Split into multiple cron jobs by contact segment

### Issue: "Events not appearing"

**Possible causes:**
1. Intercom only returns events < 90 days old
2. User has no events (check in Intercom dashboard)
3. API token lacks events permission

**Debug:**
```bash
# Test single contact
curl "https://api.intercom.io/events?type=user&email=test@example.com" \
  -H "Authorization: Bearer ${INTERCOM_ACCESS_TOKEN}" \
  -H "Intercom-Version: 2.13"
```

## Next Steps

After setup:

1. ✅ Run first manual archive to test
2. ✅ Verify archive files created in `data/event-archives/`
3. ✅ Check logs for errors
4. ✅ Wait 24 hours and verify cron ran automatically
5. ✅ Set up monitoring/alerts
6. 🚀 Build onboarding analytics on top of archived data

## Related Files

- **Server Action:** `src/actions/archive-events.ts`
- **Event Service:** `src/services/intercom-events.ts`
- **Types:** `types/intercom.d.ts`
- **Admin Dashboard:** `src/app/(admin)/admin/user-activity/page.tsx`
- **Cron Endpoint:** `src/app/api/cron/archive-events/route.ts`

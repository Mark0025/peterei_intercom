# Manual Banner Scheduling in Intercom (bannerv1)

## Purpose

This guide explains how to manually create and schedule a recurring banner in Intercom to announce Pete Training every Wednesday at 11am. It also outlines how this process could be automated in the future using your application.

---

## Step 1: Create a Banner in Intercom

1. **Log in to Intercom** and go to the **Outbound** section from the main menu.
2. Click **+ New message** in the top right corner.
3. Select **Banner** as your content type.
4. (Optional) Choose a pre-made template or start from scratch.

---

## Step 2: Compose Your Banner

1. **Title:**
   - Example: `Pete Training: Join Us Every Wednesday!`
2. **Content:**
   - Example: `🚀 Pete Training is live every Wednesday at 11am! Click below to join the session or watch previous recordings.`
   - Use formatting (bold, italics, links, emoji) as needed.
3. **Personalization:**
   - Optionally, use customer or company attributes for a more personalized message.

---

## Step 3: Configure Banner Options

1. **Choose Sender:**
   - Select who the banner should come from and whether to include their avatar.
2. **Dismiss Button:**
   - Decide if the banner should be dismissible. For recurring reminders, a dismissible banner is recommended.
3. **Action:**
   - Add a CTA (Call to Action) if needed:
     - Open a URL (e.g., link to training session or calendar invite)
     - Collect reactions or emails
     - Launch a Product Tour
4. **Style:**
   - Choose banner color, position (top or bottom), and style (inline or floating).

---

## Step 4: Schedule the Banner

1. **Audience:**
   - Define who should see the banner (e.g., all users, specific segments).
2. **Schedule:**
   - Set the banner to go live every Wednesday at 11am.
   - If Intercom does not support recurring schedules natively, you will need to manually duplicate and reschedule the banner each week.
3. **Priority:**
   - If multiple banners are active, set the priority so Pete Training is shown as needed.

---

## Step 5: Preview and Launch

1. **Preview:**
   - Use the Preview option to see how the banner will look.
2. **Save and Set Live:**
   - Click **Save and Close**, then set the banner live according to your schedule.

---

## Tips

- For recurring events, set a calendar reminder to duplicate and reschedule the banner each week if Intercom does not support automatic recurrence.
- Use clear, actionable language and keep the message concise.
- Track engagement using Intercom's analytics.

---

# Future Automation: Integrating Banner Scheduling in the App

To automate banner scheduling and ensure Pete Training is always announced at the right time:

1. **Store Banner Content:**
   - Add a `banner.json` or similar config file in your app to hold the banner message, CTA, and schedule.
2. **Automate Scheduling:**
   - Use a scheduler (e.g., cron job or node-schedule) in your Node.js app to trigger banner creation or updates every Wednesday at 11am.
3. **Intercom API Integration:**
   - Use the Intercom API to programmatically create or update banners. (Note: As of now, Intercom's API may not support full banner automation; check their docs for updates.)
4. **Fallback:**
   - If API automation is not possible, continue with manual scheduling and document the process for team members.

---

**Reference:**

- [Intercom Banner Documentation](https://www.intercom.com/help/en/articles/5376247-how-to-create-a-banner-message)
- [Canvas Kit Reference](https://developers.intercom.com/canvas-kit-reference/reference/components)

---

_This guide ensures Pete Training is always promoted to your users, and provides a path to future automation as your app evolves._

# Pete User Training: Recurring Scheduled Message Setup (bannerv2)

## Purpose

This guide explains how to set up a recurring scheduled message in Intercom to remind users about Pete User Training every Wednesday at 11am, with a direct link to the Zoom registration page. Since banners cannot be scheduled, this method uses Chats, Posts, or Emails, and leverages Intercom's Series and scheduling features.

---

## Step 1: Choose Message Type

- **Recommended:** Use a Post or Email for maximum visibility and scheduling flexibility.
- **Alternative:** Use a Chat if you want a conversational approach.

---

## Step 2: Create the Message

1. **Go to Outbound** in Intercom.
2. Click **+ New message** and select **Post** or **Email**.
3. **Compose your message:**
   - **Title:** `Pete User Training: Join Us Every Wednesday!`
   - **Content Example:**
     > 🚀 Pete User Training is live every Wednesday at 11am! [Click here to register for the next session.](https://us02web.zoom.us/meeting/register/tZUvc-6grTkqHNczbYRBTElos5hqCeKFA931#/registration)
   - Use formatting, links, and emoji for engagement.
   - Optionally, add a button with the Zoom link as a CTA.

---

## Step 3: Set Up Recurring Schedule

1. **Audience:**
   - Define who should receive the message (e.g., all users, specific segments, or new users).
2. **Scheduling:**
   - In the **Frequency and Scheduling** section, choose **Send based on a fixed schedule if the person matches the rules**.
   - Set the frequency to **Weekly** and select **Wednesday** at **11am**.
   - Ensure the time zone is set to your users' or workspace's time zone for accuracy.

---

## Step 4: Use Series for Advanced Scheduling (Optional)

- Go to **Series** in Intercom.
- Create a new Series and add your message as a step.
- Set the entry rules to allow users to enter every week.
- Schedule the message to send every Wednesday at 11am.
- This allows for more complex flows, such as reminders, follow-ups, or multi-step onboarding.

---

## Step 5: Preview and Launch

1. **Preview:**
   - Use the Preview option to see how the message will look.
2. **Save and Set Live:**
   - Activate the message or Series to start sending on schedule.

---

## Best Practices

- **Clear CTA:** Always include a direct link to the Zoom registration: [Register for Pete User Training](https://us02web.zoom.us/meeting/register/tZUvc-6grTkqHNczbYRBTElos5hqCeKFA931#/registration)
- **Audience:** Target only relevant users to avoid message fatigue.
- **Time Zones:** Messages are sent in the user's time zone if known; otherwise, your workspace's time zone is used.
- **Analytics:** Track engagement and adjust content or timing as needed.

---

## References

- [Intercom: Send messages on a recurring schedule](https://www.intercom.com/help/en/articles/5376247-send-messages-on-a-recurring-schedule)
- [Intercom Series Documentation](https://www.intercom.com/help/en/articles/357-series-explained)

---

_This guide ensures Pete User Training reminders are sent reliably and automatically, maximizing attendance and engagement each week._

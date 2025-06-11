# Pete Intercom App Architecture

## Overview

This document explains the architecture and main features of the Pete Intercom onboarding app, including a mermaid diagram for easy visualization.

---

## Features

- Step-by-step onboarding flow (one question at a time)
- Full-form onboarding (all questions on one page)
- Intercom Canvas Kit UI (Messenger/Inbox)
- Company attribute sync to Intercom
- Email fallback for all responses
- Local development with ngrok

---

## Mermaid Diagram

```mermaid
flowchart TD
    A[User in Intercom Messenger/Inbox] -->|Initialize| B(Express Server /initialize)
    B -->|Step-by-step or Full Form| C{Onboarding UI}
    C -->|Step-by-step| D[One Question per Page]
    C -->|Full Form| E[All Questions on One Page]
    D & E -->|Submit| F[/submit Endpoint]
    F -->|Update| G[Intercom Company Attributes]
    F -->|Send Email| H[Email to mark@peterei.com, jon@peterei.com]
    F -->|Respond| I[Canvas Kit Confirmation]
    B & F -->|ngrok Tunnel| J[Local Dev / Webhook]
```

---

## Summary

- The app can onboard users in two ways: step-by-step or all-at-once (full form).
- All answers are saved to Intercom as company custom attributes.
- As a fallback, all responses are also emailed to mark@peterei.com and jon@peterei.com.
- The app is developed and tested locally using ngrok for secure webhooks.
- The UI is fully compliant with Intercom Canvas Kit standards.

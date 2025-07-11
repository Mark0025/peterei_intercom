# Health Checks, Automated Testing, and CI Plan (In Progress)

## Overview

This plan covers the addition of health/status endpoints, automated endpoint tests, CI integration, and migration from .html static endpoints to clean routes for the Pete Intercom App. The goal is to ensure all major features are monitored, testable, and their status is visible to developers and users.

## Completed Steps

- Added `/health`, `/api/intercom/cache/status`, and `/api/intercom/contacts/test` endpoints.
- Implemented `/api/endpoints` for machine-readable route listing.
- Built a modern `/health.html` dashboard that checks all endpoints and shows their status, type, and methods.
- Wrote an automated shell script (`src/scripts/endpoint_health_check.sh`) to check endpoint health for CI/local use.
- Created and enforced Cursor rules for endpoint health and dashboard best practices.

## In Progress / Next Steps

1. **CI Integration**
   - Add a GitHub Actions workflow to run the endpoint health script on every commit/PR.
   - Optionally update a badge or summary in docs.
2. **Migrate .html Endpoints to Clean Routes**
   - For every static `.html` endpoint (e.g., `/logs.html`), create a clean route (e.g., `/logs`) that serves the same content.
   - Update the dashboard and docs to reflect the new routes.
   - Remove `.html` as a primary route once migration is complete.

## Status

- In Progress

## References

- `.cursor/rules/endpoint-health-best-practices.mdc` (endpoint health/dashboard rule)
- `.cursor/rules/cursor-agent-protocol.mdc` (AI code change protocol)
- `.cursor/rules/github-best-practices.mdc` (GitHub/CI best practices)
- `plan.intercom-api-integration.completed.001.md` (completed API plan)

---

_Status: In Progress_

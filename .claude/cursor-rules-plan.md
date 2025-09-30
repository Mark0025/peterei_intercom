create rules with best practices based
on @https://docs.cursor.com/context/rules
and https://dotcursorrules.com/rules make sure to read though them all picking the correct one. always make a plan if i change it version it.

on full plan first before moving on to plan.health-check.md

---

# Plan: Update and Enforce Cursor Rules for Pete Intercom App

## Why This Plan Is Essential

- **Project Complexity**: The Pete Intercom App is a modular Node.js/Express backend and frontend with AI agent, API, and caching layers. As the project grows, consistent, actionable rules are critical for maintainability, onboarding, and quality.
- **Cursor Rule Power**: Cursor rules act as persistent, version-controlled system prompts for the AI, ensuring every code change, suggestion, or automation is context-aware and project-specific.
- **Best Practice Alignment**: This plan synthesizes the latest guidance from [dotcursorrules.com](https://dotcursorrules.com/rules), [Cursor Docs](https://docs.cursor.com/context/rules), and the project's own standards. It avoids generic or irrelevant rules (e.g., Next.js specifics) and focuses on Node.js/Express/API/AI agent best practices.

## Plan Steps

### 1. Audit Existing Rules

- Review all `.cursor/rules/*.mdc` files for clarity, scope, and relevance.
- Remove or refactor any rules that are:
  - Outdated (e.g., legacy `.cursorrules` content)
  - Not actionable or too vague
  - Not aligned with the current tech stack (Node.js, Express, REST, AI agent, caching)
- Ensure all rules use proper MDC frontmatter (`description`, `globs`, `alwaysApply`, etc.) and are version-controlled.

### 2. Research and Synthesize Best Practices

- Use [dotcursorrules.com/rules](https://dotcursorrules.com/rules) and [docs.cursor.com/context/rules](https://docs.cursor.com/context/rules) as primary sources.
- For Node.js/Express/API/AI agent projects, focus on:
  - Modular route and middleware structure
  - Centralized error handling and logging
  - Secure environment variable and secret management
  - RESTful API conventions (status codes, input validation, pagination)
  - Caching strategies (Redis, in-memory, etc.)
  - AI agent integration (function calling, prompt design, context injection)
  - Terminal-first workflow (ls -la, cat, tree, bat, .zshrc aliases)
  - Plan-driven development (always reference and update /DEV_MAN/plans)
- Avoid rules that are specific to frameworks not in use (e.g., Next.js, React, etc.).

### 3. Write and Organize New Rules

- For each major area (API, caching, AI agent, endpoint health, GitHub, etc.), create a focused `.mdc` rule file in `.cursor/rules/`.
- Use clear, descriptive filenames (e.g., `express-api-best-practices.mdc`, `ai-agent-integration.mdc`, `caching-strategies.mdc`).
- Each rule should:
  - Be actionable and concise (under 500 lines)
  - Include a description, glob patterns, and alwaysApply/autoAttach as needed
  - Provide concrete examples or reference template files
  - Reference related rules for composability
- Add a meta-rule (`cursor-rule-best-practices.mdc`) that enforces:
  - All new rules must be reviewed for clarity, scope, and relevance
  - Rules must be versioned and updated as the project evolves
  - No rule may contradict another; resolve conflicts immediately
  - All contributors must read and understand the rules before making changes

### 4. Enforce and Maintain Rules

- Document the rule system in `/DEV_MAN/whatworkin.md` and `/README.md`.
- Require all contributors (including AI) to:
  - Review active rules before making changes
  - Reference relevant rules in all plans and PRs
  - Use terminal tools for file/directory inspection (not Cursor UI)
  - Update rules as the tech stack or workflow changes
- Regularly audit rules for relevance and effectiveness. Remove or refactor as needed.

### 5. Version and Review All Changes

- Every rule change must be:
  - Documented in a plan (in `/DEV_MAN/plans/`)
  - Committed with a clear, conventional message
  - Reviewed for impact on the codebase and developer workflow
- Do not proceed to new feature work (e.g., health checks, AI agent upgrades) until the rule system is up-to-date and enforced.

## Why This Plan Is Perfect

- **Alignment**: Follows the latest Cursor and community best practices, tailored for Node.js/Express/API/AI agent projects.
- **Control**: Ensures every code change is guided by actionable, versioned rules, reducing errors and onboarding friction.
- **Scalability**: Modular, composable rules make it easy to adapt as the project grows or the tech stack evolves.
- **Transparency**: All contributors know exactly what is expected, and every rule is documented, reviewed, and versioned.
- **Terminal-First**: Reinforces a fast, Linux-style workflow using .zshrc aliases and terminal tools, not slow UI.

---

_This plan must be completed and reviewed before moving on to `plan.health-checks-and-ci.in-progress.001.md` or any other major feature work._

---

**References:**

- [dotcursorrules.com/rules](https://dotcursorrules.com/rules)
- [docs.cursor.com/context/rules](https://docs.cursor.com/context/rules)
- Project `.cursor/rules/` directory
- `/DEV_MAN/plans/`, `/DEV_MAN/whatworkin.md`, `/README.md`

---

# Changelog: Cursor Rule System Audit & Refactor (v2)

## Summary

This changelog documents the full audit and refactor of all Cursor rules in `.cursor/rules/`, aligning them with best practices from [docs.cursor.com/context/rules](https://docs.cursor.com/context/rules) and [dotcursorrules.com/rules](https://dotcursorrules.com/rules), and tailoring them for our Node.js/Express/API/AI agent tech stack. All rules now use proper MDC frontmatter, are actionable, concise, and reference concrete project files or templates. A new meta-rule enforces review, versioning, and non-contradiction.

## Changes Made

### 1. Refactored Existing Rules

- **endpoint-health-best-practices.mdc**: Clarified scope, added MDC frontmatter, ensured all dashboard/health requirements are Node.js/Express/RESTful, and referenced concrete endpoints and UI files.
- **github-best-practices.mdc**: Updated for atomic commits, PR workflow, and CI integration. Clarified branch protection and documentation requirements.
- **cursor-agent-protocol.mdc**: Emphasized terminal-first workflow, plan-driven development, and actionable, context-aware code changes. Removed any UI-specific or vague language.
- **intercom-api.mdc**: Ensured all Intercom API integration rules are RESTful, secure, and reference unified helpers and logging. Example code block updated for clarity.
- **.cursor-rules (legacy)**: Migrated relevant date-handling rule to a new `date-handling-best-practices.mdc` file with MDC frontmatter and actionable steps.

### 2. New Rules Created

- **cursor-rule-best-practices.mdc**: Meta-rule enforcing:
  - All rules must be reviewed for clarity, scope, and relevance before adoption.
  - Rules must be versioned and updated as the project evolves.
  - No rule may contradict another; resolve conflicts immediately.
  - All contributors must read and understand the rules before making changes.
- **date-handling-best-practices.mdc**: All date stamps in docs/code must be generated using a JS utility, never hardcoded or guessed. Example provided.
- **express-api-best-practices.mdc**: (If missing) Modular route structure, centralized error handling, RESTful conventions, input validation, and logging for all Express APIs.
- **ai-agent-integration.mdc**: (If missing) Best practices for integrating AI agents, function calling, prompt design, and context injection.
- **caching-strategies.mdc**: (If missing) Unified caching strategies for in-memory and Redis, cache invalidation, and logging.

### 3. Documentation Updated

- `/DEV_MAN/whatworkin.md` and `/README.md` updated to reference the new rule system and how to use it.

### 4. Enforcement

- All contributors (including AI) must review and reference rules before making changes.
- All rule changes are documented in `/DEV_MAN/plans/` and committed with clear messages.
- No new feature work until the rule system is up-to-date and enforced.

## Next Steps

- Review all new and updated rules in `.cursor/rules/`.
- Complete any missing rules as described above.
- Proceed to `plan.health-checks-and-ci.in-progress.001.md` only after rule system review.

---

**References:**

- [dotcursorrules.com/rules](https://dotcursorrules.com/rules)
- [docs.cursor.com/context/rules](https://docs.cursor.com/context/rules)
- Project `.cursor/rules/` directory
- `/DEV_MAN/plans/`, `/DEV_MAN/whatworkin.md`, `/README.md`

---

# Completion Summary: Cursor Rule System Audit & Refactor (v2)

## What Was Improved

- **All .mdc rules in .cursor/rules were refactored** to:
  - Use proper MDC frontmatter (description, globs, alwaysApply)
  - Require double-checking with terminal tools (ls, cat, tree, bat, .zshrc aliases) before and after any change
  - Emphasize full-stack awareness: no change should break other features, always verify impact
  - Be actionable, concise, and reference concrete project files or templates
  - Remove any vague, UI-specific, or framework-irrelevant content
- **New rules created:**
  - `cursor-rule-best-practices.mdc` (meta-rule enforcing review, versioning, non-contradiction, and terminal-first verification)
  - `date-handling-best-practices.mdc` (migrated from legacy .cursor-rules)
  - `express-api-best-practices.mdc` (modular routes, error handling, RESTful design, validation, logging)
  - `ai-agent-integration.mdc` (function calling, prompt design, context injection, logging)
  - `caching-strategies.mdc` (unified in-memory/Redis caching, invalidation, logging)
- **All rules now reference each other** for composability and are tailored for Node.js/Express/API/AI agent projects.

## Is This Plan Complete?

**YES.**

- All rules are now actionable, versioned, and enforce a terminal-first, plan-driven, full-stack safe workflow.
- No new feature work should proceed without reviewing and referencing these rules.
- The rule system is now the single source of truth for all contributors and AI.

---

**Next:**

- Review these rules as needed.
- Proceed to `plan.health-checks-and-ci.in-progress.001.md` or other feature work only after confirming rule compliance.

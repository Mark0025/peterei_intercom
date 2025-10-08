# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Git Safety Rules

**NEVER use `git checkout -- <file>` or `git restore <file>` to discard uncommitted changes without explicit user confirmation.**

Uncommitted work represents real human effort. Before discarding any changes:
1. Show the user what will be lost with `git diff`
2. Ask explicitly: "Do you want to stash, commit, or discard these changes?"
3. Prefer `git stash` for safety - it can be recovered

See `DEV_MAN/git-safety-rules.md` for full details and recovery procedures.

## Development Commands

### Start the Application
```bash
# Local development with auto-reload (uses Turbopack for faster builds)
cd pete-intercom-nextjs && pnpm dev

# Production build and start
cd pete-intercom-nextjs && pnpm build && pnpm start

# Linting
cd pete-intercom-nextjs && pnpm lint
```

**IMPORTANT:** This project **MUST use pnpm**, not npm or yarn. Always use `pnpm` for all package management commands. Turbopack is enabled for faster builds in development and production.

### Testing & Health Checks
```bash
# Health check scripts (bash, still functional)
cd pete-intercom-nextjs/src/scripts && ./endpoint_health_check.sh

# Test specific Intercom API endpoints
cd pete-intercom-nextjs/src/scripts && ./get_me.sh
cd pete-intercom-nextjs/src/scripts && ./get_admins.sh
```

### Package Management
- Application dependencies: `pete-intercom-nextjs/package.json`
- **CRITICAL: ALWAYS use `pnpm` for package management, NEVER use npm or yarn**
- Add dependencies: `pnpm add <package>`
- Remove dependencies: `pnpm remove <package>`
- Install all: `pnpm install`
- Path aliases configured in `tsconfig.json`: `@/*` maps to `src/*`, `@/types` to `types/`

## Architecture Overview

This is an **Intercom Canvas Kit application** that provides structured onboarding and user training management within Intercom Messenger. The app follows a strict Canvas Kit component model and integrates deeply with Intercom's REST API.

### Core Components
- **Next.js 15 Backend** (`pete-intercom-nextjs/src/app/api/`) - App Router API routes with Canvas Kit endpoints
- **Canvas Kit Server Actions** (`pete-intercom-nextjs/src/actions/canvas-kit.ts`) - React Server Actions for Canvas Kit logic
- **Intercom API Integration** (`pete-intercom-nextjs/src/lib/intercom-api.ts`) - REST API wrapper with caching
- **Onboarding System** (`pete-intercom-nextjs/src/services/onboarding-data.ts`) - Questionnaire service
- **Admin Dashboard** (`pete-intercom-nextjs/src/app/admin/`) - Protected admin routes with analytics
- **LangGraph AI Agent** (`pete-intercom-nextjs/src/lib/langgraph-agent.ts`) - AI-powered conversation analysis

### Request Flow
1. **Canvas Kit Initialize**: `POST /api/initialize` → Server Action returns onboarding card
2. **Canvas Kit Submit**: `POST /api/submit` → Server Action processes user actions by `component_id`
3. **Intercom API Updates**: Server Actions update user/company attributes via REST API
4. **Response**: Canvas Kit JSON response with success/error feedback

### Key Endpoints
- `POST /api/initialize` - Canvas Kit initialization endpoint (Next.js API route)
- `POST /api/submit` - Canvas Kit form submission handler (Next.js API route)
- `POST /api/intercom-webhook` - Webhook handler for Intercom events
- `GET /popout` - Full onboarding form in browser window (Next.js page)
- `POST /api/popout-submit` - Processes full form submissions
- `GET /api/intercom/*` - Intercom API proxy endpoints
- `POST /api/PeteAI` - AI helper using OpenRouter Llama 3.2 3B (LangGraph)

## Canvas Kit Rules (CRITICAL)

This project strictly follows Intercom Canvas Kit guidelines. **ALL UI changes must comply with these rules:**

### Component Restrictions
- **Only use documented Canvas Kit components** from [Canvas Kit Reference](https://developers.intercom.com/canvas-kit-reference/reference/components)
- **No custom JavaScript or external libraries** in Canvas Kit responses
- **No undocumented properties or component types**

### Request/Response Model
- All Canvas Kit endpoints accept POST requests and respond with valid JSON
- Response structure: `{ canvas: { content: { components: [...] } } }`
- Use `component_id` to identify user actions in submit handlers

### Security Requirements
- **Validate X-Body-Signature header** using INTERCOM_CLIENT_SECRET (HMAC-SHA256)
- **Never process requests without signature validation**
- Environment variables in `pete-intercom-nextjs/.env` for all secrets
- **Clerk Auth** protects admin routes - only @peterei.com users allowed

### UI/UX Guidelines
- Keep flows simple with clear text, minimal steps, actionable buttons
- Use `event: { type: "completed" }` when onboarding is finished
- Use `style: "error"` for error messages with actionable next steps
- Support both Messenger and Inbox contexts

## Environment Configuration

### Required Environment Variables (pete-intercom-nextjs/.env)
```bash
# Intercom API & Webhooks
INTERCOM_CLIENT_SECRET=your_intercom_client_secret
INTERCOM_ACCESS_TOKEN=your_intercom_access_token
INTERCOM_CLIENT_ID=your_intercom_client_id

# Email Configuration
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=4000
PUBLIC_URL=http://localhost:4000  # or production URL
NODE_ENV=development  # or production

# AI & Analytics
OPENROUTER_API_KEY=your_openrouter_key  # For PeteAI endpoint (LangGraph)

# Clerk Authentication (Admin Dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### Development vs Production
- **Local**: Uses ngrok for webhook exposure, set `NODE_ENV=development`
- **Production**: Uses provided `PUBLIC_URL`, set `NODE_ENV=production`

## Code Organization

### Directory Structure
```
pete-intercom-nextjs/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                # API routes (webhooks, Canvas Kit)
│   │   ├── admin/              # Protected admin dashboard
│   │   └── ...                 # Public pages
│   ├── actions/                # Server Actions (React 19)
│   │   ├── canvas-kit.ts       # Canvas Kit logic
│   │   ├── peteai.ts          # AI agent actions
│   │   └── ...
│   ├── components/             # React components
│   ├── lib/                    # Utilities and integrations
│   │   ├── intercom-api.ts    # Intercom REST API wrapper
│   │   ├── langgraph-agent.ts # LangGraph AI agent
│   │   └── ...
│   ├── services/               # Business logic
│   ├── middleware/             # Signature validation
│   ├── types/                  # TypeScript definitions
│   └── scripts/                # Bash utilities (legacy)
├── package.json                # App dependencies
└── DEV_MAN/                    # Documentation & planning
```

### Intercom API Scripts
Located in `pete-intercom-nextjs/src/scripts/`, these bash scripts provide direct API access:
- `update_user_training_topic.sh` - Update user custom attributes
- `get_contact_id_by_email.sh` - Lookup contact IDs
- `update_company_petetraining.sh` - Update company attributes
- `get_company_id_by_name.sh` - Lookup company IDs
- `get_all_pete_user_training_topics.sh` - Debug custom objects

**Note:** These bash scripts are functional but will be converted to TypeScript server actions (Issues #6, #7)

## AI Architecture

Pete uses a **multi-agent LangGraph system** with three specialized AI agents working together to provide intelligent assistance across different domains.

### Three Specialized Agents

1. **LangGraph Agent (General Purpose)** 📚
   - **File:** `pete-intercom-nextjs/src/services/langraph-agent.ts`
   - **Purpose:** User-facing help & data queries
   - **Features:** ✅ Conversation history, Help docs, Mermaid diagrams, Real-time Intercom data
   - **Tools:** 15+ (contacts, companies, help docs, process maps)
   - **Used in:** `/help`, `/peteai`, admin locations

2. **Conversation Agent (Pattern Analysis)** 📊
   - **File:** `pete-intercom-nextjs/src/services/conversation-agent.ts`
   - **Purpose:** Admin conversation analytics
   - **Features:** Pattern recognition, escalation analysis, success/failure patterns
   - **Tools:** 8 (analysis, patterns, escalations, flow diagrams)
   - **Used in:** `/admin/conversations/insights`

3. **Onboarding Agent (Strategic Discovery)** 🚀
   - **File:** `pete-intercom-nextjs/src/services/onboarding-agent.ts`
   - **Purpose:** Questionnaire analysis & strategy
   - **Features:** Pain points, breakthrough ideas, strategic recommendations
   - **Tools:** 7 (discovery, recommendations, effort estimation)
   - **Used in:** `/admin/onboarding-insights`

### Key Features (as of 2025-10-08)

**✅ Conversation History (NEW)**
- LangGraph Agent supports multi-turn conversations
- MemorySaver checkpointing with thread-based sessions
- Follow-up questions maintain context
- Session IDs: `help-{timestamp}-{random}`

**🚀 Session Management**
```typescript
// Frontend generates session ID
const [sessionId] = useState(() => `help-${Date.now()}-${random()}`);

// Sent to API
body: JSON.stringify({ message, sessionId })

// Agent uses for threading
await app.invoke(
  { messages: [...] },
  { configurable: { thread_id: sessionId } }
);
```

**🎯 Smart Error Handling**
- No silent fallbacks (removed cache fallback as of Issue #39)
- Generic user messages on frontend
- Detailed API/console logging for debugging
- Full-stack error handling

**🎨 Mermaid Diagrams**
- Process maps with clickable navigation (LangGraph Agent)
- Flow charts for resolution/escalation paths (Conversation Agent)
- Chart data for dashboards (Onboarding Agent)

### Integration Points

**API Route:** `POST /api/PeteAI`
- Routes to `sendMessageToPeteAIJson()` in `src/actions/peteai.ts`
- Uses LangGraph Agent (general purpose)
- Supports sessionId for conversation history

**Frontend Components:**
- `src/components/help/PeteAIChat.tsx` - Help center chat
- `src/components/PeteAIChat.tsx` - General purpose chat
- `src/app/peteai/page.tsx` - Standalone chat page
- `src/components/conversations/ConversationInsightsChat.tsx` - Admin analytics

### Configuration

**Required Environment Variable:**
```bash
OPENROUTER_API_KEY=your_openrouter_key  # For all AI agents
```

**Model Configuration:**
- Provider: OpenRouter (https://openrouter.ai)
- Model: `openai/gpt-4o-mini`
- Temperature: 0.7
- Max Tokens: 4000

### Documentation

**Comprehensive AI architecture docs:**
- **📁 Location:** `pete-intercom-nextjs/DEV_MAN/AI_Architecture/`
- **⭐ Start Here:** [00-AI-ARCHITECTURE-OVERVIEW.md](pete-intercom-nextjs/DEV_MAN/AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md)
- **📖 Quick Reference:** [README.md](pete-intercom-nextjs/DEV_MAN/AI_Architecture/README.md)

**Key Topics Covered:**
- Agent comparison matrix
- Core similarities & key differences
- Detailed agent profiles
- Architecture patterns
- Session management
- Integration points
- Best practices

**Recent Issues:**
- [#39 - Conversation History Implementation](https://github.com/Mark0025/peterei_intercom/issues/39)
- [#38 - Agent Fallback Debugging](https://github.com/Mark0025/peterei_intercom/issues/38)
- [#37 - Response Parsing Fix](https://github.com/Mark0025/peterei_intercom/issues/37)

## Development Workflow

### Before Making Changes
1. **Validate Intercom resources** with GET before any PUT/POST operations
2. **Test backend features** via frontend UI before adding to Canvas Kit
3. **Log all actions and API calls** for debugging and auditing
4. **Follow Canvas Kit component restrictions** for any UI changes

### Adding New Features
1. Implement and test via frontend UI first
2. Add comprehensive logging for debugging
3. Only then integrate into Canvas Kit UI
4. Document in README and DEV_MAN directory
5. Test in both Messenger and Inbox contexts

### Debugging
- Application logs: `pete-intercom-nextjs/logs/app.log`
- API logs: `pete-intercom-nextjs/logs/api.log`
- Canvas Kit responses are logged with `[Canvas Kit]` prefix
- Use health check scripts to verify API connectivity
- Render deployment logs available at https://dashboard.render.com

## Next.js Migration Status

The project is currently on the `Next-refactor` branch with Next.js 15, TypeScript, and strict type safety fully implemented.

### ✅ Completed Migration Work

#### TypeScript Strict Mode (2025-01)
- **Eliminated all `any` types** across 32 files (50+ instances)
- **Fixed exactOptionalPropertyTypes conflicts** with conditional rendering
- **All types extracted to `/types` directory** following DRY principles
- **Build compiles successfully** with zero type errors (warnings only)
- All JSX unescaped entity errors resolved
- Used proper TypeScript types: `unknown`, `Record<string, T>`, typed arrays

#### 7-Levels Deep Onboarding Discovery System (2025-01)
**Problem:** Need to understand WHY our onboarding works or fails at a root-cause level using EOS-style questioning.

**Solution Built:**

1. **Conversation Analysis Engine** (`src/actions/onboarding-analysis.ts`)
   - Analyzes ALL cached conversations for onboarding keywords
   - 8 topic categories: Data Upload, Marketing Handoff, Intake, Timeline, Technical, Training, Workflow, Success Metrics
   - Generates Mermaid diagrams of current onboarding process flow
   - Extracts insights with conversation excerpts
   - Timeline visualization of onboarding conversations

2. **Onboarding Insights Dashboard** (`/admin/onboarding-insights`)
   - Beautiful Pete-branded UI (purple-to-pink gradients)
   - Stats cards: total conversations, onboarding-related, topics identified
   - Auto-generated Mermaid diagram for visualization
   - Topic breakdown with filtering
   - Conversation insights list with badges
   - Top keywords analysis

3. **7-Levels Deep Questionnaire** (`/admin/onboarding-questionnaire`)
   - 56 questions across 8 sections (7 questions per section)
   - Each question digs deeper: What → Why → Why better → Why fails → Why unfixed → Why matters → Why perfection transforms
   - Progress tracking with visual indicators
   - Auto-save functionality (file-based storage)
   - Markdown export for documentation
   - Resolution categorization: Education, Coding, Expectations, Process, Data Validation
   - Pete-branded UI with gradients and clean design

4. **Questionnaire Server Actions** (`src/actions/questionnaire.ts`)
   - Session management with resume capability
   - File-based JSON storage in `data/questionnaire-responses/`
   - Markdown export with formatting
   - Multi-respondent support (Jon, Mark)

5. **Questionnaire Data Structure** (`src/data/onboarding-questionnaire.json`)
   - 8 sections with comprehensive coverage
   - Context and expectedAnswerType for each question
   - Metadata with resolution categories
   - EOS methodology applied throughout

**Access Points:**
- `/admin/onboarding-insights` - Analyze existing conversations
- `/admin/onboarding-questionnaire` - Complete 7-levels deep discovery

**Next Steps:**
- Jon and Mark to complete questionnaires
- Analyze responses to identify root causes
- Build AI assistance layer (PeteAI integration)
- Create action items from insights

See `DEV_MAN/Onboarding-7DEEP/` for full documentation and planning.

### Migration Strategy (Server Actions First)
1. **Bootstrap Next.js 15 + TypeScript** ✅ COMPLETE
2. **Extract all types to centralized `/types` directory** ✅ COMPLETE
3. **Convert POST endpoints to server actions** ✅ COMPLETE
4. **Migrate Canvas Kit logic to React Server Components** ✅ COMPLETE
5. **Build questionnaire flow with server actions** ✅ COMPLETE
6. **Add admin dashboard with server actions** ✅ COMPLETE
7. **Convert bash scripts to admin server actions** 🚧 IN PROGRESS
8. **Preserve webhook API routes** ✅ COMPLETE
9. **Delete old Express app entirely** ⏳ PENDING

### Express Routes → Next.js Migration Map

#### Server Actions (Preferred):
- `POST /submit` → `src/actions/canvas-kit.ts`
- `POST /initialize` → `src/actions/canvas-kit.ts`
- `POST /popout-submit` → `src/actions/onboarding.ts`
- `PUT /contacts/:id/training-topic` → `src/actions/intercom.ts`
- `POST /bulk-update-training-topic` → `src/actions/intercom.ts`
- Shell scripts → `app/(admin)/actions/*.ts` (replace bash with TypeScript)

#### API Routes (Webhooks & External):
- `POST /webhooks` → `app/api/webhooks/route.ts`
- `GET /api/intercom/*` → `app/api/intercom/[...slug]/route.ts`

#### App Router Pages:
- `GET /` → `app/page.tsx`
- `GET /popout` → `app/popout/page.tsx`
- `GET /admin/*` → `app/(admin)/*/page.tsx`
- `GET /docs/*` → `app/docs/[...slug]/page.tsx`

### Strict TypeScript Config
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Core Type Definitions (to extract):
- `IntercomContact`, `IntercomCompany`, `IntercomAdmin`, `IntercomConversation`
- `CanvasComponent`, `CanvasResponse`
- `OnboardingSection`, `Question`, `OnboardingData`

See `DEV_MAN/nextjs-migration-plan.md` for complete details.

## Security & Best Practices

### API Security
- All Intercom API calls use HMAC-SHA256 signature validation
- Secrets stored in environment variables, never in code
- User/company data validation before API operations

### Error Handling
- All Canvas Kit errors returned as components with `style: "error"`
- Backend errors logged but not exposed to users
- Graceful fallbacks for API failures

### Testing
- Manual testing via Canvas Kit UI required for all features
- Health check endpoints for API connectivity
- Isolated testing utilities in `src/utils/test_*.js`

## Common Issues

### Canvas Kit Response Failures
- Ensure response follows exact Canvas Kit JSON schema
- Validate all component properties against documentation
- Check for typos in `component_id` values

### Intercom API Errors
- Verify access token permissions and scope
- Use GET requests to validate resources before updates
- Check rate limiting and retry failed requests

### Local Development
- Use ngrok for webhook testing with Intercom
- Environment variables must be in `pete-intercom-nextjs/.env`
- Run health check scripts to verify API connectivity: `./src/scripts/endpoint_health_check.sh`
- Admin dashboard accessible at `http://localhost:4000/admin` (requires @peterei.com Clerk auth)

### Build Configuration Notes
- Next.js config (`next.config.ts`) currently has `ignoreBuildErrors: true` for TypeScript
- ESLint is set to `ignoreDuringBuilds: true`
- This allows builds to succeed while type issues are being resolved incrementally
- Always check console warnings during development
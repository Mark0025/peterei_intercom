# Pete Intercom App - Next.js 15

This is the main **Pete Intercom application**, built with Next.js 15, TypeScript, and React 19. Pete is an Intercom Canvas Kit application that provides intelligent onboarding, training management, and AI-powered help assistance.

## Quick Start

**Prerequisites:**
- Node.js 20+
- pnpm (required, not npm or yarn)

**Development:**
```bash
# Install dependencies
pnpm install

# Start development server (with Turbopack)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

The app runs on **http://localhost:4000** (not 3000).

## Architecture

### Three AI Agents (LangGraph)
- **LangGraph Agent** (`src/services/langraph-agent.ts`) - General purpose help with conversation history
- **Conversation Agent** (`src/services/conversation-agent.ts`) - Pattern analysis for support conversations
- **Onboarding Agent** (`src/services/onboarding-agent.ts`) - Strategic questionnaire insights

### Next.js 15 Features
- **App Router** - File-based routing with layouts
- **Server Actions** - React 19 server-side mutations
- **Turbopack** - Fast bundler for dev and production
- **TypeScript Strict Mode** - Full type safety with zero `any` types

### Key Directories

```
src/
├── app/                      # Next.js App Router
│   ├── (admin)/admin/       # Protected admin routes (19+ pages)
│   ├── api/                 # API routes (webhooks, Canvas Kit)
│   ├── help/                # Help center with AI chat
│   ├── peteai/             # Standalone AI chat
│   └── popout/             # Full onboarding form
├── actions/                 # Server Actions
│   ├── canvas-kit.ts       # Canvas Kit logic
│   ├── peteai.ts          # AI agent actions
│   ├── onboarding.ts      # Onboarding workflows
│   └── intercom.ts        # Intercom API actions
├── components/              # React components
│   ├── help/              # Help center components
│   ├── conversations/     # Conversation analysis
│   └── ui/                # shadcn/ui components
├── services/                # Business logic
│   ├── langraph-agent.ts  # Primary AI agent
│   ├── conversation-agent.ts
│   └── onboarding-agent.ts
├── lib/                     # Utilities & integrations
│   ├── intercom-api.ts    # Intercom REST API wrapper
│   └── utils.ts           # Helper functions
├── types/                   # TypeScript type definitions
└── middleware/              # Request middleware
```

## Key Features

### Persistent Conversation History (NEW - Oct 2025)
- localStorage-based session persistence
- Unique guest user tracking (`guest-{timestamp}-{random}`)
- Admin logging system with full CRUD
- History sidebar with session resume
- Backend file-based logging in `data/conversation-logs/`

### Admin Dashboard
All routes protected by Clerk authentication (@peterei.com only):

- `/admin` - Dashboard home
- `/admin/settings/ai` - AI conversation management (NEW)
- `/admin/logs` - Conversation logs viewer (NEW)
- `/admin/conversations` - Intercom conversation browser
- `/admin/onboarding-insights` - Onboarding analysis
- `/admin/onboarding-questionnaire` - 7-levels deep discovery
- `/admin/contacts` - Contact management
- `/admin/companies` - Company management
- `/admin/training` - Training topic management
- `/admin/docs/[[...slug]]` - Internal documentation browser

### Canvas Kit Integration
- Strict Intercom Canvas Kit compliance
- Components-only UI (no custom JavaScript)
- HMAC-SHA256 webhook signature validation
- Support for Messenger & Inbox contexts

### Intercom API Integration
- Full REST API wrapper with caching
- Contact/company search and management
- Conversation history and timeline
- Custom objects and attributes
- Rate limiting and retry logic

## Environment Variables

Required in `.env` file:

```bash
# Intercom
INTERCOM_CLIENT_SECRET=your_intercom_client_secret
INTERCOM_ACCESS_TOKEN=your_intercom_access_token
INTERCOM_CLIENT_ID=your_intercom_client_id

# AI (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Server
PORT=4000
PUBLIC_URL=http://localhost:4000  # or production URL
NODE_ENV=development  # or production

# Email (optional)
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

## Development Commands

```bash
# Start development server
pnpm dev

# Type checking
tsc --noEmit

# Build for production
pnpm build

# Run production build locally
pnpm start

# Lint and fix
pnpm lint --fix

# Health check scripts
cd src/scripts && ./endpoint_health_check.sh
```

## TypeScript Configuration

This project uses **strict TypeScript** with:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- Zero `any` types (all converted to proper types)
- All types extracted to `/types` directory

## Testing

### Health Checks
```bash
# Test all endpoints
cd src/scripts && ./endpoint_health_check.sh

# Test specific endpoints
./src/scripts/get_me.sh
./src/scripts/get_admins.sh
```

### Manual Testing
- Canvas Kit UI: Test in Intercom Messenger/Inbox
- Admin dashboard: http://localhost:4000/admin (requires @peterei.com auth)
- AI chat: http://localhost:4000/peteai
- Help center: http://localhost:4000/help

## Deployment

**Production:** Deployed on Render
- URL: https://pete-intercom.onrender.com
- Auto-deploy from `main` branch
- Environment variables configured in Render dashboard
- Logs: https://dashboard.render.com

## Documentation

**Main Documentation:**
- **[CLAUDE.md](../CLAUDE.md)** - Comprehensive project documentation
- **[DEV_MAN/AI_Architecture/](DEV_MAN/AI_Architecture/)** - AI agents detailed docs
- **[DEV_MAN/](DEV_MAN/)** - All technical documentation

**Key Docs:**
- AI Architecture: `DEV_MAN/AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md`
- Next.js Migration: `DEV_MAN/completed/migration/nextjs-migration-plan.md`
- Canvas Kit Rules: See CLAUDE.md section
- Git Safety: `DEV_MAN/completed/migration/git-safety-rules.md`

## Common Issues

### Build Errors
- Ensure you're using `pnpm`, not npm or yarn
- Check all environment variables are set
- Run `pnpm install` to update dependencies

### TypeScript Errors
- Current config has `ignoreBuildErrors: true` to allow incremental fixes
- Check console warnings during development
- All new code should be strictly typed

### Admin Auth Issues
- Admin routes require @peterei.com Clerk account
- Check Clerk environment variables
- Verify Clerk dashboard configuration

### Canvas Kit Response Failures
- Ensure response follows exact Canvas Kit JSON schema
- Validate all component properties against [Canvas Kit docs](https://developers.intercom.com/canvas-kit-reference/reference/components)
- Check for typos in `component_id` values

## Migration Status

✅ **COMPLETE** - Migrated from Express to Next.js 15
- All POST endpoints → Server Actions
- All Canvas Kit logic → React Server Components
- All bash scripts → TypeScript server actions (in progress)
- Old Express app deleted (as of Jan 2025)

See `DEV_MAN/completed/migration/` for full migration history.

## Contributing

1. Read CLAUDE.md for project conventions
2. Follow TypeScript strict mode rules
3. Use Server Actions for data mutations
4. Test Canvas Kit changes in Intercom Messenger
5. Update documentation for new features

## License

Private - PeteIRE Internal Use Only

## Support

- Email: mark@peterei.com
- GitHub Issues: https://github.com/Mark0025/peterei_intercom/issues

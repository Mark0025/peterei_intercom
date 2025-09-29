# Pete Intercom App - Data Architecture

## Overview

This Next.js application follows **best practices** for data fetching, caching, and state management using:
- ✅ **Single source of truth** for Intercom data
- ✅ **Server Actions** for data operations (Next.js 15 pattern)
- ✅ **API Routes** only for external integrations and webhooks
- ✅ **In-memory caching** with manual refresh capability
- ✅ **DRY principles** - no duplicate fetch logic

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Intercom API                            │
│                  https://api.intercom.io                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Fetch on init + manual refresh
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            SINGLE SOURCE: /src/services/intercom.ts             │
│                                                                  │
│  • In-memory cache (contacts, companies, admins, conversations) │
│  • refreshIntercomCache() - Fetches all data via pagination     │
│  • getIntercomCache() - Returns cached data                     │
│  • getCacheStatus() - Returns cache metadata                    │
│  • Auto-initializes on module load                              │
└────────────────┬───────────────────────┬────────────────────────┘
                 │                       │
    ┌────────────┴──────────┐   ┌────────┴──────────┐
    │                       │   │                    │
    ▼                       ▼   ▼                    ▼
┌─────────────┐      ┌────────────────┐      ┌─────────────┐
│   Server    │      │   API Routes   │      │   Client    │
│   Actions   │      │  (cache mgmt)  │      │ Components  │
│             │      │                │      │             │
│ /actions/*  │      │ /api/intercom/ │      │ RefreshBtn  │
│             │      │   - cache      │      │             │
│ Read-only   │      │   - proxy      │      │ Calls API   │
│ access to   │      │                │      │ then        │
│ cache via   │      │ POST refresh   │      │ router      │
│ service     │      │ GET  status    │      │ .refresh()  │
└─────────────┘      └────────────────┘      └─────────────┘
       │                     │                       │
       │                     │                       │
       └─────────┬───────────┴───────────────────────┘
                 │
                 ▼
          ┌────────────┐
          │   Pages    │
          │            │
          │ Use Server │
          │ Components │
          │ + Actions  │
          └────────────┘
```

## Components Breakdown

### 1. Core Service Layer (`/src/services/intercom.ts`)

**Purpose**: Single source of truth for all Intercom data

**Key Functions**:
```typescript
// Fetches ALL data from Intercom API with pagination
refreshIntercomCache(): Promise<void>

// Returns in-memory cached data
getIntercomCache(): IntercomCache

// Returns cache status and counts
getCacheStatus(): CacheStatus

// Generic proxy for any Intercom API call
proxyIntercomGet(path: string, params?): Promise<any>

// Search functions that work on cache or live
searchContacts(email?, name?, live?): Promise<IntercomContact[]>
searchCompanies(name?, live?): Promise<IntercomCompany[]>

// Update operations (PUT requests)
updateUserTrainingTopic(userId, topic): Promise<IntercomContact>
```

**Cache Structure**:
```typescript
const cache: IntercomCache = {
  contacts: IntercomContact[],      // All Intercom contacts
  companies: IntercomCompany[],     // All companies
  admins: IntercomAdmin[],          // All admins
  conversations: IntercomConversation[], // All conversations
  lastRefreshed: Date | null        // Last refresh timestamp
};
```

**Initialization**:
- Cache is automatically populated on module load
- Uses `Promise.all()` to fetch all resources in parallel
- Includes pagination handling for large datasets

### 2. Server Actions (`/src/actions/*.ts`)

**Purpose**: Data operations for server components (Next.js 15 pattern)

**Files**:
- `/src/actions/conversations.ts` - Conversation data operations
- `/src/actions/training.ts` - Training topic operations
- `/src/actions/users.ts` - User management operations

**Example Pattern**:
```typescript
'use server';

import { getIntercomCache, refreshIntercomCache } from '@/services/intercom';

export async function getAllConversations(forceRefresh = false) {
  // Optionally refresh cache
  if (forceRefresh) {
    await refreshIntercomCache();
  }

  // Always read from cache
  const cache = getIntercomCache();
  return cache.conversations;
}
```

**Best Practices**:
- ✅ Mark with `'use server'` directive
- ✅ Return serializable data only
- ✅ Use existing cache service, don't duplicate fetch logic
- ✅ Accept optional `forceRefresh` parameter
- ✅ Handle errors gracefully with ActionResult type

### 3. API Routes (`/src/app/api/intercom/*.ts`)

**Purpose**: External integrations, webhooks, and cache management

**Routes**:
- `POST /api/intercom/cache` - Manually trigger cache refresh
- `GET /api/intercom/cache` - Get cache status
- `GET /api/intercom/proxy?path=...` - Proxy any Intercom API call
- `GET /api/intercom/contacts` - Contact search
- `GET /api/intercom/companies` - Company search

**Example Pattern**:
```typescript
import { NextResponse } from 'next/server';
import { refreshIntercomCache, getCacheStatus } from '@/services/intercom';

export async function POST() {
  await refreshIntercomCache();
  return NextResponse.json(getCacheStatus());
}
```

**Best Practices**:
- ✅ Use for external webhooks and client-side operations
- ✅ Delegate to service layer, don't duplicate logic
- ✅ Return proper HTTP status codes
- ✅ Log all operations for debugging

### 4. Client Components

**Purpose**: Interactive UI that triggers cache refresh

**Example**: `/src/components/conversations/RefreshCacheButton.tsx`
```typescript
'use client';

export default function RefreshCacheButton() {
  const router = useRouter();

  const handleRefresh = async () => {
    // Call API route to refresh cache
    await fetch('/api/intercom/cache', { method: 'POST' });

    // Revalidate page to show fresh data
    router.refresh();
  };

  return <Button onClick={handleRefresh}>Refresh</Button>;
}
```

**Best Practices**:
- ✅ Use `'use client'` directive
- ✅ Call API routes for mutations
- ✅ Use `router.refresh()` to revalidate server components
- ✅ Show loading states during operations

## Data Fetching Patterns

### Pattern 1: Server Component Reading Cache

```typescript
// app/admin/training/page.tsx
import { getAllUsers } from '@/actions/users';

export default async function TrainingPage() {
  // Reads from cache by default
  const users = await getAllUsers();

  return <UserTable users={users} />;
}
```

### Pattern 2: Force Refresh Cache

```typescript
// When user clicks "Refresh" button
const RefreshButton = () => {
  const handleClick = async () => {
    // Triggers full cache refresh via API
    await fetch('/api/intercom/cache', { method: 'POST' });

    // Revalidates page to show new data
    router.refresh();
  };

  return <button onClick={handleClick}>Refresh</button>;
};
```

### Pattern 3: Live Search (Bypass Cache)

```typescript
// actions/users.ts
export async function searchUsers(email: string, live = false) {
  const { searchContacts } = await import('@/services/intercom');

  // Pass `live: true` to bypass cache
  return await searchContacts(email, undefined, live);
}
```

## Why This Architecture?

### ✅ Single Source of Truth
- All Intercom data flows through `/src/services/intercom.ts`
- No duplicate fetch logic across the app
- Easy to debug - check one place for all API calls

### ✅ Performance
- In-memory cache reduces API calls (Intercom rate limits)
- Parallel fetching during cache refresh
- Pagination handled once, not per-component

### ✅ Next.js 15 Best Practices
- Server Actions for data operations (recommended pattern)
- API Routes only for external integrations
- Server Components by default (no client-side fetching)

### ✅ Developer Experience
- TypeScript interfaces for type safety
- Consistent error handling with ActionResult
- Clear separation of concerns
- Easy to add new features - just use cache service

### ✅ Maintainability
- DRY principle - change API logic in one place
- Centralized logging for debugging
- Clear data flow that's easy to understand

## Cache Refresh Strategy

### Automatic Refresh
- Cache is populated on server startup (module load)
- Works for both development and production

### Manual Refresh
- User clicks "Refresh Cache" button
- Calls `POST /api/intercom/cache`
- Updates in-memory cache
- Page revalidates to show new data

### Future: Scheduled Refresh
```typescript
// Optional: Add cron job for periodic refresh
// Schedule refresh every 5 minutes
setInterval(async () => {
  await refreshIntercomCache();
}, 5 * 60 * 1000);
```

## Adding New Features

### To add a new Intercom resource:

1. **Add to cache** (`/src/services/intercom.ts`):
```typescript
const cache: IntercomCache = {
  // ... existing
  teams: [],  // New resource
};
```

2. **Update refresh function**:
```typescript
export async function refreshIntercomCache() {
  const [contacts, companies, teams] = await Promise.all([
    getAllFromIntercom('/contacts'),
    getAllFromIntercom('/companies'),
    getAllFromIntercom('/teams'),  // New
  ]);

  cache.teams = teams;
}
```

3. **Create server action** (`/src/actions/teams.ts`):
```typescript
'use server';
import { getIntercomCache } from '@/services/intercom';

export async function getAllTeams() {
  const cache = getIntercomCache();
  return cache.teams;
}
```

4. **Use in page**:
```typescript
import { getAllTeams } from '@/actions/teams';

export default async function TeamsPage() {
  const teams = await getAllTeams();
  return <TeamsList teams={teams} />;
}
```

## File Structure

```
src/
├── services/
│   └── intercom.ts          # ⭐ SINGLE SOURCE OF TRUTH
│
├── actions/                 # Server Actions (Next.js 15)
│   ├── conversations.ts
│   ├── training.ts
│   └── users.ts
│
├── app/
│   ├── api/
│   │   └── intercom/        # API Routes (cache mgmt only)
│   │       ├── cache/
│   │       ├── proxy/
│   │       ├── contacts/
│   │       └── companies/
│   │
│   └── admin/               # Pages (Server Components)
│       ├── conversations/
│       ├── training/
│       └── logs/
│
├── components/
│   ├── conversations/
│   │   ├── ConversationTable.tsx    # Client Component
│   │   ├── ConversationCharts.tsx   # Client Component
│   │   └── RefreshCacheButton.tsx   # Client Component
│   │
│   └── charts/
│       └── ChartWrapper.tsx         # Reusable Chart.js wrapper
│
└── types/
    └── index.ts             # TypeScript interfaces
```

## Summary

**The key insight**: Use Server Actions for data reading, API Routes for mutations and external integrations, and always delegate to the central service layer. This keeps the code DRY, performant, and easy to maintain.

**Data Flow**:
1. Intercom API → Service Layer (with caching)
2. Service Layer → Server Actions (read operations)
3. Server Actions → Pages (server components)
4. Client Components → API Routes → Service Layer (mutations)
5. API Routes trigger `router.refresh()` to revalidate pages
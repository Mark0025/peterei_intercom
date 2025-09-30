# Pete Intercom App - Next.js Migration Plan

## Current Express App Analysis (Tagged: `pre-nextjs`)

### Core Features Identified:
- **Intercom Canvas Kit Integration**: Custom onboarding flows
- **7-Level Questionnaire System**: Structured onboarding data collection  
- **Intercom REST API Wrapper**: Contacts, companies, admins, conversations
- **Admin Dashboard**: Training management, analytics, logs
- **Markdown Documentation Reader**: DEV_MAN content system
- **Canvas Kit Components**: Text, input, button builders

### Express Routes → Next.js Migration Map:

#### Server Actions (Preferred):
- `POST /submit` → `src/actions/canvas-kit.ts`
- `POST /initialize` → `src/actions/canvas-kit.ts`  
- `PUT /contacts/:id/training-topic` → `src/actions/intercom.ts`
- `POST /bulk-update-training-topic` → `src/actions/intercom.ts`
- `POST /popout-submit` → `src/actions/onboarding.ts`

#### API Routes (Webhooks & External):
- `POST /webhooks` → `app/api/webhooks/route.ts` (Intercom webhooks)
- `GET /api/intercom/*` → `app/api/intercom/[...slug]/route.ts` (proxy endpoints)

#### App Router Pages:
- `GET /` → `app/page.tsx`
- `GET /popout` → `app/popout/page.tsx`
- `GET /admin/*` → `app/(admin)/*/page.tsx`
- `GET /docs/*` → `app/docs/[...slug]/page.tsx`

### Type Extraction Plan:

#### Core Interfaces (to `/types/`):
```typescript
// Intercom API types
interface IntercomContact { id: string; email?: string; name?: string; custom_attributes?: Record<string, any> }
interface IntercomCompany { id: string; name: string; }
interface IntercomAdmin { id: string; name: string; email: string; }
interface IntercomConversation { id: string; state: string; }

// Canvas Kit types  
interface CanvasComponent { type: 'text' | 'input' | 'button'; id: string; }
interface CanvasResponse { canvas: { content: { components: CanvasComponent[] } } }

// Onboarding types
interface OnboardingSection { title: string; questions: Question[] }
interface Question { shorthand: string; detailed: string; }
interface OnboardingData { sections: OnboardingSection[] }
```

### Dependencies to Add:
- `@types/node` (latest)
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`  
- `eslint-plugin-import`
- `next-mdx-remote`
- `remark-slug`
- `rehype-highlight`

### Server Actions Architecture:
```
src/actions/
├── canvas-kit.ts     # Canvas Kit form submissions
├── intercom.ts       # Intercom API mutations  
├── onboarding.ts     # Questionnaire processing
└── types.ts          # Server action return types
```

### Strict TypeScript Config:
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

### ESLint Custom Rules:
- **no-duplicate-types**: Fails on interface/type outside `/types`
- **prefer-server-actions**: Warns on client-side fetch to own API
- **import/no-relative-parent-imports**: Forces `@/types` alias

---

## Migration Strategy (Server Actions First)

1. **Bootstrap Next.js 15 + TypeScript**
2. **Extract all types to centralized `/types` directory** 
3. **Convert POST endpoints to server actions**
4. **Migrate Canvas Kit logic to React Server Components**
5. **Build questionnaire flow with server actions**
6. **Add admin dashboard with server actions**
7. **Preserve webhook API routes for Intercom**

This approach eliminates client/server boundary complexity and provides better TypeScript inference.
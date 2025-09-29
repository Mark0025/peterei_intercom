import { readFileSync } from 'fs';
import { join } from 'path';
import { marked } from 'marked';

async function getWhatsWorkingContent() {
  try {
    // Try to read from the original Express app first
    let mdPath = join(process.cwd(), '../intercomApp/DEV_MAN/whatworkin.md');
    try {
      return readFileSync(mdPath, 'utf8');
    } catch {
      // Fallback to our DEV_MAN folder
      mdPath = join(process.cwd(), 'DEV_MAN/nextjs-migration-plan.md');
      return readFileSync(mdPath, 'utf8');
    }
  } catch {
    return `# What's Working: Pete Intercom Next.js App

## ✅ Completed Features

### Core Infrastructure
- **Next.js 15 + React 19** - Modern stack with server components
- **TypeScript Strict Mode** - Full type safety with centralized types
- **Server Actions** - React 19 patterns for form submissions
- **Original Styling Preserved** - Pete branding and design intact

### Canvas Kit Integration
- **Intercom Webhooks** - \`/api/initialize\` and \`/api/submit\` endpoints
- **Server Action Implementation** - Canvas Kit logic using server actions
- **Type-Safe Components** - Centralized Canvas Kit types

### Data Management
- **JSON Data Service** - Onboarding questions loaded from JSON
- **Type-Safe Data Access** - Proper TypeScript interfaces
- **Server-Side Caching** - Efficient data loading

### UI Components
- **shadcn/ui Integration** - Modern UI components available
- **Original Pete Styling** - Preserved #2d72d2 blue theme
- **Responsive Design** - Mobile-friendly layout

## 🚧 In Progress
- Admin dashboard
- Complete onboarding flow
- Markdown documentation reader
- ESLint configuration

## 📊 Architecture Diagram

\`\`\`mermaid
graph TB
    A[Next.js App] --> B[Server Actions]
    A --> C[API Routes]
    B --> D[Canvas Kit Logic]
    B --> E[Onboarding Service]
    C --> F[Intercom Webhooks]
    E --> G[JSON Data]
    D --> H[TypeScript Types]
    E --> H
    F --> H
\`\`\`

---
*Updated: ${new Date().toISOString()}*`;
  }
}

export default async function WhatsWorkingPage() {
  const content = await getWhatsWorkingContent();
  const htmlContent = await marked.parse(content);

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
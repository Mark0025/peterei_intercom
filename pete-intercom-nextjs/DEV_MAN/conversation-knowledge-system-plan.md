# Conversation Knowledge System - Implementation Plan

**Created:** 2025-10-16
**Status:** Planning Phase
**Goal:** Build intelligent conversation search & visualization system with proper access control

---

## 📋 Executive Summary

Transform our conversation analysis data into an intelligent knowledge base that:
1. Shows visual journeys of problem resolution (Mermaid diagrams)
2. Finds similar past questions and suggests proven solutions
3. Versions responses by author (Jon > Mark priority)
4. Pulls in Intercom notes where Jon explains solutions
5. Tests agent responses against historical data
6. Maintains strict access control (admin vs public)

---

## 🎯 Core Requirements

### Functional Requirements
- [ ] Visualize conversation timelines as Mermaid journey diagrams
- [ ] Search past conversations by semantic similarity
- [ ] Version and weight responses (Jon's explanations prioritized)
- [ ] Pull conversation parts AND notes from Intercom API
- [ ] Test PeteAI agent against historical Q&A pairs
- [ ] Anonymize data for public Pete AI
- [ ] Full transparency for admin routes

### Non-Functional Requirements
- [ ] Use existing shadcn/ui components (DRY)
- [ ] Preserve existing caching strategy
- [ ] No breaking changes to current UI/UX
- [ ] Maintain type safety (TypeScript strict mode)
- [ ] Fast search (<500ms for similarity queries)
- [ ] Responsive design (mobile-friendly)

---

## 🏗️ System Architecture

### Data Flow
```
Intercom API
    ↓
Cache Layer (existing: src/services/intercom.ts)
    ↓
Analysis Scripts (NEW: pull conversation parts + notes)
    ↓
Knowledge Base (NEW: JSON files with embeddings)
    ↓
├─→ Admin Dashboard (/admin/insights/conversations)
│   ├─ Full conversation threads
│   ├─ Timeline visualizations
│   ├─ Similarity search
│   └─ Response versioning
│
└─→ PeteAI Agent (enhanced with new tools)
    ├─ search_past_solutions (admin-only)
    ├─ find_similar_questions (public, anonymized)
    └─ generate_journey_diagram (admin-only)
```

### Access Control Matrix

| Feature | Public `/help` | Admin `/admin` |
|---------|---------------|----------------|
| View conversation history | ❌ No | ✅ Yes |
| See user names/emails | ❌ No | ✅ Yes |
| See admin notes | ❌ No | ✅ Yes |
| Get anonymized answers | ✅ Yes | ✅ Yes |
| Generate journey diagrams | ❌ No | ✅ Yes |
| Test agent responses | ❌ No | ✅ Yes |
| Similarity search | ✅ Limited | ✅ Full |

---

## 📊 Data Model

### New Data Structures

#### 1. Conversation Thread (Full Detail)
```typescript
interface ConversationThread {
  conversation_id: string;
  created_at: number;
  updated_at: number;
  state: 'open' | 'closed' | 'snoozed';

  // Participants
  user: {
    id: string;
    name?: string;
    email?: string;
  };

  // Full message thread
  messages: ConversationMessage[];

  // Admin notes (critical for Jon's explanations)
  notes: ConversationNote[];

  // Metadata
  tags: string[];
  resolution_time_hours?: number;
  category?: string;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'admin' | 'bot';
  author: {
    type: string;
    id: string;
    name?: string;
    email?: string;
  };
  body: string; // cleaned with htmlToPlainText
  created_at: number;

  // For versioning responses
  response_quality_score?: number; // Higher for Jon
}

interface ConversationNote {
  id: string;
  author: {
    id: string;
    name: string; // "Jon Nolen" or "Mark"
  };
  body: string; // cleaned
  created_at: number;

  // Weight Jon's notes higher
  is_from_jon: boolean;
  priority_score: number; // 10 for Jon, 5 for Mark, 1 for others
}
```

#### 2. Similar Question Index
```typescript
interface QuestionIndex {
  question_id: string;
  conversation_id: string;
  question_text: string;
  question_embedding?: number[]; // Future: OpenAI embeddings

  // Best answer (versioned by author)
  best_answer: {
    text: string;
    author_name: string;
    author_priority: number; // Jon = 10, Mark = 5
    resolution_time_hours: number;
    confidence_score: number;
  };

  // All answers for comparison
  all_answers: ConversationMessage[];

  // Metadata
  category: string;
  tags: string[];
  asked_count: number; // How many times similar question asked
  last_asked: number;
}
```

#### 3. Journey Diagram Data
```typescript
interface ConversationJourney {
  conversation_id: string;
  steps: JourneyStep[];
  mermaid_diagram: string; // Pre-generated
}

interface JourneyStep {
  step_number: number;
  timestamp: number;
  actor: 'user' | 'jon' | 'mark' | 'system';
  action: string; // "Asked about data upload"
  response?: string; // "Jon explained CSV format"
  duration_to_next?: number; // seconds
}
```

---

## 🔧 Implementation Plan

### Phase 1: Data Collection (Commits 1-2)

#### Commit 1: Enhance conversation analysis to pull full threads
**File:** `src/scripts/full-conversation-analysis.ts`
**Changes:**
- Modify `fetchConversationDetails()` to include conversation parts
- Add new function `fetchConversationNotes()`
- Store full threads in `data/conversation-analysis/threads/`

**New Files:**
- `data/conversation-analysis/threads-[timestamp].json`
- `data/conversation-analysis/notes-[timestamp].json`

**Testing:**
- Run analysis and verify full message threads captured
- Verify notes are properly attributed to Jon vs Mark

#### Commit 2: Response versioning & priority scoring
**File:** `src/utils/conversation-scorer.ts` (NEW)
**Functionality:**
```typescript
export function scoreResponse(message: ConversationMessage): number {
  // Jon Nolen = 10 points
  // Mark = 5 points
  // Other admins = 3 points
  // Contains code examples = +2
  // Contains links to help docs = +1
  // Fast response (<1 hour) = +1

  return score;
}

export function findBestAnswer(
  messages: ConversationMessage[]
): ConversationMessage {
  return messages
    .filter(m => m.type === 'admin')
    .map(m => ({ message: m, score: scoreResponse(m) }))
    .sort((a, b) => b.score - a.score)[0].message;
}
```

**Testing:**
- Unit tests for scoring logic
- Verify Jon's responses always rank higher

---

### Phase 2: Similarity Search (Commit 3)

#### Commit 3: Simple keyword-based similarity (Phase 1)
**File:** `src/services/similarity-search.ts` (NEW)

**Simple Implementation (No embeddings yet):**
```typescript
export function findSimilarQuestions(
  query: string,
  allQuestions: FirstQuestion[],
  limit: number = 5
): SimilarQuestion[] {
  // 1. Tokenize query
  // 2. Calculate keyword overlap (TF-IDF style)
  // 3. Rank by relevance score
  // 4. Return top N

  return similarQuestions;
}

interface SimilarQuestion {
  question: FirstQuestion;
  similarity_score: number; // 0-100
  matched_keywords: string[];
}
```

**Why start simple:**
- No external dependencies (OpenAI embeddings)
- Fast to implement
- Good enough for MVP
- Can upgrade to embeddings later

**Testing:**
- Test with known similar questions
- Verify relevance ranking

---

### Phase 3: UI Components (Commits 4-6)

#### Commit 4: Conversation timeline component
**File:** `src/components/conversations/ConversationTimeline.tsx` (NEW)

**Using existing patterns from:**
- `src/components/help/HelpInsights.tsx` (Mermaid rendering)
- `src/components/ui/card.tsx` (shadcn/ui)
- `src/components/ui/badge.tsx` (for user/admin labels)

```tsx
interface ConversationTimelineProps {
  conversationId: string;
  messages: ConversationMessage[];
  notes: ConversationNote[];
  showSensitiveData: boolean; // false for public, true for admin
}

export function ConversationTimeline({
  conversationId,
  messages,
  notes,
  showSensitiveData
}: ConversationTimelineProps) {
  // Generate Mermaid journey diagram
  const mermaidCode = generateJourneyDiagram(messages, notes);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation Journey</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mermaid diagram */}
        <MermaidRenderer code={mermaidCode} />

        {/* Message list */}
        <div className="space-y-4 mt-6">
          {messages.map(msg => (
            <MessageCard
              key={msg.id}
              message={msg}
              showAuthor={showSensitiveData}
            />
          ))}
        </div>

        {/* Notes section (admin only) */}
        {showSensitiveData && notes.length > 0 && (
          <NotesSection notes={notes} />
        )}
      </CardContent>
    </Card>
  );
}
```

**Mermaid Journey Format:**
```javascript
function generateJourneyDiagram(messages, notes) {
  return `
    journey
      title Problem Resolution Journey
      section Initial Contact
        User asks question: 5: User
        System acknowledges: 3: Pete
      section Investigation
        Jon reviews issue: 4: Jon
        Jon adds note explaining root cause: 5: Jon
      section Resolution
        Jon provides solution: 5: Jon
        User confirms fixed: 5: User
  `;
}
```

#### Commit 5: Similar questions search component
**File:** `src/components/conversations/SimilarQuestionsSearch.tsx` (NEW)

```tsx
export function SimilarQuestionsSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SimilarQuestion[]>([]);

  async function handleSearch() {
    const response = await fetch('/api/conversations/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
    const data = await response.json();
    setResults(data.results);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Similar Past Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past questions..."
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>

        <div className="mt-4 space-y-2">
          {results.map(result => (
            <SimilarQuestionCard
              key={result.question.conversation_id}
              question={result.question}
              similarityScore={result.similarity_score}
              matchedKeywords={result.matched_keywords}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Commit 6: Admin insights dashboard page
**File:** `src/app/(admin)/admin/insights/conversations/page.tsx` (NEW)

**Layout using existing patterns:**
```tsx
export default function ConversationInsightsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Conversation Insights
      </h1>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="top-questions">Top Questions</TabsTrigger>
          <TabsTrigger value="timelines">Timelines</TabsTrigger>
          <TabsTrigger value="testing">Agent Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <SimilarQuestionsSearch />
        </TabsContent>

        <TabsContent value="top-questions">
          <TopQuestionsChart />
        </TabsContent>

        <TabsContent value="timelines">
          <ConversationTimelineViewer />
        </TabsContent>

        <TabsContent value="testing">
          <AgentTestingInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### Phase 4: Agent Enhancement (Commits 7-8)

#### Commit 7: Add new LangGraph tools
**File:** `src/services/langraph-agent.ts`

**New tools:**
```typescript
// Admin-only tool
const search_past_solutions = new DynamicStructuredTool({
  name: "search_past_solutions",
  description: `Search past conversations for solutions to similar problems.
  Use this when user asks a question that might have been answered before.
  Returns full conversation threads with user details and admin notes.
  ADMIN ONLY - includes sensitive data.`,
  schema: z.object({
    query: z.string().describe("The question or problem to search for"),
    limit: z.number().optional().describe("Max results (default 5)")
  }),
  func: async ({ query, limit = 5 }) => {
    // Load conversation threads
    // Run similarity search
    // Return top matches with full context
    return JSON.stringify(results);
  }
});

// Public tool (anonymized)
const find_similar_questions = new DynamicStructuredTool({
  name: "find_similar_questions",
  description: `Find similar questions asked by other users.
  Returns anonymized, generalized answers.
  Safe for public Pete AI - no sensitive data.`,
  schema: z.object({
    query: z.string().describe("The question to find similar matches for")
  }),
  func: async ({ query }) => {
    // Load question index
    // Run similarity search
    // Return anonymized answers only
    return JSON.stringify(anonymizedResults);
  }
});

// Admin-only tool
const generate_journey_diagram = new DynamicStructuredTool({
  name: "generate_journey_diagram",
  description: `Generate a Mermaid journey diagram showing how a problem was resolved.
  ADMIN ONLY - shows full interaction timeline.`,
  schema: z.object({
    conversation_id: z.string()
  }),
  func: async ({ conversation_id }) => {
    // Load conversation thread
    // Generate Mermaid code
    return mermaidCode;
  }
});
```

**Context-aware tool selection:**
```typescript
function getAgentTools(userContext: { isAdmin: boolean }) {
  const baseTools = [
    search_contacts,
    search_companies,
    // ... existing tools
  ];

  if (userContext.isAdmin) {
    return [
      ...baseTools,
      search_past_solutions,
      generate_journey_diagram
    ];
  } else {
    return [
      ...baseTools,
      find_similar_questions
    ];
  }
}
```

#### Commit 8: Agent testing interface
**File:** `src/components/conversations/AgentTestingInterface.tsx` (NEW)

```tsx
export function AgentTestingInterface() {
  const [testQuestion, setTestQuestion] = useState('');
  const [historicalAnswer, setHistoricalAnswer] = useState('');
  const [agentAnswer, setAgentAnswer] = useState('');
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  async function runTest() {
    // 1. Find how we actually answered this question in the past
    const historical = await findHistoricalAnswer(testQuestion);
    setHistoricalAnswer(historical);

    // 2. Ask current agent the same question
    const agentResponse = await askPeteAI(testQuestion);
    setAgentAnswer(agentResponse);

    // 3. Compare answers
    const comparisonResult = compareAnswers(historical, agentResponse);
    setComparison(comparisonResult);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Response Testing</CardTitle>
        <CardDescription>
          Test Pete AI against historical answers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Test Question</Label>
            <Textarea
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              placeholder="Enter a question users have asked before..."
            />
          </div>

          <Button onClick={runTest}>Run Test</Button>

          {comparison && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <h3 className="font-semibold mb-2">
                  Historical Answer (Jon/Mark)
                </h3>
                <Card className="p-4 bg-green-50">
                  <p>{historicalAnswer}</p>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Pete AI Answer (Current)
                </h3>
                <Card className="p-4 bg-blue-50">
                  <p>{agentAnswer}</p>
                </Card>
              </div>

              <div className="col-span-2">
                <h3 className="font-semibold mb-2">Comparison</h3>
                <ComparisonReport result={comparison} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

### Phase 5: API Routes (Commit 9)

#### Commit 9: Create search API endpoints
**Files:**
- `src/app/api/conversations/search/route.ts` (NEW)
- `src/app/api/conversations/thread/[id]/route.ts` (NEW)
- `src/app/api/conversations/test-agent/route.ts` (NEW)

**Search endpoint:**
```typescript
// src/app/api/conversations/search/route.ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { findSimilarQuestions } from '@/services/similarity-search';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const isAdmin = userId && await checkIsAdmin(userId);

  const { query, limit = 5 } = await request.json();

  // Run similarity search
  const results = await findSimilarQuestions(query, limit);

  // Anonymize if not admin
  if (!isAdmin) {
    results.forEach(result => {
      delete result.question.user_name;
      delete result.question.user_email;
      delete result.question.user_id;
    });
  }

  return NextResponse.json({ results });
}
```

---

## 🔒 Access Control Implementation

### Clerk Integration (Existing)
```typescript
// src/lib/auth.ts (enhance existing)
export async function checkIsAdmin(userId: string): Promise<boolean> {
  const user = await clerkClient.users.getUser(userId);
  return user.emailAddresses.some(
    email => email.emailAddress.endsWith('@peterei.com')
  );
}

export async function getAdminContext(userId: string) {
  const isAdmin = await checkIsAdmin(userId);
  return {
    isAdmin,
    canViewSensitiveData: isAdmin,
    canAccessNotes: isAdmin,
    canTestAgent: isAdmin
  };
}
```

### Component-level access control
```tsx
// In every component
const { userId } = useAuth();
const { data: adminContext } = useQuery({
  queryKey: ['adminContext', userId],
  queryFn: () => fetch('/api/auth/context').then(r => r.json())
});

if (!adminContext?.canViewSensitiveData) {
  return <AnonymizedView />;
}

return <FullDataView />;
```

---

## 📦 File Structure

```
pete-intercom-nextjs/
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       └── insights/
│   │   │           └── conversations/
│   │   │               └── page.tsx (NEW)
│   │   └── api/
│   │       └── conversations/
│   │           ├── search/
│   │           │   └── route.ts (NEW)
│   │           ├── thread/
│   │           │   └── [id]/
│   │           │       └── route.ts (NEW)
│   │           └── test-agent/
│   │               └── route.ts (NEW)
│   │
│   ├── components/
│   │   └── conversations/
│   │       ├── ConversationTimeline.tsx (NEW)
│   │       ├── SimilarQuestionsSearch.tsx (NEW)
│   │       ├── AgentTestingInterface.tsx (NEW)
│   │       ├── MessageCard.tsx (NEW)
│   │       ├── NotesSection.tsx (NEW)
│   │       └── ComparisonReport.tsx (NEW)
│   │
│   ├── services/
│   │   ├── similarity-search.ts (NEW)
│   │   └── langraph-agent.ts (MODIFY - add new tools)
│   │
│   ├── utils/
│   │   ├── conversation-scorer.ts (NEW)
│   │   └── journey-diagram-generator.ts (NEW)
│   │
│   └── scripts/
│       └── full-conversation-analysis.ts (MODIFY - add threads/notes)
│
├── data/
│   └── conversation-analysis/
│       ├── threads/ (NEW)
│       │   └── threads-[timestamp].json
│       ├── notes/ (NEW)
│       │   └── notes-[timestamp].json
│       └── index/ (NEW)
│           └── question-index-[timestamp].json
│
└── DEV_MAN/
    └── conversation-knowledge-system-plan.md (THIS FILE)
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] `conversation-scorer.test.ts` - Response versioning logic
- [ ] `similarity-search.test.ts` - Keyword matching accuracy
- [ ] `journey-diagram-generator.test.ts` - Mermaid code generation

### Integration Tests
- [ ] API endpoints return correct data
- [ ] Admin vs public access control works
- [ ] Agent tools return expected results

### Manual Testing Checklist
- [ ] View conversation timeline as admin
- [ ] Search for similar questions as admin
- [ ] Search for similar questions as public (verify anonymization)
- [ ] Test agent with known question
- [ ] Verify Jon's notes have higher priority
- [ ] Check Mermaid diagrams render correctly
- [ ] Mobile responsive design works

---

## 🚀 Deployment Checklist

### Before First Commit
- [ ] Run full-conversation-analysis with new thread/notes fetching
- [ ] Verify data quality (no HTML, proper attribution)
- [ ] Test similarity search with sample queries
- [ ] Create at least 5 sample journey diagrams

### Before Merging to Main
- [ ] All tests passing
- [ ] TypeScript strict mode passes
- [ ] No console errors
- [ ] Admin dashboard loads fast (<2s)
- [ ] Search responds quickly (<500ms)
- [ ] Mobile UI looks good
- [ ] Access control verified (public can't see sensitive data)

### Post-Deployment
- [ ] Monitor Render logs for errors
- [ ] Check admin dashboard performance
- [ ] Verify agent uses new tools correctly
- [ ] Gather feedback from Jon/Mark

---

## 📈 Future Enhancements (Phase 2)

### Embeddings-Based Similarity Search
- Replace keyword matching with OpenAI embeddings
- Store in vector database (Pinecone or local SQLite)
- Semantic search instead of keyword overlap

### Auto-FAQ Generation
- Identify top 20 most common questions
- Generate FAQ page automatically
- Update monthly based on new conversations

### Conversation Clustering
- Group similar conversations together
- Identify recurring issues
- Proactive alerts for common problems

### Advanced Analytics
- Time-to-resolution trends
- Question category distribution
- User satisfaction correlation

---

## ⚠️ Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing cache | High | Preserve current cache structure, add new files |
| UI performance issues | Medium | Lazy load components, paginate results |
| Access control bypass | High | Test thoroughly, use Clerk at API level |
| Data privacy leaks | High | Double-check anonymization logic |
| Agent giving bad advice | Medium | Include disclaimer, test against historical data |

---

## ✅ Git Commit Plan

### Commit 1: Data Collection - Conversation Threads
```
feat: fetch full conversation threads with messages

- Modify fetchConversationDetails to include all conversation parts
- Store in data/conversation-analysis/threads/
- Add cleaned message bodies using htmlToPlainText
- Include author attribution for each message
```

### Commit 2: Data Collection - Admin Notes
```
feat: fetch and prioritize admin notes from Intercom

- Add fetchConversationNotes function
- Store in data/conversation-analysis/notes/
- Implement priority scoring (Jon=10, Mark=5)
- Associate notes with conversations
```

### Commit 3: Response Versioning
```
feat: implement response quality scoring

- Create conversation-scorer.ts utility
- Score responses by author + quality indicators
- Identify "best answer" for each conversation
- Add unit tests for scoring logic
```

### Commit 4: Similarity Search
```
feat: keyword-based similarity search

- Create similarity-search.ts service
- Implement TF-IDF style matching
- Return ranked similar questions
- Add tests for accuracy
```

### Commit 5: Timeline UI Component
```
feat: conversation timeline with Mermaid journey diagrams

- Create ConversationTimeline component
- Generate Mermaid journey diagrams
- Add MessageCard and NotesSection sub-components
- Use existing shadcn/ui patterns
```

### Commit 6: Search UI Component
```
feat: similar questions search interface

- Create SimilarQuestionsSearch component
- Add search input with results list
- Show similarity scores and matched keywords
- Responsive design for mobile
```

### Commit 7: Admin Dashboard Page
```
feat: conversation insights dashboard

- Create /admin/insights/conversations route
- Add tabs for search/top-questions/timelines/testing
- Integrate all new components
- Preserve existing Pete branding (purple gradients)
```

### Commit 8: Agent Enhancement - Search Tools
```
feat: add conversation search tools to LangGraph agent

- Add search_past_solutions (admin-only)
- Add find_similar_questions (public, anonymized)
- Add generate_journey_diagram (admin-only)
- Implement context-aware tool selection
```

### Commit 9: Agent Testing Interface
```
feat: agent response testing against historical data

- Create AgentTestingInterface component
- Compare agent responses to historical answers
- Show side-by-side comparison
- Add quality scoring
```

### Commit 10: API Routes
```
feat: conversation search API endpoints

- POST /api/conversations/search
- GET /api/conversations/thread/[id]
- POST /api/conversations/test-agent
- Implement access control with Clerk
```

### Commit 11: Documentation & Cleanup
```
docs: update CLAUDE.md with conversation knowledge system

- Document new admin routes
- Update agent capabilities
- Add usage examples
- Clean up console logs
```

---

## 📝 Notes

### Why This Approach?
1. **Incremental** - Each commit is independently testable
2. **Safe** - No changes to existing cache or UI until ready
3. **DRY** - Reuses shadcn/ui components and patterns
4. **Secure** - Access control baked in from the start
5. **Smart** - Versions responses, prioritizes Jon's expertise

### What Makes This Different?
- Not just search - it's a full knowledge evolution system
- Mermaid journey diagrams show HOW problems were solved
- Response versioning ensures best answers surface
- Admin notes capture the "why" behind solutions
- Testing interface validates agent improvements

### Integration Points
- ✅ Uses existing `getIntercomCache()`
- ✅ Extends `full-conversation-analysis.ts`
- ✅ Adds tools to existing LangGraph agent
- ✅ Follows shadcn/ui component patterns
- ✅ Uses Clerk for access control
- ✅ Preserves Pete branding/design system

---

## 🎯 Success Metrics

After implementation, we should see:
- [ ] Pete AI gives better answers (measured by testing interface)
- [ ] Faster problem resolution (compare to historical avg)
- [ ] More consistent answers across different users
- [ ] Jon's expertise captured and reusable
- [ ] Admin efficiency improved (visual timelines help)
- [ ] User satisfaction increased (better help)

---

**Next Steps:**
1. Review this plan with Jon/Mark
2. Get approval on approach
3. Start with Commit 1 (data collection)
4. Build incrementally, testing each phase
5. Monitor and iterate based on usage

**Questions to Resolve:**
- Should we start with top 100 conversations or all 1068?
- Do we need rate limiting on search API?
- Should we add export functionality (CSV/PDF)?
- What's the cache refresh strategy (daily, on-demand)?

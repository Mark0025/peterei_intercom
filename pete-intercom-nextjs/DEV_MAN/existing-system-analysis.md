# Existing System Deep Analysis

**Date:** 2025-10-16
**Purpose:** Analyze what data we ALREADY have vs what we need to build

---

## 🔍 Current Data Infrastructure

### 1. **Cache System** (`src/services/intercom.ts`)

**What We Store:**
```typescript
cache = {
  contacts: IntercomContact[],        // 417 contacts
  companies: IntercomCompany[],       // 96 companies
  admins: IntercomAdmin[],            // 3 admins
  conversations: IntercomConversation[], // 1,068 conversations (BASIC ONLY)
  helpCenterCollections: [],          // 11 collections
  helpCenterArticles: [],             // 76 articles
  lastRefreshed: Date
}
```

**Storage Locations:**
- In-memory: `cache` object in `src/services/intercom.ts`
- Disk: `.cache/intercom-cache.json`

**⚠️ CRITICAL FINDING:**
The cached `conversations` array contains **BASIC conversation objects ONLY**:
```typescript
interface IntercomConversation {
  id: string;
  state: 'open' | 'closed' | 'snoozed';
  created_at: number;
  updated_at: number;
  waiting_since?: number;
  assignee?: IntercomAdmin;
  source?: { type: string; id?: string };
}
```

**Missing from cache:**
- ❌ Conversation parts (messages)
- ❌ Admin notes
- ❌ Full message threads
- ❌ Author details
- ❌ Resolution timelines

---

### 2. **Analysis Script** (`src/scripts/full-conversation-analysis.ts`)

**What It Does:**
1. Uses cached basic conversations as a starting point
2. **Fetches FULL conversation details on-demand** with `proxyIntercomGet('/conversations/${id}')`
3. Extracts first questions
4. Analyzes error resolutions
5. Saves to `data/conversation-analysis/`

**What Full Details Include:**
```typescript
interface ConversationDetail {
  id: string;
  type: string;
  created_at: number;
  updated_at: number;
  title?: string;
  state: 'open' | 'closed' | 'snoozed';

  // ✅ THIS IS WHAT WE GET from proxyIntercomGet()
  conversation_parts?: {
    conversation_parts: Array<{
      id: string;
      part_type: string;
      body: string;              // ✅ Full message HTML
      created_at: number;
      author?: {                 // ✅ Who sent it
        type: string;            // "user" | "admin"
        id: string;
        name?: string;
        email?: string;
      };
    }>;
  };

  source?: {
    type: string;
    body?: string;               // ✅ Initial message
    author?: {                   // ✅ Who started conversation
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
  };

  contacts?: {
    contacts: Array<{
      id: string;
      name?: string;
      email?: string;
    }>;
  };
}
```

**⚠️ KEY FINDING:**
We **ARE fetching full conversation details** in the analysis script, but:
- ✅ We GET message threads (conversation_parts)
- ✅ We GET author info (Jon vs Mark vs User)
- ❓ We DON'T KNOW if we're getting admin notes
- ❌ We're NOT caching this rich data
- ❌ We're NOT storing it for reuse

---

## 📊 What We're ALREADY Extracting

### Current Output Files (`data/conversation-analysis/`)

**1. `first-questions-[timestamp].json`**
- 732 questions
- User names/emails
- Clean text (HTML stripped)
- Word count, timestamp, state

**2. `error-resolutions-[timestamp].json`**
- 277 error conversations
- Error type categorization
- Resolution timelines
- Initial + resolution messages

**3. `analysis-stats-[timestamp].json`**
- Summary statistics
- Monthly trends
- Error type distribution

**✅ WHAT'S GOOD:**
- HTML cleaning works perfectly
- User attribution works
- Error detection works
- Timing works

**❌ WHAT'S MISSING:**
- Full message threads not saved
- Admin notes not checked/saved
- Response versioning not done (Jon vs Mark)
- No similarity/search index

---

## 🔎 What We Need to Investigate

### 1. **Do Intercom Conversations Include Notes?**

**Question:** Does the `/conversations/{id}` endpoint return admin notes?

**Hypothesis:** The Intercom API likely has notes in one of these places:
- `conversation.notes` array (if it exists)
- `conversation.conversation_parts` where `part_type === "note"`
- Separate endpoint: `/conversations/{id}/notes`

**Action Required:**
```typescript
// Check a real conversation response
const conv = await proxyIntercomGet('/conversations/215471325684081');
console.log(JSON.stringify(conv, null, 2));

// Look for:
// - notes property
// - conversation_parts with part_type === "note"
```

### 2. **Which Admin is Which?**

**Known Admins:**
From cache: `cache.admins` (3 admins)

**Need to Map:**
- Jon Nolen's admin ID
- Mark's admin ID
- Any other admins

**Action Required:**
```typescript
const admins = await getIntercomCache();
console.log(admins.admins);
// Find Jon's ID and Mark's ID for priority scoring
```

---

## 🎯 Gap Analysis: What's Missing

### Data Collection Gaps

| Data Needed | Current Status | Gap | Solution |
|-------------|---------------|-----|----------|
| **Full message threads** | ❌ Fetched but not saved | We fetch in analysis but discard | Save to `data/conversation-analysis/threads/` |
| **Admin notes** | ❓ Unknown if available | Need to check API response | Investigate conversation object |
| **Author identification** | ✅ Available | We have it in parts | Just need to save it |
| **Response quality** | ❌ Not scored | No versioning | Add scoring util |
| **Admin ID mapping** | ✅ Available | We have admin cache | Just need mapping |

### Feature Gaps

| Feature | Current Status | Gap | Solution |
|---------|---------------|-----|----------|
| **Similarity search** | ❌ None | No index | Build keyword-based first |
| **Journey diagrams** | ❌ None | No Mermaid gen | Build diagram generator |
| **Admin dashboard** | ❌ None | No UI | Build `/admin/insights/conversations` |
| **Agent integration** | ❌ None | No tools | Add to LangGraph agent |
| **Testing interface** | ❌ None | No comparison | Build testing UI |

---

## 💡 Revised Implementation Strategy

### Phase 0: Discovery (NOW)

**Commit 0: Investigate what we already have**
- [x] Read cache structure
- [x] Read analysis script
- [ ] Check actual conversation API response for notes
- [ ] Map Jon/Mark admin IDs
- [ ] Document ConversationDetail structure fully

### Phase 1: Enhance Data Collection

**Commit 1: Save full conversation threads**
```typescript
// MODIFY: src/scripts/full-conversation-analysis.ts
// INSTEAD OF: Only extracting first question
// DO: Save entire conversation thread to threads/

interface SavedConversationThread {
  conversation_id: string;
  state: string;
  created_at: number;

  // Full timeline
  messages: Array<{
    id: string;
    type: 'user' | 'admin' | 'bot';
    author_id: string;
    author_name?: string;
    author_email?: string;
    body_html: string;
    body_clean: string;   // Cleaned with htmlToPlainText
    created_at: number;
    part_type: string;
  }>;

  // If notes exist
  notes?: Array<{
    id: string;
    author_id: string;
    author_name: string;
    body_html: string;
    body_clean: string;
    created_at: number;
  }>;

  // Metadata
  user_info: {
    id: string;
    name?: string;
    email?: string;
  };
}
```

**Commit 2: Admin ID mapping & response scoring**
```typescript
// NEW: src/utils/admin-mapper.ts
const ADMIN_IDS = {
  JON_NOLEN: 'actual_id_from_cache',
  MARK: 'actual_id_from_cache'
};

export function getAdminPriority(adminId: string): number {
  if (adminId === ADMIN_IDS.JON_NOLEN) return 10;
  if (adminId === ADMIN_IDS.MARK) return 5;
  return 3;
}
```

**Commit 3: Build question index with best answers**
```typescript
// NEW: Process all threads to build index
interface QuestionIndex {
  question_id: string;
  conversation_id: string;
  question_text: string;

  // Best answer (scored by author)
  best_answer: {
    text: string;
    author_id: string;
    author_name: string;
    priority_score: number;
    created_at: number;
  };

  // All admin responses (for comparison)
  all_responses: AdminResponse[];
}
```

### Phase 2-5: Same as original plan

But now we're building on TOP of data we already have, not refetching everything.

---

## 🚀 Immediate Next Steps

### Step 1: Check What Conversation API Returns
```typescript
// Quick test script
import { proxyIntercomGet } from './src/services/intercom';

async function inspectConversation() {
  // Use a known conversation ID
  const conv = await proxyIntercomGet('/conversations/215471325684081');

  console.log('=== CONVERSATION STRUCTURE ===');
  console.log(JSON.stringify(conv, null, 2));

  console.log('\n=== CHECKING FOR NOTES ===');
  if (conv.notes) {
    console.log('✅ Has notes property');
  }

  if (conv.conversation_parts) {
    const noteParts = conv.conversation_parts.conversation_parts
      .filter(p => p.part_type === 'note');
    console.log(`✅ Found ${noteParts.length} note-type parts`);
  }
}

inspectConversation();
```

### Step 2: Map Admin IDs
```typescript
import { getIntercomCache } from './src/services/intercom';

async function mapAdmins() {
  const cache = await getIntercomCache();
  console.log('=== ADMINS ===');
  cache.admins.forEach(admin => {
    console.log(`${admin.name} (${admin.email}): ${admin.id}`);
  });
}

mapAdmins();
```

### Step 3: Update Plan Based on Findings

Once we know:
1. ✅ If notes are available and where
2. ✅ Jon and Mark's admin IDs
3. ✅ Full conversation structure

Then we can:
- Update ConversationDetail type
- Modify analysis script to save threads
- Build on existing fetching (not redo it)

---

## ⚠️ Critical Realizations

### We're Doing Unnecessary Work
- ✅ We ALREADY fetch full conversations in analysis script
- ✅ We ALREADY have HTML cleaning working
- ✅ We ALREADY have error detection working
- ❌ We're just not SAVING the full data

### The Fix is Simpler Than We Thought
Instead of building new fetching logic:
1. Modify existing `full-conversation-analysis.ts`
2. Add new output files for threads
3. Build index from those threads
4. Everything else stays the same

### We Don't Need to Touch Cache (Yet)
- Current cache is fine for basic data
- Analysis script does on-demand full fetching
- We just need to save more of what we fetch

---

## 📋 Updated TODO

Before writing any code:
- [ ] Run conversation inspection script
- [ ] Map admin IDs
- [ ] Document exact conversation structure
- [ ] Update DEV_MAN plans with findings

Then build Phase 1:
- [ ] Modify analysis to save threads
- [ ] Add admin mapping
- [ ] Build question index
- [ ] Test with sample data

---

**Next Action:** Run discovery scripts to understand exact data structure.

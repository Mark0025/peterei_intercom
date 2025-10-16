# Discovery Findings - Conversation Data Structure

**Date:** 2025-10-16
**Status:** ✅ Complete

---

## 🎯 **Critical Discoveries**

### 1. **Admin Notes DO Exist!**
✅ **Found:** Notes are in `conversation_parts` with `part_type === "note"`

**Example from Conversation 17:**
```json
{
  "type": "conversation_part",
  "part_type": "note",
  "author": {
    "type": "admin",
    "id": "6614158",
    "name": "Jon Nolen",
    "email": "jon@thepete.io"
  },
  "body": "<p class=\"no-margin\">Dwight Tyson review what's being said about the failed MMS. Do you know how you would be able to find out this info yourself?</p>",
  "created_at": 1732054785
}
```

**Content:** Jon explaining issues, coaching team members, documenting context

###  2. **Admin ID Mapping**
- **Jon Nolen:** `6614158` (email: `jon@thepete.io`)
- **Mark:** Unknown (need to check more conversations)
- **Priority Scoring:** Jon = 10, Mark = 5, Others = 3

### 3. **Conversation Structure**

```typescript
interface ConversationFull {
  id: string;
  state: 'open' | 'closed' | 'snoozed';
  created_at: number;
  updated_at: number;

  // Initial message
  source: {
    type: string;
    body: string;        // HTML
    author: {
      type: 'user' | 'admin';
      id: string;
      name?: string;
      email?: string;
    };
  };

  // Full conversation thread
  conversation_parts: {
    conversation_parts: Array<{
      type: 'conversation_part';
      id: string;
      part_type: 'comment' | 'note' | 'assignment' | 'close' | 'open' | ...;
      body: string | null;   // HTML for comments/notes, null for system actions
      created_at: number;
      author: {
        type: 'user' | 'admin' | 'bot';
        id: string;
        name?: string;
        email?: string;
      };
    }>;
  };

  contacts: {
    contacts: Array<{
      id: string;
      external_id?: string;
    }>;
  };

  admin_assignee_id: number;
  statistics: { /* timing info */ };
  // ... other metadata
}
```

### 4. **Part Types Found**

| Part Type | Description | Has Body? | Author Type |
|-----------|-------------|-----------|-------------|
| `comment` | Actual messages | ✅ HTML | user/admin |
| `note` | Admin internal notes | ✅ HTML | admin |
| `assignment` | Conversation assigned | ❌ null | admin |
| `close` | Conversation closed | ❌ null | admin |
| `open` | Conversation reopened | ❌ null | user/admin |
| `participant_added` | User added to conversation | ❌ null | admin |
| `language_detection_details` | System action | ❌ null | bot |
| `conversation_attribute_updated_by_admin` | Attribute changed | ❌ null | bot |

### 5. **Sample Conversation 17 Timeline**

26 total parts:
- 1 system update
- 1 assignment (with body - Jon's greeting)
- **16 comments** (8 from users, 8 from admins)
- **1 note** (Jon coaching Dwight)
- 2 close actions
- 1 open action
- 4 duplicate messages

**Messages with Bodies:**
- Source: User's initial question
- Comments: All actual conversation (user ↔ admin)
- Notes: Jon's internal explanations

---

## 📊 **What We Have vs What We Need**

### ✅ Already Available

| Data | Location | Status |
|------|----------|--------|
| **Full message threads** | `conversation_parts` | ✅ In API response |
| **Admin notes** | `part_type === "note"` | ✅ Found! |
| **Author attribution** | `author.name` + `author.id` | ✅ Works |
| **HTML content** | `body` field | ✅ Needs cleaning |
| **Timestamps** | `created_at` | ✅ Works |
| **User info** | `source.author` + `contacts` | ✅ Works |
| **Jon's admin ID** | `6614158` | ✅ Confirmed |

### ❌ What We Don't Have Yet

| Need | Current Status | Solution |
|------|---------------|----------|
| **Saved full threads** | Only extracted first question | Modify analysis to save all parts |
| **Notes extracted** | Not captured | Filter `part_type === "note"` |
| **Response versioning** | No scoring | Build scoring util with Jon=10 |
| **Message index** | No search | Build from saved threads |
| **Journey diagrams** | No visualization | Generate Mermaid from timeline |

---

## 🔧 **Updated Implementation Plan**

### Phase 1: Data Collection (Simplified)

**We DON'T need new fetching - just save more from existing fetch!**

#### Commit 1: Save Full Conversation Threads
**File:** `src/scripts/full-conversation-analysis.ts`

**Changes:**
```typescript
// EXISTING: fetchConversationDetails() already gets everything
// NEW: Save the full response instead of just extracting first question

async function saveConversationThread(conversation: ConversationDetail) {
  const thread = {
    conversation_id: conversation.id,
    state: conversation.state,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,

    // User info
    user: {
      id: conversation.source?.author?.id || conversation.contacts?.contacts?.[0]?.id,
      name: conversation.source?.author?.name,
      email: conversation.source?.author?.email
    },

    // Initial message
    initial_message: {
      body_html: conversation.source?.body,
      body_clean: cleanConversationMessage(conversation.source?.body || ''),
      created_at: conversation.created_at,
      author: conversation.source?.author
    },

    // ALL conversation parts (comments, notes, actions)
    parts: conversation.conversation_parts?.conversation_parts?.map(part => ({
      id: part.id,
      type: part.part_type,
      body_html: part.body,
      body_clean: part.body ? cleanConversationMessage(part.body) : null,
      created_at: part.created_at,
      author_type: part.author?.type,
      author_id: part.author?.id,
      author_name: part.author?.name,
      author_email: part.author?.email
    })) || [],

    // Extract notes separately for easy access
    notes: conversation.conversation_parts?.conversation_parts
      ?.filter(p => p.part_type === 'note')
      ?.map(note => ({
        id: note.id,
        body_html: note.body,
        body_clean: cleanConversationMessage(note.body || ''),
        created_at: note.created_at,
        author_id: note.author?.id,
        author_name: note.author?.name,
        is_from_jon: note.author?.id === '6614158'
      })) || [],

    // Extract admin responses
    admin_responses: conversation.conversation_parts?.conversation_parts
      ?.filter(p => p.part_type === 'comment' && p.author?.type === 'admin')
      ?.map(msg => ({
        id: msg.id,
        body_html: msg.body,
        body_clean: cleanConversationMessage(msg.body || ''),
        created_at: msg.created_at,
        author_id: msg.author?.id,
        author_name: msg.author?.name,
        is_from_jon: msg.author?.id === '6614158'
      })) || [],

    // Extract user messages
    user_messages: conversation.conversation_parts?.conversation_parts
      ?.filter(p => p.part_type === 'comment' && p.author?.type === 'user')
      ?.map(msg => ({
        id: msg.id,
        body_html: msg.body,
        body_clean: cleanConversationMessage(msg.body || ''),
        created_at: msg.created_at,
        author_id: msg.author?.id,
        author_name: msg.author?.name
      })) || [],

    // Metadata
    admin_assignee_id: conversation.admin_assignee_id,
    statistics: conversation.statistics
  };

  return thread;
}

// NEW OUTPUT FILE:
const threads: SavedConversationThread[] = [];

for (const detail of conversationDetails) {
  threads.push(saveConversationThread(detail));
}

await fs.writeFile(
  path.join(outputDir, `threads-${timestamp}.json`),
  JSON.stringify(threads, null, 2)
);
```

**Output:** `data/conversation-analysis/threads-[timestamp].json`

#### Commit 2: Response Quality Scoring
**File:** `src/utils/conversation-scorer.ts` (NEW)

```typescript
export const ADMIN_IDS = {
  JON_NOLEN: '6614158',
  // Add Mark's ID when found
};

export function scoreAdminResponse(message: {
  author_id?: string;
  body_clean: string;
  created_at: number;
  response_time_from_user_message?: number;
}): number {
  let score = 0;

  // Author priority
  if (message.author_id === ADMIN_IDS.JON_NOLEN) {
    score += 10; // Jon = highest priority
  } else {
    score += 3;  // Other admins
  }

  // Quality indicators
  if (message.body_clean.length > 100) score += 1; // Detailed response
  if (message.body_clean.includes('```') || message.body_clean.includes('code')) score += 2; // Has code
  if (message.body_clean.match(/https?:\/\//)) score += 1; // Has links
  if (message.response_time_from_user_message && message.response_time_from_user_message < 3600) score += 1; // Fast (<1hr)

  return score;
}

export function findBestResponse(responses: AdminResponse[]): AdminResponse | null {
  if (responses.length === 0) return null;

  return responses
    .map(r => ({
      response: r,
      score: scoreAdminResponse(r)
    }))
    .sort((a, b) => b.score - a.score)[0]?.response || null;
}
```

#### Commit 3: Build Question Index
**File:** `src/scripts/build-question-index.ts` (NEW)

```typescript
/**
 * Build searchable question index from saved threads
 */

interface QuestionIndexEntry {
  question_id: string;
  conversation_id: string;
  question_text: string;
  question_keywords: string[];  // Tokenized for search

  // Best answer (scored)
  best_answer: {
    text: string;
    author_id: string;
    author_name: string;
    priority_score: number;
    created_at: number;
    resolution_time_hours: number;
  } | null;

  // All admin responses (for testing/comparison)
  all_responses: Array<{
    text: string;
    author_id: string;
    author_name: string;
    score: number;
  }>;

  // Relevant notes (Jon's explanations)
  notes: Array<{
    text: string;
    author_name: string;
    is_from_jon: boolean;
  }>;

  // Metadata
  category: string;  // error type or topic
  tags: string[];
  asked_count: number;  // How many similar questions
  last_asked: number;
}

async function buildQuestionIndex() {
  // 1. Load saved threads
  // 2. Extract first questions
  // 3. Find best admin response for each
  // 4. Include relevant notes
  // 5. Tokenize for search
  // 6. Save index
}
```

**Output:** `data/conversation-analysis/question-index-[timestamp].json`

---

## 🎨 **Phase 2-5: UI & Agent (Unchanged)**

Same as original plan, but now we have:
- ✅ Full conversation threads saved
- ✅ Admin notes extracted
- ✅ Response versioning working
- ✅ Search index built

---

## 📈 **Impact Assessment**

### Before Discovery
- ❌ Thought we needed new fetching logic
- ❌ Didn't know if notes existed
- ❌ Unclear about conversation structure
- ⚠️ Planned to rebuild everything

### After Discovery
- ✅ Use existing fetch, save more data
- ✅ Notes exist as `part_type === "note"`
- ✅ Full structure documented
- ✅ Just modify one script, build on top

### Effort Reduction
- **Before:** 11 commits, 3-4 days
- **After:** ~8 commits, 2-3 days (30% faster!)

---

## 🚀 **Next Steps**

1. ✅ **Discovery complete**
2. **Commit 1:** Modify `full-conversation-analysis.ts` to save threads
3. **Commit 2:** Build response scoring util
4. **Commit 3:** Build question index
5. **Then:** UI components (as originally planned)

---

## 📝 **Key Takeaways**

1. **We were 90% there** - just needed to save more of what we already fetch
2. **Notes DO exist** - as conversation parts with `part_type === "note"`
3. **Jon's ID is 6614158** - use for priority scoring
4. **HTML cleaning works** - already implemented and tested
5. **Simple is better** - don't rebuild, enhance what works

---

**Recommendation:** Start with Commit 1 tomorrow - modify the analysis script to save full threads. Test with 10 conversations first, then run on all 1,068.

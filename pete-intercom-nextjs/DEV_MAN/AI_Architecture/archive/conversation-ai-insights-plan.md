# AI-Powered Conversation Insights Plan

## Overview
Add LangGraph AI agent to the conversations page to analyze conversation patterns, identify gaps, generate Mermaid diagrams, and provide actionable insights to admins.

## Goals
1. **AI Chat Interface** - Add PeteAI chat widget to `/admin/conversations` page
2. **Conversation Analysis** - Use existing LangGraph agent to analyze conversation data
3. **Mermaid Diagrams** - Generate visual process flows based on conversation patterns
4. **Pattern Detection** - Identify what works, what fails, common issues, escalation triggers
5. **Category-based Analysis** - Filter by Intercom tags/categories for focused insights

## Architecture

### Data Flow
```
Conversation Data (Already Fetched)
    ↓
User Asks Question in Chat Widget
    ↓
LangGraph Agent (with Conversation Tools)
    ↓
NLP Analysis + Mermaid Generation
    ↓
Display Results + Diagrams
```

### Components to Build

#### 1. **Conversation Analysis Action** (`src/actions/conversation-analysis.ts`)
```typescript
export async function analyzeConversationPatterns(filters?: {
  category?: string;
  tag?: string;
  dateRange?: { start: Date; end: Date };
}): Promise<ActionResult<ConversationAnalysis>>

export interface ConversationAnalysis {
  totalAnalyzed: number;
  successPatterns: Pattern[];
  failurePatterns: Pattern[];
  escalationTriggers: string[];
  commonIssues: Issue[];
  resolutionStrategies: Strategy[];
  mermaidDiagram: string;
}
```

#### 2. **LangGraph Conversation Tools** (`src/lib/langgraph/tools/conversation-tools.ts`)
```typescript
// Add conversation-specific tools to existing agent
- getConversationsByCategory
- getEscalatedConversations
- getResolvedConversations
- analyzeConversationFlow
- generateConversationMermaid
```

#### 3. **Chat Widget Component** (`src/components/conversations/ConversationInsightsChat.tsx`)
- Reuse PeteAI chat interface
- Pre-loaded prompts for conversation analysis
- Display Mermaid diagrams inline
- Category/tag filters

#### 4. **Mermaid Generator** (`src/lib/conversation-mermaid.ts`)
```typescript
export function generateConversationFlowDiagram(
  conversations: Conversation[],
  category?: string
): string

// Generates diagrams showing:
// - Customer journey through conversation
// - Resolution paths (successful vs. failed)
// - Escalation points
// - Common touchpoints
```

## Implementation Steps

### Phase 1: Data Preparation (30 min)
- [x] Read existing conversation types
- [ ] Create `ConversationAnalysis` interface
- [ ] Add conversation analysis utilities
- [ ] Create Mermaid generation function

### Phase 2: LangGraph Integration (1 hour)
- [ ] Add conversation tools to LangGraph agent
- [ ] Create conversation analysis prompts
- [ ] Test agent with sample conversation data
- [ ] Ensure proper type handling

### Phase 3: UI Components (1 hour)
- [ ] Create `ConversationInsightsChat` component
- [ ] Add chat widget to conversations page
- [ ] Implement category/tag filters
- [ ] Add Mermaid diagram renderer

### Phase 4: Testing & Refinement (30 min)
- [ ] Test with real conversation data
- [ ] Verify Mermaid diagrams render correctly
- [ ] Test filtering by category/tag
- [ ] Ensure performance with large datasets

## Features

### AI Analysis Capabilities

1. **Success Pattern Detection**
   - What resolved conversations quickly?
   - Which responses led to customer satisfaction?
   - Best practices from successful tickets

2. **Failure Analysis**
   - Common reasons for escalation
   - Unresolved conversation patterns
   - Customer frustration indicators

3. **Process Optimization**
   - Bottlenecks in conversation flow
   - Average resolution time by category
   - Recommendations for improvement

4. **Mermaid Visualizations**
   - Customer journey maps
   - Resolution decision trees
   - Escalation flowcharts
   - Category-specific patterns

### Example Prompts

```
"Show me onboarding conversation patterns from the last month"

"What causes escalations in technical support conversations?"

"Generate a flowchart of successful data upload conversations"

"What are the common issues in conversations tagged as 'pete-mobile'?"

"Show me the resolution strategies for billing questions"
```

## Data Sources

### Intercom Conversation Fields
```typescript
interface Conversation {
  id: string;
  title: string;
  state: 'open' | 'closed' | 'snoozed';
  tags: Tag[];
  priority: boolean;
  conversation_parts: Part[];
  created_at: number;
  updated_at: number;
  statistics: {
    time_to_first_close: number;
    median_time_to_reply: number;
  };
}
```

### Analysis Categories
- Onboarding
- Data Upload
- Training
- Technical Issues
- Billing
- Feature Requests
- Escalations (tagged)

## Success Metrics

- **Response Time**: How quickly can AI generate insights?
- **Accuracy**: Are identified patterns actually meaningful?
- **Actionability**: Can admins take action based on insights?
- **Visual Quality**: Are Mermaid diagrams clear and useful?

## Files to Create/Modify

### New Files
1. `src/actions/conversation-analysis.ts` - Analysis server actions
2. `src/lib/langgraph/tools/conversation-tools.ts` - LangGraph tools
3. `src/lib/conversation-mermaid.ts` - Mermaid generator
4. `src/components/conversations/ConversationInsightsChat.tsx` - Chat UI
5. `src/types/conversation-analysis.ts` - TypeScript types

### Modified Files
1. `src/app/admin/conversations/page.tsx` - Add chat widget
2. `src/lib/langgraph/agent.ts` - Register conversation tools
3. `src/components/conversations/ConversationsPageClient.tsx` - Add insights section

## Timeline
- **Total Estimated Time**: 3 hours
- **Priority**: HIGH
- **Dependencies**: Existing LangGraph agent, Conversation data already fetched

## Notes
- Leverage existing Mermaid diagram component from onboarding insights
- Reuse PeteAI chat interface for consistency
- Use server actions for all AI analysis (keep client-side lightweight)
- Consider caching AI responses for common queries
- Tag-based filtering is critical for focused analysis

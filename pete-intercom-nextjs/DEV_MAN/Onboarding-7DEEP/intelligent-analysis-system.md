# Intelligent Onboarding Analysis System
## PeteAI LangGraph Integration with Questionnaire Results

**Date:** 2025-09-30
**Status:** Design Phase
**Build Time:** ~1 day (we have most components)

---

## 🎯 Vision

After completing the 7-levels deep questionnaire, user gets an **intelligent AI agent** (PeteAI) that:
- Has full context from questionnaire + uploads + cached data
- Can have a conversation about onboarding improvements
- Generates Chart.js visualizations
- References specific client tickets and patterns
- Recommends what to build first based on data

**Like talking to Claude, but it's the PeteAI agent with your business context.**

---

## 📊 Data Sources Available

### ✅ Already Accessible
1. **Questionnaire Responses** (`data/questionnaire-responses/*.json`)
   - 56 answers across 8 sections
   - Resolution category
   - Timestamps

2. **Uploaded Documents**
   - intake-l1: Full onboarding intake JSON (5,232 chars)
   - Parsed and stored in response

3. **Intercom Cache** (`cache/intercom-cache.json`)
   - 410 Contacts
   - 94 Companies
   - 1,022 Conversations
   - All with tags, timestamps, metadata

4. **Existing PeteAI Endpoint** (`/PeteAI/`)
   - OpenRouter Llama 3.2 3B
   - Already functional
   - Can be enhanced with context

### 🔧 Needs to Be Added
5. **URLs from Answers** (Not currently extracted)
   - Parse URLs from questionnaire text
   - Fetch and store content
   - Reference in analysis

6. **help.thepete.io API** (Mentioned but not integrated)
   - Training content
   - Article catalog
   - Loom videos

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│              Questionnaire Completed                      │
│         (session-1759237858051.json saved)               │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│          Analysis Pipeline (Server Action)                │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  1. Load Session Data                                      │
│     ├─ Questionnaire responses                            │
│     ├─ Uploaded documents                                 │
│     └─ Extract URLs from answers                          │
│                                                            │
│  2. Load Context Data                                      │
│     ├─ Intercom cache (conversations, contacts)           │
│     ├─ Onboarding-related tickets                         │
│     └─ Failed vs successful patterns                      │
│                                                            │
│  3. Generate Insights                                      │
│     ├─ NLP keyword analysis                               │
│     ├─ Pattern recognition                                │
│     ├─ Chart data preparation                             │
│     └─ Mermaid diagram generation                         │
│                                                            │
│  4. Initialize PeteAI Agent                                │
│     ├─ System prompt with full context                    │
│     ├─ Tools: analyze, visualize, recommend               │
│     └─ Memory: session data + cache                       │
│                                                            │
└────────────────┬─────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────┐
│        Results Page with AI Agent                         │
│  /admin/onboarding-responses/[sessionId]/analysis        │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────────────────────────────┐         │
│  │   Static Analysis (Pre-generated)            │         │
│  ├─────────────────────────────────────────────┤         │
│  │  • Mermaid process diagram                   │         │
│  │  • ASCII decision tree                        │         │
│  │  • Key quotes & patterns                      │         │
│  │  • Chart.js visualizations                    │         │
│  │    - Pain point frequency                     │         │
│  │    - "I don't know" moments                   │         │
│  │    - Resolution category breakdown            │         │
│  │    - Successful vs failed comparison          │         │
│  └─────────────────────────────────────────────┘         │
│                                                            │
│  ┌─────────────────────────────────────────────┐         │
│  │   Interactive AI Agent (PeteAI LangGraph)    │         │
│  ├─────────────────────────────────────────────┤         │
│  │                                               │         │
│  │  [Chat Interface]                             │         │
│  │  ┌─────────────────────────────────────────┐│         │
│  │  │ You: What should we build first?       ││         │
│  │  │                                         ││         │
│  │  │ PeteAI: Based on your responses,      ││         │
│  │  │ the Canvas Kit onboarding widget is   ││         │
│  │  │ the highest priority. You mentioned   ││         │
│  │  │ it 3 times and it addresses your      ││         │
│  │  │ #1 pain point: unclear                ││         │
│  │  │ client/Pete responsibilities.         ││         │
│  │  │                                         ││         │
│  │  │ I see 127 onboarding conversations    ││         │
│  │  │ in your cache, with "data upload"     ││         │
│  │  │ mentioned 47 times as a problem.      ││         │
│  │  │                                         ││         │
│  │  │ [Chart: Ticket Frequency by Issue]    ││         │
│  │  │ [Link: Conversation #12345]           ││         │
│  │  └─────────────────────────────────────────┘│         │
│  │                                               │         │
│  │  Suggested Questions:                         │         │
│  │  • Show me failed onboarding examples         │         │
│  │  • What do successful clients have in common? │         │
│  │  • Which CRM causes the most issues?          │         │
│  │  • Estimate ROI for Canvas Kit widget         │         │
│  └─────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Plan (1 Day Build)

### Hour 1-2: Analysis Pipeline
**File:** `src/actions/questionnaire-analysis.ts`

```typescript
'use server';

import { getQuestionnaireSession } from './questionnaire';
import { analyzeOnboardingConversations } from './onboarding-analysis';

export interface AnalysisResult {
  session: QuestionnaireSession;
  insights: {
    painPoints: Array<{ keyword: string; frequency: number; quotes: string[] }>;
    breakthroughIdeas: Array<{ idea: string; questionId: string; verbatim: string }>;
    unknowns: Array<{ question: string; signal: 'gap' | 'opportunity' }>;
    uploadedDocs: Array<{ questionId: string; type: string; summary: string }>;
  };
  conversationData: {
    onboardingRelated: number;
    failurePatterns: Array<{ pattern: string; count: number; examples: string[] }>;
    successPatterns: Array<{ pattern: string; count: number }>;
  };
  chartData: {
    painPointFrequency: ChartData;
    resolutionBreakdown: ChartData;
    timelineAnalysis: ChartData;
  };
  diagrams: {
    mermaid: string;
    ascii: string;
  };
  agentContext: string; // Compressed context for PeteAI
}

export async function analyzeQuestionnaireSession(sessionId: string) {
  // 1. Load session
  const sessionResult = await getQuestionnaireSession(sessionId);
  if (!sessionResult.success) throw new Error('Session not found');

  const session = sessionResult.data!;

  // 2. Analyze questionnaire responses
  const insights = extractInsights(session.responses);

  // 3. Load and analyze Intercom cache
  const conversationData = await analyzeOnboardingConversations();

  // 4. Generate chart data
  const chartData = generateChartData(insights, conversationData);

  // 5. Generate diagrams
  const diagrams = generateDiagrams(session, insights);

  // 6. Prepare PeteAI context
  const agentContext = buildAgentContext(session, insights, conversationData);

  return {
    success: true,
    data: {
      session,
      insights,
      conversationData,
      chartData,
      diagrams,
      agentContext
    }
  };
}
```

### Hour 3-4: PeteAI Enhancement
**File:** `src/actions/peteai-onboarding.ts`

```typescript
'use server';

export async function chatWithOnboardingAgent(
  sessionId: string,
  message: string,
  conversationHistory: Message[]
) {
  // Load full analysis context
  const analysis = await analyzeQuestionnaireSession(sessionId);

  // Build system prompt with context
  const systemPrompt = `
You are PeteAI, an expert onboarding analyst for PeteIRE.

CONTEXT:
${analysis.data.agentContext}

QUESTIONNAIRE INSIGHTS:
- Top pain point: ${analysis.data.insights.painPoints[0].keyword}
- Breakthrough ideas: ${analysis.data.insights.breakthroughIdeas.length}
- Knowledge gaps: ${analysis.data.insights.unknowns.length}

HISTORICAL DATA:
- Onboarding conversations: ${analysis.data.conversationData.onboardingRelated}
- Common failures: ${analysis.data.conversationData.failurePatterns.map(p => p.pattern).join(', ')}

TOOLS AVAILABLE:
- generate_chart(type, data) - Create Chart.js visualization
- find_conversation(keyword) - Search Intercom cache
- estimate_effort(feature) - Calculate build time
- recommend_priority(features) - Rank by impact/effort

Answer questions about onboarding improvement, reference specific data, and provide actionable recommendations.
  `;

  // Call OpenRouter with enhanced context
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ]
    })
  });

  const data = await response.json();
  return { success: true, data: data.choices[0].message.content };
}
```

### Hour 5-6: Results Page UI
**File:** `src/app/admin/onboarding-responses/[sessionId]/analysis/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { analyzeQuestionnaireSession, chatWithOnboardingAgent } from '@/actions';
import { Chart } from 'react-chartjs-2';
import Mermaid from '@/components/mermaid';

export default function AnalysisPage({ params }: { params: { sessionId: string } }) {
  const [analysis, setAnalysis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    loadAnalysis();
  }, []);

  async function loadAnalysis() {
    const result = await analyzeQuestionnaireSession(params.sessionId);
    setAnalysis(result.data);
  }

  async function handleSendMessage() {
    const response = await chatWithOnboardingAgent(
      params.sessionId,
      input,
      messages
    );

    setMessages([
      ...messages,
      { role: 'user', content: input },
      { role: 'assistant', content: response.data }
    ]);
    setInput('');
  }

  if (!analysis) return <Loader />;

  return (
    <div className="space-y-8">
      {/* Static Analysis Section */}
      <section>
        <h2>Process Diagram</h2>
        <Mermaid chart={analysis.diagrams.mermaid} />
      </section>

      <section>
        <h2>Pain Point Analysis</h2>
        <Chart type="bar" data={analysis.chartData.painPointFrequency} />
      </section>

      <section>
        <h2>Key Insights</h2>
        {analysis.insights.painPoints.map(p => (
          <InsightCard key={p.keyword} insight={p} />
        ))}
      </section>

      {/* Interactive AI Agent */}
      <section className="border-t-4 border-purple-600 pt-8">
        <h2 className="text-3xl font-bold mb-4">
          💬 Ask PeteAI About Your Onboarding
        </h2>
        <p className="text-muted-foreground mb-6">
          I have full context from your questionnaire, uploaded docs, and {analysis.conversationData.onboardingRelated} historical conversations
        </p>

        <ChatInterface
          messages={messages}
          onSend={handleSendMessage}
          input={input}
          setInput={setInput}
          suggestedQuestions={[
            "What should we build first?",
            "Show me failed onboarding examples",
            "Which CRM causes the most issues?",
            "Estimate ROI for Canvas Kit widget"
          ]}
        />
      </section>
    </div>
  );
}
```

### Hour 7-8: Chart.js Integration & Polish

**Charts to Generate:**
1. **Pain Point Frequency** - Bar chart of keywords
2. **"I Don't Know" Signals** - Highlight knowledge gaps
3. **Resolution Category** - Pie chart (Education, Coding, Process, etc.)
4. **Timeline Analysis** - When delays happen
5. **Conversation Sentiment** - Failed vs successful onboarding
6. **CRM Comparison** - Which systems cause most issues

---

## 🎨 Example Interaction

**User:** "What should we build first?"

**PeteAI:**
> Based on your 7-levels deep analysis, here's my recommendation:
>
> **Priority 1: Canvas Kit Onboarding Widget** (Build Time: ~3 days)
>
> **Why:**
> - You mentioned it 3x (questions: metrics-l6, metrics-l7, training-l7)
> - Addresses your #1 pain point: unclear responsibilities (mentioned 12x)
> - "Making onboarding like a game where you get points" - your own idea
>
> **Data Supporting This:**
> - 127 onboarding conversations in cache
> - 47 mention "data upload" as problem
> - 32 mention "unclear what's next"
> - First impressions matter (timeline-l4): "if you dont get this right they dont believe you will get anything correct"
>
> [Chart: Issue Frequency Analysis]
>
> **What the widget should include:**
> 1. ✅ Checklist progress (client + Pete tasks)
> 2. 📊 Real-time health score
> 3. 🎯 Next action clarity
> 4. 🔗 Integration with help.thepete.io
>
> **I can generate:**
> - Technical spec
> - Canvas Kit component structure
> - Integration points
>
> Want me to draft the implementation plan?

---

## 📦 What We Already Have

✅ **PeteAI Endpoint** - `/PeteAI/` working
✅ **Intercom Cache** - 1,022 conversations loaded
✅ **Questionnaire System** - Responses stored
✅ **Chart.js** - Can be added via `pnpm add react-chartjs-2 chart.js`
✅ **Mermaid** - Already rendering diagrams
✅ **Canvas Kit Utils** - Some widgets exist

---

## 🚀 What Needs to Be Built

### 1 Day Sprint:
1. ⏱️ **2 hours** - Analysis pipeline + insight extraction
2. ⏱️ **2 hours** - PeteAI enhancement with context loading
3. ⏱️ **2 hours** - Results page UI with static analysis
4. ⏱️ **2 hours** - Chat interface + Chart.js integration

### Total: **8 hours = 1 day**

---

## 🎯 Success Criteria

**After completion, user can:**
- ✅ Complete questionnaire with file uploads
- ✅ See comprehensive analysis with diagrams
- ✅ Have interactive conversation with PeteAI agent
- ✅ Get specific recommendations with data backing
- ✅ See Chart.js visualizations of patterns
- ✅ Reference specific Intercom conversations
- ✅ Export full analysis report

**The agent should feel like talking to Claude, but with your business context.**

---

## 📝 Notes

- URLs in answers need parsing (not currently extracted)
- help.thepete.io API needs documentation
- Loom video catalog needs structure
- Consider rate limiting for OpenRouter calls
- Cache analysis results to avoid re-processing

---

*This transforms the questionnaire from static Q&A into an intelligent discovery system powered by your actual business data.*
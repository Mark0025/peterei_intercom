# Conversation Knowledge System - Visual Roadmap

## 🗺️ Implementation Phases

```mermaid
graph TD
    A[Phase 1: Data Collection] --> B[Phase 2: Similarity Search]
    B --> C[Phase 3: UI Components]
    C --> D[Phase 4: Agent Enhancement]
    D --> E[Phase 5: Testing & Deployment]

    A --> A1[Commit 1: Fetch conversation threads]
    A --> A2[Commit 2: Fetch admin notes]
    A --> A3[Commit 3: Response versioning]

    B --> B1[Commit 4: Keyword similarity search]

    C --> C1[Commit 5: Timeline component]
    C --> C2[Commit 6: Search component]
    C --> C3[Commit 7: Admin dashboard]

    D --> D1[Commit 8: LangGraph tools]
    D --> D2[Commit 9: Testing interface]

    E --> E1[Commit 10: API routes]
    E --> E2[Commit 11: Documentation]
```

## 📊 Data Flow Architecture

```mermaid
flowchart LR
    IA[Intercom API] --> Cache[Cache Layer]
    Cache --> Analysis[Analysis Scripts]
    Analysis --> KB[(Knowledge Base)]

    KB --> Admin[Admin Dashboard]
    KB --> Agent[Pete AI Agent]

    Admin --> Timeline[Timeline Views]
    Admin --> Search[Search Interface]
    Admin --> Test[Testing Tool]

    Agent --> AdminTools[Admin Tools:<br/>Full Context]
    Agent --> PublicTools[Public Tools:<br/>Anonymized]

    style KB fill:#9333ea
    style Admin fill:#ec4899
    style Agent fill:#ec4899
    style AdminTools fill:#f59e0b
    style PublicTools fill:#10b981
```

## 🔐 Access Control Flow

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant Clerk
    participant API
    participant Agent

    User->>UI: Request conversation data
    UI->>Clerk: Check authentication
    Clerk-->>UI: userId + email

    alt Is Admin (@peterei.com)
        UI->>API: Request with admin context
        API->>Agent: Load admin tools
        Agent-->>API: Full data + sensitive info
        API-->>UI: Complete conversation threads
        UI-->>User: Show timeline + notes + names
    else Is Public
        UI->>API: Request with public context
        API->>Agent: Load public tools only
        Agent-->>API: Anonymized answers
        API-->>UI: Sanitized responses
        UI-->>User: Show generalized answers
    end
```

## 🎨 UI Component Hierarchy

```mermaid
graph TD
    Page[/admin/insights/conversations]
    Page --> Tabs[Tabs Component]

    Tabs --> Tab1[Search Tab]
    Tabs --> Tab2[Top Questions Tab]
    Tabs --> Tab3[Timelines Tab]
    Tabs --> Tab4[Testing Tab]

    Tab1 --> Search[SimilarQuestionsSearch]
    Search --> Results[Search Results List]
    Results --> QuestionCard[SimilarQuestionCard]

    Tab3 --> Timeline[ConversationTimeline]
    Timeline --> Mermaid[Mermaid Journey Diagram]
    Timeline --> Messages[Message List]
    Messages --> MessageCard[MessageCard]
    Timeline --> Notes[NotesSection]

    Tab4 --> Testing[AgentTestingInterface]
    Testing --> Comparison[ComparisonReport]

    style Page fill:#9333ea,color:#fff
    style Tabs fill:#ec4899,color:#fff
    style Search fill:#8b5cf6,color:#fff
    style Timeline fill:#8b5cf6,color:#fff
    style Testing fill:#8b5cf6,color:#fff
```

## 🧬 Response Versioning Logic

```mermaid
flowchart TD
    Conv[Conversation Thread] --> Extract[Extract All Admin Responses]
    Extract --> Score[Score Each Response]

    Score --> Jon{Is Jon Nolen?}
    Jon -->|Yes| JonScore[Base Score: 10]
    Jon -->|No| OtherScore{Is Mark?}
    OtherScore -->|Yes| MarkScore[Base Score: 5]
    OtherScore -->|No| DefaultScore[Base Score: 3]

    JonScore --> Modifiers[Apply Modifiers]
    MarkScore --> Modifiers
    DefaultScore --> Modifiers

    Modifiers --> HasCode{Has code<br/>examples?}
    HasCode -->|Yes| AddCode[+2 points]
    HasCode -->|No| HasLinks{Has help<br/>doc links?}

    AddCode --> HasLinks
    HasLinks -->|Yes| AddLinks[+1 point]
    HasLinks -->|No| Speed{Fast response<br/>&lt;1 hour?}

    AddLinks --> Speed
    Speed -->|Yes| AddSpeed[+1 point]
    Speed -->|No| FinalScore[Final Score]

    FinalScore --> Rank[Rank All Responses]
    Rank --> Best[Return Highest Scored]

    style Best fill:#10b981,color:#fff
    style JonScore fill:#f59e0b,color:#000
```

## 🔍 Similarity Search Process

```mermaid
flowchart LR
    Query[User Question] --> Tokenize[Tokenize Query]
    Tokenize --> LoadIndex[(Load Question Index)]

    LoadIndex --> Compare[Compare with All Questions]
    Compare --> Keywords[Calculate Keyword Overlap]
    Keywords --> TFIDF[TF-IDF Scoring]

    TFIDF --> Rank[Rank by Similarity]
    Rank --> Top5[Return Top 5 Matches]

    Top5 --> Admin{Is Admin User?}
    Admin -->|Yes| FullData[Return Full Context<br/>+ User Info + Notes]
    Admin -->|No| Anonymize[Anonymize Data<br/>Remove PII]

    FullData --> Display[Display Results]
    Anonymize --> Display

    style Query fill:#ec4899,color:#fff
    style FullData fill:#f59e0b,color:#000
    style Anonymize fill:#10b981,color:#fff
```

## 🧪 Agent Testing Flow

```mermaid
sequenceDiagram
    participant Admin
    participant TestUI
    participant Search
    participant Agent
    participant Compare

    Admin->>TestUI: Enter test question
    TestUI->>Search: Find historical answer
    Search-->>TestUI: Jon's original response

    TestUI->>Agent: Ask same question
    Agent-->>TestUI: Current agent response

    TestUI->>Compare: Compare answers
    Compare->>Compare: Calculate similarity score
    Compare->>Compare: Check for key concepts
    Compare->>Compare: Verify accuracy

    Compare-->>TestUI: Comparison report
    TestUI-->>Admin: Side-by-side display<br/>+ quality metrics

    Note over Admin,Compare: Continuous improvement loop
```

## 📅 Timeline (Estimated 3-4 days)

```mermaid
gantt
    title Conversation Knowledge System Implementation
    dateFormat YYYY-MM-DD
    section Data Layer
    Fetch conversation threads           :a1, 2025-10-17, 4h
    Fetch admin notes                    :a2, after a1, 3h
    Implement response scoring           :a3, after a2, 2h

    section Backend
    Build similarity search              :b1, after a3, 4h
    Create API routes                    :b2, after b1, 3h

    section UI Components
    Timeline component                   :c1, after b1, 4h
    Search component                     :c2, after c1, 3h
    Testing interface                    :c3, after c2, 3h
    Admin dashboard page                 :c4, after c2, 2h

    section Agent
    Add new LangGraph tools              :d1, after b2, 4h
    Implement access control             :d2, after d1, 2h

    section Testing
    Unit tests                           :e1, after d2, 3h
    Integration tests                    :e2, after e1, 2h
    Manual QA                           :e3, after e2, 2h

    section Deploy
    Documentation                        :f1, after e3, 2h
    Deploy to Render                     :f2, after f1, 1h
```

## 🎯 Success Criteria Checklist

### Data Quality ✅
- [ ] All conversation threads fetched completely
- [ ] Admin notes properly attributed (Jon vs Mark)
- [ ] No HTML artifacts in message bodies
- [ ] Response scores calculated correctly

### UI/UX ✅
- [ ] Timeline diagrams render without errors
- [ ] Search returns relevant results in <500ms
- [ ] Mobile responsive design works perfectly
- [ ] Pete branding (purple gradients) preserved
- [ ] Components use shadcn/ui patterns (DRY)

### Security ✅
- [ ] Clerk authentication required for admin routes
- [ ] Public users never see sensitive data
- [ ] Admin tools only available to @peterei.com users
- [ ] No PII leaks in anonymized responses

### Agent Intelligence ✅
- [ ] Finds similar past questions accurately
- [ ] Prioritizes Jon's responses over Mark's
- [ ] Generates meaningful journey diagrams
- [ ] Testing shows improvement over baseline

### Performance ✅
- [ ] Dashboard loads in <2 seconds
- [ ] Search completes in <500ms
- [ ] No new caching issues introduced
- [ ] Agent response time unchanged

## 🚨 Critical Dependencies

```mermaid
graph TD
    A[Intercom API Access] --> B[Cache System]
    B --> C[Analysis Scripts]

    D[Clerk Auth] --> E[Admin Routes]
    E --> F[Sensitive Data Access]

    G[shadcn/ui] --> H[UI Components]
    H --> I[Consistent Design]

    J[LangGraph Agent] --> K[New Tools]
    K --> L[Smart Search]

    M[HTML Cleaner] --> N[Clean Text]
    N --> O[Quality Data]

    style A fill:#ef4444,color:#fff
    style D fill:#ef4444,color:#fff
    style G fill:#ef4444,color:#fff
    style J fill:#ef4444,color:#fff
    style M fill:#ef4444,color:#fff
```

---

## 📝 Quick Reference

### Key Files to Modify
- ✏️ `src/scripts/full-conversation-analysis.ts` - Add threads/notes
- ✏️ `src/services/langraph-agent.ts` - Add new tools
- ✏️ `src/services/intercom.ts` - May need cache updates

### New Files to Create
- 🆕 `src/services/similarity-search.ts`
- 🆕 `src/utils/conversation-scorer.ts`
- 🆕 `src/utils/journey-diagram-generator.ts`
- 🆕 `src/components/conversations/*.tsx` (6 files)
- 🆕 `src/app/(admin)/admin/insights/conversations/page.tsx`
- 🆕 `src/app/api/conversations/**/*.ts` (3 routes)

### Data Output Locations
- 📁 `data/conversation-analysis/threads/`
- 📁 `data/conversation-analysis/notes/`
- 📁 `data/conversation-analysis/index/`

---

**Ready to start?** Begin with Commit 1: Fetch conversation threads 🚀

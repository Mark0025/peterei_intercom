# AI Architecture Documentation

**Last Updated:** 2025-10-09

This folder contains comprehensive documentation for Pete's multi-agent LangGraph AI system.

## 📁 Document Structure

### Current Documentation

1. **[00-AI-ARCHITECTURE-OVERVIEW.md](./00-AI-ARCHITECTURE-OVERVIEW.md)** ⭐ **START HERE**
   - Complete agent comparison matrix
   - Core similarities and key differences
   - Detailed agent profiles
   - Architecture patterns
   - Session management
   - Integration points
   - Best practices

### Archive

- `archive/` - Old planning docs (pre-implementation)
  - `intercom-ai-agent-integration-plan.md` - Original planning
  - `conversation-ai-insights-plan.md` - Conversation agent planning

## 🤖 Our Three AI Agents

| Agent | Purpose | Status |
|-------|---------|--------|
| **LangGraph Agent** | General help & data queries | ✅ Production (with history) |
| **Conversation Agent** | Pattern analysis | ✅ Production (stateless) |
| **Onboarding Agent** | Strategic discovery | ✅ Production (stateless) |

## 🔗 Quick Links

### Code Files
- **LangGraph Agent:** `src/services/langraph-agent.ts`
- **Conversation Agent:** `src/services/conversation-agent.ts`
- **Onboarding Agent:** `src/services/onboarding-agent.ts`
- **Actions Layer:** `src/actions/peteai.ts`
- **API Route:** `src/app/api/PeteAI/route.ts`

### Frontend Integration
- **Help Center:** `src/components/help/PeteAIChat.tsx`
- **General Chat:** `src/components/PeteAIChat.tsx`
- **Conversation Insights:** `src/components/conversations/ConversationInsightsChat.tsx`

### Recent Issues
- [#39 - Conversation History Implementation](https://github.com/Mark0025/peterei_intercom/issues/39)
- [#38 - Agent Fallback Debugging](https://github.com/Mark0025/peterei_intercom/issues/38)
- [#37 - Response Parsing Fix](https://github.com/Mark0025/peterei_intercom/issues/37)

## 📊 Key Features

### ✅ Conversation History & Persistence (NEW - Oct 2025)

**LangGraph MemorySaver (Agent-level):**
- Multi-turn conversation support
- Thread-based session management
- Follow-up questions maintain context

**localStorage Persistence (Frontend):**
- Conversation history survives page reloads (commit 90cc969)
- Unique guest user IDs for identity (commit 324dde4)
- History sidebar with session resume (commit 91efb20)

**Admin Logging System (Backend):**
- All AI conversations tracked (commit 6cb7b29)
- Full CRUD operations for conversation management (commit 5be1dce)
- File-based JSON logging in `data/conversation-logs/`
- Admin interface at `/admin/settings/ai` and `/admin/logs`

### 🎯 Specialized Tools
- **15+ tools** in LangGraph Agent (help docs, contacts, companies)
- **8 tools** in Conversation Agent (pattern analysis)
- **7 tools** in Onboarding Agent (strategic insights)

### 🎨 Mermaid Diagrams
- Process maps (step-by-step instructions)
- Flow charts (resolution paths, escalations)
- Chart data (pain points, timelines)

### 🔒 Clean Error Handling
- No silent fallbacks (removed cache fallback)
- Generic user messages
- Detailed API/console logging
- Full-stack error handling

## 🚀 Getting Started

### For Developers

**Read first:**
1. [00-AI-ARCHITECTURE-OVERVIEW.md](./00-AI-ARCHITECTURE-OVERVIEW.md) - Full architecture
2. Check agent comparison matrix
3. Review integration points
4. See best practices section

**Adding a new tool:**
```typescript
const myTool = tool(
  async ({ param }: { param: string }) => {
    try {
      const result = await operation(param);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  {
    name: "my_tool",
    description: "Clear description for LLM",
    schema: z.object({
      param: z.string().describe("Parameter description")
    })
  }
);
```

**Adding conversation history to an agent:**
See "Best Practices" section in 00-AI-ARCHITECTURE-OVERVIEW.md

### For Product/Business

**Key insights from architecture:**
- **LangGraph Agent** - User-facing, best for help & general queries
- **Conversation Agent** - Admin analytics for support optimization
- **Onboarding Agent** - Strategic planning and discovery

**Current capabilities:**
- Multi-turn conversations (LangGraph Agent only)
- Real-time Intercom data access
- Automatic help doc fetching
- Visual process maps
- Conversation pattern analysis
- Strategic recommendations with ROI

## 📈 Metrics & Monitoring

**Current monitoring:**
- API logs: `logs/api.log`
- Application logs: `logs/app.log`
- Console logs: Browser dev tools

**Log format:**
```
[PeteAI] Request (session: help-123): how do i upload...
[PeteAI] Success (session: help-123) - 1234 chars
[PeteAI] Contains Mermaid: true
[LangGraph] Processing message (thread: help-123)
[LangGraph] Total messages in thread: 5
```

## 🔧 Troubleshooting

### Issue: Agent not responding
1. Check `OPENROUTER_API_KEY` in environment
2. Check API logs for errors
3. Verify session ID is passed correctly
4. Check browser console for frontend errors

### Issue: No conversation history
1. Only LangGraph Agent supports history (as of 2025-10-08)
2. Verify sessionId is generated and passed
3. Check MemorySaver checkpointer is configured
4. Verify thread_id is passed on invoke

### Issue: Tool not being called
1. Check tool description is clear for LLM
2. Verify Zod schema matches tool parameters
3. Check system prompt includes tool usage instructions
4. Review tool binding: `llm.bindTools(tools, { tool_choice: "auto" })`

## 🎯 Future Roadmap

### High Priority
- [ ] Add conversation history to Conversation Agent
- [ ] Add conversation history to Onboarding Agent
- [ ] Unified session management system

### Medium Priority
- [ ] Persistent checkpointing (SQLite/Postgres)
- [ ] Agent performance monitoring dashboard
- [ ] Tool usage analytics

### Low Priority
- [ ] A/B testing different models
- [ ] Custom fine-tuned models
- [ ] Multi-language support

## 📞 Support

**For AI architecture questions:**
- Email: mark@peterei.com
- GitHub: Create issue with `ai-architecture` label

**For implementation help:**
- See code comments in agent files
- Review integration points in overview doc
- Check best practices section

---

**Status:** ✅ Production Active (with persistent conversation history)
**Last Review:** 2025-10-09
**Next Review:** 2025-11-09

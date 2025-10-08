# DEV_MAN - Development Manual

**Purpose**: Centralized development documentation for Pete Intercom Next.js app.
**Last Updated**: 2025-10-08
**Maintained By**: Claude Code + Mark Carpenter

---

## 📁 Directory Structure

```
DEV_MAN/
├── README.md                          # ⭐ This file - start here
│
├── AI_Architecture/                   # 🤖 AI agents & LangGraph system
│   ├── 00-AI-ARCHITECTURE-OVERVIEW.md  # Comprehensive AI architecture (40+ pages)
│   ├── README.md                       # Quick reference guide
│   └── archive/                        # Old AI planning docs
│
├── Application_Security/              # 🔒 Security architecture & compliance
│   ├── 00-SECURITY-OVERVIEW.md         # Security architecture overview
│   ├── 01-CLERK-SECURITY-DEEP-DIVE.md  # Why Clerk + SOC 2 compliance
│   ├── 02-DEVILS-ADVOCATE-ANALYSIS.md  # Red team security analysis
│   ├── 03-PRODUCTION-READINESS-CHECKLIST.md
│   ├── 04-INCIDENT-RESPONSE-PLAN.md
│   ├── README.md                       # Security docs navigation
│   └── DIAGRAM-FIX-SUMMARY.md
│
├── HelpDeskPlan/                      # 📚 Help desk & content strategy
│   ├── 01-research-and-audit.md
│   ├── 02-information-architecture.md
│   ├── 03-content-strategy.md
│   ├── 04-technical-implementation.md
│   ├── 05-architecture-patterns.md
│   └── README.md
│
├── HelpDesk/                          # 📝 Help desk analysis & content
│   ├── help-desk-architecture-analysis.md
│   ├── help-desk-content-rules.md
│   ├── help-desk-pure-architecture-analysis.md
│   ├── help-desk-reorganization-action-plan.md
│   ├── pete-help-desk-content-audit.md
│   └── competitor-content-categorization-analysis.md
│
├── Onboarding-7DEEP/                  # 🚀 7-levels deep discovery system
│   ├── feature-requests.md
│   ├── github-issues.md
│   ├── implementation-plan.md
│   ├── intelligent-analysis-system.md
│   └── progress-summary.md
│
├── Guidelines/                        # 📖 Best practices & standards
│   ├── tailwind-shadcn-best-practices.md
│   └── TYPESCRIPT-ANY-TYPES-PREVENTION.md
│
├── Planning/                          # 📋 Active & future plans
│   ├── clerk-integration-plan.md
│   ├── company-timeline-analysis-plan.md
│   ├── support-quality-analyzer-plan.md
│   └── TIMELINE-CHURN-ARCHITECTURE.md
│
├── Reports/                           # 📊 Status reports & learnings
│   ├── CONSOLIDATION-COMPLETE.md
│   ├── REPO-STATUS-REPORT.md
│   └── LEARNING-2025-01-company-timeline-planning.md
│
├── completed/                         # ✅ Archived completed work
│   ├── README.md
│   ├── migration/                     # Express → Next.js migration docs
│   └── express-app/                   # Legacy Express app docs
│
└── in-progress/                       # 🔨 Work in progress

```

---

## 🎯 Quick Links by Topic

### AI & Agents
- **Main Docs**: [AI_Architecture/](./AI_Architecture/)
- **Overview**: [00-AI-ARCHITECTURE-OVERVIEW.md](./AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md)
- **Three Agents**: LangGraph (general), Conversation (analytics), Onboarding (strategy)
- **Recent Issues**: #39, #38, #37

### Security
- **Main Docs**: [Application_Security/](./Application_Security/)
- **Start Here**: [00-SECURITY-OVERVIEW.md](./Application_Security/00-SECURITY-OVERVIEW.md)
- **Clerk Deep Dive**: [01-CLERK-SECURITY-DEEP-DIVE.md](./Application_Security/01-CLERK-SECURITY-DEEP-DIVE.md)
- **Production Ready**: [03-PRODUCTION-READINESS-CHECKLIST.md](./Application_Security/03-PRODUCTION-READINESS-CHECKLIST.md)

### Help Desk & Content
- **Planning**: [HelpDeskPlan/](./HelpDeskPlan/)
- **Analysis**: [HelpDesk/](./HelpDesk/)
- **Content Rules**: [HelpDesk/help-desk-content-rules.md](./HelpDesk/help-desk-content-rules.md)

### Development Guidelines
- **TypeScript**: [Guidelines/TYPESCRIPT-ANY-TYPES-PREVENTION.md](./Guidelines/TYPESCRIPT-ANY-TYPES-PREVENTION.md)
- **UI/UX**: [Guidelines/tailwind-shadcn-best-practices.md](./Guidelines/tailwind-shadcn-best-practices.md)

---

## 🚀 Active Projects

### 1. AI Architecture Documentation (#40)
**Status**: ✅ Complete (2025-10-08)
**Location**: `AI_Architecture/`
**Achievements**:
- Comprehensive 40+ page architecture doc
- Agent comparison matrix
- Session management with conversation history
- Best practices guide

### 2. Application Security Documentation
**Status**: ✅ Complete (2025-10-08)
**Location**: `Application_Security/`
**Achievements**:
- 121KB of security documentation
- 38 Mermaid diagrams
- Production readiness checklist
- Incident response plan

### 3. Conversation History Implementation (#39)
**Status**: ✅ Complete (2025-10-08)
**Achievements**:
- LangGraph MemorySaver checkpointing
- Thread-based session management
- Removed cache fallback
- Clean error handling at all layers

---

## 📋 Workflow

### Starting New Work
1. Check if plan exists in `Planning/` or relevant folder
2. If not, create `[feature-name]-plan.md` in appropriate folder
3. Create GitHub issue(s)
4. Link plan to issues
5. Update this README

### During Development
1. Update plan with progress checkmarks
2. Add learnings to `Reports/LEARNING-*.md`
3. Link commits to issues: `feat: description (#issue)`
4. Update documentation as you go

### Completing Work
1. Final testing
2. Update plan with ✅ complete status
3. Commit and close GitHub issue
4. Move plan to `completed/[plan-name]-issue-X.md`
5. Update this README

### GitHub Issue Creation
```bash
# Create issue with proper labels
gh issue create \
  --title "feat: [Feature Name]" \
  --body "See DEV_MAN/[folder]/[file].md for details" \
  --label "feature,documentation"
```

### Moving to Completed
```bash
# After closing issue #123
mv DEV_MAN/Planning/feature-plan.md DEV_MAN/completed/feature-plan-issue-123.md
git add DEV_MAN/
git commit -m "docs: archive completed plan (closes #123)"
```

---

## 🎓 Best Practices

### Documentation
1. **One Document Per Major Topic** - Keep files focused
2. **Use Descriptive Names** - `company-timeline-analysis-plan.md` not `plan.md`
3. **Include Diagrams** - Mermaid diagrams for complex systems
4. **Link to Code** - Reference actual files and line numbers
5. **Update Regularly** - Keep docs in sync with code

### Organization
1. **Right Folder** - AI docs → AI_Architecture, Security → Application_Security
2. **Archive Old Docs** - Move outdated docs to `archive/` folders
3. **README Navigation** - Update folder READMEs with new docs
4. **Git Integration** - Link docs to issues and commits

### Code Examples
- Include actual code snippets, not pseudocode
- Show file paths: `src/services/langraph-agent.ts`
- Reference line numbers when helpful
- Keep examples up-to-date with actual code

---

## 📊 Documentation Browser

**Live Documentation**: http://localhost:3000/admin/docs

Features:
- Full Mermaid diagram rendering
- Search across all docs
- Organized navigation
- Mobile-responsive

---

## 📈 Statistics

**Total Documentation**:
- 120+ markdown files
- 9 main folders
- 200+ pages of documentation
- 50+ Mermaid diagrams

**Recent Updates** (Last 7 days):
- AI Architecture comprehensive docs (#40)
- Application Security docs (#36)
- Conversation history implementation (#39)
- Response parsing fixes (#37, #38)

---

## 🔍 Finding Documentation

### By Topic
- **AI/Agents**: `AI_Architecture/`
- **Security**: `Application_Security/`
- **Help Desk**: `HelpDeskPlan/`, `HelpDesk/`
- **Onboarding**: `Onboarding-7DEEP/`
- **Guidelines**: `Guidelines/`
- **Plans**: `Planning/`
- **Reports**: `Reports/`
- **Completed**: `completed/`

### By Status
- **Active**: `Planning/`, `in-progress/`
- **Reference**: `Guidelines/`, `AI_Architecture/`, `Application_Security/`
- **Completed**: `completed/`
- **Archived**: `*/archive/` folders

### By Date
- **Latest**: Check git log: `git log --oneline -- DEV_MAN/`
- **This Week**: See "Recent Updates" section above
- **Historical**: See `completed/` folder

---

## ⚠️ Important Notes

### Git Workflow
- **Always** link docs to GitHub issues
- **Always** reference issue numbers in commits
- **Always** update READMEs when adding/moving docs
- **Never** delete docs - archive them instead

### File Naming
- Use kebab-case: `my-feature-plan.md`
- Include dates for reports: `LEARNING-2025-10-08-topic.md`
- Include issue numbers for archived files: `plan-issue-123.md`
- Use numbered prefixes for sequences: `01-first.md`, `02-second.md`

### Folder Rules
- **No loose files at root** - Only README.md belongs at DEV_MAN root
- **Archive old docs** - Don't let archive folders get cluttered
- **One topic per folder** - Keep related docs together
- **README in each folder** - Help people navigate

---

## 🔗 External Links

- **GitHub Repo**: https://github.com/Mark0025/peterei_intercom
- **Issues**: https://github.com/Mark0025/peterei_intercom/issues
- **Render Dashboard**: https://dashboard.render.com
- **Clerk Dashboard**: https://dashboard.clerk.com
- **Intercom**: https://app.intercom.com

---

## 📞 Support

**For documentation questions:**
- Email: mark@peterei.com
- GitHub: Create issue with `documentation` label
- Slack: #development (if applicable)

---

**Last Updated**: 2025-10-08
**Version**: 2.0 (Reorganized structure)
**Status**: ✅ Organized and up-to-date

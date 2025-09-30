# Pete Onboarding Discovery System - Implementation Plan

## Executive Summary

This is **NOT** a generic tool-building project. This is an analysis system to understand and improve the **EXISTING PeteIRE onboarding process** (200+ production users).

### Core Mission
Build a context-driven discovery system that:
- Analyzes REAL client data structures via CSV/XLSX uploads
- Generates DYNAMIC 7-levels-deep questions based on uploaded data patterns
- Uses **NLP-FIRST** approach to understand data relationships
- Enhances with PeteAI AFTER NLP analysis establishes structure
- Creates Mermaid diagrams showing current→desired state workflows
- Helps understand WHY processes exist, not just WHAT they are

### Philosophy: "Everything is Code"
Treat onboarding as code with structure, patterns, and logic that can be analyzed, refactored, and improved.

---

## Context Analysis

### From planv1raw.md (OpenAI Conversation)

**Key Insights:**

1. **Data Upload is Foundation** - If this fails, everything fails
   - Should clients own their upload using standardized templates?
   - Current problem: We extract data → own all errors → risk churn
   - Solution: Templates + validation + coaching = client accountability

2. **8 Decision Areas Identified:**
   - Data Upload Standardization
   - Marketing → Onboarding Handoff
   - Onboarding Intake (Discovery Questions)
   - Timeline Expectations
   - Data Scraping (Last Resort)
   - Pete Mobile Expectations
   - Client Expectations & Responsibilities
   - Workflows & Templates

3. **Failure Analysis Framework (F1-F8):**
   - Each failure categorized: Education | Coding | Expectations | Process | Data Validation
   - 7-levels deep "Why?" questioning for root cause analysis
   - Designed for Jon + churned clients interviews

4. **Success Definition Needed:**
   - Day 1: Core data + Twilio + 1 workflow
   - 30-day: Training complete + first campaign sent
   - Long-term: Client owns data hygiene + workflows

### From Excel Files Analysis

**Onboarding (1).xlsx:**
- 1000 rows × 4 columns
- Structure: Steps | Description | Factors | What is the issue 1
- Contains actual onboarding process breakdown
- Real pain points documented

**Pete Information (1).xlsx - 6 Sheets:**
1. **Onboarding Questions** (1001 rows) - Actual questions asked during onboarding
2. **Loom videos added to Intercom** (1001 rows) - Training materials catalog
3. **Pete Info** (1028 rows) - Product documentation/FAQs
4. **Templates** (1005 rows) - Workflow templates catalog
5. **Column Bugs** - Known issues
6. **Sheet12** - Utility scripts

---

## Architecture: NLP-First, AI-Enhanced

### Phase 1: NLP Analysis (Primary)
```
User uploads CSV/XLSX
    ↓
Parse structure (headers, data types, relationships)
    ↓
NLP Pattern Detection:
  - Column name analysis (semantic meaning)
  - Data type distribution (text, numbers, dates, emails)
  - Relationship detection (foreign keys, hierarchies)
  - Cardinality analysis (one-to-many, many-to-many)
  - Null patterns (required vs optional fields)
    ↓
Generate Data Profile:
  {
    objects: ["Contact", "Property", "Owner"],
    relationships: [{ from: "Property", to: "Owner", type: "many-to-one" }],
    requiredFields: ["email", "phone"],
    optionalFields: ["secondary_phone"],
    dataQualityIssues: ["23% missing emails", "duplicate phone numbers"]
  }
```

### Phase 2: Dynamic Question Generation
```
Data Profile
    ↓
EOS 7-Levels Question Generator:
  Level 1: "What is this field?" (Understanding)
  Level 2: "Why do you capture this?" (Purpose)
  Level 3: "How is it used in your workflow?" (Application)
  Level 4: "What happens if it's wrong?" (Impact)
  Level 5: "Why isn't this validated at source?" (Root Cause)
  Level 6: "What would fix this systematically?" (Solution)
  Level 7: "Why would that solution improve retention?" (Business Impact)
    ↓
Contextual Questions Array:
  [
    { field: "owner_email", level: 1, question: "Is owner_email the primary contact?" },
    { field: "owner_email", level: 2, question: "Why capture owner separately from property manager?" },
    ...
  ]
```

### Phase 3: Mermaid Diagram Generation
```
NLP Analysis + Question Responses
    ↓
Process Flow Extraction:
  - Identify workflow stages from data structure
  - Map dependencies between objects
  - Detect bottlenecks (high null rates, manual steps)
    ↓
Generate Mermaid Diagrams:
  - Current State (as-is from uploaded data)
  - Desired State (from questionnaire responses)
  - Gap Analysis (what needs to change)
```

### Phase 4: PeteAI Enhancement Layer
```
NLP Analysis Results
    ↓
PeteAI Utilities (NOT primary analysis):
  - Suggest similar patterns from other clients
  - Recommend best practices based on RE industry
  - Generate natural language summaries
  - Identify outliers ("This client has 47 custom fields - typical is 12")
  - Propose workflow templates based on data structure
```

---

## Technical Implementation

### 1. NLP Data Structure Analyzer

**File:** `src/utils/nlp-data-analyzer.ts`

```typescript
export interface DataStructureAnalysis {
  objects: IdentifiedObject[];
  relationships: Relationship[];
  dataQuality: QualityMetrics;
  patterns: DetectedPattern[];
}

export interface IdentifiedObject {
  name: string; // inferred from columns/sheet names
  fields: FieldAnalysis[];
  estimatedRowCount: number;
}

export interface FieldAnalysis {
  name: string;
  inferredType: 'email' | 'phone' | 'date' | 'currency' | 'text' | 'id';
  nullRate: number; // 0-1
  uniqueRate: number; // 0-1
  sampleValues: string[];
  semanticCategory?: 'identifier' | 'contact' | 'address' | 'financial' | 'temporal';
}

export interface Relationship {
  fromObject: string;
  toObject: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  confidence: number; // 0-1
  inferredFrom: 'column_name' | 'data_pattern' | 'user_confirmation';
}

// Core functions
export async function analyzeDataStructure(
  parsedData: ParsedData
): Promise<DataStructureAnalysis>

export function inferFieldSemantics(
  fieldName: string,
  sampleValues: any[]
): FieldAnalysis

export function detectRelationships(
  objects: IdentifiedObject[]
): Relationship[]
```

**Key NLP Techniques:**
- Regex patterns for email/phone/date detection
- Levenshtein distance for fuzzy column name matching
- Statistical analysis for cardinality inference
- Semantic tokenization of field names (split on _/camelCase)
- Common RE industry terms dictionary ("owner", "tenant", "lease", "property")

### 2. Dynamic Question Generator

**File:** `src/utils/question-generator.ts`

```typescript
export interface DynamicQuestion {
  id: string;
  sectionId: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  question: string;
  context: string; // Why we're asking
  relatedFields: string[]; // From uploaded data
  expectedAnswerType: 'text' | 'yes-no' | 'multiple-choice' | 'scale';
  resolutionCategory?: 'Education' | 'Coding' | 'Expectations' | 'Process' | 'Data Validation';
}

export function generateQuestionsFromStructure(
  analysis: DataStructureAnalysis,
  questionTemplates: QuestionTemplate[]
): DynamicQuestion[]

// Example:
// If NLP detects "owner_email" field with 30% null rate
// → Generate L1: "What is owner_email used for?"
// → Generate L2: "Why is 30% of owner_email data missing?"
// → Generate L3: "How does missing owner_email affect notifications?"
// ... up to L7
```

### 3. Mermaid Diagram Generator

**File:** `src/utils/mermaid-generator.ts`

```typescript
export interface MermaidDiagramConfig {
  type: 'current-state' | 'desired-state' | 'gap-analysis';
  analysis: DataStructureAnalysis;
  questionnaireResponses?: QuestionnaireSession;
}

export function generateOnboardingFlowDiagram(
  config: MermaidDiagramConfig
): string

// Example output:
// graph TD
//   A[Data Upload] -->|30% missing emails| B{Validation}
//   B -->|Pass| C[Import]
//   B -->|Fail| D[Manual Review]
//   C --> E[Workflow Setup]
```

### 4. PeteAI Enhancement Utilities

**File:** `src/utils/peteai-enhancer.ts`

```typescript
// Convert existing PeteAI into reusable utilities
export async function enhanceAnalysisWithAI(
  nlpAnalysis: DataStructureAnalysis
): Promise<AIEnhancedInsights>

export async function suggestWorkflowTemplates(
  analysis: DataStructureAnalysis
): Promise<WorkflowSuggestion[]>

export async function generateNaturalLanguageSummary(
  analysis: DataStructureAnalysis
): Promise<string>

// IMPORTANT: These are enhancement layers, NOT primary analysis
// NLP must run first and establish ground truth
```

---

## User Experience Flow

### Step 1: Upload Client Data
```
[File Upload Component]
  ↓
"Upload your current data export (CSV/XLSX)"
  ↓
[Drag & Drop or Browse]
  ↓
Processing...
```

### Step 2: NLP Analysis Results
```
[Data Structure Report]

Objects Identified:
✓ Contacts (1,247 rows)
✓ Properties (892 rows)
✓ Owners (445 rows)

Relationships Detected:
→ Properties linked to Owners (many-to-one)
→ Contacts linked to Properties (many-to-many)

Data Quality Issues:
⚠ 23% of owner_email missing
⚠ 156 duplicate phone numbers
⚠ property_address formatting inconsistent

[Proceed to Questionnaire] button
```

### Step 3: Dynamic Questionnaire
```
Questions generated based on YOUR data:

Section: owner_email field
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Level 1/7: Understanding
❓ We detected "owner_email" with 23% missing values.
   What is this field used for in your workflow?

[Text input with context from your data]

────────────────────────────────

[After answering Level 1, Level 2 appears...]

Level 2/7: Root Cause
❓ Why is 23% of owner_email data missing in your current system?

[Multiple choice]:
○ Not collected at intake
○ Optional in old CRM
○ Data entry inconsistency
○ Other: _______

[Continue pattern through Level 7]
```

### Step 4: Visualization & Export
```
[Current State Diagram]
[Generated Mermaid showing bottlenecks]

[Desired State Diagram]
[Based on questionnaire answers]

[Gap Analysis]
[What needs to change]

[Export to Markdown] [Save Session] [Create GitHub Issues]
```

---

## File Structure

```
src/
├── utils/
│   ├── nlp-data-analyzer.ts           # NEW: NLP-first structure analysis
│   ├── question-generator.ts          # NEW: Dynamic question generation
│   ├── mermaid-generator.ts           # NEW: Diagram generation from analysis
│   ├── peteai-enhancer.ts             # NEW: AI enhancement utilities
│   └── file-parser.ts                 # EXISTING: CSV/XLSX parsing
│
├── components/
│   ├── file-upload.tsx                # EXISTING: Reusable upload component
│   ├── data-structure-report.tsx      # NEW: Display NLP analysis results
│   ├── dynamic-questionnaire.tsx      # NEW: Renders questions from generator
│   └── diagram-visualizer.tsx         # NEW: Mermaid diagram display
│
├── actions/
│   ├── analyze-upload.ts              # NEW: Server action for NLP analysis
│   ├── questionnaire.ts               # EXISTING: Session management
│   └── generate-diagrams.ts           # NEW: Mermaid generation server action
│
├── app/admin/
│   ├── onboarding-insights/           # EXISTING: Conversation analysis
│   ├── onboarding-questionnaire/      # MODIFIED: Integrate file upload + dynamic questions
│   ├── onboarding-responses/          # EXISTING: View completed sessions
│   └── data-analyzer/                 # NEW: Standalone NLP analysis tool
│
└── data/
    ├── onboarding-questionnaire.json  # EXISTING: Static question templates
    ├── question-templates/            # NEW: Dynamic question templates by field type
    │   ├── email-field.json
    │   ├── phone-field.json
    │   ├── address-field.json
    │   └── relationship-field.json
    └── questionnaire-responses/       # EXISTING: Session storage
```

---

## GitHub Issues Breakdown

### Epic: NLP-First Onboarding Discovery System

**Issue #1: NLP Data Structure Analyzer**
- [ ] Build field type inference (email, phone, date, currency)
- [ ] Implement semantic field name analysis
- [ ] Create relationship detection algorithm
- [ ] Add data quality metrics calculation
- [ ] Write tests with sample real estate data

**Issue #2: Dynamic Question Generator**
- [ ] Design question templates for common field types
- [ ] Implement 7-levels-deep question chains
- [ ] Add context injection from NLP analysis
- [ ] Create resolution category tagging
- [ ] Test with Pete Information questions

**Issue #3: Mermaid Diagram Generation**
- [ ] Build current-state diagram from NLP analysis
- [ ] Create desired-state diagram from questionnaire responses
- [ ] Generate gap-analysis diff visualization
- [ ] Add color-coding for bottlenecks/issues
- [ ] Integrate with existing markdown-renderer component

**Issue #4: PeteAI Enhancement Layer**
- [ ] Refactor existing PeteAI into utility functions
- [ ] Add best practice suggestions based on analysis
- [ ] Implement natural language summary generation
- [ ] Create workflow template recommendations
- [ ] Ensure AI runs AFTER NLP, not before

**Issue #5: File Upload Integration**
- [ ] Add FileUpload component to questionnaire page
- [ ] Trigger NLP analysis on upload
- [ ] Display data structure report
- [ ] Allow user confirmation before questionnaire
- [ ] Store parsed data with session

**Issue #6: Dynamic Questionnaire UI**
- [ ] Replace static questions with dynamic generation
- [ ] Progressive disclosure (one level at a time)
- [ ] Context tooltips showing data from upload
- [ ] Resolution category selection per answer
- [ ] Progress tracking with data quality metrics

**Issue #7: Help.thepete.io API Integration**
- [ ] Research API endpoints
- [ ] Fetch existing documentation
- [ ] Cross-reference with uploaded data
- [ ] Display relevant help articles
- [ ] Generate new documentation from analysis

**Issue #8: Loom Video Integration**
- [ ] Parse "Loom videos added to Intercom" sheet
- [ ] Link videos to relevant question sections
- [ ] Track video watch completion
- [ ] Integrate with Intercom if possible
- [ ] Suggest videos based on data issues

---

## Success Metrics

### For Jon (Owner/Developer)
- [ ] Can upload client data and get instant structure analysis
- [ ] Receives dynamic questions specific to that client's data
- [ ] Sees visual diagrams showing process bottlenecks
- [ ] Gets actionable categorization (Education vs Coding vs Process)
- [ ] Understands WHY onboarding fails, not just WHAT failed

### For Churned Clients (Win-Back)
- [ ] They see we understand their specific data challenges
- [ ] Questions feel relevant (not generic)
- [ ] Diagrams show we "get" their workflow
- [ ] Clear path from current state → desired state
- [ ] Accountability framework (what's on them vs us)

### For New Clients (Onboarding)
- [ ] Upload data → instant validation feedback
- [ ] Understand Pete's architecture through diagrams
- [ ] Clear expectations set from data analysis
- [ ] Training materials matched to their data issues
- [ ] Confidence that Pete can handle their structure

---

## Phase Rollout

### Phase 1: Foundation (Week 1-2)
- ✅ File upload infrastructure (DONE)
- ✅ Basic questionnaire system (DONE)
- 🔄 NLP data structure analyzer
- 🔄 Simple Mermaid diagram generation

### Phase 2: Intelligence (Week 3-4)
- 🔄 Dynamic question generator
- 🔄 Context-aware question chains
- 🔄 Resolution category tagging
- 🔄 PeteAI enhancement utilities

### Phase 3: Integration (Week 5-6)
- 🔄 Help.thepete.io API integration
- 🔄 Loom video linking
- 🔄 Intercom tracking integration
- 🔄 Advanced diagram generation

### Phase 4: Production (Week 7-8)
- 🔄 Jon + team testing with real client data
- 🔄 Churned client interviews
- 🔄 Refinement based on feedback
- 🔄 Documentation and training materials

---

## Critical Reminders

### What This Is:
✅ Analysis tool for EXISTING PeteIRE onboarding process
✅ Understanding tool for WHY things are the way they are
✅ Discovery system for improving Canvas Kit/Sidekicks
✅ NLP-first, AI-enhanced approach
✅ Dynamic questions based on real uploaded data
✅ Mermaid diagrams from code-like structure analysis

### What This Is NOT:
❌ Building a new CRM
❌ Generic onboarding tool for any business
❌ AI-first system (AI is enhancement only)
❌ Automated solution (discovery requires human insight)
❌ Replacement for client communication

### Philosophy:
> "Everything is code. Treat onboarding as code with structure, patterns, and logic that can be analyzed, refactored, and improved."

---

## Next Steps

1. **Review this plan with Jon** - Ensure alignment with business goals
2. **Create GitHub issues** - Break down into implementable chunks
3. **Start with NLP analyzer** - Foundation for everything else
4. **Test with real data** - Use Onboarding (1).xlsx + Pete Information (1).xlsx
5. **Iterate based on insights** - This is discovery, not prescription

## Questions for Jon

1. Should we integrate directly with PeteIRE database, or stay file-upload only?
2. What access do we have to help.thepete.io API?
3. Can we track Loom video views via Intercom API?
4. Should churned client interviews happen before or after building Phase 1?
5. What's the timeline for testing with real clients?

---

*Generated: 2025-09-29*
*Status: Planning Phase*
*Next Review: After Jon feedback*
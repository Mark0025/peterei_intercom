# GitHub Issues: Pete Onboarding Discovery System

## Epic: NLP-First Onboarding Discovery System

**Epic Description:**
Build a context-driven discovery system to analyze the EXISTING PeteIRE onboarding process. This is NOT a generic tool - it's specifically designed to understand WHY 200+ production users experience onboarding friction, using NLP-first analysis of real client data structures.

**Epic Goals:**
- Analyze real client data (CSV/XLSX uploads)
- Generate dynamic 7-levels-deep questions based on data patterns
- Create Mermaid diagrams showing current→desired workflows
- Categorize issues: Education | Coding | Expectations | Process | Data Validation
- Understand WHY processes exist, not just WHAT they are

---

## Issue #1: NLP Data Structure Analyzer 🧠

**Priority:** High
**Effort:** 8 story points
**Labels:** `nlp`, `foundation`, `typescript`

### Description
Build the core NLP engine that analyzes uploaded CSV/XLSX files to understand data structure, relationships, and quality issues. This is the foundation for everything else - we cannot generate dynamic questions or diagrams without first understanding the data.

### Acceptance Criteria
- [ ] Parse uploaded file and extract column headers, data types, sample values
- [ ] Infer field semantics (email, phone, date, currency, address, id, text)
- [ ] Detect relationships between objects (one-to-many, many-to-many)
- [ ] Calculate data quality metrics (null rates, uniqueness, duplicates)
- [ ] Generate structured analysis report with confidence scores
- [ ] Handle common RE industry terms (owner, tenant, lease, property, contact)
- [ ] Support multiple sheets in Excel files
- [ ] Return type-safe TypeScript interfaces

### Technical Details

**File:** `src/utils/nlp-data-analyzer.ts`

```typescript
export interface DataStructureAnalysis {
  objects: IdentifiedObject[];
  relationships: Relationship[];
  dataQuality: QualityMetrics;
  patterns: DetectedPattern[];
  processingTime: number;
}

export interface IdentifiedObject {
  name: string;
  source: 'sheet_name' | 'column_prefix' | 'inferred';
  fields: FieldAnalysis[];
  rowCount: number;
  confidence: number; // 0-1
}

export interface FieldAnalysis {
  name: string;
  inferredType: 'email' | 'phone' | 'date' | 'currency' | 'text' | 'id' | 'address';
  nullRate: number; // 0-1
  uniqueRate: number; // 0-1
  duplicateCount: number;
  sampleValues: string[];
  semanticCategory?: 'identifier' | 'contact' | 'address' | 'financial' | 'temporal';
  confidence: number; // 0-1
}

export interface Relationship {
  fromObject: string;
  fromField: string;
  toObject: string;
  toField: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  confidence: number;
  inferredFrom: 'column_name' | 'data_pattern' | 'foreign_key';
}

export interface QualityMetrics {
  overallScore: number; // 0-100
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  severity: 'critical' | 'warning' | 'info';
  field: string;
  issue: string;
  affectedRows: number;
  example?: string;
}
```

### NLP Techniques to Implement

1. **Field Type Inference:**
   - Regex patterns: `/^[\w\.-]+@[\w\.-]+\.\w+$/` for email
   - Phone patterns: `/^\+?[\d\s\(\)-]{10,}$/`
   - Date patterns: ISO, US, EU formats
   - Currency patterns: `$`, `£`, `€` with decimal detection

2. **Semantic Analysis:**
   ```typescript
   // Tokenize field names
   "owner_email" → ["owner", "email"]
   "propertyAddress" → ["property", "address"]

   // Match against RE industry dictionary
   const RETerms = {
     identifier: ['id', 'uuid', 'key', 'code'],
     contact: ['email', 'phone', 'mobile', 'contact'],
     person: ['owner', 'tenant', 'manager', 'agent'],
     property: ['property', 'address', 'unit', 'building'],
     financial: ['rent', 'price', 'fee', 'deposit', 'commission']
   };
   ```

3. **Relationship Detection:**
   ```typescript
   // ID matching: look for {object}_id patterns
   "property_id" in Contacts → link to Properties.id

   // Name matching: fuzzy match with Levenshtein distance
   "owner_name" in Properties → link to Owners.name (if match > 80%)

   // Cardinality analysis:
   - unique(field) / count(rows) → 1:1 if ~1.0, 1:many if low
   - Duplicate analysis for many:many detection
   ```

4. **Data Quality Scoring:**
   ```typescript
   Score = (
     (1 - avg_null_rate) * 0.4 +      // Completeness
     (1 - duplicate_rate) * 0.3 +      // Uniqueness where expected
     format_consistency_score * 0.2 +  // e.g., phone formatting
     relationship_integrity * 0.1      // FK references valid
   ) * 100
   ```

### Test Cases

**Test 1: Simple Contact List**
```csv
email,phone,name
john@example.com,555-1234,John Doe
jane@example.com,,Jane Smith
invalid-email,555-5678,Bob Johnson
```
Expected:
- 3 fields detected (email, phone, name)
- email: 66% valid (2/3), 1 quality issue
- phone: 66% null rate (2/3 present)
- name: 100% present, text type

**Test 2: Multi-Object with Relationships**
```
Sheet: Properties
property_id,address,owner_id
P001,123 Main St,O001
P002,456 Oak Ave,O001

Sheet: Owners
owner_id,name,email
O001,John Doe,john@example.com
O002,Jane Smith,jane@example.com
```
Expected:
- 2 objects detected (Properties, Owners)
- Relationship: Properties.owner_id → Owners.owner_id (many-to-one)
- Quality: O002 has no properties (orphan record warning)

**Test 3: Real Estate Data Quality Issues**
```csv
owner_email,owner_phone,property_address
john@example.com,555-1234,123 Main St
,555-5678,456 Oak Ave
jane@example.com,555-1234,789 Pine Rd
```
Expected:
- 33% missing owner_email (critical issue)
- Duplicate phone 555-1234 (warning: different owners)
- Recommendation: "Require owner_email at data entry"

### Dependencies
- `xlsx` (already installed)
- `papaparse` (already installed)
- No AI/LLM dependencies (pure NLP/statistical)

### Definition of Done
- [ ] All test cases pass
- [ ] TypeScript interfaces exported and documented
- [ ] Handles malformed data gracefully
- [ ] Performance: <2 seconds for 10k rows
- [ ] Unit tests achieve >80% coverage

---

## Issue #2: Dynamic Question Generator 📝

**Priority:** High
**Effort:** 13 story points
**Labels:** `question-generation`, `eos`, `typescript`
**Depends on:** Issue #1

### Description
Generate context-aware, 7-levels-deep EOS-style questions dynamically based on NLP analysis results. Questions must reference actual fields and values from uploaded data, not generic templates.

### Acceptance Criteria
- [ ] Generate Level 1-7 questions for each identified data issue
- [ ] Inject context from NLP analysis (field names, sample values, metrics)
- [ ] Support resolution category tagging (Education | Coding | Expectations | Process | Data Validation)
- [ ] Progressive disclosure: Level N+1 only after Level N answered
- [ ] Question templates for common field types (email, phone, address, relationship)
- [ ] Handle custom fields with intelligent fallback questions
- [ ] Maintain EOS "Why?" chain structure

### Technical Details

**File:** `src/utils/question-generator.ts`

```typescript
export interface DynamicQuestion {
  id: string;
  sectionId: string;
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  question: string;
  context: string; // Why we're asking this
  relatedFields: string[]; // From uploaded data
  relatedIssue?: QualityIssue;
  expectedAnswerType: 'text' | 'yes-no' | 'multiple-choice' | 'scale';
  options?: string[]; // For multiple-choice
  resolutionCategory?: 'Education' | 'Coding' | 'Expectations' | 'Process' | 'Data Validation';
  nextQuestionLogic?: ConditionalLogic;
}

export interface QuestionTemplate {
  issueType: 'missing_data' | 'duplicate_data' | 'invalid_format' | 'missing_relationship' | 'orphan_record';
  fieldType: 'email' | 'phone' | 'address' | 'id' | 'text' | 'relationship';
  levels: LevelTemplate[];
}

export interface LevelTemplate {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  questionTemplate: string; // Uses {{field}}, {{percentage}}, {{sample}} placeholders
  contextTemplate: string;
  answerType: 'text' | 'yes-no' | 'multiple-choice' | 'scale';
  resolutionCategory: string;
}
```

### Question Generation Logic

**Example: Missing Email Field**
```typescript
// NLP Analysis detected:
{
  field: "owner_email",
  nullRate: 0.23,
  affectedRows: 287,
  issue: "23% of owner_email data missing"
}

// Generated Questions:
Level 1: Understanding
Q: "We detected the field 'owner_email' with 23% missing values (287 out of 1,247 records).
    What is owner_email used for in your current workflow?"
Context: "Understanding the purpose helps us determine if this is critical or optional data."
Answer Type: text
Resolution: Expectations

Level 2: Root Cause
Q: "Why is 23% of owner_email data missing in your current system?"
Context: "Based on your answer: '{Level1Answer}'"
Answer Type: multiple-choice
Options:
  - Not collected during intake process
  - Optional in old CRM
  - Data entry inconsistency
  - Only required for certain property types
  - Other: _______
Resolution: Process

Level 3: Impact
Q: "How does missing owner_email affect your operations?
    (e.g., Can't send lease reminders? Manual lookup required?)"
Context: "You mentioned: '{Level2Answer}'"
Answer Type: text
Resolution: Expectations

Level 4: Validation Gap
Q: "Why doesn't your current system validate or require owner_email at data entry?"
Answer Type: text
Resolution: Coding

Level 5: Solution Design
Q: "What would be the ideal requirement:
    A) Always required
    B) Required only for certain workflows
    C) Optional but encouraged"
Answer Type: multiple-choice
Resolution: Process

Level 6: Implementation
Q: "If we enforced owner_email requirement in Pete, what training or documentation
    would your team need?"
Answer Type: text
Resolution: Education

Level 7: Business Impact
Q: "How would fixing the owner_email data issue improve client retention or operations?"
Answer Type: text
Resolution: Expectations
```

### Question Templates Directory Structure

```
data/question-templates/
├── missing_data/
│   ├── email-field.json
│   ├── phone-field.json
│   ├── address-field.json
│   ├── id-field.json
│   └── generic-field.json
├── duplicate_data/
│   ├── identifier-duplicate.json
│   └── contact-duplicate.json
├── invalid_format/
│   ├── email-format.json
│   ├── phone-format.json
│   └── date-format.json
├── missing_relationship/
│   └── foreign-key-missing.json
└── orphan_record/
    └── unused-record.json
```

### Test Cases

**Test 1: Generate Questions from Missing Data**
Input:
```typescript
{
  field: "tenant_phone",
  nullRate: 0.45,
  issue: "45% missing tenant_phone"
}
```
Expected:
- 7 questions generated
- Level 1 includes "tenant_phone" and "45%"
- Each level references previous answers
- Resolution categories assigned

**Test 2: Relationship Issue Questions**
Input:
```typescript
{
  fromObject: "Properties",
  toObject: "Owners",
  issue: "156 properties have invalid owner_id references"
}
```
Expected:
- Questions focus on data integrity
- L1: What happens when property has invalid owner?
- L7: How would clean relationships improve onboarding?

**Test 3: Progressive Disclosure**
- User answers L1
- L2 appears with L1 context injected
- L3 locked until L2 answered
- UI shows progress (2/7 complete)

### Dependencies
- NLP Data Structure Analyzer (Issue #1)
- Existing questionnaire infrastructure

### Definition of Done
- [ ] Generate questions for all NLP-detected issues
- [ ] Context injection works (field names, percentages, samples)
- [ ] Progressive disclosure implemented in UI
- [ ] All test cases pass
- [ ] Templates for 10+ common scenarios created

---

## Issue #3: Mermaid Diagram Generator from NLP Analysis 📊

**Priority:** High
**Effort:** 8 story points
**Labels:** `visualization`, `mermaid`, `typescript`
**Depends on:** Issue #1

### Description
Generate Mermaid diagrams programmatically from NLP analysis showing:
1. **Current State** - Data flow as-is from uploaded data
2. **Desired State** - Ideal workflow from questionnaire responses
3. **Gap Analysis** - Visual diff highlighting what needs to change

### Acceptance Criteria
- [ ] Generate current-state diagram from NLP analysis alone
- [ ] Generate desired-state diagram from questionnaire + NLP
- [ ] Create gap-analysis diagram with color coding
- [ ] Highlight bottlenecks (high null rates, duplicates)
- [ ] Show relationship flows between objects
- [ ] Support data quality annotations
- [ ] Render using existing markdown-renderer component

### Technical Details

**File:** `src/utils/mermaid-generator.ts`

```typescript
export interface MermaidDiagramConfig {
  type: 'current-state' | 'desired-state' | 'gap-analysis';
  analysis: DataStructureAnalysis;
  questionnaireResponses?: QuestionnaireSession;
  highlightIssues?: boolean;
}

export function generateOnboardingFlowDiagram(
  config: MermaidDiagramConfig
): string

export function generateDataQualityDiagram(
  analysis: DataStructureAnalysis
): string

export function generateRelationshipDiagram(
  objects: IdentifiedObject[],
  relationships: Relationship[]
): string
```

### Diagram Generation Logic

**Example 1: Current State from NLP**
```typescript
// Input: NLP Analysis
{
  objects: [
    { name: "Properties", rowCount: 892, fields: [...] },
    { name: "Owners", rowCount: 445, fields: [...] }
  ],
  dataQuality: {
    issues: [
      { field: "owner_email", issue: "23% missing", severity: "critical" }
    ]
  },
  relationships: [
    { from: "Properties", to: "Owners", type: "many-to-one" }
  ]
}

// Output: Mermaid
graph TD
    A[Data Upload] -->|892 records| B[Properties]
    A -->|445 records| C[Owners]
    B -->|owner_id link| C
    B -.->|⚠ 23% missing owner_email| D[Validation Issues]
    D -->|Manual Review| E{Accept or Fix?}
    E -->|Accept| F[Import Complete]
    E -->|Fix| G[Data Cleanup]
    G --> B

    style D fill:#ffcccc
    style E fill:#ffffcc
```

**Example 2: Gap Analysis**
```typescript
// Current State Issues:
- 23% missing owner_email
- Manual data extraction
- No validation at upload

// Desired State (from questionnaire):
- Require owner_email
- Client self-upload with templates
- Auto-validation before import

// Gap Diagram:
graph LR
    subgraph Current ["Current State 🔴"]
        A1[Manual Extract] --> B1[No Validation]
        B1 --> C1[23% Bad Data]
    end

    subgraph Desired ["Desired State 🟢"]
        A2[Client Upload] --> B2[Template Validation]
        B2 --> C2[Clean Data]
    end

    Current -.->|Changes Needed| Desired

    D[Training Videos] -.-> A2
    E[Upload Templates] -.-> A2
    F[Validation Rules] -.-> B2

    style Current fill:#ffeeee
    style Desired fill:#eeffee
```

### Test Cases

**Test 1: Simple Object Flow**
Input:
- 2 objects (Contacts, Properties)
- 1 relationship (Contact → Property)
- No issues
Expected:
```mermaid
graph LR
    A[Upload] --> B[Contacts: 1247 records]
    A --> C[Properties: 892 records]
    B -->|contact_property_id| C
```

**Test 2: Quality Issues Highlighted**
Input:
- High null rate (>30%)
- Duplicate records
Expected:
- Red nodes for critical issues
- Yellow nodes for warnings
- Annotations with percentages

**Test 3: Process Bottleneck**
Input:
- Manual step detected (from questionnaire)
- Data scraping mentioned
Expected:
- Diamond decision nodes
- Manual process highlighted
- Time/effort annotations

### Dependencies
- NLP Data Structure Analyzer (Issue #1)
- Dynamic Question Generator (Issue #2) for desired-state
- Existing markdown-renderer component

### Definition of Done
- [ ] Generate all 3 diagram types
- [ ] Color coding for severity
- [ ] Integrates with existing MarkdownRenderer
- [ ] Performance: <1 second for typical dataset
- [ ] All test cases pass

---

## Issue #4: PeteAI Enhancement Layer (AI After NLP) 🤖

**Priority:** Medium
**Effort:** 5 story points
**Labels:** `ai`, `enhancement`, `typescript`
**Depends on:** Issue #1

### Description
Refactor existing PeteAI into reusable utility functions that ENHANCE NLP analysis results, not replace them. AI provides suggestions, best practices, and natural language summaries AFTER NLP establishes ground truth.

### Acceptance Criteria
- [ ] Convert PeteAI into utility functions (not primary analysis)
- [ ] Generate natural language summaries from NLP results
- [ ] Suggest workflow templates based on data structure
- [ ] Recommend best practices from RE industry knowledge
- [ ] Identify outliers ("This client has 47 custom fields - typical is 12")
- [ ] All AI calls happen AFTER NLP completes
- [ ] Graceful fallback if AI unavailable

### Technical Details

**File:** `src/utils/peteai-enhancer.ts`

```typescript
export interface AIEnhancedInsights {
  summary: string; // Natural language summary of NLP findings
  bestPractices: string[];
  workflowSuggestions: WorkflowSuggestion[];
  outliers: OutlierDetection[];
  riskAssessment: RiskAssessment;
}

export interface WorkflowSuggestion {
  name: string;
  description: string;
  triggeredBy: string; // Which data pattern triggered this
  confidence: number;
  templateLink?: string;
}

export interface OutlierDetection {
  metric: string;
  clientValue: number;
  typicalRange: { min: number; max: number };
  severity: 'info' | 'warning' | 'concern';
  explanation: string;
}

export async function enhanceAnalysisWithAI(
  nlpAnalysis: DataStructureAnalysis
): Promise<AIEnhancedInsights>

export async function generateNaturalLanguageSummary(
  analysis: DataStructureAnalysis
): Promise<string>

export async function suggestWorkflowTemplates(
  analysis: DataStructureAnalysis
): Promise<WorkflowSuggestion[]>
```

### AI Enhancement Examples

**Input: NLP Analysis**
```typescript
{
  objects: ["Contacts", "Properties", "Leases"],
  dataQuality: { overallScore: 67 },
  issues: [
    { field: "tenant_email", nullRate: 0.34 }
  ]
}
```

**Output: AI Enhanced**
```typescript
{
  summary: "Analysis of 3 core objects (Contacts, Properties, Leases) shows moderate data quality (67/100). Primary concern: 34% missing tenant contact information, which will block automated lease renewal workflows.",

  bestPractices: [
    "Require tenant_email at lease signing (industry standard: 95%+ capture rate)",
    "Consider SMS fallback for non-email users",
    "Implement double-entry validation during intake"
  ],

  workflowSuggestions: [
    {
      name: "Lease Renewal Automation",
      description: "Auto-send renewal notices 60 days before expiration",
      triggeredBy: "Detected lease_end_date field with good data quality",
      confidence: 0.89
    }
  ],

  outliers: [
    {
      metric: "custom_fields_count",
      clientValue: 47,
      typicalRange: { min: 8, max: 15 },
      severity: "warning",
      explanation: "Significantly more custom fields than typical clients. May indicate over-customization or legacy data migration."
    }
  ]
}
```

### AI Prompt Engineering

**Summary Generation Prompt:**
```
You are analyzing a real estate CRM data structure.

NLP Analysis Results:
{{nlpAnalysisJSON}}

Generate a 2-3 sentence executive summary that:
1. Identifies the number and type of core objects
2. Highlights the #1 data quality issue
3. Explains business impact in plain language

Example: "Analysis of 3 core objects (Contacts, Properties, Owners) shows..."
```

**Best Practice Recommendations:**
```
Based on this data structure, suggest 3-5 RE industry best practices:

Context:
- Objects: {{objects}}
- Quality Issues: {{issues}}
- Relationships: {{relationships}}

Format: Bullet points, actionable, specific to their data.
```

### Test Cases

**Test 1: Summary Generation**
Input: NLP with 2 critical issues
Expected: Summary mentions both issues and impact

**Test 2: Workflow Suggestions**
Input: NLP detects "lease_end_date" field
Expected: Suggests lease renewal automation

**Test 3: Outlier Detection**
Input: Client has 50 custom fields (typical: 10-15)
Expected: Flags as outlier with explanation

**Test 4: AI Unavailable Fallback**
Input: AI service down
Expected: Return basic insights from NLP only, no error

### Dependencies
- NLP Data Structure Analyzer (Issue #1)
- Existing PeteAI infrastructure
- OpenRouter/Llama API access

### Definition of Done
- [ ] All AI utilities return results within 5 seconds
- [ ] Fallback handling for API failures
- [ ] Results enhance NLP, don't contradict it
- [ ] All test cases pass
- [ ] Documentation for adding new enhancement types

---

## Issue #5: File Upload Integration in Questionnaire Page 📤

**Priority:** High
**Effort:** 5 story points
**Labels:** `ui`, `integration`, `react`
**Depends on:** Issue #1, Issue #2

### Description
Integrate the existing FileUpload component into the onboarding questionnaire page. On upload, trigger NLP analysis, display results, and dynamically generate questions.

### Acceptance Criteria
- [ ] Add FileUpload component to `/admin/onboarding-questionnaire` page
- [ ] Trigger NLP analysis on file upload
- [ ] Display data structure report before questionnaire
- [ ] Allow user to review/confirm analysis
- [ ] Generate dynamic questions based on NLP results
- [ ] Store parsed data with questionnaire session
- [ ] Handle upload errors gracefully
- [ ] Show loading states during analysis

### User Flow

```
1. User visits /admin/onboarding-questionnaire
   └─> Sees "Upload Client Data" section

2. User uploads "acme-properties.xlsx"
   └─> File validated (size, type)
   └─> Parsing... (progress indicator)
   └─> NLP analysis... (progress indicator)

3. Data Structure Report shown:
   ┌─────────────────────────────────────┐
   │ 📊 Analysis Complete                │
   │                                     │
   │ Objects Identified:                 │
   │ ✓ Properties (892 rows)             │
   │ ✓ Owners (445 rows)                 │
   │ ✓ Tenants (1,247 rows)              │
   │                                     │
   │ Relationships:                      │
   │ → Properties → Owners (many-to-one) │
   │ → Tenants → Properties (many-to-one)│
   │                                     │
   │ Data Quality: 67/100 ⚠              │
   │ • 23% missing owner_email           │
   │ • 156 duplicate phone numbers       │
   │                                     │
   │ [View Full Report] [Start Questions]│
   └─────────────────────────────────────┘

4. User clicks "Start Questions"
   └─> 47 dynamic questions generated
   └─> First question appears with context from uploaded data

5. User answers questions progressively
   └─> Each answer unlocks next level
   └─> Context from previous answers injected

6. Session saved with:
   - Parsed data
   - NLP analysis
   - Questionnaire responses
```

### Technical Details

**Modified File:** `src/app/admin/onboarding-questionnaire/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import FileUpload from '@/components/file-upload';
import DataStructureReport from '@/components/data-structure-report';
import DynamicQuestionnaire from '@/components/dynamic-questionnaire';
import { analyzeDataStructure } from '@/actions/analyze-upload';
import { generateQuestionsFromStructure } from '@/utils/question-generator';

export default function OnboardingQuestionnairePage() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [analysis, setAnalysis] = useState<DataStructureAnalysis | null>(null);
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'questionnaire'>('upload');

  const handleFileProcessed = async (data: ParsedData) => {
    setParsedData(data);

    // Trigger NLP analysis
    const analysisResult = await analyzeDataStructure(data);
    setAnalysis(analysisResult);

    // Generate dynamic questions
    const generatedQuestions = generateQuestionsFromStructure(analysisResult);
    setQuestions(generatedQuestions);

    setStep('review');
  };

  const handleStartQuestionnaire = () => {
    setStep('questionnaire');
  };

  return (
    <div>
      {step === 'upload' && (
        <FileUpload onFileProcessed={handleFileProcessed} />
      )}

      {step === 'review' && analysis && (
        <DataStructureReport
          analysis={analysis}
          onStartQuestionnaire={handleStartQuestionnaire}
        />
      )}

      {step === 'questionnaire' && questions.length > 0 && (
        <DynamicQuestionnaire
          questions={questions}
          parsedData={parsedData}
          analysis={analysis}
        />
      )}
    </div>
  );
}
```

### New Components Needed

**1. DataStructureReport Component**
File: `src/components/data-structure-report.tsx`
- Display objects, relationships, quality metrics
- Collapsible sections for details
- Visual quality score (progress bar)
- "Start Questionnaire" CTA button

**2. DynamicQuestionnaire Component**
File: `src/components/dynamic-questionnaire.tsx`
- Progressive disclosure (one level at a time)
- Context injection from uploaded data
- Answer type switching (text, multiple-choice, scale)
- Progress indicator (e.g., "Question 5 of 47")

### Test Cases

**Test 1: Upload Happy Path**
- Upload valid CSV
- See analysis report
- Start questionnaire
- Questions reference uploaded data

**Test 2: Upload Error Handling**
- Upload invalid file → error message
- Upload too large → size limit error
- NLP analysis fails → fallback to static questions

**Test 3: Progressive Disclosure**
- Answer L1 question
- L2 appears with L1 context
- Cannot skip ahead
- Can go back to edit

### Dependencies
- Existing FileUpload component
- NLP Data Structure Analyzer (Issue #1)
- Dynamic Question Generator (Issue #2)

### Definition of Done
- [ ] FileUpload integrated and functional
- [ ] Analysis report displays correctly
- [ ] Dynamic questions generated and rendered
- [ ] All test cases pass
- [ ] Error states handled gracefully
- [ ] Loading states shown during processing

---

## Issue #6: Help.thepete.io API Integration 📚

**Priority:** Medium
**Effort:** 8 story points
**Labels:** `api`, `integration`, `documentation`

### Description
Research and integrate with help.thepete.io API to fetch existing documentation, cross-reference with uploaded data, and suggest relevant help articles during questionnaire.

### Acceptance Criteria
- [ ] Research help.thepete.io API endpoints and authentication
- [ ] Implement API client in TypeScript
- [ ] Fetch relevant documentation based on NLP analysis
- [ ] Display help articles contextually during questionnaire
- [ ] Generate new documentation suggestions from analysis
- [ ] Cache API responses for performance
- [ ] Handle API unavailability gracefully

### Research Questions
1. What API endpoints does help.thepete.io expose?
2. Authentication method (API key, OAuth)?
3. Can we search documentation programmatically?
4. Can we create/update documentation via API?
5. Rate limiting considerations?

### Technical Details

**File:** `src/lib/help-pete-api.ts`

```typescript
export interface HelpArticle {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  relevance: number; // 0-1
  tags: string[];
}

export class HelpPeteAPI {
  constructor(apiKey: string);

  async searchArticles(query: string): Promise<HelpArticle[]>

  async getArticlesByTag(tag: string): Promise<HelpArticle[]>

  async createArticleSuggestion(
    title: string,
    content: string,
    triggeredBy: string
  ): Promise<void>
}
```

### Integration Points

**1. During NLP Analysis:**
```typescript
// After detecting data quality issue
const issue = "23% missing owner_email";

// Search for relevant help
const articles = await helpAPI.searchArticles("owner email data upload");

// Display in analysis report:
"📚 Related Help Articles:
  • How to Upload Owner Contact Information
  • Data Validation Requirements
  • Fixing Common Data Issues"
```

**2. During Questionnaire:**
```typescript
// On Level 4 question about validation
const currentQuestion = {
  field: "owner_email",
  level: 4,
  question: "Why doesn't your system validate email?"
};

// Fetch contextual help
const help = await helpAPI.getArticlesByTag("validation");

// Show inline:
"💡 Tip: See our guide on Email Validation Best Practices"
```

**3. Generate New Documentation:**
```typescript
// After completing questionnaire with novel insights
if (analysis.outliers.length > 0) {
  await helpAPI.createArticleSuggestion(
    "Handling Highly Customized Data Structures",
    generateDocFromAnalysis(analysis),
    "onboarding-discovery-tool"
  );
}
```

### Test Cases

**Test 1: API Connection**
- Verify authentication works
- Handle invalid credentials
- Retry logic for timeouts

**Test 2: Search Relevance**
- Search "owner email" → returns relevant articles
- Search "gibberish" → returns empty gracefully

**Test 3: Contextual Display**
- Question about validation → shows validation articles
- Question about workflows → shows workflow articles

### Dependencies
- Help.thepete.io API access (needs Jon's approval)
- NLP Data Structure Analyzer (Issue #1)

### Definition of Done
- [ ] API client implemented and tested
- [ ] Integration in analysis report
- [ ] Integration in questionnaire
- [ ] Cache strategy implemented
- [ ] Error handling complete
- [ ] Documentation for future maintainers

---

## Issue #7: Loom Video Integration & Tracking 🎥

**Priority:** Medium
**Effort:** 5 story points
**Labels:** `video`, `tracking`, `intercom`

### Description
Parse "Loom videos added to Intercom" sheet, link videos to relevant questionnaire sections, track completion, and integrate with Intercom if possible.

### Acceptance Criteria
- [ ] Parse "Loom videos added to Intercom" sheet from Excel file
- [ ] Create video catalog with categorization
- [ ] Link videos to question sections automatically
- [ ] Embed videos in questionnaire UI
- [ ] Track video watch events (if possible)
- [ ] Research Intercom + Loom integration capabilities
- [ ] Suggest videos based on data quality issues

### Data Source

From `Pete Information (1).xlsx`, sheet "Loom videos added to Intercom":
```
TITLE | LINK TO LOOM
--------------------------
Data Upload Best Practices | https://loom.com/...
Owner Contact Information | https://loom.com/...
Property Address Formatting | https://loom.com/...
...
```

### Technical Details

**File:** `src/utils/loom-video-catalog.ts`

```typescript
export interface LoomVideo {
  id: string;
  title: string;
  url: string;
  category?: string; // Inferred from title
  tags: string[];
  duration?: number; // If available from Loom API
  viewCount?: number;
}

export interface VideoCatalog {
  videos: LoomVideo[];
  categoryMap: Record<string, LoomVideo[]>;
}

export async function parseVideoCatalog(
  excelFile: File
): Promise<VideoCatalog>

export function suggestVideosForIssue(
  issue: QualityIssue
): LoomVideo[]

export function embedVideo(
  videoUrl: string
): React.ReactElement
```

### Video Categorization Logic

```typescript
// Infer category from title
const categorizeVideo = (title: string): string => {
  if (title.includes('Data') || title.includes('Upload')) return 'data-upload';
  if (title.includes('Workflow')) return 'workflows';
  if (title.includes('Email') || title.includes('Phone')) return 'contact-info';
  if (title.includes('Address') || title.includes('Property')) return 'property-data';
  return 'general';
};

// Match to question sections
const matchVideoToSection = (video: LoomVideo, section: string): number => {
  // Return relevance score 0-1
  const titleWords = video.title.toLowerCase().split(' ');
  const sectionWords = section.toLowerCase().split('-');

  const matches = titleWords.filter(w => sectionWords.includes(w)).length;
  return matches / Math.max(titleWords.length, sectionWords.length);
};
```

### Integration Points

**1. Analysis Report:**
```tsx
{analysis.issues.map(issue => (
  <div key={issue.field}>
    <p>{issue.issue}</p>
    {suggestVideosForIssue(issue).map(video => (
      <VideoThumbnail video={video} />
    ))}
  </div>
))}
```

**2. Questionnaire Context:**
```tsx
<QuestionCard question={currentQuestion}>
  <p>{currentQuestion.question}</p>

  {/* Relevant video suggestions */}
  <VideoSuggestions>
    <p>📹 Helpful Videos:</p>
    {getRelevantVideos(currentQuestion.sectionId).map(video => (
      <VideoEmbed key={video.id} url={video.url} />
    ))}
  </VideoSuggestions>
</QuestionCard>
```

### Loom + Intercom Research

**Questions to Answer:**
1. Can we track Loom video views via API?
2. Does Intercom have Loom integration already?
3. Can we send Loom links via Intercom messages?
4. Can we trigger Intercom messages based on questionnaire answers?

**Potential Integration:**
```typescript
// If user answers indicate training gap
if (answer.indicates('lacks_understanding')) {
  // Send Intercom message with Loom video
  await intercomAPI.sendMessage({
    userId: session.userId,
    message: "We noticed you have questions about data uploads. Check out this video:",
    attachments: [{ type: 'video', url: relevantVideo.url }]
  });
}
```

### Test Cases

**Test 1: Video Catalog Parsing**
- Parse Excel sheet → extract all videos
- Categorize automatically
- No broken links

**Test 2: Relevance Matching**
- Issue: "missing owner_email"
- Expected: "Owner Contact Information" video suggested

**Test 3: Video Embedding**
- Embed Loom URL in React component
- Video plays inline
- No CORS issues

### Dependencies
- Pete Information Excel file
- Loom API research
- Intercom API access (if integration attempted)

### Definition of Done
- [ ] Video catalog parsed and categorized
- [ ] Videos linked to question sections
- [ ] Video embedding works
- [ ] Tracking implemented (if possible)
- [ ] All test cases pass

---

## Issue #8: Production Deployment & Testing with Real Clients 🚀

**Priority:** High
**Effort:** 13 story points
**Labels:** `deployment`, `testing`, `production`
**Depends on:** All previous issues

### Description
Deploy the onboarding discovery system to production, conduct testing with Jon + team using real client data, interview churned clients, and refine based on feedback.

### Acceptance Criteria
- [ ] Deploy to production environment
- [ ] Jon + team test with real client data (anonymized if needed)
- [ ] Conduct 3+ churned client interviews using the tool
- [ ] Collect feedback on question relevance and clarity
- [ ] Measure time to complete questionnaire
- [ ] Refine question templates based on feedback
- [ ] Document insights and patterns discovered
- [ ] Create final report for Jon

### Testing Plan

**Phase 1: Internal Testing (Week 1)**
- [ ] Jon uploads 3 real client data exports
- [ ] Reviews NLP analysis accuracy
- [ ] Completes full questionnaire for each
- [ ] Identifies confusing questions
- [ ] Tests Mermaid diagram generation

**Phase 2: Churned Client Interviews (Week 2-3)**
- [ ] Schedule interviews with 3-5 churned clients
- [ ] Guide them through uploading their data
- [ ] Have them answer dynamic questions
- [ ] Record their feedback (with permission)
- [ ] Identify patterns in failure modes

**Phase 3: Refinement (Week 4)**
- [ ] Update question templates based on feedback
- [ ] Improve NLP field detection accuracy
- [ ] Enhance Mermaid diagrams with clearer labeling
- [ ] Add FAQ section for common confusions
- [ ] Optimize performance for larger datasets

### Success Metrics

**Quantitative:**
- [ ] Average questionnaire completion time: <45 minutes
- [ ] NLP analysis accuracy: >85% field type detection
- [ ] User satisfaction score: >7/10
- [ ] Questions perceived as "relevant": >80%
- [ ] Time saved vs manual discovery: >50%

**Qualitative:**
- [ ] Jon feels confident understanding WHY onboarding failed
- [ ] Churned clients say "You get it" about their data challenges
- [ ] Clear actionable insights for each client
- [ ] Diagrams are understandable without explanation
- [ ] Resolution categories help prioritize fixes

### Deliverables

**1. Testing Report:**
```markdown
# Onboarding Discovery Tool - Testing Results

## Executive Summary
- Clients tested: 5
- Questionnaires completed: 5/5
- Average completion time: 38 minutes
- Key insights discovered: [summary]

## Client Breakdown
### Client A (Churned)
- Data quality score: 54/100
- Primary issue: 67% missing tenant emails (Education)
- Root cause: Not collected during intake
- Recommended fix: Add intake validation + training

### Client B (Churned)
...
```

**2. Pattern Analysis:**
```markdown
# Onboarding Failure Patterns

## Top 3 Failure Modes (across all clients tested)
1. **Missing Contact Data (60% of cases)**
   - Resolution: Education + Process
   - Fix: Intake checklist + training videos

2. **Workflow Misunderstanding (40%)**
   - Resolution: Expectations + Education
   - Fix: Workflow visualizer + better docs

3. **Pete Mobile Limitations (20%)**
   - Resolution: Expectations + Coding
   - Fix: Set expectations early + beta labeling
```

**3. Recommendation Report for Jon:**
```markdown
# Recommendations: Onboarding Improvements

## Quick Wins (Next 30 Days)
1. Add intake data validation checklist
2. Create "Pete Rules for Success" document
3. Label Pete Mobile as "Beta" in-app

## Medium Term (60-90 Days)
1. Build workflow visualizer
2. Implement data upload templates with validation
3. Create certification path for client teams

## Long Term (6+ Months)
1. Build help.thepete.io integration
2. Add automated training tracking
3. Implement client onboarding SLA
```

### Post-Deployment Monitoring

**1. Analytics to Track:**
- Questionnaire start vs completion rate
- Most common data quality issues
- Average time per question level
- Resolution category distribution
- Mermaid diagram view rate

**2. Feedback Loop:**
- Monthly review of questionnaire responses
- Quarterly update of question templates
- Continuous improvement of NLP accuracy
- Annual review of RE industry best practices

### Dependencies
- All previous issues completed
- Production environment ready
- Jon's availability for testing
- Access to churned client contact info

### Definition of Done
- [ ] Deployed to production
- [ ] 5+ real client tests completed
- [ ] Testing report delivered to Jon
- [ ] Pattern analysis documented
- [ ] Recommendations report created
- [ ] Feedback incorporated into system
- [ ] Monitoring dashboard set up
- [ ] Handoff documentation complete

---

## Timeline Overview

```
Week 1-2: Foundation
├─ Issue #1: NLP Data Structure Analyzer
└─ Issue #3: Mermaid Diagram Generator

Week 3-4: Intelligence
├─ Issue #2: Dynamic Question Generator
└─ Issue #4: PeteAI Enhancement Layer

Week 5-6: Integration
├─ Issue #5: File Upload Integration
├─ Issue #6: Help.thepete.io API
└─ Issue #7: Loom Video Integration

Week 7-8: Production
└─ Issue #8: Deployment & Testing
```

---

## Notes for Developers

### Critical Reminders
- **NLP FIRST, AI SECOND** - Never let AI replace NLP analysis
- **Dynamic Questions** - Must reference actual uploaded data, not generic
- **Type Safety** - All interfaces in `/types` directory
- **No `any` types** - Strict TypeScript
- **Test with Real Data** - Use Pete Information Excel files
- **Performance** - Target <5 seconds for full analysis

### Code Quality Standards
- TSDoc comments on all exported functions
- Unit tests with >80% coverage
- Integration tests for critical paths
- Error boundaries in React components
- Loading states for all async operations
- Graceful degradation when services unavailable

### Git Workflow
- Branch from `Next-refactor`
- Naming: `feature/nlp-analyzer`, `fix/mermaid-colors`
- PR review required before merge
- Update CLAUDE.md with significant changes
- Tag completed work with issue numbers

---

*Issues created: 2025-09-29*
*Epic Owner: Jon*
*Developer: Mark + Claude Code*
*Target Completion: 8 weeks from start*
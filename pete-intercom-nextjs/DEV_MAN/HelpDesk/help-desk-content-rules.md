# Pete Help Desk Content Organization Rules

**Date**: 2025-10-08
**Purpose**: Define clear rules for organizing help desk content in Intercom
**Based On**: Analysis of REsimpli's industry-standard categorization patterns

---

## Core Principle

**"If an article is about Feature X, it belongs in the Feature X collection."**

Articles should be organized by SOFTWARE FEATURE, not by topic, workflow, or user role.

---

## Rule #1: Feature-Based Organization

### Definition
Each collection represents a distinct software feature or module.

### Examples
- **Lead Management collection** = Everything about the Leads feature
- **Property Management collection** = Everything about the Properties feature
- **Communication collection** = Everything about Email, Phone, SMS features
- **Workflows collection** = Everything about the Workflows feature

### Application
**CORRECT**:
- Article "Manually Add a Lead" → Lead Management collection
- Article "Configure Email Settings" → Communication collection
- Article "Create a Workflow" → Workflows collection

**INCORRECT**:
- Article "Manually Add a Lead" → Properties collection (wrong feature)
- Article "Set Up Teams" → Workflows collection (wrong feature)

### Test
Ask: "What feature/module does this article explain?"
- Answer = collection name

---

## Rule #2: No Duplicates

### Definition
Each article topic should exist in exactly ONE place.

### Examples
**CORRECT**:
- "Set Up User Profile" exists once in Company Management

**INCORRECT**:
- "Set Up User Profile" in Getting Started AND Company Management AND Support

### Resolution
When duplicates exist:
1. Identify the BEST home based on Rule #1 (feature-based)
2. Consolidate content into single article
3. Delete duplicates
4. Use "Related Articles" section for cross-references

### Application
If users need user profile setup info from Getting Started:
- Keep article in Company Management (best feature home)
- Link to it from Getting Started with "See also: Set Up User Profile"

---

## Rule #3: Consistent Article Naming

### Definition
All articles follow a consistent naming format.

### Format
`[Action Verb] + [Object] + [Optional Context]`

### Rules
1. **Remove date stamps** - Never use "Pete Support 12/26/24 - [Topic]"
2. **Use title case** - Capitalize major words
3. **Start with action verb** when possible (Set Up, Create, Configure, Add, Delete, Manage)
4. **Keep under 60 characters**
5. **Remove question format** - "How to..." is optional

### Examples
**CORRECT**:
- "Set Up Your User Profile"
- "Create Email Templates"
- "Manage Property Statuses"
- "Configure Phone System"

**INCORRECT**:
- "Pete Support 12/26/24 - User Profile Setup and Email Configuration" (date stamp, too long)
- "How Can I Manually Add a Lead?" (question format)
- "how to set up your user profile?" (lowercase, question mark)

### Action Verbs to Use
- Set Up (for initial configuration)
- Configure (for settings)
- Create (for making new items)
- Add (for adding to lists/databases)
- Edit / Update (for modifying)
- Delete / Remove (for removing)
- Manage (for overview/ongoing management)
- View (for viewing information)
- Import / Export (for data operations)

---

## Rule #4: Clear Collection Scope

### Definition
Each collection has a clear, defined boundary. No mixing of features.

### Scope Test
Can you describe the collection in one sentence?
- **YES**: "This collection contains everything about managing leads in Pete."
- **NO**: "This collection contains stuff about leads and properties and some settings."

### Examples
**CORRECT SCOPE**:
- **Lead Management**: All articles about creating, updating, deleting, and managing leads
- **Property Management**: All articles about creating, updating, deleting, and managing properties
- **Communication**: All articles about email, phone, SMS communication features

**INCORRECT SCOPE**:
- **Properties**: Mix of property articles AND lead articles (mixing features)
- **Workflows & Automation**: Mix of workflow articles AND team management (mixing features)
- **Support**: Mix of everything (no scope at all)

### Boundary Rules
- **Leads ≠ Properties** - These are separate features, separate collections
- **Users ≠ Workflows** - User management is Company Management, not Workflows
- **Email Setup ≠ Email Templates** - Both belong in Communication (same feature, different aspects)

---

## Rule #5: No "Dumping Ground" Collections

### Definition
No collection should contain more than 15% of total articles.

### Calculation
With 59 total articles:
- 15% = 9 articles maximum per collection
- Exception: Training/Release Notes collections can be larger if content is chronological

### Current Violation
- **Support collection = 24 articles (41%)** - UNACCEPTABLE

### Resolution
1. Identify proper home for each article based on Rule #1
2. Move articles to correct collections
3. Delete or rename "Support" collection

### "General" vs "Support"
- **General** (acceptable) = Cross-feature tools, account management, platform-wide features
- **Support** (unacceptable) = Dumping ground with no organizing logic

### Test
If a collection has >9 articles:
- Is it chronological content? (Release Notes, Training Videos) → OK
- Is it a major feature? (Leads, Communication) → Maybe OK if well-organized
- Is it a catch-all? (Support, General with random content) → NOT OK, redistribute

---

## Rule #6: Logical Reading Order

### Definition
Articles within a collection should be numbered or ordered to show progression.

### Order Pattern
```
1. What is [Feature]? (Conceptual introduction)
2. Set Up [Feature] (Initial configuration)
3. Basic [Feature] Actions (Common tasks)
4. Advanced [Feature] Techniques (Power user features)
```

### Examples
**Lead Management Collection Order**:
1. What are Leads in Pete? (Concept)
2. Manually Add a Lead (Basic)
3. Import Leads from CSV (Bulk)
4. Lead Statuses Explained (Understanding)
5. Manage Lead Temperature (Advanced)
6. Bulk Update Leads with Workflows (Advanced)
7. Delete a Lead (Cleanup)

**Getting Started Collection Order**:
1. Technical Requirements (Can I use Pete?)
2. Set Up Company Profile (Company setup)
3. Set Up User Profile (User setup)
4. Add Your First Contact (First action)
5. View Notifications (Basic usage)

**Current Violation**:
- Getting Started article #1 = "Grid customization" (too advanced)
- Getting Started article #8 = "Technical Requirements" (should be #1)

---

## Rule #7: Cross-Module Content Goes in "General"

### Definition
Articles that touch MULTIPLE features belong in a cross-module collection.

### "General" Collection Criteria
Article belongs in General if it meets 2+ of these:
1. **Account-level** (affects entire account: billing, users, plans)
2. **Cross-module tools** (templates used across email/SMS/tasks)
3. **Platform-wide** (dashboard, search, notifications that aggregate all data)
4. **Regulatory** (compliance, security affecting all features)

### Examples
**BELONGS in General**:
- "Create Task Templates" - Used across Leads, Properties, Buyers
- "Configure Dashboard KPIs" - Aggregates data from all modules
- "Add Team Members" - Account-level user management
- "Update Billing Information" - Account-level setting

**DOES NOT belong in General**:
- "Create Email Templates" → Communication (single feature)
- "Add a Lead" → Lead Management (single feature)
- "Configure Phone Voicemail" → Communication (single feature)

### Test
Ask: "Does this article explain a feature that's used ONLY in one module or ACROSS multiple modules?"
- One module → Feature collection
- Multiple modules → General collection

---

## Rule #8: Delete, Don't Archive

### Definition
When consolidating duplicates or removing incorrect content, DELETE rather than archive.

### Rationale
- Archived articles can confuse users if they appear in search
- Better to have ONE correct article than multiple archived duplicates
- Cleaner help center, easier maintenance

### Process
1. Identify duplicate or misplaced article
2. If content is unique, merge into correct article
3. Delete the duplicate/misplaced article
4. Set up redirect if article had external links (Intercom feature)

### Examples
- User Profile articles exist 3 times → Consolidate to 1, delete 2
- Email Template articles exist 2 times → Consolidate to 1, delete 1
- "Teams" article in Workflows → Move to Company Management, update links

---

## Rule #9: Training Content Belongs in Feature Collections

### Definition
Training videos/content should be integrated into feature collections, not separate.

### Rationale
- Users learning about workflows should find training IN the Workflows collection
- Separate "Training" collection forces users to search two places
- Better to see written article + video training together

### Application
**CURRENT (Wrong)**:
- Training collection with 3 workflow videos
- Workflows collection with 1 article (wrong article about teams)

**TARGET (Right)**:
- Workflows collection with 4 articles (3 videos + 1 article about workflows)
- Training collection deleted

### Format
When adding training videos to feature collections:
- Title: "Video: [Action]" (e.g., "Video: Creating Workflows")
- Place after related written article
- Link written article to video: "For a visual walkthrough, see Video: Creating Workflows"

---

## Rule #10: Update Notes Stay Chronological

### Definition
Release Notes and Update Notes remain in their own collection, ordered by date.

### Rationale
- These are time-based, not feature-based
- Users want to see "What changed in July?" not "What changed about leads?"
- Chronological order makes sense for updates

### Format
- Collection: "Update Notes"
- Articles: "Release Notes [Date]"
- Order: Newest first

### Cross-Referencing
Link release notes to affected feature articles:
- Release note mentions new workflow feature → Link to "Creating Workflows" article
- Release note mentions phone improvements → Link to "Phone System Setup" article

---

## Application Checklist

When adding or editing an article, verify:

- [ ] **Rule #1**: Article is in feature-based collection (Feature X article → Feature X collection)
- [ ] **Rule #2**: No duplicate articles exist for this topic
- [ ] **Rule #3**: Title follows naming format (Action Verb + Object, no dates)
- [ ] **Rule #4**: Collection has clear, single-feature scope
- [ ] **Rule #5**: Collection has <9 articles (or is chronological/major feature)
- [ ] **Rule #6**: Article is in logical reading order within collection
- [ ] **Rule #7**: Cross-module content is in General, not feature collection
- [ ] **Rule #8**: Duplicates/misplaced articles deleted, not archived
- [ ] **Rule #9**: Training content integrated into feature collections
- [ ] **Rule #10**: Update notes in chronological collection

---

## Examples: Applying the Rules

### Example 1: "Pete Support 12/26/24 - Adding a New Lead in Pete"

**Apply Rules**:
- **Rule #1** (Feature-based): Article about Leads → Lead Management collection
- **Rule #2** (No duplicates): Check for duplicate "Add Lead" articles → Found 1 in Properties (consolidate)
- **Rule #3** (Naming): Rename to "Add a New Lead"
- **Rule #6** (Reading order): Place after "What are Leads?" and before "Import Leads"

**Result**:
- New name: "Add a New Lead"
- New location: Lead Management collection, position #2
- Duplicate deleted from Properties

### Example 2: "How to set up or edit your team and responsibilities?"

**Apply Rules**:
- **Rule #1** (Feature-based): Article about Teams → Company Management collection (NOT Workflows)
- **Rule #3** (Naming): Rename to "Set Up Teams and Responsibilities"
- **Rule #6** (Reading order): Place after "Set Up Company Profile"

**Result**:
- New name: "Set Up Teams and Responsibilities"
- New location: Company Management collection (moved from Workflows)

### Example 3: "Pete Support 12/26/24 - Creating Task Templates"

**Apply Rules**:
- **Rule #7** (Cross-module): Task templates used across Leads, Properties, etc. → Could go in General OR Tasks
- Decision: Tasks collection (tasks are the primary feature, templates are secondary)
- **Rule #3** (Naming): Rename to "Create Task Templates"

**Result**:
- New name: "Create Task Templates"
- New location: Tasks collection

### Example 4: "How to Set Up User Profile" (appears 3 times)

**Apply Rules**:
- **Rule #2** (No duplicates): Consolidate 3 articles into 1
- **Rule #1** (Feature-based): User profiles → Company Management collection
- **Rule #3** (Naming): "Set Up Your User Profile"
- **Rule #8** (Delete): Delete 2 duplicates from Getting Started and Support

**Result**:
- New name: "Set Up Your User Profile"
- New location: Company Management collection
- Duplicates: DELETED (not archived)

---

## Enforcement

These rules apply to:
- All existing articles (during reorganization)
- All new articles (going forward)
- All article updates (when editing)

**Violations** should be fixed immediately:
- Misplaced articles → Move to correct collection
- Poorly named articles → Rename following Rule #3
- Duplicate articles → Consolidate and delete
- Oversized collections → Redistribute articles

---

_These rules ensure Pete's help desk follows industry-standard organization patterns for better user navigation and content management._

# Next.js Migration - GitHub Issues Template

**Based on:** `DEV_MAN/migration-completion-plan.md` and `DEV_MAN/migration-comparison.md`

**Current Status:** 75% Complete | 25% Remaining

---

## 🔥 Phase 1: CRITICAL SECURITY (Week 1-2)

### Issue #1: Implement HMAC Signature Validation
**Priority:** 🔴 CRITICAL
**Labels:** `security`, `migration`, `canvas-kit`
**Effort:** 3 days

**Description:**
Implement HMAC-SHA256 signature validation for all Canvas Kit endpoints. This is a CRITICAL security gap.

**Express Reference:**
`intercomApp/src/index.js:78-88` - `validateSignature()` middleware

**Implementation Checklist:**
- [ ] Create `src/middleware/signature-validation.ts`
- [ ] Add `validateIntercomSignature()` function
- [ ] Integrate validation in `app/api/initialize/route.ts`
- [ ] Integrate validation in `app/api/submit/route.ts`
- [ ] Add unit tests for validation logic
- [ ] Test with Intercom webhook simulator
- [ ] Add comprehensive logging for failed validations

**Acceptance Criteria:**
- All Canvas Kit endpoints validate `X-Body-Signature` header
- Invalid signatures return `401 Unauthorized`
- Valid signatures process normally
- Failed validation attempts logged

**Risk:** HIGH - App vulnerable to unauthorized requests without this

---

### Issue #2: Add Email Integration for Onboarding
**Priority:** 🟡 HIGH
**Labels:** `integration`, `migration`, `onboarding`
**Effort:** 2 days

**Description:**
Restore email notification functionality lost in migration. Onboarding form submissions should email admins.

**Express Reference:**
`intercomApp/src/index.js:283-307` - Nodemailer transporter and email sending

**Implementation Checklist:**
- [ ] Install `nodemailer` and `@types/nodemailer`
- [ ] Create `src/services/email.ts`
- [ ] Implement `sendOnboardingEmail()` function
- [ ] Create `app/api/popout-submit/route.ts` endpoint
- [ ] Add environment variables: `EMAIL_USER`, `EMAIL_PASS`
- [ ] Test email delivery with Gmail
- [ ] Add error handling and logging

**Acceptance Criteria:**
- Onboarding submissions send emails to `mark@peterei.com` and `jon@peterei.com`
- Email contains all form answers
- Failed sends logged and don't break form submission

---

### Issue #3: Complete Environment Configuration
**Priority:** 🟡 MEDIUM
**Labels:** `config`, `migration`
**Effort:** 1 day

**Description:**
Add missing environment variables and create centralized env validation.

**Missing Variables:**
- `NODE_ENV`
- `PUBLIC_URL`
- `WORKSPACE_ID`
- `EMAIL_USER`
- `EMAIL_PASS`

**Implementation Checklist:**
- [ ] Update `.env.example` with all required variables
- [ ] Create `src/lib/env.ts` with validation
- [ ] Add type-safe environment access
- [ ] Document all environment variables in README
- [ ] Add startup validation that fails fast if variables missing

**Acceptance Criteria:**
- All environment variables documented
- Type-safe access throughout codebase
- App fails gracefully with clear error if variables missing

---

## 🛠️ Phase 2: BASH SCRIPT MIGRATION (Week 3-4)

### Issue #4: Convert Admin Scripts to TypeScript Server Actions (Part 1)
**Priority:** 🟡 HIGH
**Labels:** `migration`, `admin`, `bash-to-typescript`
**Effort:** 7 days

**Description:**
Convert bash scripts in `intercomApp/src/scripts/` to TypeScript server actions. Part 1 covers core admin operations.

**Scripts to Migrate (Priority Order):**
1. ✅ `get_admins.sh` → `src/actions/admin-management.ts::getAdminsAction()`
2. ✅ `get_admin_by_id.sh` → `src/actions/admin-management.ts::getAdminByIdAction()`
3. ✅ `get_contact_id_by_email.sh` → `src/actions/contact-lookup.ts::getContactIdByEmailAction()`
4. ✅ `get_company_id_by_name.sh` → `src/actions/company-lookup.ts::getCompanyIdByNameAction()`
5. ✅ `get_me.sh` → `src/actions/admin-management.ts::getMeAction()`

**Implementation Checklist:**
- [ ] Create `src/actions/admin-management.ts`
- [ ] Create `src/actions/contact-lookup.ts`
- [ ] Create `src/actions/company-lookup.ts`
- [ ] Implement each action with full TypeScript types
- [ ] Add comprehensive error handling
- [ ] Add logging for all operations
- [ ] Create admin UI in `app/(admin)/scripts/page.tsx`
- [ ] Test each action thoroughly
- [ ] Document usage in admin interface

**Acceptance Criteria:**
- All 5 scripts converted to TypeScript
- Admin UI provides equivalent functionality
- Actions use existing Intercom service layer
- Comprehensive logging and error handling

---

### Issue #5: Convert Training & Bulk Operations Scripts (Part 2)
**Priority:** 🟡 HIGH
**Labels:** `migration`, `admin`, `bash-to-typescript`
**Effort:** 5 days

**Description:**
Convert training topic and bulk operation bash scripts to TypeScript.

**Scripts to Migrate:**
1. ✅ `update_user_training_topic.sh` → `src/actions/training.ts::updateUserTrainingTopicAction()`
2. ✅ `create_pete_user_training_topic.sh` → `src/actions/training.ts::createUserTrainingTopicAction()`
3. ✅ `get_pete_user_training_topic.sh` → `src/actions/training.ts::getUserTrainingTopicAction()`
4. ✅ `get_all_pete_user_training_topics.sh` → `src/actions/training.ts::getAllTrainingTopicsAction()`
5. ✅ `update_company_petetraining.sh` → `src/actions/training.ts::updateCompanyTrainingAction()`

**Implementation Checklist:**
- [ ] Create `src/actions/training.ts`
- [ ] Implement CRUD operations for training topics
- [ ] Add bulk update functionality
- [ ] Integrate with existing Intercom API
- [ ] Add validation (GET before PUT/POST per Cursor rules)
- [ ] Create training management UI
- [ ] Test all operations
- [ ] Document training data model

**Acceptance Criteria:**
- All training operations work via TypeScript
- Bulk operations handle errors gracefully
- UI provides easy training topic management

---

### Issue #6: Convert Health Check & Utility Scripts (Part 3)
**Priority:** 🟢 MEDIUM
**Labels:** `migration`, `admin`, `bash-to-typescript`
**Effort:** 3 days

**Description:**
Convert remaining utility and health check scripts.

**Scripts to Migrate:**
1. ✅ `endpoint_health_check.sh` → `src/actions/health.ts::checkEndpointHealthAction()`

**Enhanced Implementation:**
- Check Intercom API connectivity
- Verify cache health
- Check memory usage
- Test all critical endpoints
- Generate health report

**Implementation Checklist:**
- [ ] Create `src/actions/health.ts`
- [ ] Implement comprehensive health checks
- [ ] Create `app/api/health/route.ts` for external monitoring
- [ ] Add health dashboard in admin
- [ ] Add automated health monitoring
- [ ] Set up alerting for failures

**Acceptance Criteria:**
- Comprehensive health check functionality
- Health dashboard shows all system status
- API route for external monitoring

---

## 📊 Phase 3: ENHANCED FEATURES (Week 5-6)

### Issue #7: Implement Chart Integration
**Priority:** 🟢 MEDIUM
**Labels:** `enhancement`, `ui`, `charts`
**Effort:** 3 days

**Description:**
Add Chart.js integration for admin dashboard visualizations.

**Express Reference:**
`intercomApp/src/utils/chart.js` - Chart utility functions

**Implementation Checklist:**
- [ ] Install `chart.js` and `react-chartjs-2`
- [ ] Create `src/components/charts/` directory
- [ ] Implement `ConversationStatsChart.tsx`
- [ ] Implement `UserActivityChart.tsx`
- [ ] Implement `TrainingProgressChart.tsx`
- [ ] Add charts to admin dashboard
- [ ] Make charts responsive
- [ ] Add export functionality

**Acceptance Criteria:**
- Charts display Intercom data
- Charts update when data refreshes
- Charts are responsive and accessible

---

### Issue #8: Complete Mermaid Diagram Rendering
**Priority:** 🟢 LOW
**Labels:** `enhancement`, `documentation`
**Effort:** 2 days

**Description:**
Add Mermaid diagram rendering to documentation system.

**Express Reference:**
`intercomApp/src/index.js:443-494` - Mermaid rendering logic

**Implementation Checklist:**
- [ ] Install `mermaid` and required dependencies
- [ ] Create `src/components/MermaidRenderer.tsx`
- [ ] Integrate with MDX rendering in docs
- [ ] Add client-side rendering for diagrams
- [ ] Handle diagram errors gracefully
- [ ] Test with existing DEV_MAN diagrams

**Acceptance Criteria:**
- Mermaid diagrams render in `/docs/*` routes
- Diagrams are interactive where applicable
- Errors handled gracefully

---

## 🚀 Phase 4: PRODUCTION HARDENING (Week 7-8)

### Issue #9: Implement Production Logging & Monitoring
**Priority:** 🟡 HIGH
**Labels:** `production`, `observability`
**Effort:** 4 days

**Description:**
Enhance logging and add comprehensive monitoring for production.

**Implementation Checklist:**
- [ ] Add structured logging (JSON format)
- [ ] Implement log rotation
- [ ] Add request tracing
- [ ] Create log viewer in admin dashboard
- [ ] Set up error alerting
- [ ] Add performance monitoring
- [ ] Implement audit logs for sensitive operations

**Acceptance Criteria:**
- All operations comprehensively logged
- Logs viewable in admin interface
- Errors trigger alerts
- Performance metrics tracked

---

### Issue #10: Add Testing Infrastructure
**Priority:** 🟡 MEDIUM
**Labels:** `testing`, `quality`
**Effort:** 5 days

**Description:**
Set up comprehensive testing infrastructure.

**Implementation Checklist:**
- [ ] Install Vitest and Testing Library
- [ ] Create test setup and configuration
- [ ] Write unit tests for server actions
- [ ] Write integration tests for Canvas Kit flows
- [ ] Write tests for Intercom API integration
- [ ] Add test coverage reporting
- [ ] Set up CI pipeline for tests
- [ ] Document testing guidelines

**Acceptance Criteria:**
- Test coverage > 80% for critical paths
- All tests pass in CI
- Testing documentation complete

---

### Issue #11: Security Hardening
**Priority:** 🔴 CRITICAL
**Labels:** `security`, `production`
**Effort:** 3 days

**Description:**
Comprehensive security review and hardening.

**Implementation Checklist:**
- [ ] Add rate limiting to all API routes
- [ ] Implement origin validation
- [ ] Add CORS configuration
- [ ] Security headers middleware
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (if applicable)
- [ ] XSS prevention
- [ ] Security audit and penetration testing
- [ ] Document security measures

**Acceptance Criteria:**
- Security audit passes
- Rate limiting prevents abuse
- All inputs validated
- Security best practices documented

---

## ✅ Phase 5: FINAL MIGRATION (Week 9)

### Issue #12: Comprehensive Testing & Validation
**Priority:** 🔴 CRITICAL
**Labels:** `testing`, `migration`, `final`
**Effort:** 5 days

**Description:**
End-to-end testing of all migrated features to ensure parity with Express app.

**Testing Checklist:**
- [ ] Canvas Kit flows (Messenger & Inbox)
- [ ] Onboarding questionnaire (full flow)
- [ ] All admin pages and actions
- [ ] All converted bash script functionality
- [ ] Intercom API operations
- [ ] PeteAI functionality
- [ ] Email delivery
- [ ] Bulk operations
- [ ] Health monitoring
- [ ] Logging system
- [ ] Caching system
- [ ] Error handling edge cases

**Performance Testing:**
- [ ] Load testing under expected traffic
- [ ] Memory leak testing
- [ ] Response time benchmarks
- [ ] Cache performance validation

**Acceptance Criteria:**
- All features work identically to Express app
- No critical bugs found
- Performance meets or exceeds Express baseline
- Documentation complete and accurate

---

### Issue #13: Production Deployment Preparation
**Priority:** 🔴 CRITICAL
**Labels:** `deployment`, `production`
**Effort:** 3 days

**Description:**
Prepare for production deployment and cutover.

**Implementation Checklist:**
- [ ] Update deployment scripts for Next.js
- [ ] Configure production environment variables
- [ ] Set up production database/cache (if applicable)
- [ ] Configure CDN and edge caching
- [ ] Set up monitoring and alerting
- [ ] Create rollback plan
- [ ] Document deployment process
- [ ] Conduct deployment dry run
- [ ] Schedule maintenance window
- [ ] Notify stakeholders

**Acceptance Criteria:**
- Deployment process documented and tested
- Rollback plan validated
- All stakeholders informed
- Production environment ready

---

### Issue #14: Express App Deletion (FINAL STEP)
**Priority:** 🔴 CRITICAL
**Labels:** `migration`, `cleanup`, `breaking-change`
**Effort:** 2 days

**Description:**
⚠️ **ONLY EXECUTE AFTER ALL ABOVE ISSUES COMPLETE** ⚠️

Delete Express app entirely, making Next.js the sole application.

**Pre-Deletion Validation:**
- [ ] All 13 previous issues completed
- [ ] All features tested in production
- [ ] 48 hours of production stability
- [ ] Zero critical bugs reported
- [ ] Stakeholder approval obtained
- [ ] Backup created and verified

**Deletion Steps:**
1. [ ] Create backup branch: `git branch express-backup-YYYY-MM-DD`
2. [ ] Delete `intercomApp/` directory
3. [ ] Move/rename `pete-intercom-nextjs/` to root (or keep structure)
4. [ ] Update `start.sh` to run Next.js app
5. [ ] Update all documentation references
6. [ ] Remove Express-related dependencies from root
7. [ ] Update `.gitignore` if needed
8. [ ] Update CI/CD pipelines
9. [ ] Final smoke test

**Files/Directories to DELETE:**
```
intercomApp/src/
intercomApp/package.json
intercomApp/README.md
intercomApp/.env
intercomApp/node_modules/
```

**Acceptance Criteria:**
- Express app completely removed
- Next.js app is sole application
- All functionality preserved
- Production running smoothly
- Documentation updated
- Team trained on new system

---

## 📊 Migration Metrics

**Total Issues:** 14
**Estimated Timeline:** 9 weeks (~175 hours)

**Priority Breakdown:**
- 🔴 Critical: 5 issues
- 🟡 High/Medium: 7 issues
- 🟢 Low: 2 issues

**Phase Duration:**
- Phase 1 (Critical Security): 2 weeks
- Phase 2 (Bash Scripts): 2 weeks
- Phase 3 (Enhanced Features): 2 weeks
- Phase 4 (Production Hardening): 2 weeks
- Phase 5 (Final Migration): 1 week

---

## 🎯 Success Criteria Summary

**Phase 1 Complete:**
- ✅ HMAC signature validation working
- ✅ Email notifications functional
- ✅ Environment properly configured

**Phase 2 Complete:**
- ✅ All 11 bash scripts converted to TypeScript
- ✅ Admin UI provides all bash script functionality
- ✅ No regression in administrative capabilities

**Phase 3 Complete:**
- ✅ Charts displaying data
- ✅ Mermaid diagrams rendering
- ✅ UI/UX equals or exceeds Express app

**Phase 4 Complete:**
- ✅ Production logging and monitoring active
- ✅ Test coverage > 80%
- ✅ Security audit passed
- ✅ Performance benchmarks met

**Phase 5 Complete:**
- ✅ All features tested and validated
- ✅ Production deployment successful
- ✅ Express app deleted
- ✅ Team trained
- ✅ Documentation complete

---

## 📝 Usage Instructions

**To create GitHub issues from this template:**

```bash
# Use GitHub CLI to create issues
gh issue create --title "Issue #1: Implement HMAC Signature Validation" \
  --body "$(sed -n '/### Issue #1/,/^---$/p' MIGRATION-ISSUES.md)" \
  --label "security,migration,canvas-kit" \
  --milestone "Phase 1: Critical Security"

# Or manually copy each issue section into GitHub's issue UI
```

**To track progress:**
- Use GitHub Projects to create a migration board
- Link all issues to a "Next.js Migration" milestone
- Track completion percentage
- Review weekly in team meetings

---

**Based on:**
- `DEV_MAN/migration-completion-plan.md` (Detailed implementation guide)
- `DEV_MAN/migration-comparison.md` (Feature parity analysis)
- `DEV_MAN/nextjs-migration-plan.md` (Architecture strategy)
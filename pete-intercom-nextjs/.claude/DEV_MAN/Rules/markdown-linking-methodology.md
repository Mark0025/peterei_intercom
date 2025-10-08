# DEV_MAN Markdown Linking Methodology

**Created**: 2025-10-08
**Status**: Active
**Applies To**: All documentation in `/DEV_MAN`

---

## Rule: Follow Next.js 15.3+ Routing for All DEV_MAN Links

When writing or updating documentation in DEV_MAN, **ALWAYS** use proper file paths for internal links that work with Next.js 15.3+ dynamic routing.

---

## ✅ DO: Use File-Based Links

### Relative to Current File

When linking from one doc to another **in the same folder**:
```markdown
[AI Architecture Overview](./00-AI-ARCHITECTURE-OVERVIEW.md)
[Security Guide](./01-CLERK-SECURITY-DEEP-DIVE.md)
```

When linking to a file **in a subfolder**:
```markdown
[Archive Document](./archive/old-plan.md)
[Completed Migration](./completed/migration-issue-123.md)
```

When linking to a file **in parent folder**:
```markdown
[Main README](../README.md)
[Guidelines](../../Guidelines/TYPESCRIPT-ANY-TYPES-PREVENTION.md)
```

### Implicit Relative (Same Folder)

Links without `./` or `../` are resolved relative to the current file's directory:
```markdown
[Same Folder File](other-document.md)
```

This works because the docs browser automatically resolves it as:
```
Current: AI_Architecture/README.md
Link: 00-AI-ARCHITECTURE-OVERVIEW.md
Resolves to: AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md
```

---

## ❌ DON'T: Use Fragment/Anchor Links for Navigation

**Fragment links DO NOT work for routing to different files:**

```markdown
<!-- ❌ WRONG - This won't navigate to a file -->
[Agent Matrix](#agent-comparison-matrix)
[Security Overview](#security-overview)
```

**Why**: Fragments (`#section-name`) only scroll within the **current** page. They don't route to different files.

**When to use fragments**: Only for linking to sections **within the same document**:
```markdown
<!-- ✅ CORRECT - Links to section in current file -->
Jump to [Implementation Details](#implementation-details) below.
```

---

## 📁 File Path Structure

All DEV_MAN links follow this structure:
```
/admin/docs/[...path-to-file].md
```

Examples:
```
/admin/docs/AI_Architecture/README.md
/admin/docs/AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md
/admin/docs/Application_Security/01-CLERK-SECURITY-DEEP-DIVE.md
/admin/docs/Planning/clerk-integration-plan.md
```

---

## 🔧 How Links Are Processed

### In File Browser
- Uses Next.js `<Link>` components
- Direct routing with `href={/admin/docs/${file.path}}`
- URL updates immediately
- Browser history works

### In Markdown Content
- Custom click handler intercepts link clicks
- Resolves relative paths based on current file location
- Uses `router.push()` for navigation
- Preserves Next.js optimizations

---

## 📝 Writing Guidelines

### When Creating New Docs

1. **Use relative paths** for links within DEV_MAN
2. **Test links** by clicking them in `/admin/docs`
3. **Verify URL updates** correctly
4. **Check browser back button** works

### Example: Creating a New Plan

```markdown
# New Feature Plan

**Related Docs**:
- [Architecture Overview](../AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md)
- [Security Checklist](../Application_Security/03-PRODUCTION-READINESS-CHECKLIST.md)
- [Completed Migration](../completed/migration/nextjs-migration-plan.md)

## Implementation

See [TypeScript Guidelines](../Guidelines/TYPESCRIPT-ANY-TYPES-PREVENTION.md) for coding standards.
```

### Example: Cross-Folder Navigation

From `AI_Architecture/README.md` to `Application_Security/README.md`:
```markdown
For security considerations, see [Application Security](../Application_Security/README.md).
```

---

## 🎯 Quick Reference

| Link Type | Syntax | Example | When to Use |
|-----------|--------|---------|-------------|
| Same folder | `./file.md` | `[Doc](./README.md)` | Files in same directory |
| Subfolder | `./folder/file.md` | `[Archive](./archive/old.md)` | Files in subdirectory |
| Parent folder | `../file.md` | `[Up](../README.md)` | Files in parent directory |
| Implicit relative | `file.md` | `[Same](other.md)` | Files in same directory |
| Fragment (same doc) | `#section` | `[Section](#details)` | Sections in current file only |
| External | `https://...` | `[GitHub](https://...)` | External websites |

---

## 🚫 Common Mistakes

### Mistake 1: Using Fragments for Different Files
```markdown
<!-- ❌ WRONG -->
[Security Overview](docs#security-overview)

<!-- ✅ CORRECT -->
[Security Overview](../Application_Security/00-SECURITY-OVERVIEW.md)
```

### Mistake 2: Absolute Paths from Root
```markdown
<!-- ❌ WRONG - Not portable -->
[Doc](/DEV_MAN/AI_Architecture/README.md)

<!-- ✅ CORRECT - Relative path -->
[Doc](../AI_Architecture/README.md)
```

### Mistake 3: Missing File Extension
```markdown
<!-- ❌ WRONG - Extension required -->
[Doc](./README)

<!-- ✅ CORRECT - Include .md -->
[Doc](./README.md)
```

---

## 🔍 Testing Links

Before committing documentation:

1. **Open the doc in browser**: `/admin/docs/[path]`
2. **Click each link**: Verify it navigates correctly
3. **Check URL bar**: Should update to new file path
4. **Test back button**: Should return to previous doc
5. **Check console**: No errors in browser console

---

## 🏗️ Technical Implementation

The linking system uses:

- **Next.js 15.3+ Dynamic Routes**: `[[...slug]]/page.tsx`
- **Custom Link Handler**: Intercepts markdown link clicks
- **Path Resolution**: Resolves `./`, `../`, and implicit relatives
- **Next.js Router**: `useRouter()` for programmatic navigation
- **URL State**: Browser URL syncs with current document

See commit `982eefa` for full implementation.

---

## 📚 Examples from Real Docs

### AI Architecture README
```markdown
**Main Docs**: [AI_Architecture/](./AI_Architecture/)
**Overview**: [00-AI-ARCHITECTURE-OVERVIEW.md](./AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md)
```

### Application Security README
```markdown
**Start Here**: [00-SECURITY-OVERVIEW.md](./Application_Security/00-SECURITY-OVERVIEW.md)
**Clerk Deep Dive**: [01-CLERK-SECURITY-DEEP-DIVE.md](./Application_Security/01-CLERK-SECURITY-DEEP-DIVE.md)
```

### Main DEV_MAN README
```markdown
### AI & Agents
- **Main Docs**: [AI_Architecture/](./AI_Architecture/)
- **Overview**: [00-AI-ARCHITECTURE-OVERVIEW.md](./AI_Architecture/00-AI-ARCHITECTURE-OVERVIEW.md)
```

---

## 🎓 Best Practices

1. ✅ **Always use `.md` extension**
2. ✅ **Prefer relative paths over absolute**
3. ✅ **Test links before committing**
4. ✅ **Use descriptive link text**
5. ✅ **Keep path structure flat when possible**
6. ✅ **Document cross-references clearly**
7. ✅ **Update links when moving files**
8. ✅ **Use fragments only for same-page navigation**

---

## 🔄 When This Rule Applies

- ✅ All new documentation in DEV_MAN
- ✅ All updates to existing docs
- ✅ All README files
- ✅ All planning documents
- ✅ All architecture docs
- ✅ Any markdown file served by `/admin/docs`

---

## 📞 Questions?

If links aren't working:
1. Check browser console for errors
2. Verify file path is correct relative to current file
3. Ensure `.md` extension is included
4. Test in `/admin/docs` browser
5. Review this document

---

**Last Updated**: 2025-10-08
**Next Review**: When Next.js routing methodology changes
**Maintained By**: Claude Code + Development Team

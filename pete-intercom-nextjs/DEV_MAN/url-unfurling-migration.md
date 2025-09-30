# URL Unfurling Migration Plan

## Problem
Canvas Kit widgets not showing for URLs in Intercom conversations (e.g., help.thepete.io links). This was working in the old Express app but is missing in the Next.js migration.

## Root Cause
The `/api/initialize` endpoint currently only returns static onboarding buttons. It doesn't:
1. Check if the request contains a URL context
2. Detect help.thepete.io URLs
3. Return URL preview widgets with metadata (title, description, image)

## Solution Overview
Add URL detection and unfurling logic to the Canvas Kit initialization endpoint.

## Implementation Steps

### 1. Update `/api/initialize/route.ts`
- Parse the request payload for URL context
- Check if `context.url` or similar field contains a URL
- Extract the URL and determine if it's a help.thepete.io link

### 2. Create URL Unfurling Service `/src/services/url-unfurl.ts`
```typescript
export interface URLMetadata {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  author?: string;
}

export async function fetchURLMetadata(url: string): Promise<URLMetadata>
```

**Logic:**
- For `help.thepete.io` URLs: Call `/api/help-proxy` to get article metadata
- For other URLs: Basic Open Graph / meta tag scraping
- Return structured metadata for Canvas Kit components

### 3. Add Canvas Kit URL Preview Components
Update `/src/actions/canvas-kit.ts` to include:
```typescript
function createImageComponent(id: string, url: string): CanvasKitComponent
function createLinkComponent(id: string, text: string, url: string): CanvasKitComponent
```

### 4. Update `initializeCanvasKit()` Function
```typescript
export async function initializeCanvasKit(
  payload?: { context?: { url?: string } }
): Promise<ActionResult<CanvasKitResponse>>
```

**Logic:**
```
if (payload?.context?.url) {
  const url = payload.context.url;

  if (url.includes('help.thepete.io')) {
    const metadata = await fetchURLMetadata(url);

    return {
      canvas: {
        content: {
          components: [
            createImageComponent('preview_image', metadata.imageUrl),
            createTextComponent('title', metadata.title, 'header'),
            createTextComponent('description', metadata.description),
            createLinkComponent('view_article', 'View Article', url)
          ]
        }
      }
    };
  }
}

// Fallback to default onboarding buttons
return defaultOnboardingResponse();
```

### 5. Test URL Patterns
Test with these URL types:
- `https://help.thepete.io/en/collections/10827028-getting-started`
- `https://help.thepete.io/en/articles/12345-article-name`
- External URLs (should fallback gracefully)

## Canvas Kit Components for URL Preview

```javascript
{
  "canvas": {
    "content": {
      "components": [
        {
          "type": "image",
          "id": "article_preview",
          "url": "https://help.thepete.io/.../image.png",
          "width": "full",
          "height": 200,
          "align": "center"
        },
        {
          "type": "text",
          "id": "article_title",
          "text": "Getting Started with Pete",
          "style": "header",
          "align": "left"
        },
        {
          "type": "text",
          "id": "article_description",
          "text": "Learn the basics of Pete in just a few minutes...",
          "align": "left"
        },
        {
          "type": "button",
          "id": "view_article",
          "label": "View Full Article →",
          "style": "primary",
          "action": {
            "type": "url",
            "url": "https://help.thepete.io/en/articles/..."
          }
        }
      ]
    }
  }
}
```

## Files to Modify
1. `/src/app/api/initialize/route.ts` - Parse URL from payload
2. `/src/actions/canvas-kit.ts` - Add URL unfurling logic
3. `/src/services/url-unfurl.ts` (NEW) - URL metadata fetching
4. `/src/types/index.ts` - Add URL context types

## Testing Checklist
- [ ] Test with help.thepete.io collection URL
- [ ] Test with help.thepete.io article URL
- [ ] Test with external URLs (graceful fallback)
- [ ] Test with no URL context (default buttons)
- [ ] Verify signature validation still works
- [ ] Check image loading and rendering
- [ ] Verify "View Article" button opens correct URL

## Acceptance Criteria
✅ When a help.thepete.io URL is sent in an Intercom conversation, the widget appears with:
  - Article title
  - Article description
  - Preview image (if available)
  - "View Article" button

✅ When no URL is present, default onboarding buttons appear

✅ External URLs either show basic preview or no widget

## Notes
- Intercom sends URL context in the `/initialize` payload when it detects a URL
- The payload structure is: `{ context: { url: string }, ... }`
- We may need to check Intercom Canvas Kit docs for exact payload structure
- Consider caching URL metadata to avoid repeated fetches

## Priority
**HIGH** - User-facing feature regression from Express migration

## Estimated Time
- Setup URL detection: 30 min
- Create unfurling service: 1 hour
- Add Canvas Kit components: 30 min
- Testing and debugging: 1 hour
- **Total: ~3 hours**

# Help Links Utility

A comprehensive utility for generating consistent help documentation links across the entire application.

## Features

- **Consistent Link Formatting**: All help links use the same styling and behavior
- **Multiple Contexts**: Support for chat, admin, and navigation contexts
- **Proxy Support**: Automatic handling of iframe embedding via proxy
- **TypeScript Support**: Full type safety and IntelliSense
- **PeteAI Integration**: Tools for AI agent to generate links

## Quick Start

```typescript
import {
  createHelpDocLink,
  HelpLinkFormatter,
  COMMON_HELP_LINKS,
} from '@/utils/help-links';

// Basic usage
const link = createHelpDocLink(
  'collections/10827028-getting-started',
  'Getting Started'
);

// Using formatters
const chatLink = HelpLinkFormatter.forChat('collections/tasks', 'Tasks');
const adminLink = HelpLinkFormatter.forAdmin(
  'collections/integrations',
  'Integrations'
);

// Using common links
const gettingStarted = COMMON_HELP_LINKS.gettingStarted();
```

## API Reference

### Core Functions

#### `createHelpDocLink(path, text, options?)`

Creates a help documentation link with consistent formatting.

**Parameters:**

- `path`: Help documentation path (e.g., 'collections/10827028-getting-started')
- `text`: Display text for the link
- `options`: Optional configuration

**Returns:** `HelpLinkResult` object with URL, text, and HTML attributes

#### `createHelpSearchLink(query, text?, options?)`

Creates a help search link.

#### `createHelpCategoryLink(category, text?, options?)`

Creates a help category link.

### Formatters

#### `HelpLinkFormatter.forChat(path, text)`

Formats links for chat/AI responses (internal, proxy links).

#### `HelpLinkFormatter.forAdmin(path, text)`

Formats links for admin pages (external links).

#### `HelpLinkFormatter.forNavigation(path, text)`

Formats links for navigation (external links).

#### `HelpLinkFormatter.forIframe(path, text)`

Formats links for iframe embedding (proxy links).

### PeteAI Integration

#### `PeteAIHelpLinks.generateLink(path, text)`

Generates HTML for PeteAI responses.

#### `PeteAIHelpLinks.generateMultipleLinks(links)`

Generates multiple links joined with separators.

## Common Help Paths

```typescript
import { HELP_PATHS } from '@/utils/help-links';

HELP_PATHS.GETTING_STARTED; // 'collections/10827028-getting-started'
HELP_PATHS.WORKFLOWS; // 'collections/11235880-workflows-automation'
HELP_PATHS.TASKS; // 'collections/10826939-tasks'
HELP_PATHS.COMMUNICATION; // 'collections/10827385-communication'
HELP_PATHS.PROPERTIES; // 'collections/10827549-properties'
HELP_PATHS.INTEGRATIONS; // 'collections/11235874-integrations'
```

## PeteAI Agent Tools

The utility includes two tools for the PeteAI agent:

1. **`generate_help_link`**: Generate a single help link
2. **`generate_multiple_help_links`**: Generate multiple help links

These tools are automatically available to PeteAI and will generate properly formatted HTML links.

## Examples

### React Component Usage

```tsx
import { createHelpDocLink, HELP_PATHS } from '@/utils/help-links';

function MyComponent() {
  const link = createHelpDocLink(
    HELP_PATHS.GETTING_STARTED,
    'Getting Started',
    {
      external: true,
      className: 'my-custom-class',
    }
  );

  return (
    <a
      href={link.url}
      target={link.attributes.target}
      className={link.attributes.class}
      rel={link.attributes.rel}
    >
      {link.text}
    </a>
  );
}
```

### PeteAI Response

When PeteAI generates help documentation, it will automatically include properly formatted links:

```html
<a
  href="/api/help-proxy?path=/collections/10827028-getting-started"
  class="font-medium text-blue-600 hover:text-blue-800 underline"
>
  Getting Started Guide
</a>
```

### HTML Generation

```typescript
import { generateHelpLinkHTML } from '@/utils/help-links';

const html = generateHelpLinkHTML(
  'collections/10827028-getting-started',
  'Getting Started Guide',
  { external: true }
);
// Returns: '<a href="https://help.thepete.io/en/collections/10827028-getting-started" class="..." target="_blank" rel="noopener noreferrer">Getting Started Guide</a>'
```

## Configuration

The utility uses these base URLs:

- **Help Center**: `https://help.thepete.io/en/`
- **Proxy**: `/api/help-proxy`

These can be imported from the utility if needed:

```typescript
import { HELP_BASE_URL, HELP_PROXY_URL } from '@/utils/help-links';
```

## TypeScript Support

Full TypeScript support with interfaces:

```typescript
interface HelpLinkOptions {
  external?: boolean;
  className?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  useProxy?: boolean;
  attributes?: Record<string, string>;
}

interface HelpLinkResult {
  url: string;
  text: string;
  attributes: Record<string, string>;
  isExternal: boolean;
  usesProxy: boolean;
}
```

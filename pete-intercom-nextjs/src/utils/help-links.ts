/**
 * Help Documentation Link Utility
 * 
 * Provides consistent link formatting and generation for help documentation
 * across the entire application. Can be used by components, agents, and other utilities.
 */

export interface HelpLinkOptions {
  /** Whether to open in new tab (default: true for external links) */
  external?: boolean;
  /** CSS classes to apply */
  className?: string;
  /** Target attribute for the link */
  target?: '_blank' | '_self' | '_parent' | '_top';
  /** Whether to use proxy URL for iframe embedding */
  useProxy?: boolean;
  /** Additional attributes */
  attributes?: Record<string, string>;
}

export interface HelpLinkResult {
  /** The formatted URL */
  url: string;
  /** The display text */
  text: string;
  /** HTML attributes for the link */
  attributes: Record<string, string>;
  /** Whether this is an external link */
  isExternal: boolean;
  /** Whether this uses the proxy */
  usesProxy: boolean;
}

/**
 * Base URL for help documentation
 */
export const HELP_BASE_URL = 'https://help.thepete.io/en/';

/**
 * Proxy URL for iframe embedding
 */
export const HELP_PROXY_URL = '/api/help-proxy';

/**
 * Create a help documentation link with consistent formatting
 */
export function createHelpDocLink(
  path: string,
  text: string,
  options: HelpLinkOptions = {}
): HelpLinkResult {
  const {
    external = false,
    className = '',
    target = external ? '_blank' : '_self',
    useProxy = !external,
    attributes = {}
  } = options;

  // Normalize path (remove leading slash if present)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Determine the base URL
  const baseUrl = useProxy ? HELP_PROXY_URL : HELP_BASE_URL;
  
  // Construct the full URL
  const url = useProxy 
    ? `${baseUrl}?path=/${normalizedPath}`
    : `${baseUrl}${normalizedPath}`;

  // Build CSS classes
  const linkClasses = [
    'text-primary hover:text-primary/80',
    'underline hover:no-underline',
    'transition-colors',
    className
  ].filter(Boolean).join(' ');

  // Build attributes
  const linkAttributes: Record<string, string> = {
    href: url,
    class: linkClasses,
    ...(target && { target }),
    ...(external && { rel: 'noopener noreferrer' }),
    ...attributes
  };

  return {
    url,
    text,
    attributes: linkAttributes,
    isExternal: external,
    usesProxy: useProxy
  };
}

/**
 * Create a help search link
 */
export function createHelpSearchLink(
  query: string,
  text?: string,
  options: HelpLinkOptions = {}
): HelpLinkResult {
  const searchText = text || `Search: "${query}"`;
  const searchPath = `?search=${encodeURIComponent(query)}`;
  
  return createHelpDocLink(searchPath, searchText, {
    external: true,
    ...options
  });
}

/**
 * Create a help category link
 */
export function createHelpCategoryLink(
  category: string,
  text?: string,
  options: HelpLinkOptions = {}
): HelpLinkResult {
  const categoryText = text || category;
  const categoryPath = `?category=${encodeURIComponent(category)}`;
  
  return createHelpDocLink(categoryPath, categoryText, options);
}

/**
 * Create a help article link
 */
export function createHelpArticleLink(
  articlePath: string,
  title: string,
  options: HelpLinkOptions = {}
): HelpLinkResult {
  return createHelpDocLink(articlePath, title, options);
}

/**
 * Format help links for different contexts
 */
export class HelpLinkFormatter {
  /**
   * Format for chat/AI responses (internal links)
   */
  static forChat(path: string, text: string): HelpLinkResult {
    return createHelpDocLink(path, text, {
      useProxy: true,
      external: false,
      className: 'font-medium text-blue-600 hover:text-blue-800'
    });
  }

  /**
   * Format for admin pages (external links)
   */
  static forAdmin(path: string, text: string): HelpLinkResult {
    return createHelpDocLink(path, text, {
      external: true,
      className: 'text-primary hover:text-primary/80 font-medium'
    });
  }

  /**
   * Format for navigation (external links)
   */
  static forNavigation(path: string, text: string): HelpLinkResult {
    return createHelpDocLink(path, text, {
      external: true,
      className: 'text-foreground hover:text-primary transition-colors'
    });
  }

  /**
   * Format for iframe embedding (proxy links)
   */
  static forIframe(path: string, text: string): HelpLinkResult {
    return createHelpDocLink(path, text, {
      useProxy: true,
      external: false,
      className: 'text-blue-600 hover:text-blue-800'
    });
  }
}

/**
 * Generate HTML for a help link
 */
export function generateHelpLinkHTML(
  path: string,
  text: string,
  options: HelpLinkOptions = {}
): string {
  const link = createHelpDocLink(path, text, options);
  
  const attributesString = Object.entries(link.attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return `<a ${attributesString}>${text}</a>`;
}

/**
 * Generate Markdown for a help link
 */
export function generateHelpLinkMarkdown(
  path: string,
  text: string,
  options: HelpLinkOptions = {}
): string {
  const link = createHelpDocLink(path, text, options);
  return `[${text}](${link.url})`;
}

/**
 * Common help documentation paths
 */
export const HELP_PATHS = {
  GETTING_STARTED: 'collections/10827028-getting-started',
  WORKFLOWS: 'collections/11235880-workflows-automation',
  TASKS: 'collections/10826939-tasks',
  COMMUNICATION: 'collections/10827385-communication',
  PROPERTIES: 'collections/10827549-properties',
  INTEGRATIONS: 'collections/11235874-integrations',
  SUPPORT: 'collections/10827385-communication',
  UPDATE_NOTES: 'collections/update-notes'
} as const;

/**
 * Pre-configured help links for common topics
 */
export const COMMON_HELP_LINKS = {
  gettingStarted: () => createHelpDocLink(
    HELP_PATHS.GETTING_STARTED,
    'Getting Started Guide',
    { external: true }
  ),
  workflows: () => createHelpDocLink(
    HELP_PATHS.WORKFLOWS,
    'Workflows & Automation',
    { external: true }
  ),
  tasks: () => createHelpDocLink(
    HELP_PATHS.TASKS,
    'Tasks Management',
    { external: true }
  ),
  communication: () => createHelpDocLink(
    HELP_PATHS.COMMUNICATION,
    'Communication Settings',
    { external: true }
  ),
  properties: () => createHelpDocLink(
    HELP_PATHS.PROPERTIES,
    'Properties Management',
    { external: true }
  ),
  integrations: () => createHelpDocLink(
    HELP_PATHS.INTEGRATIONS,
    'Integrations Setup',
    { external: true }
  )
} as const;

/**
 * Utility for PeteAI agent to generate help links
 */
export class PeteAIHelpLinks {
  /**
   * Generate a help link for PeteAI responses
   */
  static generateLink(path: string, text: string): string {
    const link = HelpLinkFormatter.forChat(path, text);
    return generateHelpLinkHTML(path, text, {
      useProxy: true,
      external: false,
      className: 'font-medium text-blue-600 hover:text-blue-800 underline'
    });
  }

  /**
   * Generate multiple help links for a response
   */
  static generateMultipleLinks(links: Array<{ path: string; text: string }>): string {
    return links
      .map(({ path, text }) => this.generateLink(path, text))
      .join(' • ');
  }

  /**
   * Generate a help search link
   */
  static generateSearchLink(query: string): string {
    return this.generateLink(`?search=${encodeURIComponent(query)}`, `Search: "${query}"`);
  }

  /**
   * Generate a category link
   */
  static generateCategoryLink(category: string): string {
    return this.generateLink(`?category=${encodeURIComponent(category)}`, category);
  }
}

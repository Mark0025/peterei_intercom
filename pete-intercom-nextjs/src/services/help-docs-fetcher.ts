/**
 * Help Documentation Fetcher Service
 * 
 * This service provides functionality to fetch and integrate with help.thepete.io
 * Currently implements iframe integration, with foundation for future API integration
 */

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  url: string;
  lastUpdated: string;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  articleCount: number;
  articles: HelpArticle[];
}

export interface HelpSearchResult {
  query: string;
  results: HelpArticle[];
  totalResults: number;
  categories: string[];
}

/**
 * Help Center Configuration
 */
export const HELP_CENTER_CONFIG = {
  baseUrl: 'https://help.thepete.io/en/',
  apiBaseUrl: 'https://help.thepete.io/api/v1', // Future API endpoint
  categories: [
    'Getting Started',
    'Workflows & Automation', 
    'Tasks',
    'Communication',
    'Properties',
    'Integrations',
    'Training',
    'Support',
    'Update Notes'
  ]
} as const;

/**
 * Get help center iframe URL
 */
export function getHelpCenterUrl(category?: string): string {
  const baseUrl = HELP_CENTER_CONFIG.baseUrl;
  return category ? `${baseUrl}?category=${encodeURIComponent(category)}` : baseUrl;
}

/**
 * Get help center search URL
 */
export function getHelpSearchUrl(query: string): string {
  return `${HELP_CENTER_CONFIG.baseUrl}?search=${encodeURIComponent(query)}`;
}

/**
 * Future API Integration Functions
 * These will be implemented when help.thepete.io API becomes available
 */

/**
 * Fetch all help categories (Future API implementation)
 */
export async function fetchHelpCategories(): Promise<HelpCategory[]> {
  // TODO: Implement when API is available
  // const response = await fetch(`${HELP_CENTER_CONFIG.apiBaseUrl}/categories`);
  // return response.json();
  
  // For now, return mock data based on the help center structure
  return HELP_CENTER_CONFIG.categories.map((category, index) => ({
    id: `category-${index + 1}`,
    name: category,
    description: `Help articles for ${category}`,
    articleCount: 0, // Will be populated from API
    articles: []
  }));
}

/**
 * Search help articles (Future API implementation)
 */
export async function searchHelpArticles(query: string): Promise<HelpSearchResult> {
  // TODO: Implement when API is available
  // const response = await fetch(`${HELP_CENTER_CONFIG.apiBaseUrl}/search?q=${encodeURIComponent(query)}`);
  // return response.json();
  
  // For now, return empty results
  return {
    query,
    results: [],
    totalResults: 0,
    categories: []
  };
}

/**
 * Fetch specific help article (Future API implementation)
 */
export async function fetchHelpArticle(articleId: string): Promise<HelpArticle | null> {
  // TODO: Implement when API is available
  // const response = await fetch(`${HELP_CENTER_CONFIG.apiBaseUrl}/articles/${articleId}`);
  // return response.json();
  
  return null;
}

/**
 * Get help articles by category (Future API implementation)
 */
export async function fetchHelpArticlesByCategory(categoryId: string): Promise<HelpArticle[]> {
  // TODO: Implement when API is available
  // const response = await fetch(`${HELP_CENTER_CONFIG.apiBaseUrl}/categories/${categoryId}/articles`);
  // return response.json();
  
  return [];
}

/**
 * Check if help center API is available
 */
export async function checkHelpApiAvailability(): Promise<boolean> {
  try {
    // TODO: Implement API health check when available
    // const response = await fetch(`${HELP_CENTER_CONFIG.apiBaseUrl}/health`);
    // return response.ok;
    
    return false; // API not available yet
  } catch {
    return false;
  }
}

/**
 * Get help center statistics (Future API implementation)
 */
export async function getHelpCenterStats(): Promise<{
  totalArticles: number;
  totalCategories: number;
  lastUpdated: string;
}> {
  // TODO: Implement when API is available
  return {
    totalArticles: 0,
    totalCategories: HELP_CENTER_CONFIG.categories.length,
    lastUpdated: new Date().toISOString()
  };
}

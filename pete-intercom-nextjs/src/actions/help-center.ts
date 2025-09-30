'use server';

import { 
  fetchHelpCategories, 
  searchHelpArticles, 
  fetchHelpArticle,
  fetchHelpArticlesByCategory,
  checkHelpApiAvailability,
  getHelpCenterStats,
  getHelpCenterUrl,
  getHelpSearchUrl,
  HELP_CENTER_CONFIG
} from '@/services/help-docs-fetcher';

/**
 * Server action to get help center URL
 */
export async function getHelpCenterUrlAction(category?: string) {
  try {
    const url = getHelpCenterUrl(category);
    return {
      success: true,
      data: { url }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get help center URL'
    };
  }
}

/**
 * Server action to get help search URL
 */
export async function getHelpSearchUrlAction(query: string) {
  try {
    const url = getHelpSearchUrl(query);
    return {
      success: true,
      data: { url, query }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get search URL'
    };
  }
}

/**
 * Server action to check if help center API is available
 */
export async function checkHelpApiAction() {
  try {
    const isAvailable = await checkHelpApiAvailability();
    return {
      success: true,
      data: { isAvailable }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check API availability'
    };
  }
}

/**
 * Server action to get help center statistics
 */
export async function getHelpStatsAction() {
  try {
    const stats = await getHelpCenterStats();
    return {
      success: true,
      data: stats
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get help statistics'
    };
  }
}

/**
 * Server action to get help categories
 */
export async function getHelpCategoriesAction() {
  try {
    const categories = await fetchHelpCategories();
    return {
      success: true,
      data: categories
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch help categories'
    };
  }
}

/**
 * Server action to search help articles
 */
export async function searchHelpArticlesAction(query: string) {
  try {
    if (!query.trim()) {
      return {
        success: false,
        error: 'Search query cannot be empty'
      };
    }

    const results = await searchHelpArticles(query);
    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search help articles'
    };
  }
}

/**
 * Server action to get help configuration
 */
export async function getHelpConfigAction() {
  try {
    return {
      success: true,
      data: {
        baseUrl: HELP_CENTER_CONFIG.baseUrl,
        apiBaseUrl: HELP_CENTER_CONFIG.apiBaseUrl,
        categories: HELP_CENTER_CONFIG.categories
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get help configuration'
    };
  }
}

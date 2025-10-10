'use server';

import type {
  CollectionAnalysis,
  HelpDeskAssessment
} from '@/types/help-desk-analysis';
import { ORIGINAL_AUDIT_BASELINE, RESIMPLI_BENCHMARK } from '@/types/help-desk-analysis';
import { getIntercomCache } from '@/services/intercom';
import type { HelpCenterCollection, HelpCenterArticle } from '@/types';

/**
 * Detect if article title has dating/naming issues
 */
function detectNamingIssues(article: HelpCenterArticle): string[] {
  const issues: string[] = [];
  const title = article.title;

  // Date-stamped support ticket format
  if (/Pete Support \d{1,2}\/\d{1,2}\/\d{2,4}/.test(title)) {
    issues.push('Date-stamped support ticket format (should be evergreen)');
  }

  // Training with dates
  if (/Pete Training \d{1,2}\/\d{1,2}\/\d{2,4}/.test(title)) {
    issues.push('Date-stamped training title (should be generic)');
  }

  // Inconsistent capitalization
  if (/[a-z]+\s+[A-Z][a-z]+\s+[a-z]/.test(title)) {
    issues.push('Inconsistent capitalization');
  }

  // Too long (over 80 characters)
  if (title.length > 80) {
    issues.push('Title too long (over 80 characters)');
  }

  return issues;
}

/**
 * Detect potential misplaced articles based on title keywords
 */
function detectMisplacedArticles(
  article: HelpCenterArticle,
  collectionName: string
): { suggestedCollection: string; reason: string } | null {
  const title = article.title.toLowerCase();

  // Lead-related in Properties collection
  if (collectionName.toLowerCase() === 'properties' &&
      (title.includes('lead') || title.includes('leads'))) {
    return {
      suggestedCollection: 'Lead Management',
      reason: 'Article about leads should not be in Properties collection'
    };
  }

  // Team/user management in Workflows
  if (collectionName.toLowerCase().includes('workflow') &&
      (title.includes('team') || title.includes('responsibilities') || title.includes('user rights'))) {
    return {
      suggestedCollection: 'Company Management',
      reason: 'Team management should not be in Workflows collection'
    };
  }

  // Email/Phone setup in Support
  if (collectionName.toLowerCase() === 'support' &&
      (title.includes('email setup') || title.includes('phone setup') || title.includes('phone number'))) {
    return {
      suggestedCollection: 'Communication',
      reason: 'Communication setup should be in Communication collection'
    };
  }

  // KPIs/Dashboard in Support
  if (collectionName.toLowerCase() === 'support' &&
      (title.includes('kpi') || title.includes('dashboard') || title.includes('analytics'))) {
    return {
      suggestedCollection: 'Analytics & Reporting',
      reason: 'Analytics content should be in dedicated collection'
    };
  }

  // Task management in Support
  if (collectionName.toLowerCase() === 'support' &&
      (title.includes('task template') || title.includes('task management'))) {
    return {
      suggestedCollection: 'Tasks',
      reason: 'Task-related content should be in Tasks collection'
    };
  }

  return null;
}

/**
 * Find duplicate articles by title
 */
function findDuplicateArticles(articles: HelpCenterArticle[]): { title: string; count: number; ids: string[] }[] {
  const titleMap = new Map<string, string[]>();

  // Group articles by normalized title
  for (const article of articles) {
    const normalizedTitle = article.title.toLowerCase().trim();
    const ids = titleMap.get(normalizedTitle) || [];
    ids.push(article.id);
    titleMap.set(normalizedTitle, ids);
  }

  // Find titles with multiple articles
  const duplicates: { title: string; count: number; ids: string[] }[] = [];

  for (const [title, ids] of titleMap.entries()) {
    if (ids.length > 1) {
      duplicates.push({
        title,
        count: ids.length,
        ids
      });
    }
  }

  return duplicates;
}

/**
 * Analyze a collection for issues
 */
function analyzeCollection(
  collection: HelpCenterCollection,
  articles: HelpCenterArticle[],
  totalArticles: number
): CollectionAnalysis {
  const issues: string[] = [];
  const articleCount = articles.length;
  const percentage = totalArticles > 0 ? (articleCount / totalArticles) * 100 : 0;

  // Check if this is a dumping ground (>20% of total articles)
  if (percentage > 20) {
    issues.push(`Potential dumping ground: ${percentage.toFixed(1)}% of all articles`);
  }

  // Check for very small collections (<3 articles)
  if (articleCount > 0 && articleCount < 3) {
    issues.push(`Very small collection: only ${articleCount} article(s)`);
  }

  // Check for naming issues in articles
  for (const article of articles) {
    const namingIssues = detectNamingIssues(article);
    if (namingIssues.length > 0) {
      issues.push(`Article "${article.title}": ${namingIssues.join(', ')}`);
    }
  }

  // Check for misplaced articles
  for (const article of articles) {
    const misplaced = detectMisplacedArticles(article, collection.name);
    if (misplaced) {
      issues.push(`Article "${article.title}": ${misplaced.reason} → Suggest moving to ${misplaced.suggestedCollection}`);
    }
  }

  return {
    collection,
    articles,
    issues,
    percentage
  };
}

/**
 * Generate recommendations based on assessment
 */
function generateRecommendations(assessment: HelpDeskAssessment): string[] {
  const recommendations: string[] = [];
  const { totalCollections, totalArticles, collections, criticalIssues } = assessment;

  // Dumping ground recommendations
  if (criticalIssues.dumpingGroundCollections.length > 0) {
    const dumpingGroundCollection = collections.find(
      c => criticalIssues.dumpingGroundCollections.includes(c.collection.name)
    );
    recommendations.push(
      `🚨 CRITICAL: Dismantle "${criticalIssues.dumpingGroundCollections[0]}" collection and redistribute ${
        dumpingGroundCollection?.articles.length || 0
      } articles to proper feature-based collections`
    );
  }

  // Compare to benchmark
  const avgPerCollection = totalArticles / totalCollections;
  if (avgPerCollection < RESIMPLI_BENCHMARK.averageArticlesPerCollection / 2) {
    recommendations.push(
      `Expand thin collections: Current average is ${avgPerCollection.toFixed(1)} articles/collection vs REsimpli's ${RESIMPLI_BENCHMARK.averageArticlesPerCollection}`
    );
  }

  // Missing collections
  const collectionNames = collections.map(c => c.collection.name.toLowerCase());
  const suggestedCollections = [
    'Lead Management',
    'Company Management',
    'Data Management',
    'Analytics & Reporting'
  ];

  const missingCollections = suggestedCollections.filter(name =>
    !collectionNames.some(existing => existing.includes(name.toLowerCase()))
  );

  if (missingCollections.length > 0) {
    recommendations.push(
      `Create missing feature collections: ${missingCollections.join(', ')}`
    );
  }

  // Apply REsimpli's principle
  recommendations.push(
    `📚 Adopt REsimpli's organizing principle: "If it's about Feature X, it goes in Feature X collection"`
  );

  return recommendations;
}

/**
 * Main function: Run complete help desk assessment using cached data
 */
export async function runHelpDeskAssessment(): Promise<HelpDeskAssessment> {
  try {
    // Get data from cache (already fetched and cached by intercom service)
    const cache = await getIntercomCache();
    const collections = cache.helpCenterCollections;
    const allArticles = cache.helpCenterArticles as HelpCenterArticle[];

    if (!collections || collections.length === 0) {
      throw new Error('No help center collections found in cache. The cache may need to be refreshed.');
    }

    // Calculate total articles from actual cached articles
    const totalArticles = allArticles.length;

    // Analyze each collection with its articles
    const collectionAnalyses: CollectionAnalysis[] = collections.map(collection => {
      // Filter articles for this collection
      const collectionArticles = allArticles.filter(
        article => article.collection_id === collection.id
      );

      return analyzeCollection(collection, collectionArticles, totalArticles);
    });

    // Sort by percentage descending (largest collections first)
    collectionAnalyses.sort((a, b) => b.percentage - a.percentage);

    // Identify critical issues
    const dumpingGroundCollections = collectionAnalyses
      .filter(c => c.percentage > 20)
      .map(c => c.collection.name)
      .sort((a, b) => {
        const aPercent = collectionAnalyses.find(c => c.collection.name === a)?.percentage || 0;
        const bPercent = collectionAnalyses.find(c => c.collection.name === b)?.percentage || 0;
        return bPercent - aPercent; // Descending
      });

    // Find duplicate articles across all collections
    const duplicateArticles = findDuplicateArticles(allArticles);

    // Find misplaced articles
    const misplacedArticles: { article: string; currentCollection: string; suggestedCollection: string }[] = [];
    for (const analysis of collectionAnalyses) {
      for (const article of analysis.articles) {
        const misplaced = detectMisplacedArticles(article, analysis.collection.name);
        if (misplaced) {
          misplacedArticles.push({
            article: article.title,
            currentCollection: analysis.collection.name,
            suggestedCollection: misplaced.suggestedCollection
          });
        }
      }
    }

    // Find naming issues
    const namingIssues: { article: string; issues: string[] }[] = [];
    for (const article of allArticles) {
      const issues = detectNamingIssues(article);
      if (issues.length > 0) {
        namingIssues.push({
          article: article.title,
          issues
        });
      }
    }

    // Calculate comparison with original audit
    const previousDumpingGroundPercentage = ORIGINAL_AUDIT_BASELINE.dumpingGroundPercentage;
    const currentDumpingGroundPercentage = collectionAnalyses
      .reduce((max, c) => Math.max(max, c.percentage), 0);

    const assessment: HelpDeskAssessment = {
      totalCollections: collections.length,
      totalArticles,
      collections: collectionAnalyses,
      criticalIssues: {
        dumpingGroundCollections,
        duplicateArticles,
        misplacedArticles,
        namingIssues
      },
      comparison: {
        previous: {
          totalCollections: ORIGINAL_AUDIT_BASELINE.totalCollections,
          totalArticles: ORIGINAL_AUDIT_BASELINE.totalArticles,
          dumpingGroundPercentage: previousDumpingGroundPercentage
        },
        changes: {
          collectionsAdded: Math.max(0, collections.length - ORIGINAL_AUDIT_BASELINE.totalCollections),
          collectionsRemoved: Math.max(0, ORIGINAL_AUDIT_BASELINE.totalCollections - collections.length),
          articlesAdded: Math.max(0, totalArticles - ORIGINAL_AUDIT_BASELINE.totalArticles),
          articlesRemoved: Math.max(0, ORIGINAL_AUDIT_BASELINE.totalArticles - totalArticles),
          dumpingGroundImprovement: previousDumpingGroundPercentage - currentDumpingGroundPercentage
        }
      },
      recommendations: [],
      timestamp: new Date().toISOString()
    };

    // Generate recommendations
    assessment.recommendations = generateRecommendations(assessment);

    return assessment;

  } catch (error) {
    console.error('[Help Desk Assessment] Error:', error);
    throw new Error(`Failed to run help desk assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Server action wrapper for frontend
 */
export async function getHelpDeskAssessment() {
  try {
    const assessment = await runHelpDeskAssessment();
    return {
      success: true,
      data: assessment
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run assessment'
    };
  }
}

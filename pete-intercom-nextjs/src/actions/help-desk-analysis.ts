'use server';

import type {
  HelpCenterCollection,
  HelpCenterArticle,
  CollectionAnalysis,
  HelpDeskAssessment
} from '@/types/help-desk-analysis';
import { ORIGINAL_AUDIT_BASELINE, RESIMPLI_BENCHMARK } from '@/types/help-desk-analysis';

const INTERCOM_API_BASE = 'https://api.intercom.io';
const ACCESS_TOKEN = process.env.INTERCOM_ACCESS_TOKEN?.replace(/^"|"$/g, '');

/**
 * Fetch all help center collections from Intercom
 */
async function fetchHelpCenterCollections(): Promise<HelpCenterCollection[]> {
  if (!ACCESS_TOKEN) {
    throw new Error('INTERCOM_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(`${INTERCOM_API_BASE}/help_center/collections`, {
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Intercom-Version': '2.11',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch collections: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch all articles for a specific collection
 * Uses a try-catch approach to handle collections that may not have accessible sections
 */
async function fetchCollectionArticles(
  collectionId: string,
  collectionName: string
): Promise<HelpCenterArticle[]> {
  if (!ACCESS_TOKEN) {
    throw new Error('INTERCOM_ACCESS_TOKEN is not configured');
  }

  try {
    // Try to fetch sections first
    const response = await fetch(
      `${INTERCOM_API_BASE}/help_center/collections/${collectionId}/sections`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Intercom-Version': '2.11',
          'Accept': 'application/json'
        }
      }
    );

    // If 404, the collection might not have sections - return empty array
    if (response.status === 404) {
      console.log(`[Help Desk Analysis] Collection ${collectionName} (${collectionId}) has no accessible sections, skipping article fetch`);
      return [];
    }

    if (!response.ok) {
      console.error(`[Help Desk Analysis] Failed to fetch sections for ${collectionName}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const sections = data.data || [];

    // Fetch articles from all sections in this collection
    const allArticles: HelpCenterArticle[] = [];

    for (const section of sections) {
      if (section.articles) {
        allArticles.push(...section.articles);
      }
    }

    return allArticles;
  } catch (error) {
    console.error(`[Help Desk Analysis] Error fetching articles for ${collectionName}:`, error);
    // Return empty array on error - don't fail entire assessment
    return [];
  }
}

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
  const percentage = totalArticles > 0 ? (articles.length / totalArticles) * 100 : 0;

  // Check if this is a dumping ground (>20% of total articles)
  if (percentage > 20) {
    issues.push(`Potential dumping ground: ${percentage.toFixed(1)}% of all articles`);
  }

  // Check for very small collections (<3 articles)
  if (articles.length > 0 && articles.length < 3) {
    issues.push(`Very small collection: only ${articles.length} article(s)`);
  }

  // Check for naming consistency within collection
  const datestampedCount = articles.filter(a =>
    a.title.includes('Pete Support') || a.title.includes('Pete Training')
  ).length;

  if (datestampedCount > 0) {
    issues.push(`${datestampedCount} article(s) with date-stamped titles`);
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
    recommendations.push(
      `🚨 CRITICAL: Dismantle "${criticalIssues.dumpingGroundCollections[0]}" collection and redistribute ${
        collections.find(c => criticalIssues.dumpingGroundCollections.includes(c.collection.name))?.articles.length || 0
      } articles to proper feature-based collections`
    );
  }

  // Duplicate recommendations
  if (criticalIssues.duplicateArticles.length > 0) {
    recommendations.push(
      `Remove ${criticalIssues.duplicateArticles.length} duplicate article(s): ${
        criticalIssues.duplicateArticles.map(d => `"${d.title}" (${d.count} copies)`).join(', ')
      }`
    );
  }

  // Misplaced articles
  if (criticalIssues.misplacedArticles.length > 0) {
    recommendations.push(
      `Move ${criticalIssues.misplacedArticles.length} misplaced article(s) to correct collections`
    );
  }

  // Naming issues
  if (criticalIssues.namingIssues.length > 0) {
    const datestampedCount = criticalIssues.namingIssues.filter(n =>
      n.issue.includes('Date-stamped')
    ).length;

    if (datestampedCount > 0) {
      recommendations.push(
        `Rename ${datestampedCount} date-stamped articles to evergreen titles (remove "Pete Support MM/DD/YY")`
      );
    }
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
 * Main function: Run complete help desk assessment
 */
export async function runHelpDeskAssessment(): Promise<HelpDeskAssessment> {
  try {
    // Fetch all collections
    const collections = await fetchHelpCenterCollections();

    // Fetch articles for each collection
    const collectionAnalyses: CollectionAnalysis[] = [];
    const allArticles: HelpCenterArticle[] = [];

    for (const collection of collections) {
      const articles = await fetchCollectionArticles(collection.id, collection.name);

      // Add collection name to each article
      const articlesWithCollection = articles.map(article => ({
        ...article,
        collection_name: collection.name,
        collection_id: collection.id
      }));

      allArticles.push(...articlesWithCollection);

      const analysis = analyzeCollection(collection, articlesWithCollection, allArticles.length);
      collectionAnalyses.push(analysis);
    }

    // Re-calculate percentages now that we have total article count
    const totalArticles = allArticles.length;
    collectionAnalyses.forEach(analysis => {
      analysis.percentage = (analysis.articles.length / totalArticles) * 100;

      // Re-check dumping ground threshold
      if (analysis.percentage > 20 && !analysis.issues.some(i => i.includes('dumping ground'))) {
        analysis.issues.unshift(`Potential dumping ground: ${analysis.percentage.toFixed(1)}% of all articles`);
      }
    });

    // Identify critical issues
    const dumpingGroundCollections = collectionAnalyses
      .filter(c => c.percentage > 20)
      .map(c => c.collection.name)
      .sort((a, b) => {
        const aPercent = collectionAnalyses.find(c => c.collection.name === a)?.percentage || 0;
        const bPercent = collectionAnalyses.find(c => c.collection.name === b)?.percentage || 0;
        return bPercent - aPercent; // Descending
      });

    const duplicateArticles = findDuplicateArticles(allArticles);

    const misplacedArticles: { articleId: string; title: string; currentCollection: string; suggestedCollection: string; reason: string }[] = [];
    const namingIssues: { articleId: string; title: string; issue: string }[] = [];

    for (const article of allArticles) {
      // Check for misplacement
      const misplacement = detectMisplacedArticles(article, article.collection_name || '');
      if (misplacement) {
        misplacedArticles.push({
          articleId: article.id,
          title: article.title,
          currentCollection: article.collection_name || '',
          suggestedCollection: misplacement.suggestedCollection,
          reason: misplacement.reason
        });
      }

      // Check for naming issues
      const issues = detectNamingIssues(article);
      for (const issue of issues) {
        namingIssues.push({
          articleId: article.id,
          title: article.title,
          issue
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
      collections: collectionAnalyses.sort((a, b) => b.percentage - a.percentage), // Sort by size descending
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

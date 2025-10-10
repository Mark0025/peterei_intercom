/**
 * Help Desk Analysis Types
 * For assessing and comparing Intercom Help Center structure
 */

export interface HelpCenterCollection {
  id: string;
  name: string;
  description?: string;
  article_count: number;
  url?: string;
  created_at?: number;
  updated_at?: number;
}

export interface HelpCenterArticle {
  id: string;
  title: string;
  description?: string;
  collection_id?: string;
  collection_name?: string;
  author_id?: string;
  state?: 'published' | 'draft';
  url?: string;
  created_at?: number;
  updated_at?: number;
}

export interface CollectionAnalysis {
  collection: HelpCenterCollection;
  articles: HelpCenterArticle[];
  issues: string[];
  percentage: number; // Percentage of total articles
}

export interface HelpDeskAssessment {
  totalCollections: number;
  totalArticles: number;
  collections: CollectionAnalysis[];
  criticalIssues: {
    dumpingGroundCollections: string[]; // Collections with >20% of total articles
    duplicateArticles: { title: string; count: number; ids: string[] }[];
    misplacedArticles: { articleId: string; title: string; currentCollection: string; suggestedCollection: string; reason: string }[];
    namingIssues: { articleId: string; title: string; issue: string }[];
  };
  comparison: {
    previous: {
      totalCollections: number;
      totalArticles: number;
      dumpingGroundPercentage: number;
    };
    changes: {
      collectionsAdded: number;
      collectionsRemoved: number;
      articlesAdded: number;
      articlesRemoved: number;
      dumpingGroundImprovement: number; // Percentage improvement
    };
  };
  recommendations: string[];
  timestamp: string;
}

export interface CompetitorBenchmark {
  name: string;
  totalCollections: number;
  totalArticles: number;
  averageArticlesPerCollection: number;
  largestCollectionPercentage: number;
  organizationStrategy: string;
}

// Original audit baseline data
export const ORIGINAL_AUDIT_BASELINE = {
  date: '2025-10-08',
  totalCollections: 9,
  totalArticles: 59,
  dumpingGroundCollection: 'Support',
  dumpingGroundArticles: 24,
  dumpingGroundPercentage: 41, // 24/59 = 40.68%
  criticalIssues: [
    'Support collection is a dumping ground (41% of content)',
    'Duplicate articles (User Profile Setup appears 3 times)',
    'Inconsistent article naming (mix of question-based and date-stamped)',
    'Poor categorization (Leads in Properties collection)',
    'Date-stamped support ticket titles (Pete Support 12/26/24)',
    'Workflow content split across 3 collections',
    'Missing core collections (Lead Management, Company Management, Analytics)'
  ],
  collections: [
    { name: 'Getting Started', articles: 9 },
    { name: 'Workflows & Automation', articles: 1 },
    { name: 'Tasks', articles: 3 },
    { name: 'Communication', articles: 8 },
    { name: 'Properties', articles: 6 },
    { name: 'Integrations', articles: 1 },
    { name: 'Training', articles: 3 },
    { name: 'Support', articles: 24 }, // The dumping ground
    { name: 'Update Notes', articles: 4 }
  ]
} as const;

// REsimpli competitor benchmark
export const RESIMPLI_BENCHMARK: CompetitorBenchmark = {
  name: 'REsimpli',
  totalCollections: 22,
  totalArticles: 400,
  averageArticlesPerCollection: 18.2,
  largestCollectionPercentage: 10, // General collection: 41/400 = 10%
  organizationStrategy: 'Feature-based organization - "If it\'s about Feature X, it goes in Feature X collection"'
};

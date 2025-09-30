/**
 * Company Analysis Tools for LangGraph
 *
 * Advanced company data extraction and analysis tools
 * Used by PeteAI and onboarding analyzer
 */

'use server';

import { getIntercomCache } from '@/services/intercom';
import { searchCompanyByName as searchCompanyAPI, getCompanyById } from '@/actions/company-lookup';
import type { IntercomConversation, IntercomContact, IntercomCompany } from '@/types';

export interface CompanyTimeline {
  companyId: string;
  companyName: string;
  conversations: Array<{
    id: string;
    title: string;
    created_at: number;
    state: string;
    topic?: string;
    participants: string[];
  }>;
  contacts: Array<{
    id: string;
    name?: string;
    email?: string;
    role?: string;
  }>;
  totalConversations: number;
  firstInteraction: number;
  lastInteraction: number;
  topics: Record<string, number>;
}

export interface CompanyAttributes {
  companyId: string;
  companyName: string;
  intercomId: string;
  size?: number;
  industry?: string;
  website?: string;
  plan?: string;
  customAttributes: Record<string, unknown>;
  userCount?: number;
  sessionCount?: number;
  created_at: number;
  updated_at: number;
}

/**
 * Fuzzy search for company by name
 * Handles partial matches like "stkcam" -> "Stkcam"
 */
export async function fuzzySearchCompany(searchTerm: string): Promise<{
  success: boolean;
  companies?: Array<{ id: string; name: string; score: number }>;
  error?: string;
}> {
  try {
    const cache = await getIntercomCache();
    const companies = cache.companies as IntercomCompany[];

    // Fuzzy match logic
    const searchLower = searchTerm.toLowerCase().trim();
    const matches = companies
      .map(company => {
        const nameLower = company.name.toLowerCase();
        let score = 0;

        // Exact match
        if (nameLower === searchLower) score = 100;
        // Starts with
        else if (nameLower.startsWith(searchLower)) score = 90;
        // Contains
        else if (nameLower.includes(searchLower)) score = 70;
        // Levenshtein-like similarity
        else {
          const similarity = calculateSimilarity(searchLower, nameLower);
          if (similarity > 0.6) score = similarity * 60;
        }

        return { id: company.id, name: company.name, score };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      success: true,
      companies: matches
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get complete timeline for a company
 * All conversations + contacts grouped by company_id
 */
export async function getCompanyTimeline(companyId: string): Promise<{
  success: boolean;
  timeline?: CompanyTimeline;
  error?: string;
}> {
  try {
    const cache = await getIntercomCache();
    const conversations = cache.conversations as IntercomConversation[];
    const contacts = cache.contacts as IntercomContact[];

    // Find company
    const company = (cache.companies as IntercomCompany[]).find(c => c.id === companyId);
    if (!company) {
      return { success: false, error: 'Company not found' };
    }

    // Get all contacts for this company
    const companyContacts = contacts.filter(contact =>
      contact.companies?.companies.some(c => c.id === companyId)
    );

    const contactIds = new Set(companyContacts.map(c => c.id));

    // Get all conversations involving company contacts
    const companyConversations = conversations.filter(conv => {
      // Check if conversation source author is from this company
      const sourceAuthorId = conv.source?.author?.id;
      if (sourceAuthorId && contactIds.has(sourceAuthorId)) return true;

      // Check conversation parts
      return conv.conversation_parts?.conversation_parts.some(part =>
        part.author?.id && contactIds.has(part.author.id)
      );
    });

    // Extract topics from conversations
    const topics: Record<string, number> = {};
    companyConversations.forEach(conv => {
      const searchableText = [
        conv.title || '',
        conv.source?.body || ''
      ].join(' ').toLowerCase();

      // Simple topic extraction (can be enhanced)
      if (searchableText.includes('data') || searchableText.includes('upload')) topics['Data Upload'] = (topics['Data Upload'] || 0) + 1;
      if (searchableText.includes('training')) topics['Training'] = (topics['Training'] || 0) + 1;
      if (searchableText.includes('integration')) topics['Integration'] = (topics['Integration'] || 0) + 1;
      if (searchableText.includes('workflow')) topics['Workflow'] = (topics['Workflow'] || 0) + 1;
    });

    // Sort conversations by date
    const sortedConvs = companyConversations.sort((a, b) => a.created_at - b.created_at);

    const timeline: CompanyTimeline = {
      companyId: company.id,
      companyName: company.name,
      conversations: sortedConvs.map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled',
        created_at: conv.created_at,
        state: conv.state,
        topic: undefined, // Can be enhanced with better topic detection
        participants: Array.from(new Set([
          conv.source?.author?.id,
          ...(conv.conversation_parts?.conversation_parts.map(p => p.author?.id) || [])
        ].filter(Boolean) as string[]))
      })),
      contacts: companyContacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        role: contact.custom_attributes?.role as string | undefined
      })),
      totalConversations: companyConversations.length,
      firstInteraction: sortedConvs[0]?.created_at || 0,
      lastInteraction: sortedConvs[sortedConvs.length - 1]?.created_at || 0,
      topics
    };

    return {
      success: true,
      timeline
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extract and JSONify all company attributes
 */
export async function extractCompanyAttributes(companyId: string): Promise<{
  success: boolean;
  attributes?: CompanyAttributes;
  error?: string;
}> {
  try {
    // Get from API for fresh data
    const result = await getCompanyById(companyId);

    if (!result.success || !result.company) {
      return { success: false, error: result.error || 'Company not found' };
    }

    const company = result.company;

    const attributes: CompanyAttributes = {
      companyId: company.company_id || company.id,
      companyName: company.name,
      intercomId: company.id,
      size: company.size,
      industry: company.industry,
      website: company.website,
      plan: company.plan,
      customAttributes: company.custom_attributes || {},
      created_at: company.created_at || 0,
      updated_at: company.updated_at || 0
    };

    return {
      success: true,
      attributes
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Analyze topic breakdown by company
 * Groups conversations by company for a specific topic
 */
export async function analyzeTopicByCompany(topic: string): Promise<{
  success: boolean;
  companies?: Array<{
    companyId: string;
    companyName: string;
    conversationCount: number;
    conversations: Array<{
      id: string;
      title: string;
      created_at: number;
    }>;
  }>;
  error?: string;
}> {
  try {
    const cache = await getIntercomCache();
    const conversations = cache.conversations as IntercomConversation[];
    const companies = cache.companies as IntercomCompany[];
    const contacts = cache.contacts as IntercomContact[];

    // Filter conversations by topic keywords
    const topicKeywords = getTopicKeywords(topic);
    const relevantConvs = conversations.filter(conv => {
      const searchableText = [
        conv.title || '',
        conv.source?.body || ''
      ].join(' ').toLowerCase();

      return topicKeywords.some(keyword => searchableText.includes(keyword.toLowerCase()));
    });

    // Group by company
    const companyMap = new Map<string, typeof relevantConvs>();

    for (const conv of relevantConvs) {
      // Find company via conversation author
      const authorId = conv.source?.author?.id;
      if (!authorId) continue;

      const contact = contacts.find(c => c.id === authorId);
      if (!contact?.companies?.companies.length) continue;

      const companyId = contact.companies.companies[0].id;
      if (!companyMap.has(companyId)) {
        companyMap.set(companyId, []);
      }
      companyMap.get(companyId)!.push(conv);
    }

    // Build result
    const result = Array.from(companyMap.entries()).map(([companyId, convs]) => {
      const company = companies.find(c => c.id === companyId);
      return {
        companyId,
        companyName: company?.name || 'Unknown',
        conversationCount: convs.length,
        conversations: convs.map(c => ({
          id: c.id,
          title: c.title || 'Untitled',
          created_at: c.created_at
        }))
      };
    }).sort((a, b) => b.conversationCount - a.conversationCount);

    return {
      success: true,
      companies: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper functions

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function getTopicKeywords(topic: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'Data Upload': ['data upload', 'import', 'migration', 'csv', 'spreadsheet', 'bulk upload'],
    'Marketing Handoff': ['handoff', 'marketing', 'sales', 'intake'],
    'Intake Process': ['intake', 'requirements', 'questionnaire', 'onboarding form'],
    'Timeline & Expectations': ['timeline', 'deadline', 'when', 'how long', 'schedule'],
    'Scraping & Extraction': ['scraping', 'scrape', 'extract', 'data extraction'],
    'Mobile Setup': ['mobile', 'app', 'ios', 'android'],
    'Workflow & Automation': ['workflow', 'template', 'process', 'automation'],
    'Integration': ['twilio', 'integration', 'api', 'webhook', 'connect']
  };

  return keywordMap[topic] || [topic.toLowerCase()];
}
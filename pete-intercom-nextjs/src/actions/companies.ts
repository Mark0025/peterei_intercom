'use server';

/**
 * Companies Server Actions
 *
 * Fetches and manages Intercom companies from the smart cache
 */

import { getSmartCache, smartSearchCompanies } from '@/services/smart-cache';
import type { ActionResult } from '@/types';
import { logInfo, logError } from '@/services/logger';

export interface Company {
  id: string;
  company_id?: string;  // Pete company ID (external ID)
  name: string;
  created_at: number;
  updated_at: number;
  monthly_spend?: number;
  session_count?: number;
  user_count?: number;
  size?: number | null;
  website?: string | null;
  industry?: string | null;
  remote_created_at?: number | null;
  plan?: {
    type: string;
    id?: string | null;
    name?: string | null;
  } | null;
  custom_attributes?: Record<string, any>;
  tags?: {
    type?: string;
    tags?: Array<{
      type?: string;
      id: string;
      name?: string;
      url?: string;
    }>;
  };
  segments?: {
    type?: string;
    segments?: Array<{
      type?: string;
      id: string;
      name?: string;
      url?: string;
    }>;
  };
}

/**
 * Get all companies from cache
 */
export async function getAllCompanies(live = false): Promise<ActionResult<Company[]>> {
  try {
    logInfo('[COMPANIES] Fetching all companies from cache');
    const cache = getSmartCache();

    return {
      success: true,
      data: cache.companies as Company[]
    };
  } catch (error) {
    logError(`[COMPANIES] Error fetching companies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch companies'
    };
  }
}

/**
 * Search companies by name
 */
export async function searchCompanies(
  name?: string,
  live = false
): Promise<ActionResult<Company[]>> {
  try {
    logInfo(`[COMPANIES] Searching companies: name=${name || 'none'}, live=${live}`);
    const results = await smartSearchCompanies(name, live);

    return {
      success: true,
      data: results as Company[]
    };
  } catch (error) {
    logError(`[COMPANIES] Error searching companies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search companies'
    };
  }
}

/**
 * Get company by ID
 */
export async function getCompanyById(companyId: string): Promise<ActionResult<Company>> {
  try {
    logInfo(`[COMPANIES] Fetching company by ID: ${companyId}`);
    const cache = getSmartCache();
    const company = cache.companies.find((c: any) => c.id === companyId);

    if (!company) {
      return {
        success: false,
        error: 'Company not found'
      };
    }

    return {
      success: true,
      data: company as Company
    };
  } catch (error) {
    logError(`[COMPANIES] Error fetching company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch company'
    };
  }
}

/**
 * Get company statistics
 */
export async function getCompanyStats(): Promise<ActionResult<{
  total: number;
  withPeteId: number;
  withUsers: number;
  withTags: number;
  withSegments: number;
  withCustomAttributes: number;
  withPlan: number;
  totalRevenue: number;
}>> {
  try {
    logInfo('[COMPANIES] Calculating company statistics');
    const cache = getSmartCache();

    const stats = {
      total: cache.companies.length,
      withPeteId: cache.companies.filter((c: any) => c.company_id).length,
      withUsers: cache.companies.filter((c: any) => c.user_count && c.user_count > 0).length,
      withTags: cache.companies.filter((c: any) => c.tags?.tags?.length > 0).length,
      withSegments: cache.companies.filter((c: any) => c.segments?.segments?.length > 0).length,
      withCustomAttributes: cache.companies.filter((c: any) => c.custom_attributes && Object.keys(c.custom_attributes).length > 0).length,
      withPlan: cache.companies.filter((c: any) => c.plan?.name).length,
      totalRevenue: cache.companies.reduce((sum: number, c: any) => sum + (c.monthly_spend || 0), 0)
    };

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    logError(`[COMPANIES] Error calculating stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate stats'
    };
  }
}

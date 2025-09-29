/**
 * Company Lookup Actions
 *
 * TypeScript server actions for looking up Intercom companies.
 * Migrated from get_company_id_by_name.sh
 *
 * @see Issue #5: Convert Admin Scripts to TypeScript (Part 1)
 */

'use server';

import { logInfo, logError } from '@/services/logger';
import { env } from '@/lib/env';

interface Company {
  id: string;
  name: string;
  company_id?: string;
  plan?: string;
  size?: number;
  website?: string;
  industry?: string;
  created_at?: number;
  updated_at?: number;
  custom_attributes?: Record<string, any>;
}

/**
 * Search for companies by name
 *
 * @param name - Company name to search for
 * @returns Company information including ID
 *
 * @example
 * const result = await searchCompanyByName('Acme Corp');
 * if (result.success) {
 *   console.log('Company ID:', result.companies[0].id);
 * }
 */
export async function searchCompanyByName(
  name: string
): Promise<{ success: boolean; companies?: Company[]; error?: string }> {
  try {
    logInfo(`[Company Lookup] Searching for company: ${name}`);

    const response = await fetch('https://api.intercom.io/companies/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          field: 'name',
          operator: '=',
          value: name,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search companies: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      logInfo(`[Company Lookup] No companies found for name: ${name}`);
      return {
        success: true,
        companies: [],
      };
    }

    const companies: Company[] = data.data.map((company: any) => ({
      id: company.id,
      name: company.name,
      company_id: company.company_id,
      plan: company.plan,
      size: company.size,
      website: company.website,
      industry: company.industry,
      created_at: company.created_at,
      updated_at: company.updated_at,
      custom_attributes: company.custom_attributes,
    }));

    logInfo(`[Company Lookup] Found ${companies.length} compan(y|ies) for ${name}`);

    return {
      success: true,
      companies,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Company Lookup] Error searching companies: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get company by ID
 *
 * @param companyId - Intercom company ID
 * @returns Full company information
 */
export async function getCompanyById(
  companyId: string
): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    logInfo(`[Company Lookup] Getting company: ${companyId}`);

    const response = await fetch(`https://api.intercom.io/companies/${companyId}`, {
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get company: ${response.statusText}`);
    }

    const company = await response.json();

    logInfo(`[Company Lookup] Retrieved company: ${companyId}`);

    return {
      success: true,
      company: {
        id: company.id,
        name: company.name,
        company_id: company.company_id,
        plan: company.plan,
        size: company.size,
        website: company.website,
        industry: company.industry,
        created_at: company.created_at,
        updated_at: company.updated_at,
        custom_attributes: company.custom_attributes,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Company Lookup] Error getting company: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update company custom attributes
 *
 * @param companyId - Intercom company ID
 * @param customAttributes - Custom attributes to update
 * @returns Updated company information
 */
export async function updateCompanyAttributes(
  companyId: string,
  customAttributes: Record<string, any>
): Promise<{ success: boolean; company?: Company; error?: string }> {
  try {
    logInfo(`[Company Lookup] Updating company ${companyId} attributes:`, customAttributes);

    const response = await fetch(`https://api.intercom.io/companies/${companyId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        custom_attributes: customAttributes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update company: ${response.statusText} - ${errorText}`);
    }

    const company = await response.json();

    logInfo(`[Company Lookup] Successfully updated company ${companyId}`);

    return {
      success: true,
      company: {
        id: company.id,
        name: company.name,
        company_id: company.company_id,
        plan: company.plan,
        size: company.size,
        website: company.website,
        industry: company.industry,
        created_at: company.created_at,
        updated_at: company.updated_at,
        custom_attributes: company.custom_attributes,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Company Lookup] Error updating company: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * List all companies (with pagination)
 *
 * @param page - Page number (default 1)
 * @param perPage - Results per page (default 50, max 150)
 * @returns List of companies
 */
export async function listCompanies(
  page: number = 1,
  perPage: number = 50
): Promise<{ success: boolean; companies?: Company[]; totalCount?: number; error?: string }> {
  try {
    logInfo(`[Company Lookup] Listing companies (page ${page}, per_page ${perPage})`);

    const response = await fetch(
      `https://api.intercom.io/companies?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${env.INTERCOM_ACCESS_TOKEN}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list companies: ${response.statusText}`);
    }

    const data = await response.json();

    const companies: Company[] = (data.data || []).map((company: any) => ({
      id: company.id,
      name: company.name,
      company_id: company.company_id,
      plan: company.plan,
      size: company.size,
      website: company.website,
      industry: company.industry,
      created_at: company.created_at,
      updated_at: company.updated_at,
      custom_attributes: company.custom_attributes,
    }));

    logInfo(`[Company Lookup] Retrieved ${companies.length} companies`);

    return {
      success: true,
      companies,
      totalCount: data.total_count,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`[Company Lookup] Error listing companies: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
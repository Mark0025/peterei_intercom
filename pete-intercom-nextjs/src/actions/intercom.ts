'use server';

import { forceFullRefresh, getSmartCacheStatus, smartSearchContacts, smartSearchCompanies } from '@/services/smart-cache';
import { logInfo, logError } from '@/services/logger';
import type { ActionResult, CacheStatusData, ContactSearchData, CompanySearchData } from '@/types';

export async function refreshCacheAction(): Promise<ActionResult<CacheStatusData>> {
  try {
    logInfo('[INTERCOM_ACTION] Manual cache refresh requested');
    await forceFullRefresh(); // Force full refresh for manual requests
    const status = getSmartCacheStatus();
    
    return {
      success: true,
      data: {
        message: 'Cache refreshed successfully',
        ...status
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logError(`[INTERCOM_ACTION] Cache refresh error: ${errorMsg}`);
    
    return {
      success: false,
      error: `Failed to refresh cache: ${errorMsg}`
    };
  }
}

export async function getCacheStatusAction(): Promise<ActionResult<CacheStatusData>> {
  try {
    const status = getSmartCacheStatus();
    return {
      success: true,
      data: status
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logError(`[INTERCOM_ACTION] Get cache status error: ${errorMsg}`);
    
    return {
      success: false,
      error: `Failed to get cache status: ${errorMsg}`
    };
  }
}

export async function searchContactsAction(
  email?: string,
  name?: string,
  live: boolean = false
): Promise<ActionResult<ContactSearchData>> {
  try {
    logInfo(`[INTERCOM_ACTION] Search contacts: email=${email || ''}, name=${name || ''}, live=${live}`);
    
    const contacts = await smartSearchContacts(email, name, live);
    
    return {
      success: true,
      data: {
        contacts,
        count: contacts.length
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logError(`[INTERCOM_ACTION] Search contacts error: ${errorMsg}`);
    
    return {
      success: false,
      error: `Failed to search contacts: ${errorMsg}`
    };
  }
}

export async function searchCompaniesAction(
  name?: string,
  live: boolean = false
): Promise<ActionResult<CompanySearchData>> {
  try {
    logInfo(`[INTERCOM_ACTION] Search companies: name=${name || ''}, live=${live}`);
    
    const companies = await smartSearchCompanies(name, live);
    
    return {
      success: true,
      data: {
        companies,
        count: companies.length
      }
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logError(`[INTERCOM_ACTION] Search companies error: ${errorMsg}`);
    
    return {
      success: false,
      error: `Failed to search companies: ${errorMsg}`
    };
  }
}
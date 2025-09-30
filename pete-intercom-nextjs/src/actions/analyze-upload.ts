/**
 * Server Action: Analyze Uploaded Data
 *
 * Processes uploaded CSV/XLSX files through NLP analysis
 */

'use server';

import type { ParsedData } from '@/utils/file-parser';
import type { DataStructureAnalysis } from '@/types/nlp-analysis';
import { analyzeDataStructure } from '@/utils/nlp-data-analyzer';

export interface AnalyzeUploadResult {
  success: boolean;
  data?: DataStructureAnalysis;
  error?: string;
}

/**
 * Analyze uploaded data structure using NLP
 */
export async function analyzeUploadedData(
  parsedData: ParsedData
): Promise<AnalyzeUploadResult> {
  try {
    const analysis = await analyzeDataStructure(parsedData);

    return {
      success: true,
      data: analysis
    };
  } catch (error) {
    console.error('[analyze-upload] Error analyzing data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during analysis'
    };
  }
}
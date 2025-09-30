/**
 * File Parser Utility
 *
 * Reusable utility for parsing CSV and Excel files
 * Used across the application for data uploads
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number>[];
  rowCount: number;
  summary: string;
}

/**
 * Parse CSV file to structured data
 */
export function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string | number>[];

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          summary: generateSummary(headers, rows)
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      }
    });
  });
}

/**
 * Parse Excel file (.xlsx, .xls) to structured data
 */
export async function parseExcel(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('No data read from file');
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as Array<Array<string | number>>;

        if (jsonData.length === 0) {
          throw new Error('Excel file is empty');
        }

        // First row is headers
        const headers = jsonData[0].map(String);
        const dataRows = jsonData.slice(1);

        // Convert to array of objects
        const rows = dataRows.map(row => {
          const obj: Record<string, string | number> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] ?? '';
          });
          return obj;
        });

        resolve({
          headers,
          rows,
          rowCount: rows.length,
          summary: generateSummary(headers, rows)
        });
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    default:
      throw new Error(`Unsupported file type: ${extension}. Please upload CSV or Excel files.`);
  }
}

/**
 * Generate a human-readable summary of the data
 */
function generateSummary(headers: string[], rows: Record<string, string | number>[]): string {
  const columnCount = headers.length;
  const rowCount = rows.length;

  // Sample first few values for each column
  const columnSamples = headers.map(header => {
    const values = rows.slice(0, 3).map(row => row[header]).filter(v => v !== null && v !== undefined);
    return `${header}: ${values.join(', ')}${values.length < rows.length ? '...' : ''}`;
  });

  return `File contains ${rowCount} rows and ${columnCount} columns.\n\nColumns:\n${columnSamples.join('\n')}`;
}

/**
 * Export data back to CSV
 */
export function exportToCSV(data: ParsedData, filename: string = 'export.csv'): void {
  const csv = Papa.unparse({
    fields: data.headers,
    data: data.rows
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate uploaded file
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ['csv', 'xlsx', 'xls'];
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Please upload: ${allowedExtensions.join(', ')}`
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`
    };
  }

  return { valid: true };
}
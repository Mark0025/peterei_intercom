/**
 * NLP Data Structure Analyzer
 *
 * Pure NLP/statistical analysis of uploaded data structures.
 * NO AI/LLM dependencies - uses pattern matching, statistics, and heuristics.
 *
 * This is the foundation for dynamic question generation and Mermaid diagrams.
 */

import type { ParsedData } from './file-parser';
import type {
  DataStructureAnalysis,
  IdentifiedObject,
  FieldAnalysis,
  Relationship,
  QualityMetrics,
  QualityIssue,
  DetectedPattern
} from '@/types/nlp-analysis';
import {
  REIndustryTerms,
  FieldNamePatterns,
  ValidationPatterns
} from '@/types/nlp-analysis';

/**
 * Main entry point: Analyze data structure from parsed CSV/XLSX
 */
export async function analyzeDataStructure(
  parsedData: ParsedData
): Promise<DataStructureAnalysis> {
  const startTime = Date.now();

  // Step 1: Identify objects (tables/entities)
  const objects = identifyObjects(parsedData);

  // Step 2: Analyze each field in each object
  const analyzedObjects = objects.map(obj => analyzeObjectFields(obj, parsedData));

  // Step 3: Detect relationships between objects
  const relationships = detectRelationships(analyzedObjects);

  // Step 4: Calculate data quality metrics
  const dataQuality = calculateDataQuality(analyzedObjects);

  // Step 5: Detect patterns
  const patterns = detectPatterns(analyzedObjects, parsedData);

  const processingTime = Date.now() - startTime;

  return {
    objects: analyzedObjects,
    relationships,
    dataQuality,
    patterns,
    processingTime,
    analyzedAt: Date.now()
  };
}

/**
 * Step 1: Identify objects from the parsed data
 * For single-sheet files, infer from column prefixes
 * For multi-sheet files, each sheet is an object
 */
function identifyObjects(parsedData: ParsedData): IdentifiedObject[] {
  // For now, treat the entire dataset as one object
  // In future, we can detect multiple objects from column prefixes
  const objectName = inferObjectName(parsedData.headers);

  return [{
    name: objectName,
    source: 'inferred',
    fields: parsedData.headers.map(header => ({
      name: header,
      inferredType: 'text', // Will be refined in Step 2
      nullRate: 0,
      uniqueRate: 0,
      duplicateCount: 0,
      sampleValues: [],
      confidence: 0
    })),
    rowCount: parsedData.rowCount,
    confidence: 0.8
  }];
}

/**
 * Infer object name from column headers
 */
function inferObjectName(headers: string[]): string {
  // Look for common RE terms in headers
  const headerText = headers.join(' ').toLowerCase();

  if (headerText.includes('property') || headerText.includes('address')) {
    return 'Properties';
  }
  if (headerText.includes('owner') && !headerText.includes('property')) {
    return 'Owners';
  }
  if (headerText.includes('tenant') || headerText.includes('renter')) {
    return 'Tenants';
  }
  if (headerText.includes('contact') || headerText.includes('email') || headerText.includes('phone')) {
    return 'Contacts';
  }
  if (headerText.includes('lease') || headerText.includes('rental')) {
    return 'Leases';
  }

  // Default
  return 'Data';
}

/**
 * Step 2: Analyze fields (columns) in an object
 */
function analyzeObjectFields(
  object: IdentifiedObject,
  parsedData: ParsedData
): IdentifiedObject {
  const analyzedFields = object.fields.map(field => {
    // Get column data
    const columnIndex = parsedData.headers.indexOf(field.name);
    const columnData = parsedData.rows.map(row => row[field.name]);

    return analyzeField(field.name, columnData);
  });

  return {
    ...object,
    fields: analyzedFields
  };
}

/**
 * Analyze a single field (column)
 */
export function analyzeField(
  fieldName: string,
  values: any[]
): FieldAnalysis {
  // Remove null/undefined/empty values
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const nullCount = values.length - nonNullValues.length;
  const nullRate = values.length > 0 ? nullCount / values.length : 0;

  // Calculate uniqueness
  const uniqueValues = new Set(nonNullValues);
  const uniqueRate = nonNullValues.length > 0 ? uniqueValues.size / nonNullValues.length : 0;
  const duplicateCount = nonNullValues.length - uniqueValues.size;

  // Sample values (first 5 non-null unique values)
  const sampleValues = Array.from(uniqueValues)
    .slice(0, 5)
    .map(v => String(v));

  // Infer type
  const { type, confidence } = inferFieldType(fieldName, nonNullValues);

  // Infer semantic category
  const semanticCategory = inferSemanticCategory(fieldName, type);

  return {
    name: fieldName,
    inferredType: type,
    nullRate,
    uniqueRate,
    duplicateCount,
    sampleValues,
    semanticCategory,
    confidence
  };
}

/**
 * Infer field type from name and values
 */
function inferFieldType(
  fieldName: string,
  values: any[]
): { type: FieldAnalysis['inferredType']; confidence: number } {
  if (values.length === 0) {
    return { type: 'text', confidence: 0.3 };
  }

  const fieldNameLower = fieldName.toLowerCase();

  // Check field name patterns first (high confidence)
  if (FieldNamePatterns.email.test(fieldNameLower)) {
    const validCount = values.filter(v => ValidationPatterns.email.test(String(v))).length;
    if (validCount / values.length > 0.5) {
      return { type: 'email', confidence: 0.9 };
    }
  }

  if (FieldNamePatterns.phone.test(fieldNameLower)) {
    const validCount = values.filter(v => ValidationPatterns.phone.test(String(v))).length;
    if (validCount / values.length > 0.5) {
      return { type: 'phone', confidence: 0.85 };
    }
  }

  if (FieldNamePatterns.id.test(fieldNameLower)) {
    return { type: 'id', confidence: 0.9 };
  }

  if (FieldNamePatterns.currency.test(fieldNameLower)) {
    const validCount = values.filter(v => {
      const str = String(v).replace(/[$,]/g, '');
      return !isNaN(parseFloat(str));
    }).length;
    if (validCount / values.length > 0.7) {
      return { type: 'currency', confidence: 0.85 };
    }
  }

  if (FieldNamePatterns.date.test(fieldNameLower)) {
    return { type: 'date', confidence: 0.8 };
  }

  if (FieldNamePatterns.address.test(fieldNameLower)) {
    return { type: 'address', confidence: 0.85 };
  }

  if (FieldNamePatterns.boolean.test(fieldNameLower)) {
    return { type: 'boolean', confidence: 0.8 };
  }

  // Check data patterns (medium confidence)
  const sampleSize = Math.min(values.length, 100);
  const sample = values.slice(0, sampleSize);

  // Email pattern in data
  const emailCount = sample.filter(v => ValidationPatterns.email.test(String(v))).length;
  if (emailCount / sampleSize > 0.7) {
    return { type: 'email', confidence: 0.85 };
  }

  // Phone pattern in data
  const phoneCount = sample.filter(v => ValidationPatterns.phone.test(String(v))).length;
  if (phoneCount / sampleSize > 0.7) {
    return { type: 'phone', confidence: 0.8 };
  }

  // Date pattern in data
  const dateCount = sample.filter(v => {
    const str = String(v);
    return ValidationPatterns.date.iso.test(str) ||
           ValidationPatterns.date.us.test(str) ||
           ValidationPatterns.date.eu.test(str);
  }).length;
  if (dateCount / sampleSize > 0.7) {
    return { type: 'date', confidence: 0.75 };
  }

  // Number pattern
  const numberCount = sample.filter(v => {
    const num = Number(v);
    return !isNaN(num) && isFinite(num);
  }).length;
  if (numberCount / sampleSize > 0.9) {
    return { type: 'number', confidence: 0.7 };
  }

  // Default to text
  return { type: 'text', confidence: 0.6 };
}

/**
 * Infer semantic category from field name and type
 */
function inferSemanticCategory(
  fieldName: string,
  type: FieldAnalysis['inferredType']
): FieldAnalysis['semanticCategory'] | undefined {
  const tokens = tokenizeFieldName(fieldName);

  // Check against RE industry terms
  for (const [category, terms] of Object.entries(REIndustryTerms)) {
    if (tokens.some(token => terms.includes(token))) {
      return category as FieldAnalysis['semanticCategory'];
    }
  }

  // Fallback based on type
  if (type === 'email' || type === 'phone') return 'contact';
  if (type === 'date') return 'temporal';
  if (type === 'currency') return 'financial';
  if (type === 'id') return 'identifier';
  if (type === 'address') return 'address';

  return 'descriptive';
}

/**
 * Tokenize field name (split on _ - or camelCase)
 */
function tokenizeFieldName(fieldName: string): string[] {
  // Split on underscores, hyphens, or camelCase
  const tokens = fieldName
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
    .split(/[_\-\s]+/)
    .map(t => t.toLowerCase())
    .filter(t => t.length > 0);

  return tokens;
}

/**
 * Step 3: Detect relationships between objects
 */
export function detectRelationships(objects: IdentifiedObject[]): Relationship[] {
  const relationships: Relationship[] = [];

  // For now, we only have one object, so no relationships
  // In future, detect foreign keys by matching field names like "owner_id" to "id"

  if (objects.length < 2) {
    return relationships;
  }

  // TODO: Implement multi-object relationship detection
  // Look for patterns like:
  // - {object}_id in one table matching id in another
  // - Shared field names suggesting joins
  // - Cardinality analysis

  return relationships;
}

/**
 * Step 4: Calculate data quality metrics
 */
function calculateDataQuality(objects: IdentifiedObject[]): QualityMetrics {
  const issues: QualityIssue[] = [];
  const recommendations: string[] = [];

  let totalNullRate = 0;
  let totalValidityScore = 0;
  let fieldCount = 0;

  for (const object of objects) {
    for (const field of object.fields) {
      fieldCount++;
      totalNullRate += field.nullRate;

      // Check for critical issues
      if (field.nullRate > 0.3) {
        const severity: QualityIssue['severity'] =
          field.nullRate > 0.5 ? 'critical' : 'warning';

        issues.push({
          severity,
          field: field.name,
          objectName: object.name,
          issue: `${Math.round(field.nullRate * 100)}% missing data`,
          affectedRows: Math.round(object.rowCount * field.nullRate),
          suggestedResolution: field.semanticCategory === 'contact' ? 'Data Validation' : 'Process'
        });

        if (field.semanticCategory === 'contact') {
          recommendations.push(
            `Require ${field.name} at data entry to reduce ${Math.round(field.nullRate * 100)}% null rate`
          );
        }
      }

      // Check for duplicates in ID fields
      if (field.semanticCategory === 'identifier' && field.duplicateCount > 0) {
        issues.push({
          severity: 'critical',
          field: field.name,
          objectName: object.name,
          issue: `${field.duplicateCount} duplicate IDs detected`,
          affectedRows: field.duplicateCount,
          suggestedResolution: 'Data Validation'
        });

        recommendations.push(`Enforce unique constraint on ${field.name}`);
      }

      // Check for low uniqueness in expected-unique fields
      if (field.inferredType === 'email' && field.uniqueRate < 0.9) {
        issues.push({
          severity: 'warning',
          field: field.name,
          objectName: object.name,
          issue: `${Math.round((1 - field.uniqueRate) * 100)}% duplicate emails`,
          affectedRows: object.rowCount - Math.round(object.rowCount * field.uniqueRate),
          example: field.sampleValues[0],
          suggestedResolution: 'Process'
        });
      }

      // Validity score based on confidence
      totalValidityScore += field.confidence;
    }
  }

  const avgNullRate = fieldCount > 0 ? totalNullRate / fieldCount : 0;
  const avgValidity = fieldCount > 0 ? totalValidityScore / fieldCount : 0;

  const completenessScore = Math.round((1 - avgNullRate) * 100);
  const validityScore = Math.round(avgValidity * 100);
  const consistencyScore = 75; // TODO: Implement format consistency checking

  const overallScore = Math.round(
    completenessScore * 0.4 +
    validityScore * 0.3 +
    consistencyScore * 0.3
  );

  return {
    overallScore,
    issues,
    recommendations,
    completenessScore,
    consistencyScore,
    validityScore
  };
}

/**
 * Step 5: Detect patterns in the data
 */
function detectPatterns(
  objects: IdentifiedObject[],
  parsedData: ParsedData
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Detect naming conventions
  const hasUnderscores = parsedData.headers.filter(h => h.includes('_')).length;
  const hasCamelCase = parsedData.headers.filter(h => /[a-z][A-Z]/.test(h)).length;

  if (hasUnderscores > hasCamelCase && hasUnderscores > parsedData.headers.length * 0.5) {
    patterns.push({
      type: 'naming_convention',
      description: 'Snake_case naming convention detected',
      evidence: parsedData.headers.filter(h => h.includes('_')).slice(0, 3),
      confidence: 0.9
    });
  } else if (hasCamelCase > hasUnderscores && hasCamelCase > parsedData.headers.length * 0.5) {
    patterns.push({
      type: 'naming_convention',
      description: 'camelCase naming convention detected',
      evidence: parsedData.headers.filter(h => /[a-z][A-Z]/.test(h)).slice(0, 3),
      confidence: 0.85
    });
  }

  // Detect workflow indicators
  const hasStatusField = parsedData.headers.some(h =>
    /status|state|stage|phase/i.test(h)
  );
  if (hasStatusField) {
    patterns.push({
      type: 'workflow_indicator',
      description: 'Workflow/status tracking detected',
      evidence: parsedData.headers.filter(h => /status|state|stage|phase/i.test(h)),
      confidence: 0.85
    });
  }

  return patterns;
}

/**
 * Helper: Calculate Levenshtein distance for fuzzy string matching
 * Used for detecting similar field names across objects
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Helper: Calculate similarity between two strings (0-1)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}
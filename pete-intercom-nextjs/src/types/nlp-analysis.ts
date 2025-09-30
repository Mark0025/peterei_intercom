/**
 * NLP Data Structure Analysis Types
 *
 * Types for analyzing uploaded CSV/XLSX data structures
 * using NLP techniques (not AI/LLM) to understand:
 * - Field types and semantics
 * - Object relationships
 * - Data quality issues
 */

export interface DataStructureAnalysis {
  /** Identified objects (tables/entities) from the data */
  objects: IdentifiedObject[];
  /** Detected relationships between objects */
  relationships: Relationship[];
  /** Overall data quality metrics and issues */
  dataQuality: QualityMetrics;
  /** Detected patterns in the data */
  patterns: DetectedPattern[];
  /** Processing time in milliseconds */
  processingTime: number;
  /** Timestamp of analysis */
  analyzedAt: number;
}

export interface IdentifiedObject {
  /** Name of the object (e.g., "Contacts", "Properties") */
  name: string;
  /** How this object was identified */
  source: 'sheet_name' | 'column_prefix' | 'inferred';
  /** Fields (columns) in this object */
  fields: FieldAnalysis[];
  /** Number of rows in this object */
  rowCount: number;
  /** Confidence score (0-1) for this identification */
  confidence: number;
}

export interface FieldAnalysis {
  /** Field name (column header) */
  name: string;
  /** Inferred data type */
  inferredType: 'email' | 'phone' | 'date' | 'currency' | 'text' | 'id' | 'address' | 'boolean' | 'number';
  /** Percentage of null/empty values (0-1) */
  nullRate: number;
  /** Percentage of unique values (0-1) */
  uniqueRate: number;
  /** Number of duplicate values */
  duplicateCount: number;
  /** Sample values from the field */
  sampleValues: string[];
  /** Semantic category for the field */
  semanticCategory?: 'identifier' | 'contact' | 'address' | 'financial' | 'temporal' | 'descriptive';
  /** Confidence score (0-1) for type inference */
  confidence: number;
}

export interface Relationship {
  /** Source object name */
  fromObject: string;
  /** Source field name */
  fromField: string;
  /** Target object name */
  toObject: string;
  /** Target field name */
  toField: string;
  /** Type of relationship */
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  /** Confidence score (0-1) for this relationship */
  confidence: number;
  /** How this relationship was inferred */
  inferredFrom: 'column_name' | 'data_pattern' | 'foreign_key';
}

export interface QualityMetrics {
  /** Overall quality score (0-100) */
  overallScore: number;
  /** List of identified issues */
  issues: QualityIssue[];
  /** Recommendations for improvement */
  recommendations: string[];
  /** Completeness score (0-100) */
  completenessScore: number;
  /** Consistency score (0-100) */
  consistencyScore: number;
  /** Validity score (0-100) */
  validityScore: number;
}

export interface QualityIssue {
  /** Severity of the issue */
  severity: 'critical' | 'warning' | 'info';
  /** Field(s) affected */
  field: string;
  /** Object this field belongs to */
  objectName: string;
  /** Description of the issue */
  issue: string;
  /** Number of rows affected */
  affectedRows: number;
  /** Example value demonstrating the issue */
  example?: string;
  /** Suggested resolution category */
  suggestedResolution?: 'Education' | 'Coding' | 'Expectations' | 'Process' | 'Data Validation';
}

export interface DetectedPattern {
  /** Type of pattern detected */
  type: 'naming_convention' | 'data_structure' | 'workflow_indicator' | 'legacy_system';
  /** Description of the pattern */
  description: string;
  /** Evidence supporting this pattern */
  evidence: string[];
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Real Estate Industry Terms Dictionary
 * Used for semantic analysis of field names
 */
export const REIndustryTerms = {
  identifier: ['id', 'uuid', 'key', 'code', 'number', 'ref'],
  contact: ['email', 'phone', 'mobile', 'fax', 'contact', 'tel', 'cell'],
  person: ['owner', 'tenant', 'manager', 'agent', 'landlord', 'lessee', 'lessor', 'buyer', 'seller'],
  property: ['property', 'address', 'unit', 'building', 'apt', 'suite', 'lot', 'parcel'],
  financial: ['rent', 'price', 'fee', 'deposit', 'commission', 'amount', 'payment', 'balance'],
  temporal: ['date', 'time', 'created', 'updated', 'start', 'end', 'expires', 'lease', 'term'],
  address: ['street', 'city', 'state', 'zip', 'postal', 'country', 'address', 'location'],
  descriptive: ['name', 'description', 'notes', 'comments', 'status', 'type', 'category']
} as const;

/**
 * Common field name patterns for type inference
 */
export const FieldNamePatterns = {
  email: /email|e-mail|e_mail/i,
  phone: /phone|tel|mobile|cell|fax/i,
  date: /date|time|created|updated|modified|start|end|expires/i,
  currency: /price|rent|fee|deposit|commission|amount|payment|cost|balance/i,
  id: /^id$|_id$|^uuid|^key|^code/i,
  address: /address|street|city|state|zip|postal/i,
  boolean: /^is_|^has_|^active|^enabled|^verified/i
} as const;

/**
 * Regex patterns for data validation
 */
export const ValidationPatterns = {
  email: /^[\w\.-]+@[\w\.-]+\.\w+$/,
  phone: /^\+?[\d\s\(\)-]{10,}$/,
  usPhone: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  currency: /^\$?[\d,]+\.?\d{0,2}$/,
  date: {
    iso: /^\d{4}-\d{2}-\d{2}/,
    us: /^\d{1,2}\/\d{1,2}\/\d{2,4}/,
    eu: /^\d{1,2}\.\d{1,2}\.\d{2,4}/
  }
} as const;
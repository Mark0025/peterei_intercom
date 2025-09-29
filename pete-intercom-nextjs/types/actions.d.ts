// Server Action Types - React 19 Compatible

export interface ActionResult<TData = unknown> {
  success: boolean;
  data?: TData;
  error?: string;
  errors?: Record<string, string[]>; // field-level validation errors
}

export interface ActionState<TData = unknown> {
  data?: TData;
  error?: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  pending?: boolean;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Common server action patterns
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface SearchParams {
  query?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// File upload types for server actions
export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

// Cache-related types
export interface CacheConfig {
  ttl?: number; // time to live in seconds
  revalidate?: boolean;
}

export interface CacheResult<T> {
  data: T;
  cached: boolean;
  timestamp: Date;
}
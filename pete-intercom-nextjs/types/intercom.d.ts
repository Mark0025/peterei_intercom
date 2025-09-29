// Intercom API Types - Extracted from Express app analysis

export interface IntercomContact {
  id: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'user' | 'lead';
  custom_attributes?: Record<string, unknown>;
  created_at?: number;
  updated_at?: number;
}

export interface IntercomCompany {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: number;
  created_at?: number;
  updated_at?: number;
}

export interface IntercomAdmin {
  id: string;
  name: string;
  email: string;
  avatar?: {
    image_url?: string;
  };
  away_mode_enabled?: boolean;
  away_mode_reassign?: boolean;
}

export interface IntercomConversation {
  id: string;
  state: 'open' | 'closed' | 'snoozed';
  created_at: number;
  updated_at: number;
  waiting_since?: number;
  assignee?: IntercomAdmin;
  source?: {
    type: string;
    id?: string;
  };
}

export interface IntercomCache {
  contacts: IntercomContact[];
  companies: IntercomCompany[];
  admins: IntercomAdmin[];
  conversations: IntercomConversation[];
  lastRefreshed: Date | null;
}

export interface IntercomApiResponse<T> {
  data?: T[];
  pages?: {
    next?: string | Record<string, unknown>;
    per_page?: number;
    total_pages?: number;
  };
  type?: string;
}

export interface IntercomSearchQuery {
  operator: 'AND' | 'OR';
  value: Array<{
    field: string;
    operator: '=' | '!=' | '>' | '<' | 'IN' | 'NOT_IN';
    value: string | number | string[];
  }>;
}

export interface IntercomSearchRequest {
  query: IntercomSearchQuery;
  pagination?: {
    per_page?: number;
    starting_after?: string;
  };
}
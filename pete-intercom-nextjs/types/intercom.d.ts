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

export interface HelpCenterCollection {
  id: string;
  name: string;
  description?: string;
  article_count: number;
  url?: string;
  created_at?: number;
  updated_at?: number;
}

export interface HelpCenterArticle {
  id: string;
  title: string;
  description?: string;
  parent_id?: string;
  parent_ids?: string[];
  parent_type?: 'collection' | 'section';
  author_id?: string;
  state?: 'published' | 'draft';
  url?: string;
  created_at?: number;
  updated_at?: number;
}

export interface IntercomCache {
  contacts: IntercomContact[];
  companies: IntercomCompany[];
  admins: IntercomAdmin[];
  conversations: IntercomConversation[];
  helpCenterCollections: HelpCenterCollection[];
  helpCenterArticles: HelpCenterArticle[];
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

// Event & Activity Tracking Types
export interface IntercomEvent {
  id: string;
  event_name: string;
  created_at: number;
  user_id?: string;
  intercom_user_id?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface IntercomPageView {
  id: string;
  url: string;
  title?: string;
  created_at: number;
  user_id?: string;
  intercom_user_id?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface IntercomEventSummary {
  name: string;
  count: number;
  first: number;
  last: number;
}

export interface IntercomEventsResponse {
  type: 'event.list';
  events: IntercomEvent[];
  pages?: {
    next?: string;
    per_page?: number;
    total_pages?: number;
  };
}

// Archived Activity Data (for long-term storage)
export interface ArchivedUserActivity {
  contact_id: string;
  email?: string;
  name?: string;
  archived_at: number;
  data_period_start: number;
  data_period_end: number;
  events: IntercomEvent[];
  page_views: IntercomPageView[];
  event_summaries: IntercomEventSummary[];
}
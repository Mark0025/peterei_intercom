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

// Full conversation thread with all parts, notes, and messages
export interface ConversationThread {
  conversation_id: string;
  state: 'open' | 'closed' | 'snoozed';
  created_at: number;
  updated_at: number;

  // User info
  user: {
    id: string;
    name?: string;
    email?: string;
  };

  // Initial message
  initial_message: {
    body_html?: string;
    body_clean: string;
    created_at: number;
    author?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
  };

  // All conversation parts (messages, notes, system actions)
  parts: Array<{
    id: string;
    type: string; // comment, note, assignment, close, etc.
    body_html?: string | null;
    body_clean: string | null;
    created_at: number;
    author_type?: string;
    author_id?: string;
    author_name?: string;
    author_email?: string;
  }>;

  // Extracted notes (for easy access)
  notes: Array<{
    id: string;
    body_html?: string;
    body_clean: string;
    created_at: number;
    author_id: string;
    author_name: string;
    is_from_jon: boolean;
    is_from_mark: boolean;
  }>;

  // Extracted admin responses
  admin_responses: Array<{
    id: string;
    body_html?: string;
    body_clean: string;
    created_at: number;
    author_id: string;
    author_name: string;
    is_from_jon: boolean;
    is_from_mark: boolean;
  }>;

  // Extracted user messages
  user_messages: Array<{
    id: string;
    body_html?: string;
    body_clean: string;
    created_at: number;
    author_id?: string;
    author_name?: string;
  }>;

  // Metadata
  admin_assignee_id?: number;
  total_parts: number;
  total_comments: number;
  total_notes: number;
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

export interface ArticleStatistics {
  type: 'article_statistics';
  views: number;
  conversions: number;
  reactions: number;
  happy_reaction_percentage: number;
  neutral_reaction_percentage: number;
  sad_reaction_percentage: number;
}

export interface TranslatedContent {
  type: 'article_translated_content';
  title?: string;
  description?: string;
  body?: string;
  author_id?: number;
  state?: 'published' | 'draft';
  created_at?: number;
  updated_at?: number;
  url?: string;
}

export interface HelpCenterArticle {
  type: 'article';
  id: string;
  workspace_id?: string;
  title: string;
  description?: string;
  body?: string;
  author_id?: string;
  state?: 'published' | 'draft';
  created_at?: number;
  updated_at?: number;
  url?: string;
  parent_id?: string;
  parent_ids?: string[];
  parent_type?: 'collection' | 'section';
  default_locale?: string;
  translated_content?: Record<string, TranslatedContent>;
  statistics?: ArticleStatistics;
}

export interface IntercomCache {
  contacts: IntercomContact[];
  companies: IntercomCompany[];
  admins: IntercomAdmin[];
  conversations: IntercomConversation[];
  conversationThreads: ConversationThread[];  // Full thread data with notes
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
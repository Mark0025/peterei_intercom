// Canvas Kit Types
export interface CanvasComponent {
  id: string;
  type: string;
  content: string;
  styles?: Record<string, any>;
  children?: CanvasComponent[];
}

export interface CanvasData {
  canvas: {
    id: string;
    title: string;
    content: {
      components: CanvasComponent[];
    };
  };
}

export interface CanvasKitResponse {
  success: boolean;
  data?: CanvasData;
  message?: string;
}

// Onboarding Data Types
export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'text' | 'radio' | 'checkbox' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export interface OnboardingSection {
  id: string;
  title: string;
  description?: string;
  questions: OnboardingQuestion[];
}

export interface OnboardingData {
  title: string;
  description: string;
  sections: OnboardingSection[];
}

export interface OnboardingResponse {
  [key: string]: string | string[];
}

// PeteAI Types
export interface PeteAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface PeteAIRequest {
  message: string;
  conversation?: PeteAIMessage[];
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

export interface PeteAIResponse {
  message: string;
  model: string;
  timestamp: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Intercom API Types
export interface IntercomContact {
  type: 'contact';
  id: string;
  workspace_id: string;
  external_id?: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar?: {
    type: string;
    image_url?: string;
  };
  owner_id?: string;
  social_profiles?: {
    type: string;
    name: string;
    username: string;
    url: string;
  }[];
  has_hard_bounced: boolean;
  marked_email_as_spam: boolean;
  unsubscribed_from_emails: boolean;
  created_at: number;
  updated_at: number;
  signed_up_at?: number;
  last_seen_at?: number;
  last_replied_at?: number;
  last_contacted_at?: number;
  last_email_opened_at?: number;
  last_email_clicked_at?: number;
  language_override?: string;
  browser?: string;
  browser_version?: string;
  browser_language?: string;
  os?: string;
  location?: {
    type: string;
    country?: string;
    region?: string;
    city?: string;
    country_code?: string;
    continent_code?: string;
  };
  android_app_name?: string;
  android_app_version?: string;
  android_device?: string;
  android_os_version?: string;
  android_sdk_version?: string;
  android_last_seen_at?: number;
  ios_app_name?: string;
  ios_app_version?: string;
  ios_device?: string;
  ios_os_version?: string;
  ios_sdk_version?: string;
  ios_last_seen_at?: number;
  custom_attributes?: Record<string, any>;
  tags?: {
    type: string;
    tags: {
      type: string;
      id: string;
      name: string;
    }[];
  };
  notes?: {
    type: string;
    notes: {
      type: string;
      id: string;
      body: string;
      author: {
        type: string;
        id: string;
        name: string;
        email: string;
      };
      created_at: number;
      updated_at: number;
    }[];
  };
  companies?: {
    type: string;
    companies: IntercomCompany[];
  };
}

export interface IntercomCompany {
  type: 'company';
  company_id?: string;
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  monthly_spend?: number;
  session_count?: number;
  user_count?: number;
  size?: number;
  website?: string;
  industry?: string;
  remote_created_at?: number;
  custom_attributes?: Record<string, any>;
  tags?: {
    type: string;
    tags: {
      type: string;
      id: string;
      name: string;
    }[];
  };
  segments?: {
    type: string;
    segments: {
      type: string;
      id: string;
      name: string;
    }[];
  };
}

export interface IntercomAdmin {
  type: 'admin';
  id: string;
  name: string;
  email: string;
  job_title?: string;
  away_mode_enabled: boolean;
  away_mode_reassign: boolean;
  has_inbox_seat: boolean;
  team_ids?: string[];
  avatar?: {
    type: string;
    image_url?: string;
  };
}

export interface IntercomConversation {
  type: 'conversation';
  id: string;
  title?: string;
  created_at: number;
  updated_at: number;
  waiting_since?: number;
  snoozed_until?: number;
  open: boolean;
  state: 'open' | 'closed' | 'snoozed';
  read: boolean;
  priority: 'not_priority' | 'priority';
  admin_assignee_id?: string;
  team_assignee_id?: string;
  tags?: {
    type: string;
    tags: {
      type: string;
      id: string;
      name: string;
    }[];
  };
  conversation_rating?: {
    rating: number;
    remark?: string;
    created_at: number;
    contact: {
      type: string;
      id: string;
      external_id?: string;
    };
    teammate: {
      type: string;
      id: string;
    };
  };
  source?: {
    type: string;
    id?: string;
    delivered_as?: string;
    subject?: string;
    body?: string;
    author?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
    attachments?: any[];
    url?: string;
    redacted?: boolean;
  };
  contacts?: {
    type: string;
    contacts: IntercomContact[];
  };
  teammates?: {
    type: string;
    teammates: {
      type: string;
      id: string;
    }[];
  };
  custom_attributes?: Record<string, any>;
  first_contact_reply?: {
    created_at: number;
    type: string;
    url: string;
  };
  sla_applied?: {
    sla_name: string;
    sla_status: string;
  };
  statistics?: {
    type: string;
    time_to_assignment?: number;
    time_to_admin_reply?: number;
    time_to_first_close?: number;
    time_to_last_close?: number;
    median_time_to_reply?: number;
    first_contact_reply_at?: number;
    first_assignment_at?: number;
    first_admin_reply_at?: number;
    first_close_at?: number;
    last_assignment_at?: number;
    last_assignment_admin_reply_at?: number;
    last_contact_reply_at?: number;
    last_admin_reply_at?: number;
    last_close_at?: number;
    last_closed_by?: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
    count_reopens?: number;
    count_assignments?: number;
    count_conversation_parts?: number;
  };
}

export interface IntercomCache {
  contacts: IntercomContact[];
  companies: IntercomCompany[];
  admins: IntercomAdmin[];
  conversations: IntercomConversation[];
  lastRefreshed: Date | null;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Server Action Result Types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Log Types
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warning' | 'debug';
  message: string;
  filename?: string;
}

// Environment Types
export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT?: string;
  OPENROUTER_API_KEY?: string;
  INTERCOM_ACCESS_TOKEN?: string;
  DATABASE_URL?: string;
}
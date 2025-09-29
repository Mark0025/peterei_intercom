/**
 * Intercom Fields Configuration
 *
 * Centralized configuration for which fields to fetch from Intercom API.
 * Used across all Intercom data fetching functions.
 */

export interface IntercomFieldConfig {
  name: string;
  type: 'string' | 'boolean' | 'number' | 'timestamp' | 'object' | 'array';
  description: string;
  enabled: boolean;
  usedIn: string[];
  example?: string;
  path?: string; // For nested fields like custom_attributes.user_training_topic
}

export interface IntercomConfig {
  contacts: IntercomFieldConfig[];
  companies: IntercomFieldConfig[];
}

export const INTERCOM_FIELDS_CONFIG: IntercomConfig = {
  "contacts": [
    {
      "name": "id",
      "type": "string",
      "description": "Unique Intercom contact ID",
      "enabled": true,
      "usedIn": [
        "Training Management",
        "All API calls"
      ],
      "example": "675a18b8dc8aa923cd71908b"
    },
    {
      "name": "email",
      "type": "string",
      "description": "User email address",
      "enabled": true,
      "usedIn": [
        "Training Management",
        "User lookup"
      ],
      "example": "user@example.com"
    },
    {
      "name": "name",
      "type": "string",
      "description": "User full name",
      "enabled": true,
      "usedIn": [
        "Training Management"
      ],
      "example": "John Doe"
    },
    {
      "name": "role",
      "type": "string",
      "description": "Contact role: user, lead, visitor",
      "enabled": true,
      "usedIn": [
        "Training Management - Active Users KPI"
      ],
      "example": "user"
    },
    {
      "name": "unsubscribed_from_emails",
      "type": "boolean",
      "description": "Whether user unsubscribed from emails",
      "enabled": true,
      "usedIn": [
        "Training Management - Unsubscribed KPI"
      ],
      "example": "false"
    },
    {
      "name": "marked_email_as_spam",
      "type": "boolean",
      "description": "Whether user marked emails as spam",
      "enabled": true,
      "usedIn": [
        "Training Management - Bounced/Spam KPI"
      ],
      "example": "false"
    },
    {
      "name": "has_hard_bounced",
      "type": "boolean",
      "description": "Whether emails to user have hard bounced",
      "enabled": true,
      "usedIn": [
        "Training Management - Bounced/Spam KPI"
      ],
      "example": "false"
    },
    {
      "name": "user_training_topic",
      "type": "string",
      "description": "Custom training topic assigned to user",
      "enabled": true,
      "usedIn": [
        "Training Management - Training Topic Distribution"
      ],
      "example": "Getting Started with Pete",
      "path": "custom_attributes.user_training_topic"
    },
    {
      "name": "phone",
      "type": "string",
      "description": "User phone number",
      "enabled": false,
      "usedIn": [],
      "example": "+1234567890"
    },
    {
      "name": "avatar",
      "type": "object",
      "description": "User avatar image URL",
      "enabled": false,
      "usedIn": [],
      "example": "{ type: \"avatar\", image_url: \"...\" }"
    },
    {
      "name": "owner_id",
      "type": "string",
      "description": "ID of the admin who owns this contact",
      "enabled": false,
      "usedIn": [],
      "example": "123456"
    },
    {
      "name": "created_at",
      "type": "timestamp",
      "description": "When contact was created (Unix timestamp)",
      "enabled": false,
      "usedIn": [],
      "example": "1733957816"
    },
    {
      "name": "updated_at",
      "type": "timestamp",
      "description": "When contact was last updated",
      "enabled": false,
      "usedIn": [],
      "example": "1759175201"
    },
    {
      "name": "signed_up_at",
      "type": "timestamp",
      "description": "When user signed up",
      "enabled": false,
      "usedIn": [],
      "example": "1704067200"
    },
    {
      "name": "last_seen_at",
      "type": "timestamp",
      "description": "When user was last active",
      "enabled": false,
      "usedIn": [],
      "example": "1759175201"
    },
    {
      "name": "last_replied_at",
      "type": "timestamp",
      "description": "When user last replied to a message",
      "enabled": false,
      "usedIn": [],
      "example": "1757366224"
    },
    {
      "name": "last_contacted_at",
      "type": "timestamp",
      "description": "When user was last contacted",
      "enabled": false,
      "usedIn": [],
      "example": "1758033077"
    },
    {
      "name": "last_email_opened_at",
      "type": "timestamp",
      "description": "When user last opened an email",
      "enabled": false,
      "usedIn": [],
      "example": "1757062704"
    },
    {
      "name": "last_email_clicked_at",
      "type": "timestamp",
      "description": "When user last clicked a link in an email",
      "enabled": false,
      "usedIn": [],
      "example": "1757062704"
    },
    {
      "name": "browser",
      "type": "string",
      "description": "User browser",
      "enabled": false,
      "usedIn": [],
      "example": "chrome"
    },
    {
      "name": "browser_version",
      "type": "string",
      "description": "Browser version",
      "enabled": false,
      "usedIn": [],
      "example": "140.0.0.0"
    },
    {
      "name": "browser_language",
      "type": "string",
      "description": "Browser language preference",
      "enabled": false,
      "usedIn": [],
      "example": "en"
    },
    {
      "name": "os",
      "type": "string",
      "description": "Operating system",
      "enabled": false,
      "usedIn": [],
      "example": "Windows 10"
    },
    {
      "name": "location",
      "type": "object",
      "description": "User location data (country, city, etc)",
      "enabled": false,
      "usedIn": [],
      "example": "{ country: \"USA\", city: \"New York\" }"
    },
    {
      "name": "social_profiles",
      "type": "object",
      "description": "User social media profiles",
      "enabled": false,
      "usedIn": [],
      "example": "{ type: \"list\", data: [...] }"
    },
    {
      "name": "language_override",
      "type": "string",
      "description": "User language preference override",
      "enabled": false,
      "usedIn": [],
      "example": "en"
    }
  ],
  "companies": [
    {
      "name": "id",
      "type": "string",
      "description": "Unique company ID",
      "enabled": true,
      "usedIn": [],
      "example": "company-123"
    },
    {
      "name": "name",
      "type": "string",
      "description": "Company name",
      "enabled": true,
      "usedIn": [],
      "example": "Acme Corp"
    },
    {
      "name": "plan",
      "type": "string",
      "description": "Company plan/tier",
      "enabled": true,
      "usedIn": [],
      "example": "enterprise"
    },
    {
      "name": "size",
      "type": "number",
      "description": "Company size (employees)",
      "enabled": true,
      "usedIn": [],
      "example": "500"
    },
    {
      "name": "website",
      "type": "string",
      "description": "Company website",
      "enabled": true,
      "usedIn": [],
      "example": "https://acme.com"
    },
    {
      "name": "industry",
      "type": "string",
      "description": "Company industry",
      "enabled": false,
      "usedIn": [],
      "example": "Technology"
    }
  ]
};

/**
 * Get enabled contact fields
 */
export function getEnabledContactFields(): IntercomFieldConfig[] {
  return INTERCOM_FIELDS_CONFIG.contacts.filter(f => f.enabled);
}

/**
 * Get enabled company fields
 */
export function getEnabledCompanyFields(): IntercomFieldConfig[] {
  return INTERCOM_FIELDS_CONFIG.companies.filter(f => f.enabled);
}

/**
 * Extract a field value from an object, supporting nested paths
 */
export function extractFieldValue(obj: Record<string, unknown>, field: IntercomFieldConfig): string | number | boolean | null {
  if (field.path) {
    // Handle nested paths like 'custom_attributes.user_training_topic'
    const parts = field.path.split('.');
    let value: unknown = obj;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }
    // Ensure we return a valid type
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return null;
  }
  const value = obj[field.name];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return null;
}

/**
 * UI Configuration Types
 *
 * Defines configurable UI settings using Tailwind classes
 */

export interface UIConfig {
  typography: {
    // Headings
    h1: string;
    h2: string;
    h3: string;
    h4: string;

    // Body text
    paragraph: string;
    small: string;

    // Special text
    lead: string; // Larger intro text
    muted: string; // Muted text
  };

  spacing: {
    sectionGap: string;
    cardGap: string;
    contentPadding: string;
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const DEFAULT_UI_CONFIG: UIConfig = {
  typography: {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-semibold',
    h3: 'text-2xl font-semibold',
    h4: 'text-xl font-semibold',
    paragraph: 'text-base',
    small: 'text-sm',
    lead: 'text-lg font-medium',
    muted: 'text-sm text-muted-foreground',
  },
  spacing: {
    sectionGap: 'space-y-8',
    cardGap: 'space-y-6',
    contentPadding: 'p-6',
  },
  colors: {
    primary: 'bg-gradient-to-r from-purple-600 to-pink-600',
    secondary: 'bg-blue-500',
    accent: 'bg-green-500',
  },
};

export const TYPOGRAPHY_OPTIONS = {
  sizes: [
    { label: 'Extra Small', value: 'text-xs' },
    { label: 'Small', value: 'text-sm' },
    { label: 'Base', value: 'text-base' },
    { label: 'Large', value: 'text-lg' },
    { label: 'XL', value: 'text-xl' },
    { label: '2XL', value: 'text-2xl' },
    { label: '3XL', value: 'text-3xl' },
    { label: '4XL', value: 'text-4xl' },
    { label: '5XL', value: 'text-5xl' },
  ],
  weights: [
    { label: 'Normal', value: 'font-normal' },
    { label: 'Medium', value: 'font-medium' },
    { label: 'Semibold', value: 'font-semibold' },
    { label: 'Bold', value: 'font-bold' },
  ],
  spacing: [
    { label: 'Compact (4)', value: 'space-y-4' },
    { label: 'Normal (6)', value: 'space-y-6' },
    { label: 'Relaxed (8)', value: 'space-y-8' },
    { label: 'Loose (12)', value: 'space-y-12' },
  ],
  padding: [
    { label: 'Small (4)', value: 'p-4' },
    { label: 'Medium (6)', value: 'p-6' },
    { label: 'Large (8)', value: 'p-8' },
  ],
};
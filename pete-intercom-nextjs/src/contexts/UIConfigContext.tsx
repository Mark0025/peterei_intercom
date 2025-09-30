'use client';

/**
 * UI Configuration Context
 *
 * Provides global access to UI configuration settings
 */

import { createContext, useContext, ReactNode } from 'react';
import type { UIConfig } from '@/types/ui-config';

interface UIConfigContextType {
  config: UIConfig;
}

const UIConfigContext = createContext<UIConfigContextType | undefined>(undefined);

export function UIConfigProvider({
  children,
  config
}: {
  children: ReactNode;
  config: UIConfig;
}) {
  return (
    <UIConfigContext.Provider value={{ config }}>
      {children}
    </UIConfigContext.Provider>
  );
}

export function useUIConfig() {
  const context = useContext(UIConfigContext);
  if (context === undefined) {
    throw new Error('useUIConfig must be used within a UIConfigProvider');
  }
  return context;
}

// Convenience hooks for specific config sections
export function useTypography() {
  const { config } = useUIConfig();
  return config.typography;
}

export function useSpacing() {
  const { config } = useUIConfig();
  return config.spacing;
}

export function useColors() {
  const { config } = useUIConfig();
  return config.colors;
}
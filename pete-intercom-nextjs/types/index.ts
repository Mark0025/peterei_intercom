// Centralized Type Exports - Single Source of Truth

// Re-export all types from their respective modules
export * from './intercom';
export * from './canvas-kit';
export * from './onboarding';
export * from './actions';

// Common utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonEmptyArray<T> = [T, ...T[]];

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> 
  & {
      [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
    }[Keys];

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Environment variable types
export interface EnvironmentConfig {
  INTERCOM_ACCESS_TOKEN: string;
  INTERCOM_CLIENT_SECRET: string;
  INTERCOM_CLIENT_ID: string;
  USER_ID?: string;
  WORKSPACE_ID?: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PUBLIC_URL?: string;
}
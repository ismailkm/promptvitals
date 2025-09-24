// src/lib/config/appConfig.ts

/**
 * Application-wide configuration settings.
 * Values here are defaults and can often be overridden by environment variables.
 */

import { getBooleanEnv, getNumberEnv } from '@/lib/utils/envUtils';

export const appConfig = {
    // General Application Information
    appName: "AI Prompt Evaluation & Improvement Tool",
    version: "0.1.0-mvp", // Your application version
    defaultLanguage: "en",
    contactEmail: "support@example.com", // Replace with your actual support email
  
    // Environment (can also be directly from process.env.APP_ENV if you prefer)
    // Useful for enabling/disabling features or changing behavior
    environment: process.env.APP_ENV || "development", // "development", "staging", "production"
  
    // Feature Flags
    // Allows enabling/disabling features without code deployment (if controlled by env vars)
    // For MVP, these might be static, but good to have the structure.
    featureFlags: {
      enableAdvancedKpiAnalysis: getBooleanEnv(process.env.NEXT_PUBLIC_FEATURE_ADVANCED_KPI, false),
      enableBadgeSystem: getBooleanEnv(process.env.NEXT_PUBLIC_FEATURE_BADGE_SYSTEM, true), // Default to true for MVP
      enableUserAccounts: getBooleanEnv(process.env.NEXT_PUBLIC_FEATURE_USER_ACCOUNTS, true), // Assuming accounts for summary/detailed gating
      // Add more feature flags as needed
    },
  
    // API Configuration (for internal or external APIs your app calls)
    apiSettings: {
      // Example: if your backend API had a prefix, though likely not needed for Next.js App Router APIs
      // backendApiPrefix: "/api",
      defaultTimeoutMilliseconds: getNumberEnv(30000, process.env.API_DEFAULT_TIMEOUT_MS), // 30 seconds
    },
  
    // Logging Configuration
    logging: {
      // Log level can be controlled by an environment variable for different environments
      level: process.env.LOG_LEVEL || (process.env.APP_ENV === "production" ? "info" : "debug"),
      // prettyPrint: process.env.NODE_ENV === 'development', // If using a logger that supports it
    },
  
    // UI / Frontend specific configurations (if any that aren't component-specific)
    ui: {
      defaultPageSize: 20, // Example, if you had lists of prompts or reports
      // theme: 'dark', // If you had theme settings
    },
  
    // Add other configuration sections as needed:
    // - scoringWeights (though kpiDefinitions.ts might be better for that level of detail)
    // - externalServiceEndpoints
};
  
// Optional: Export individual values if frequently used directly
export const IS_DEVELOPMENT_ENV = appConfig.environment === "development";
export const IS_PRODUCTION_ENV = appConfig.environment === "production";
  
  
export default appConfig; // Default export for easy import
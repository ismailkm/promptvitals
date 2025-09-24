// src/lib/types/riskAssessment.ts

import { PatternWithMetadata } from './patterns';
import { RiskAssessmentLevel, SeverityLevel } from './shared';

/**
 * Defines thresholds for different risk levels in the risk assessment system.
 * These values are used to categorize the cumulative risk score.
 */
export const RISK_LEVEL_THRESHOLDS = {
  LOW: 0.3,      // Cumulative risk score <= 0.3
  MEDIUM: 0.6,   // Cumulative risk score <= 0.6
  HIGH: 0.8,     // Cumulative risk score <= 0.8
  CRITICAL: 1.0  // Cumulative risk score <= 1.0
} as const;

/**
 * Defines all possible pattern categories used in safety and ethics analysis.
 * This structure is organized by the type and severity of the potential harm.
 */
export const PATTERN_CATEGORIES = {
  // --- High-Severity Technical Threats ---
  INJECTION: 'INJECTION',                                     // For classic prompt injection (e.g., "ignore instructions").
  BYPASS: 'BYPASS',                                           // For attempts to disable or ignore safety/security/ethical rules.
  PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',               // For attempts to gain admin/root access or perform privileged actions.
  DATA_EXFILTRATION: 'DATA_EXFILTRATION',                     // For attempts to extract source code, system prompts, or secrets.
  MALICIOUS_CONTENT: 'MALICIOUS_CONTENT',                     // For requests to generate illegal, dangerous, or harmful content (hacking, bombs, etc.).
  DATA_PRIVACY_VIOLATION: 'DATA_PRIVACY_VIOLATION',           // For requests related to non-consensual data collection/sharing.

  // --- Suspicious & Manipulative Technical Patterns ---
  JAILBREAK_ATTEMPT: 'JAILBREAK_ATTEMPT',                     // For known jailbreak techniques and personas (e.g., "developer mode", "DAN").
  ROLEPLAY_MANIPULATION: 'ROLEPLAY_MANIPULATION',             // For attempts to bypass rules via roleplay or hypothetical scenarios.

  // --- Ethical & Social Harms ---
  UNETHICAL_MANIPULATION: 'UNETHICAL_MANIPULATION',           // For requests involving psychological tricks, exploiting vulnerabilities, or deception.
  UNETHICAL_COERCION: 'UNETHICAL_COERCION',                   // For requests involving pressure tactics, creating urgency, or inducing FOMO.
  BIASED_GENERALIZATION: 'BIASED_GENERALIZATION',             // For stereotypes based on gender, age, profession, etc.
  DISCRIMINATORY_LANGUAGE: 'DISCRIMINATORY_LANGUAGE',         // For exclusionary or elitist language targeting specific groups.
  RACIAL_ETHNIC_BIAS: 'RACIAL_ETHNIC_BIAS',                   // Specific category for racial and ethnic stereotypes or determinism.
  RELIGIOUS_BIAS: 'RELIGIOUS_BIAS',                           // Specific category for religious stereotypes and inflammatory language.
  SOCIOECONOMIC_BIAS: 'SOCIOECONOMIC_BIAS',                   // Specific category for bias based on wealth, class, or education.
  ABILITY_BIAS: 'ABILITY_BIAS',                               // Specific category for bias related to disabilities.
  DANGEROUS_BEHAVIOR: 'DANGEROUS_BEHAVIOR',                   // For requests that may not fit other categories but still represent dangerous or harmful behavior.
} as const;

export type PatternCategory = typeof PATTERN_CATEGORIES[keyof typeof PATTERN_CATEGORIES];

/**
 * Defines weight multipliers for different pattern types when calculating risk scores.
 * These weights are used to give appropriate importance to different kinds of patterns.
 */
/**
 * Defines weight multipliers for different pattern categories when calculating risk scores.
 * These weights establish a clear hierarchy of risk, from critical attacks to more subtle biases.
 */
export const PATTERN_RISK_WEIGHTS = {
  // === CRITICAL SEVERITY (Weight: 1.0) ===
  // These are unambiguous, direct attacks or requests for dangerous content. They should have the maximum possible impact.
  MALICIOUS_CONTENT: 1.0,
  INJECTION: 1.0,
  BYPASS: 1.0,

  // === VERY HIGH SEVERITY (Weight: 0.9 - 0.95) ===
  // These are severe threats to the system's integrity or represent the most harmful social biases.
  PRIVILEGE_ESCALATION: 0.95,
  DATA_EXFILTRATION: 0.95,
  RACIAL_ETHNIC_BIAS: 0.9,
  RELIGIOUS_BIAS: 0.9, 
  DATA_PRIVACY_VIOLATION: 0.95,

  // === HIGH SEVERITY (Weight: 0.8 - 0.85) ===
  // These are serious ethical violations or known jailbreak techniques.
  UNETHICAL_MANIPULATION: 0.85,
  JAILBREAK_ATTEMPT: 0.8,
  UNETHICAL_COERCION: 0.8,
  
  // === MEDIUM-HIGH SEVERITY (Weight: 0.7 - 0.75) ===
  // Serious forms of bias and discrimination that are less severe than the highest tier.
  DISCRIMINATORY_LANGUAGE: 0.75,
  ABILITY_BIAS: 0.7,
  SOCIOECONOMIC_BIAS: 0.7,

  // === MEDIUM SEVERITY (Weight: 0.5 - 0.6) ===
  // More subtle issues, including general stereotypes and contextual manipulation attempts.
  BIASED_GENERALIZATION: 0.6,
  ROLEPLAY_MANIPULATION: 0.5,
  DANGEROUS_BEHAVIOR: 0.95, // High weight due to potential for harm
} as const;
/**
 * Type for the keys of RISK_LEVEL_THRESHOLDS
 */
export type RiskLevel = keyof typeof RISK_LEVEL_THRESHOLDS;

/**
 * Type for the keys of PATTERN_RISK_WEIGHTS
 */
export type PatternRiskCategory = keyof typeof PATTERN_RISK_WEIGHTS;

/**
 * Interface for risk assessment results
 */
export interface RiskAssessmentResult {
  cumulativeRiskScore: number;           // The calculated risk score (0 to 1)
  riskLevel: RiskLevel;                  // The determined risk level based on thresholds
  highestSeverityPattern?: PatternWithMetadata; // The pattern with highest severity that was matched
  detectedRisks: {                       // Breakdown of detected risks by category
    category: PatternRiskCategory;
    patterns: PatternWithMetadata[];
    contributingScore: number;
  }[];
}

/**
 * Interface for risk assessment metadata that can be attached to patterns
 */
export interface RiskAssessmentMetadata {
  category: PatternRiskCategory;
  baseScore: number;              // Base risk score before weight application
  contextMultiplier?: number;     // Optional multiplier based on context
}

/**
 * Interface for the result of safety risk computation.
 * Used by computeSafetyRisk() utility to aggregate detected safety/ethics violations into a unified risk assessment.
 */
export interface SafetyRiskComputation {
  cumulativeRiskScore: number;           // Aggregated risk score (0.0 to 1.0) using saturating combination
  riskAssessmentLevel: RiskAssessmentLevel; // Categorical risk level based on thresholds
  highestSeverity?: SeverityLevel;       // Most severe individual detection for context
}

/**
 * Numeric ordering for SeverityLevel enum to enable severity comparisons.
 * Used in computeSafetyRisk() to track highestSeverity across all detections.
 */
export const SEVERITY_HIERARCHY: Record<SeverityLevel, number> = {
  [SeverityLevel.INFO]: 0,
  [SeverityLevel.LOW]: 1,
  [SeverityLevel.MEDIUM]: 2,
  [SeverityLevel.HIGH]: 3,
  [SeverityLevel.CRITICAL]: 4,
};

/**
 * Numeric ordering for RiskAssessmentLevel enum to enable risk level comparisons.
 * Used for risk level comparison and escalation logic.
 */
export const RISK_HIERARCHY: Record<RiskAssessmentLevel, number> = {
  [RiskAssessmentLevel.LOW]: 1,
  [RiskAssessmentLevel.MEDIUM]: 2,
  [RiskAssessmentLevel.HIGH]: 3,
  [RiskAssessmentLevel.CRITICAL]: 4,
};

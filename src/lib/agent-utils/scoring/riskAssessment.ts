/**
 * Risk Assessment Level Utilities
 * 
 * Handles risk level comparisons, escalation logic, and 
 * risk-based decision making for agent systems.
 */

import { RiskAssessmentLevel, SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';
import { RISK_HIERARCHY, SEVERITY_HIERARCHY } from '@/lib/types/riskAssessment';
import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';


/**
 * Utility: Check if a severity is high or critical (using SeverityLevel enum, case-insensitive fallback)
 */
export function isHighOrCriticalSeverity(severity: any): boolean {
  if (typeof severity === 'string') {
    const s = severity.toLowerCase();
    return s === SeverityLevel.HIGH || s === SeverityLevel.CRITICAL;
  }
  return severity === SeverityLevel.HIGH || severity === SeverityLevel.CRITICAL || severity === 2 || severity === 3;
}


/**
 * Get the highest risk level from a collection of risk levels
 */
export function getHighestRiskLevel(levels: RiskAssessmentLevel[]): RiskAssessmentLevel {
  if (levels.length === 0) return RiskAssessmentLevel.LOW;
  
  return levels.reduce<RiskAssessmentLevel>((highest, level) => {
    return RISK_HIERARCHY[level] > RISK_HIERARCHY[highest] 
      ? level 
      : highest;
  }, RiskAssessmentLevel.LOW);
}

/**
 * Compare two risk assessment levels
 * Returns: -1 if level1 < level2, 0 if equal, 1 if level1 > level2
 */
export function compareRiskLevels(level1: RiskAssessmentLevel, level2: RiskAssessmentLevel): number {
  const hierarchy1 = RISK_HIERARCHY[level1];
  const hierarchy2 = RISK_HIERARCHY[level2];
  
  if (hierarchy1 < hierarchy2) return -1;
  if (hierarchy1 > hierarchy2) return 1;
  return 0;
}

/**
 * Check if a risk level meets or exceeds a minimum threshold
 */
export function isRiskLevelAtLeast(level: RiskAssessmentLevel, minLevel: RiskAssessmentLevel): boolean {
  return RISK_HIERARCHY[level] >= RISK_HIERARCHY[minLevel];
}


/**
 * Determine the overall bias risk level based on detected bias indicators
 * @param biasIndicators Array of detected bias risk indicators
 * @returns The highest risk level found among the indicators
 */
export function getBiasRiskLevel(biasIndicators: DetectedPatternInfo[]): RiskAssessmentLevel {
  if (biasIndicators.length === 0) return RiskAssessmentLevel.LOW;
  
  // Check for highest severity first (most critical to least)
  if (biasIndicators.some(i => i.severity === SeverityLevel.CRITICAL)) {
    return RiskAssessmentLevel.CRITICAL;
  } else if (biasIndicators.some(i => i.severity === SeverityLevel.HIGH)) {
    return RiskAssessmentLevel.HIGH;
  } else if (biasIndicators.some(i => i.severity === SeverityLevel.MEDIUM)) {
    return RiskAssessmentLevel.MEDIUM;
  } else {
    return RiskAssessmentLevel.LOW; // If all are low/info severity
  }
}

/**
 * Determine malicious intent risk level based on detected patterns
 * @param patterns Array of detected malicious intent patterns
 * @returns The highest risk level based on pattern severity
 */
export function getMaliciousIntentRiskLevel(patterns: DetectedPatternInfo[]): RiskAssessmentLevel {
  if (patterns.length === 0) return RiskAssessmentLevel.LOW;
  
  // Check for critical patterns (TIER1)
  const hasCriticalPatterns = patterns.some(p => p.severity === SeverityLevel.CRITICAL);
  if (hasCriticalPatterns) return RiskAssessmentLevel.CRITICAL;

  // Check for high severity patterns (TIER2)
  const hasHighPatterns = patterns.some(p => p.severity === SeverityLevel.HIGH);
  if (hasHighPatterns) return RiskAssessmentLevel.HIGH;

  // Check for medium severity patterns (TIER3)
  const hasMediumPatterns = patterns.some(p => p.severity === SeverityLevel.MEDIUM);
  if (hasMediumPatterns) return RiskAssessmentLevel.MEDIUM;

  return RiskAssessmentLevel.LOW;
}

/**
 * Convert RiskAssessmentLevel to a numeric value for scoring purposes
 * CRITICAL = 3, HIGH = 2, MEDIUM = 1, LOW = 0
 * This helps in applying score penalties based on risk levels.
 */
export const getRiskLevelNumericValue = (level: RiskAssessmentLevel): number => {
  switch (level) {
    case RiskAssessmentLevel.CRITICAL: return 3;
    case RiskAssessmentLevel.HIGH: return 2;
    case RiskAssessmentLevel.MEDIUM: return 1;
    default: return 0;
  }
};

/**
 * Map SeverityLevel to RiskAssessmentLevel
 * Converts severity levels (low, medium, high, critical) to corresponding risk levels.
 */
export const mapSeverityToRiskLevel = (severity: SeverityLevel): RiskAssessmentLevel => {
  switch (severity) {
    case 'low':
      return RiskAssessmentLevel.LOW;
    case 'medium':
      return RiskAssessmentLevel.MEDIUM;
    case 'high':
      return RiskAssessmentLevel.HIGH;
    case 'critical':
      return RiskAssessmentLevel.CRITICAL;
    default:
      throw new Error(`Unknown severity level: ${severity}`);
  }
};

/**
 * Reconciles the results of the ethical and malicious safety KPIs.
 * This enforces the critical rule that a prompt flagged for high malicious intent
 * cannot also be considered ethically sound.
 *
 * @param ethicalResult The initial evaluation output for the ethical/bias KPI.
 * @param maliciousResult The initial evaluation output for the malicious intent KPI.
 * @returns An object containing the final, logically consistent evaluations for both KPIs.
 */
export const reconcileSafetyKpis = (
  ethicalResult: KpiEvaluationOutput,
  maliciousResult: KpiEvaluationOutput
): {
  ethicalSafetyBiasMitigation: KpiEvaluationOutput;
  maliciousIntentMisusePrevention: KpiEvaluationOutput;
} => {
  const maliciousIntentScore = maliciousResult.score;
  const baseEthicalScore = ethicalResult.score;

  // Rule 1: The final ethical score can NEVER be higher than the malicious intent score.
  const finalEthicalScore = Math.min(baseEthicalScore, maliciousIntentScore);

  // Create a mutable copy of the ethical result to avoid direct mutation.
  const finalEthicalResult = { ...ethicalResult, score: finalEthicalScore };

  // Rule 2: If malicious intent is critical, its assessment must override the ethical one.
  const CRITICAL_THRESHOLD = 25;
  if (maliciousIntentScore <= CRITICAL_THRESHOLD) {
    if (!finalEthicalResult.flags) {
      finalEthicalResult.flags = {};
    }
    finalEthicalResult.flags.assessment_comment =
      "CRITICAL: The prompt's request is fundamentally unethical as it facilitates harmful and illegal activities.";
  }

  // Return the final, reconciled results.
  return {
    ethicalSafetyBiasMitigation: finalEthicalResult,
    maliciousIntentMisusePrevention: maliciousResult, // The malicious result itself does not change.
  };
};
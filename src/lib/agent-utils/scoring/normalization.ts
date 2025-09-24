/**
 * Score Normalization & Threshold Utilities
 * 
 * Provides standardized score normalization, threshold classification,
 * and confidence interval calculations for agent scoring systems.
 */

import { RiskAssessmentLevel } from '@/lib/types/shared';
import { RISK_LEVEL_THRESHOLDS } from '@/lib/types/riskAssessment';

/**
 * Normalize a raw score to 0-1 range using min-max normalization
 */
export function normalizeScore(rawScore: number, minValue: number, maxValue: number): number {
  if (minValue >= maxValue) {
    throw new Error('minValue must be less than maxValue');
  }
  
  const normalized = (rawScore - minValue) / (maxValue - minValue);
  return Math.max(0, Math.min(1, normalized)); // Clamp to [0, 1]
}

/**
 * Apply saturation function to combine multiple scores with diminishing returns
 * Uses the formula: 1 - (1 - s1) * (1 - s2) * ... for scores in [0, 1]
 */
export function applySaturation(scores: number[]): number {
  if (scores.length === 0) return 0;
  
  // Validate all scores are in [0, 1] range
  const validScores = scores.filter(score => score >= 0 && score <= 1);
  if (validScores.length !== scores.length) {
    console.warn('Some scores were outside [0, 1] range and were filtered out');
  }
  
  if (validScores.length === 0) return 0;
  if (validScores.length === 1) return validScores[0];
  
  // Apply saturation: 1 - product of (1 - score_i)
  const product = validScores.reduce((acc, score) => acc * (1 - score), 1);
  return 1 - product;
}

/**
 * Classify a normalized score (0-1) into risk assessment levels using thresholds
 */
export function classifyByThreshold(normalizedScore: number): RiskAssessmentLevel {
  if (normalizedScore < 0 || normalizedScore > 1) {
    console.warn(`Score ${normalizedScore} is outside [0, 1] range`);
  }
  
  if (normalizedScore <= RISK_LEVEL_THRESHOLDS.LOW) {
    return RiskAssessmentLevel.LOW;
  } else if (normalizedScore <= RISK_LEVEL_THRESHOLDS.MEDIUM) {
    return RiskAssessmentLevel.MEDIUM;
  } else if (normalizedScore <= RISK_LEVEL_THRESHOLDS.HIGH) {
    return RiskAssessmentLevel.HIGH;
  } else {
    return RiskAssessmentLevel.CRITICAL;
  }
}

/**
 * Calculate confidence interval for AI-enhanced scoring
 * Returns confidence bounds around a base score
 */
export function calculateConfidenceInterval(
  baseScore: number,
  confidenceLevel: number = 0.95,
  standardError: number = 0.1
): { lower: number; upper: number; confidence: number } {
  if (confidenceLevel <= 0 || confidenceLevel >= 1) {
    throw new Error('Confidence level must be between 0 and 1');
  }
  
  // Use normal distribution approximation for confidence interval
  // Z-score for 95% confidence ≈ 1.96, for 90% ≈ 1.645
  const zScore = confidenceLevel === 0.95 ? 1.96 : 
                 confidenceLevel === 0.90 ? 1.645 :
                 confidenceLevel === 0.99 ? 2.576 :
                 1.96; // Default to 95%
  
  const margin = zScore * standardError;
  
  return {
    lower: Math.max(0, baseScore - margin),
    upper: Math.min(1, baseScore + margin),
    confidence: confidenceLevel
  };
}

/**
 * Weighted score combination with configurable weights
 * Useful for combining different types of analysis scores
 */
export function combineWeightedScores(
  scores: Array<{ value: number; weight: number; label?: string }>
): { combinedScore: number; breakdown: typeof scores } {
  if (scores.length === 0) {
    return { combinedScore: 0, breakdown: [] };
  }
  
  // Validate weights
  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('Total weight must be positive');
  }
  
  // Calculate weighted average
  const weightedSum = scores.reduce((sum, item) => {
    return sum + (item.value * item.weight);
  }, 0);
  
  const combinedScore = weightedSum / totalWeight;
  
  return {
    combinedScore: Math.max(0, Math.min(1, combinedScore)), // Clamp to [0, 1]
    breakdown: scores.map(item => ({
      ...item,
      normalizedWeight: item.weight / totalWeight
    }))
  };
}

/**
 * Utility to get threshold boundaries for a given risk level
 */
export function getThresholdBoundaries(level: RiskAssessmentLevel): { min: number; max: number } {
  switch (level) {
    case RiskAssessmentLevel.LOW:
      return { min: 0, max: RISK_LEVEL_THRESHOLDS.LOW };
    case RiskAssessmentLevel.MEDIUM:
      return { min: RISK_LEVEL_THRESHOLDS.LOW, max: RISK_LEVEL_THRESHOLDS.MEDIUM };
    case RiskAssessmentLevel.HIGH:
      return { min: RISK_LEVEL_THRESHOLDS.MEDIUM, max: RISK_LEVEL_THRESHOLDS.HIGH };
    case RiskAssessmentLevel.CRITICAL:
      return { min: RISK_LEVEL_THRESHOLDS.HIGH, max: 1.0 };
    default:
      return { min: 0, max: 1.0 };
  }
}

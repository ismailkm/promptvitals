
/**
 * Severity Level Management Utilities
 * 
 * Handles severity level comparisons, filtering, and analysis
 * for detected patterns across all agents.
 */

import { SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';
import { SEVERITY_HIERARCHY } from '@/lib/types/riskAssessment';

/**
 * Get the highest severity level from a collection of patterns
 */
export function getHighestSeverity(patterns: DetectedPatternInfo[]): SeverityLevel {
  if (patterns.length === 0) return SeverityLevel.INFO;
  
  return patterns.reduce<SeverityLevel>((highest, pattern) => {
    return SEVERITY_HIERARCHY[pattern.severity] > SEVERITY_HIERARCHY[highest] 
      ? pattern.severity 
      : highest;
  }, SeverityLevel.INFO);
}

/**
 * Count patterns by severity level
 */
export function countBySeverity(patterns: DetectedPatternInfo[]): Record<SeverityLevel, number> {
  return patterns.reduce((counts, pattern) => {
    counts[pattern.severity]++;
    return counts;
  }, {
    [SeverityLevel.INFO]: 0,
    [SeverityLevel.LOW]: 0,
    [SeverityLevel.MEDIUM]: 0,
    [SeverityLevel.HIGH]: 0,
    [SeverityLevel.CRITICAL]: 0
  });
}

/**
 * Filter patterns by minimum severity level
 */
export function filterBySeverity(
  patterns: DetectedPatternInfo[], 
  minSeverity: SeverityLevel
): DetectedPatternInfo[] {
  const minLevel = SEVERITY_HIERARCHY[minSeverity];
  return patterns.filter(pattern => SEVERITY_HIERARCHY[pattern.severity] >= minLevel);
}

/**
 * Check if any patterns meet or exceed a severity threshold
 */
export function hasPatternAtSeverity(patterns: DetectedPatternInfo[], minSeverity: SeverityLevel): boolean {
  const minLevel = SEVERITY_HIERARCHY[minSeverity];
  return patterns.some(pattern => SEVERITY_HIERARCHY[pattern.severity] >= minLevel);
}

/**
 * Convert severity-based raw counts to normalized risk score
 * Useful for pattern-based analysis
 */
export function severityCountsToScore(severityCounts: Record<SeverityLevel, number>): number {
  const weights = {
    [SeverityLevel.INFO]: 0.0,
    [SeverityLevel.LOW]: 0.1,
    [SeverityLevel.MEDIUM]: 0.3,
    [SeverityLevel.HIGH]: 0.7,
    [SeverityLevel.CRITICAL]: 1.0
  };
  
  const totalCounts = Object.values(severityCounts).reduce((sum, count) => sum + count, 0);
  if (totalCounts === 0) return 0;
  
  // Calculate weighted score based on severity distribution
  const weightedSum = Object.entries(severityCounts).reduce((sum, [severity, count]) => {
    const weight = weights[severity as SeverityLevel];
    return sum + (weight * count);
  }, 0);
  
  // Normalize by total count and apply saturation
  const rawScore = weightedSum / totalCounts;
  
  // Apply diminishing returns for high counts
  const saturationFactor = Math.min(1, totalCounts / 10); // Saturate at 10+ patterns
  
  return Math.min(1, rawScore * (1 + saturationFactor * 0.5));
}


/**
 * Returns true if any pattern match has HIGH or MEDIUM severity.
 */
export function hasConfidentPatternMatch(matches: { severity: SeverityLevel }[]): boolean {
  return matches.some(match => match.severity === SeverityLevel.HIGH || match.severity === SeverityLevel.MEDIUM);
}

/**
 * Filters an array of issues to only those with the exact specified severity.
 * Useful for extracting issues of a single severity level (e.g., INFO, MEDIUM, HIGH).
 */
export function filterByExactSeverity<T extends { severity: SeverityLevel }>(
  issues: T[],
  severity: SeverityLevel
): T[] {
  return issues.filter(issue => issue.severity === severity);
}

/**
 * Returns true if there are at least minCount matches at the specified severity level.
 */
export function hasMultiplePatternMatchesAtSeverity(
  matches: { severity: SeverityLevel }[],
  severity: SeverityLevel,
  minCount: number
): boolean {
  return matches.filter(match => match.severity === severity).length >= minCount;
}

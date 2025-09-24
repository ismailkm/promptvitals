/**
 * Pattern Organization Utilities
 * 
 * Tools for grouping, sorting, filtering, and analyzing
 * collections of DetectedPatternInfo objects.
 */

import { DetectedPatternInfo } from '@/lib/types/patterns';
import { SEVERITY_HIERARCHY } from '@/lib/types/riskAssessment';
import { countBySeverity, getHighestSeverity } from '../scoring/severityManagement';

/**
 * Group patterns by their source for organized reporting
 */
export function groupPatternsBySource(patterns: DetectedPatternInfo[]): Record<string, DetectedPatternInfo[]> {
  return patterns.reduce((groups, pattern) => {
    const source = typeof pattern.matchedPatternSource === 'string' 
      ? pattern.matchedPatternSource 
      : pattern.matchedPatternSource.reason;
    if (!groups[source]) {
      groups[source] = [];
    }
    groups[source].push(pattern);
    return groups;
  }, {} as Record<string, DetectedPatternInfo[]>);
}

/**
 * Sort patterns by severity (highest first) then by position in text
 */
export function sortPatternsBySeverityAndPosition(patterns: DetectedPatternInfo[]): DetectedPatternInfo[] {
  return [...patterns].sort((a, b) => {
    // First sort by severity (highest first)
    const severityDiff = SEVERITY_HIERARCHY[b.severity] - SEVERITY_HIERARCHY[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then sort by position in text (earliest first)
    return a.startIndex - b.startIndex;
  });
}

/**
 * Get summary statistics for a collection of patterns
 */
export function getPatternSummary(patterns: DetectedPatternInfo[]) {
  const counts = countBySeverity(patterns);
  const highestSeverity = getHighestSeverity(patterns);
  const sources = [...new Set(patterns.map(p => p.matchedPatternSource))];
  
  return {
    totalCount: patterns.length,
    severityCounts: counts,
    highestSeverity,
    uniqueSources: sources,
    sourceCount: sources.length
  };
}

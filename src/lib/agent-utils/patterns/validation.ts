/**
 * Pattern Validation Utilities
 * 
 * Validates DetectedPatternInfo objects for correctness
 * and provides sanitization functions.
 */

import { DetectedPatternInfo } from '@/lib/types/patterns';
import { SeverityLevel } from '@/lib/types/shared';

/**
 * Validate that a pattern has required fields and sensible values
 */
export function validatePattern(pattern: DetectedPatternInfo): boolean {
  // First check if pattern exists and is an object
  if (!pattern || typeof pattern !== 'object') {
    return false;
  }
  
  return (
    typeof pattern.matchedText === 'string' &&
    pattern.matchedText.length > 0 &&
    typeof pattern.reason === 'string' &&
    pattern.reason.length > 0 &&
    typeof pattern.startIndex === 'number' &&
    typeof pattern.endIndex === 'number' &&
    pattern.startIndex >= 0 &&
    pattern.endIndex >= pattern.startIndex &&
    Object.values(SeverityLevel).includes(pattern.severity)
  );
}

/**
 * Filter out invalid patterns and log warnings
 */
export function sanitizePatterns(patterns: DetectedPatternInfo[]): DetectedPatternInfo[] {
  return patterns.filter(pattern => {
    const isValid = validatePattern(pattern);
    if (!isValid) {
      console.warn('Invalid pattern detected and filtered out:', pattern);
    }
    return isValid;
  });
}

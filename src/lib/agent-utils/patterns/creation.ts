/**
 * Pattern Creation Utilities
 * 
 * Standardized helpers for creating DetectedPatternInfo objects
 * with consistent structure and severity levels.
 */

import { SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';

/**
 * Create a standardized DetectedPatternInfo object
 */
export function createPatternInfo(
  matchedText: string,
  patternSource: string,
  reason: string,
  severity: SeverityLevel,
  startIndex: number,
  endIndex: number
): DetectedPatternInfo {
  return {
    matchedText,
    matchedPatternSource: patternSource,
    reason,
    severity,
    startIndex,
    endIndex
  };
}

/**
 * Create pattern info for low-severity informational patterns
 */
export function createLowSeverityPattern(
  matchedText: string,
  patternSource: string,
  reason: string,
  startIndex: number,
  endIndex: number
): DetectedPatternInfo {
  return createPatternInfo(matchedText, patternSource, reason, SeverityLevel.LOW, startIndex, endIndex);
}

/**
 * Create pattern info for medium-severity concern patterns
 */
export function createMediumSeverityPattern(
  matchedText: string,
  patternSource: string,
  reason: string,
  startIndex: number,
  endIndex: number
): DetectedPatternInfo {
  return createPatternInfo(matchedText, patternSource, reason, SeverityLevel.MEDIUM, startIndex, endIndex);
}

/**
 * Create pattern info for high-severity issue patterns
 */
export function createHighSeverityPattern(
  matchedText: string,
  patternSource: string,
  reason: string,
  startIndex: number,
  endIndex: number
): DetectedPatternInfo {
  return createPatternInfo(matchedText, patternSource, reason, SeverityLevel.HIGH, startIndex, endIndex);
}

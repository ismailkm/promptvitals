/**
 * Severity Management Utilities Tests
 * 
 * Tests for severity level operations, counting, and filtering.
 */

import { 
  getHighestSeverity, 
  countBySeverity, 
  filterBySeverity,
  hasPatternAtSeverity,
  severityCountsToScore
} from '@/lib/agent-utils/scoring/severityManagement';
import { SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';

// Test fixtures
const createMockPattern = (severity: SeverityLevel, text: string = 'test'): DetectedPatternInfo => ({
  matchedText: text,
  matchedPatternSource: 'test-source',
  reason: 'test reason',
  severity,
  startIndex: 0,
  endIndex: text.length
});

describe('Severity Management Utilities', () => {
  describe('getHighestSeverity', () => {
    test('returns INFO for empty array', () => {
      expect(getHighestSeverity([])).toBe(SeverityLevel.INFO);
    });

    test('returns single severity for one pattern', () => {
      const patterns = [createMockPattern(SeverityLevel.HIGH)];
      expect(getHighestSeverity(patterns)).toBe(SeverityLevel.HIGH);
    });

    test('returns highest severity from multiple patterns', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.CRITICAL),
        createMockPattern(SeverityLevel.MEDIUM),
        createMockPattern(SeverityLevel.HIGH)
      ];
      expect(getHighestSeverity(patterns)).toBe(SeverityLevel.CRITICAL);
    });

    test('handles multiple patterns with same highest severity', () => {
      const patterns = [
        createMockPattern(SeverityLevel.HIGH),
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.HIGH)
      ];
      expect(getHighestSeverity(patterns)).toBe(SeverityLevel.HIGH);
    });
  });

  describe('countBySeverity', () => {
    test('returns zero counts for empty array', () => {
      const counts = countBySeverity([]);
      expect(counts).toEqual({
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 0,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 0,
        [SeverityLevel.CRITICAL]: 0
      });
    });

    test('counts single pattern correctly', () => {
      const patterns = [createMockPattern(SeverityLevel.HIGH)];
      const counts = countBySeverity(patterns);
      
      expect(counts[SeverityLevel.HIGH]).toBe(1);
      expect(counts[SeverityLevel.LOW]).toBe(0);
      expect(counts[SeverityLevel.MEDIUM]).toBe(0);
      expect(counts[SeverityLevel.CRITICAL]).toBe(0);
      expect(counts[SeverityLevel.INFO]).toBe(0);
    });

    test('counts multiple patterns of different severities', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.HIGH),
        createMockPattern(SeverityLevel.CRITICAL),
        createMockPattern(SeverityLevel.MEDIUM)
      ];
      const counts = countBySeverity(patterns);
      
      expect(counts[SeverityLevel.LOW]).toBe(2);
      expect(counts[SeverityLevel.HIGH]).toBe(1);
      expect(counts[SeverityLevel.CRITICAL]).toBe(1);
      expect(counts[SeverityLevel.MEDIUM]).toBe(1);
      expect(counts[SeverityLevel.INFO]).toBe(0);
    });
  });

  describe('filterBySeverity', () => {
    test('returns empty array for empty input', () => {
      expect(filterBySeverity([], SeverityLevel.LOW)).toEqual([]);
    });

    test('filters patterns by minimum severity', () => {
      const patterns = [
        createMockPattern(SeverityLevel.INFO),
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.HIGH),
        createMockPattern(SeverityLevel.CRITICAL)
      ];
      
      const filtered = filterBySeverity(patterns, SeverityLevel.HIGH);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].severity).toBe(SeverityLevel.HIGH);
      expect(filtered[1].severity).toBe(SeverityLevel.CRITICAL);
    });

    test('includes patterns at exact threshold', () => {
      const patterns = [
        createMockPattern(SeverityLevel.MEDIUM),
        createMockPattern(SeverityLevel.LOW)
      ];
      
      const filtered = filterBySeverity(patterns, SeverityLevel.MEDIUM);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe(SeverityLevel.MEDIUM);
    });
  });

  describe('hasPatternAtSeverity', () => {
    test('returns false for empty array', () => {
      expect(hasPatternAtSeverity([], SeverityLevel.LOW)).toBe(false);
    });

    test('returns true when pattern meets threshold', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.HIGH)
      ];
      
      expect(hasPatternAtSeverity(patterns, SeverityLevel.MEDIUM)).toBe(true);
      expect(hasPatternAtSeverity(patterns, SeverityLevel.HIGH)).toBe(true);
    });

    test('returns false when no patterns meet threshold', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW),
        createMockPattern(SeverityLevel.INFO)
      ];
      
      expect(hasPatternAtSeverity(patterns, SeverityLevel.HIGH)).toBe(false);
    });
  });

  describe('severityCountsToScore', () => {
    test('returns 0 for empty counts', () => {
      const counts = {
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 0,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 0,
        [SeverityLevel.CRITICAL]: 0
      };
      
      expect(severityCountsToScore(counts)).toBe(0);
    });

    test('calculates score for single severity type', () => {
      const counts = {
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 0,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 1,
        [SeverityLevel.CRITICAL]: 0
      };
      
      const score = severityCountsToScore(counts);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    test('assigns higher scores to higher severities', () => {
      const lowCounts = {
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 1,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 0,
        [SeverityLevel.CRITICAL]: 0
      };
      
      const criticalCounts = {
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 0,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 0,
        [SeverityLevel.CRITICAL]: 1
      };
      
      const lowScore = severityCountsToScore(lowCounts);
      const criticalScore = severityCountsToScore(criticalCounts);
      
      expect(criticalScore).toBeGreaterThan(lowScore);
    });

    test('applies saturation for high pattern counts', () => {
      const moderateCounts = {
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 3,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 0,
        [SeverityLevel.CRITICAL]: 0
      };
      
      const highCounts = {
        [SeverityLevel.INFO]: 0,
        [SeverityLevel.LOW]: 15,
        [SeverityLevel.MEDIUM]: 0,
        [SeverityLevel.HIGH]: 0,
        [SeverityLevel.CRITICAL]: 0
      };
      
      const moderateScore = severityCountsToScore(moderateCounts);
      const highScore = severityCountsToScore(highCounts);
      
      // High count should have saturation effect
      expect(highScore).toBeGreaterThan(moderateScore);
      expect(highScore).toBeLessThanOrEqual(1);
    });
  });
});

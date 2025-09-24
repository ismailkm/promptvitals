/**
 * Pattern Organization Utilities Tests
 * 
 * Tests for grouping, sorting, and analyzing collections of patterns.
 */

import { 
  groupPatternsBySource, 
  sortPatternsBySeverityAndPosition,
  getPatternSummary
} from '@/lib/agent-utils/patterns/organization';
import { SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';

// Test fixtures
const createMockPattern = (
  severity: SeverityLevel, 
  source: string,
  startIndex: number = 0,
  text: string = 'test'
): DetectedPatternInfo => ({
  matchedText: text,
  matchedPatternSource: source,
  reason: 'test reason',
  severity,
  startIndex,
  endIndex: startIndex + text.length
});

describe('Pattern Organization Utilities', () => {
  describe('groupPatternsBySource', () => {
    test('returns empty object for empty array', () => {
      expect(groupPatternsBySource([])).toEqual({});
    });

    test('groups patterns by string source correctly', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW, 'source-a'),
        createMockPattern(SeverityLevel.HIGH, 'source-b'),
        createMockPattern(SeverityLevel.MEDIUM, 'source-a')
      ];
      
      const grouped = groupPatternsBySource(patterns);
      
      expect(grouped['source-a']).toHaveLength(2);
      expect(grouped['source-b']).toHaveLength(1);
      expect(grouped['source-a'][0].severity).toBe(SeverityLevel.LOW);
      expect(grouped['source-a'][1].severity).toBe(SeverityLevel.MEDIUM);
      expect(grouped['source-b'][0].severity).toBe(SeverityLevel.HIGH);
    });

    test('handles single pattern', () => {
      const patterns = [createMockPattern(SeverityLevel.HIGH, 'single-source')];
      const grouped = groupPatternsBySource(patterns);
      
      expect(Object.keys(grouped)).toHaveLength(1);
      expect(grouped['single-source']).toHaveLength(1);
    });

    test('handles patterns with same source but different properties', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW, 'common-source', 0, 'first'),
        createMockPattern(SeverityLevel.HIGH, 'common-source', 10, 'second'),
        createMockPattern(SeverityLevel.CRITICAL, 'common-source', 20, 'third')
      ];
      
      const grouped = groupPatternsBySource(patterns);
      
      expect(grouped['common-source']).toHaveLength(3);
      expect(grouped['common-source'].map(p => p.matchedText)).toEqual(['first', 'second', 'third']);
    });

    test('handles object-type pattern sources by extracting reason', () => {
      const patterns = [
        {
          ...createMockPattern(SeverityLevel.LOW, 'fallback-source'),
          matchedPatternSource: { reason: 'object-source', type: 'test' }
        }
      ];
      
      const grouped = groupPatternsBySource(patterns as any);
      
      expect(grouped['object-source']).toHaveLength(1);
    });
  });

  describe('sortPatternsBySeverityAndPosition', () => {
    test('returns empty array for empty input', () => {
      expect(sortPatternsBySeverityAndPosition([])).toEqual([]);
    });

    test('sorts by severity first (highest to lowest)', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW, 'source', 0),
        createMockPattern(SeverityLevel.CRITICAL, 'source', 0),
        createMockPattern(SeverityLevel.MEDIUM, 'source', 0),
        createMockPattern(SeverityLevel.HIGH, 'source', 0)
      ];
      
      const sorted = sortPatternsBySeverityAndPosition(patterns);
      
      expect(sorted[0].severity).toBe(SeverityLevel.CRITICAL);
      expect(sorted[1].severity).toBe(SeverityLevel.HIGH);
      expect(sorted[2].severity).toBe(SeverityLevel.MEDIUM);
      expect(sorted[3].severity).toBe(SeverityLevel.LOW);
    });

    test('sorts by position when severity is equal', () => {
      const patterns = [
        createMockPattern(SeverityLevel.HIGH, 'source', 30),
        createMockPattern(SeverityLevel.HIGH, 'source', 10),
        createMockPattern(SeverityLevel.HIGH, 'source', 20),
        createMockPattern(SeverityLevel.HIGH, 'source', 5)
      ];
      
      const sorted = sortPatternsBySeverityAndPosition(patterns);
      
      expect(sorted[0].startIndex).toBe(5);
      expect(sorted[1].startIndex).toBe(10);
      expect(sorted[2].startIndex).toBe(20);
      expect(sorted[3].startIndex).toBe(30);
    });

    test('applies both severity and position sorting', () => {
      const patterns = [
        createMockPattern(SeverityLevel.MEDIUM, 'source', 15),
        createMockPattern(SeverityLevel.HIGH, 'source', 25),
        createMockPattern(SeverityLevel.MEDIUM, 'source', 5),
        createMockPattern(SeverityLevel.HIGH, 'source', 10)
      ];
      
      const sorted = sortPatternsBySeverityAndPosition(patterns);
      
      // First HIGH patterns (by position: 10, 25)
      expect(sorted[0].severity).toBe(SeverityLevel.HIGH);
      expect(sorted[0].startIndex).toBe(10);
      expect(sorted[1].severity).toBe(SeverityLevel.HIGH);
      expect(sorted[1].startIndex).toBe(25);
      
      // Then MEDIUM patterns (by position: 5, 15)
      expect(sorted[2].severity).toBe(SeverityLevel.MEDIUM);
      expect(sorted[2].startIndex).toBe(5);
      expect(sorted[3].severity).toBe(SeverityLevel.MEDIUM);
      expect(sorted[3].startIndex).toBe(15);
    });

    test('does not mutate original array', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW, 'source', 20),
        createMockPattern(SeverityLevel.HIGH, 'source', 10)
      ];
      const originalOrder = [...patterns];
      
      sortPatternsBySeverityAndPosition(patterns);
      
      expect(patterns).toEqual(originalOrder);
    });
  });

  describe('getPatternSummary', () => {
    test('returns empty summary for empty array', () => {
      const summary = getPatternSummary([]);
      
      expect(summary).toEqual({
        totalCount: 0,
        severityCounts: {
          [SeverityLevel.INFO]: 0,
          [SeverityLevel.LOW]: 0,
          [SeverityLevel.MEDIUM]: 0,
          [SeverityLevel.HIGH]: 0,
          [SeverityLevel.CRITICAL]: 0
        },
        highestSeverity: SeverityLevel.INFO,
        uniqueSources: [],
        sourceCount: 0
      });
    });

    test('calculates summary for single pattern', () => {
      const patterns = [createMockPattern(SeverityLevel.HIGH, 'test-source')];
      const summary = getPatternSummary(patterns);
      
      expect(summary.totalCount).toBe(1);
      expect(summary.severityCounts[SeverityLevel.HIGH]).toBe(1);
      expect(summary.highestSeverity).toBe(SeverityLevel.HIGH);
      expect(summary.uniqueSources).toEqual(['test-source']);
      expect(summary.sourceCount).toBe(1);
    });

    test('calculates comprehensive summary for multiple patterns', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW, 'source-a'),
        createMockPattern(SeverityLevel.LOW, 'source-b'),
        createMockPattern(SeverityLevel.HIGH, 'source-a'),
        createMockPattern(SeverityLevel.CRITICAL, 'source-c'),
        createMockPattern(SeverityLevel.MEDIUM, 'source-b')
      ];
      
      const summary = getPatternSummary(patterns);
      
      expect(summary.totalCount).toBe(5);
      expect(summary.severityCounts[SeverityLevel.LOW]).toBe(2);
      expect(summary.severityCounts[SeverityLevel.MEDIUM]).toBe(1);
      expect(summary.severityCounts[SeverityLevel.HIGH]).toBe(1);
      expect(summary.severityCounts[SeverityLevel.CRITICAL]).toBe(1);
      expect(summary.severityCounts[SeverityLevel.INFO]).toBe(0);
      expect(summary.highestSeverity).toBe(SeverityLevel.CRITICAL);
      expect(summary.uniqueSources).toHaveLength(3);
      expect(summary.sourceCount).toBe(3);
      expect(summary.uniqueSources).toEqual(expect.arrayContaining(['source-a', 'source-b', 'source-c']));
    });

    test('handles duplicate sources correctly', () => {
      const patterns = [
        createMockPattern(SeverityLevel.LOW, 'same-source'),
        createMockPattern(SeverityLevel.HIGH, 'same-source'),
        createMockPattern(SeverityLevel.MEDIUM, 'same-source')
      ];
      
      const summary = getPatternSummary(patterns);
      
      expect(summary.totalCount).toBe(3);
      expect(summary.uniqueSources).toEqual(['same-source']);
      expect(summary.sourceCount).toBe(1);
    });

    test('identifies highest severity correctly', () => {
      const testCases = [
        { patterns: [createMockPattern(SeverityLevel.LOW, 'src')], expected: SeverityLevel.LOW },
        { patterns: [createMockPattern(SeverityLevel.MEDIUM, 'src')], expected: SeverityLevel.MEDIUM },
        { patterns: [createMockPattern(SeverityLevel.HIGH, 'src')], expected: SeverityLevel.HIGH },
        { patterns: [createMockPattern(SeverityLevel.CRITICAL, 'src')], expected: SeverityLevel.CRITICAL }
      ];
      
      testCases.forEach(({ patterns, expected }) => {
        const summary = getPatternSummary(patterns);
        expect(summary.highestSeverity).toBe(expected);
      });
    });
  });
});

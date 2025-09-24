/**
 * Agent Utils Integration Tests
 * 
 * Tests the complete integration of scoring and pattern utilities
 * through the main index exports.
 */

import * as scoringUtils from '../scoring';
import * as patternUtils from '../patterns';
import { makeContext } from '../fixtureBuilders';
import { SeverityLevel } from '@/lib/types/shared';

describe('Agent Utils Integration', () => {
  describe('Scoring Module Exports', () => {
    test('exports all scoring utilities', () => {
      expect(scoringUtils.getHighestSeverity).toBeDefined();
      expect(scoringUtils.countBySeverity).toBeDefined();
      expect(scoringUtils.calculateCumulativeRisk).toBeDefined();
      expect(scoringUtils.normalizeScore).toBeDefined();
      expect(scoringUtils.applySaturation).toBeDefined();
    });

    test('scoring utilities work with real data', () => {
      const context = makeContext();
      expect(context).toBeDefined();
      expect(context.promptText).toBeDefined();
      
      // Test score normalization
      const normalizedScore = scoringUtils.normalizeScore(7, 0, 10);
      expect(normalizedScore).toBe(0.7);
      
      // Test saturation
      const saturatedScore = scoringUtils.applySaturation([0.3, 0.4]);
      expect(saturatedScore).toBeGreaterThan(0.3);
      expect(saturatedScore).toBeGreaterThan(0.4);
    });
  });

  describe('Pattern Module Exports', () => {
    test('exports all pattern utilities', () => {
      expect(patternUtils.createPatternInfo).toBeDefined();
      expect(patternUtils.groupPatternsBySource).toBeDefined();
      expect(patternUtils.validatePattern).toBeDefined();
      expect(patternUtils.sanitizePatterns).toBeDefined();
    });

    test('pattern utilities work with real data', () => {
      // Create test patterns
      const pattern1 = patternUtils.createPatternInfo(
        'test issue',
        'test-source',
        'Found test issue',
        SeverityLevel.MEDIUM,
        0,
        10
      );
      
      const pattern2 = patternUtils.createPatternInfo(
        'another issue',
        'different-source', 
        'Found another issue',
        SeverityLevel.HIGH,
        15,
        28
      );
      
      // Test validation
      expect(patternUtils.validatePattern(pattern1)).toBe(true);
      expect(patternUtils.validatePattern(pattern2)).toBe(true);
      
      // Test grouping
      const grouped = patternUtils.groupPatternsBySource([pattern1, pattern2]);
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['test-source']).toHaveLength(1);
      expect(grouped['different-source']).toHaveLength(1);
      
      // Test sorting
      const sorted = patternUtils.sortPatternsBySeverityAndPosition([pattern1, pattern2]);
      expect(sorted[0].severity).toBe(SeverityLevel.HIGH); // Higher severity first
      expect(sorted[1].severity).toBe(SeverityLevel.MEDIUM);
      
      // Test summary
      const summary = patternUtils.getPatternSummary([pattern1, pattern2]);
      expect(summary.totalCount).toBe(2);
      expect(summary.highestSeverity).toBe(SeverityLevel.HIGH);
      expect(summary.sourceCount).toBe(2);
    });
  });

  describe('Cross-Module Integration', () => {
    test('scoring and pattern utilities work together', () => {
      // Create patterns using pattern utilities
      const patterns = [
        patternUtils.createPatternInfo('low issue', 'source1', 'reason', SeverityLevel.LOW, 0, 9),
        patternUtils.createPatternInfo('high issue', 'source2', 'reason', SeverityLevel.HIGH, 10, 20),
        patternUtils.createPatternInfo('critical issue', 'source3', 'reason', SeverityLevel.CRITICAL, 25, 39)
      ];
      
      // Use scoring utilities to analyze
      const highest = scoringUtils.getHighestSeverity(patterns);
      expect(highest).toBe(SeverityLevel.CRITICAL);
      
      const counts = scoringUtils.countBySeverity(patterns);
      expect(counts[SeverityLevel.LOW]).toBe(1);
      expect(counts[SeverityLevel.HIGH]).toBe(1);
      expect(counts[SeverityLevel.CRITICAL]).toBe(1);
      
      // Use pattern utilities to organize
      const grouped = patternUtils.groupPatternsBySource(patterns);
      expect(Object.keys(grouped)).toHaveLength(3);
      
      const summary = patternUtils.getPatternSummary(patterns);
      expect(summary.totalCount).toBe(3);
      expect(summary.highestSeverity).toBe(SeverityLevel.CRITICAL);
    });

    test('fixture builders integrate with utilities', () => {
      const safetyContext = makeContext({ 
        promptText: 'How to handle sensitive data securely?',
        riskAssessmentLevel: require('@/lib/types/shared').RiskAssessmentLevel.MEDIUM
      });
      
      expect(safetyContext.promptText).toContain('sensitive data');
      expect(safetyContext.riskAssessmentLevel).toBeDefined();
      
      // Pattern creation should work with context data
      const pattern = patternUtils.createPatternInfo(
        'sensitive data',
        'security-analysis',
        'Found security-related content',
        SeverityLevel.MEDIUM,
        safetyContext.promptText.indexOf('sensitive'),
        safetyContext.promptText.indexOf('sensitive') + 'sensitive'.length
      );
      
      expect(patternUtils.validatePattern(pattern)).toBe(true);
      expect(pattern.matchedText).toBe('sensitive data');
    });
  });

  describe('Performance and Edge Cases', () => {
    test('handles large datasets efficiently', () => {
      // Create a large number of patterns
      const patterns = Array.from({ length: 1000 }, (_, i) => 
        patternUtils.createPatternInfo(
          `pattern-${i}`,
          `source-${i % 10}`, // 10 different sources
          `reason-${i}`,
          i % 2 === 0 ? SeverityLevel.LOW : SeverityLevel.HIGH,
          i * 10,
          i * 10 + 9
        )
      );
      
      // Test that utilities handle large datasets
      const start = performance.now();
      
      const highest = scoringUtils.getHighestSeverity(patterns);
      const counts = scoringUtils.countBySeverity(patterns);
      const grouped = patternUtils.groupPatternsBySource(patterns);
      const summary = patternUtils.getPatternSummary(patterns);
      
      const end = performance.now();
      
      // Performance should be reasonable (under 100ms for 1000 patterns)
      expect(end - start).toBeLessThan(100);
      
      // Results should be correct
      expect(highest).toBe(SeverityLevel.HIGH);
      expect(counts[SeverityLevel.LOW]).toBe(500);
      expect(counts[SeverityLevel.HIGH]).toBe(500);
      expect(Object.keys(grouped)).toHaveLength(10);
      expect(summary.totalCount).toBe(1000);
    });

    test('handles edge cases gracefully', () => {
      // Empty arrays
      expect(scoringUtils.getHighestSeverity([])).toBe(SeverityLevel.INFO);
      expect(patternUtils.groupPatternsBySource([])).toEqual({});
      
      // Invalid data
      const invalidPatterns = [
        { invalid: 'pattern' } as any,
        null as any,
        undefined as any
      ];
      
      const sanitized = patternUtils.sanitizePatterns(invalidPatterns);
      expect(sanitized).toHaveLength(0);
      
      // Edge case scores
      expect(scoringUtils.normalizeScore(0, 0, 1)).toBe(0);
      expect(scoringUtils.normalizeScore(1, 0, 1)).toBe(1);
      expect(scoringUtils.applySaturation([])).toBe(0);
      expect(scoringUtils.applySaturation([1])).toBe(1);
    });
  });
});

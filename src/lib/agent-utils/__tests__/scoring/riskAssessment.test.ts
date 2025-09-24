/**
 * Risk Assessment Utilities Tests
 * 
 * Tests for risk level calculations, comparisons, and cumulative risk analysis.
 */

import { 
  calculateCumulativeRisk, 
  compareRiskLevels,
  determineRiskLevel,
  getHighestRiskLevel,
  isRiskLevelAtLeast,
  sortRiskLevelsByPriority
} from '@/lib/agent-utils/scoring/riskAssessment';
import { RiskAssessmentLevel, SeverityLevel } from '@/lib/types/shared';
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

describe('Risk Assessment Utilities', () => {
  describe('calculateCumulativeRisk', () => {
    test('returns 0 for empty pattern arrays', () => {
      expect(calculateCumulativeRisk([])).toBe(0);
    });

    test('calculates risk for single pattern array', () => {
      const patterns = [
        [createMockPattern(SeverityLevel.HIGH)],
      ];
      
      const risk = calculateCumulativeRisk(patterns);
      expect(risk).toBeGreaterThan(0);
    });

    test('calculates cumulative risk across multiple arrays', () => {
      const patterns = [
        [createMockPattern(SeverityLevel.HIGH)],
        [createMockPattern(SeverityLevel.MEDIUM), createMockPattern(SeverityLevel.LOW)],
        [createMockPattern(SeverityLevel.CRITICAL)]
      ];
      
      const risk = calculateCumulativeRisk(patterns);
      expect(risk).toBeGreaterThan(0);
      
      // Higher severity should contribute more to risk
      const singleCritical = calculateCumulativeRisk([[createMockPattern(SeverityLevel.CRITICAL)]]);
      const singleLow = calculateCumulativeRisk([[createMockPattern(SeverityLevel.LOW)]]);
      expect(singleCritical).toBeGreaterThan(singleLow);
    });

    test('handles empty arrays within pattern collection', () => {
      const patterns = [
        [createMockPattern(SeverityLevel.HIGH)],
        [], // empty array
        [createMockPattern(SeverityLevel.MEDIUM)]
      ];
      
      expect(() => calculateCumulativeRisk(patterns)).not.toThrow();
      expect(calculateCumulativeRisk(patterns)).toBeGreaterThan(0);
    });
  });

  describe('compareRiskLevels', () => {
    test('returns 0 for equal risk levels', () => {
      expect(compareRiskLevels(RiskAssessmentLevel.MEDIUM, RiskAssessmentLevel.MEDIUM)).toBe(0);
    });

    test('returns -1 when first level is lower', () => {
      expect(compareRiskLevels(RiskAssessmentLevel.LOW, RiskAssessmentLevel.HIGH)).toBe(-1);
    });

    test('returns 1 when first level is higher', () => {
      expect(compareRiskLevels(RiskAssessmentLevel.CRITICAL, RiskAssessmentLevel.MEDIUM)).toBe(1);
    });

    test('correctly orders all risk levels', () => {
      expect(compareRiskLevels(RiskAssessmentLevel.LOW, RiskAssessmentLevel.MEDIUM)).toBe(-1);
      expect(compareRiskLevels(RiskAssessmentLevel.MEDIUM, RiskAssessmentLevel.HIGH)).toBe(-1);
      expect(compareRiskLevels(RiskAssessmentLevel.HIGH, RiskAssessmentLevel.CRITICAL)).toBe(-1);
    });
  });

  describe('determineRiskLevel', () => {
    test('returns CRITICAL when critical patterns exist', () => {
      const criticalPatterns = [createMockPattern(SeverityLevel.CRITICAL)];
      expect(determineRiskLevel(5, criticalPatterns)).toBe(RiskAssessmentLevel.CRITICAL);
    });

    test('returns risk level based on cumulative score thresholds', () => {
      expect(determineRiskLevel(0)).toBe(RiskAssessmentLevel.LOW);
      expect(determineRiskLevel(5)).toBe(RiskAssessmentLevel.LOW);
      expect(determineRiskLevel(10)).toBe(RiskAssessmentLevel.MEDIUM);
      expect(determineRiskLevel(20)).toBe(RiskAssessmentLevel.HIGH);
    });

    test('critical patterns override score-based assessment', () => {
      const criticalPatterns = [createMockPattern(SeverityLevel.CRITICAL)];
      expect(determineRiskLevel(1, criticalPatterns)).toBe(RiskAssessmentLevel.CRITICAL);
    });
  });

  describe('getHighestRiskLevel', () => {
    test('returns LOW for empty array', () => {
      expect(getHighestRiskLevel([])).toBe(RiskAssessmentLevel.LOW);
    });

    test('returns single risk level for one item', () => {
      expect(getHighestRiskLevel([RiskAssessmentLevel.HIGH])).toBe(RiskAssessmentLevel.HIGH);
    });

    test('returns highest risk level from multiple levels', () => {
      const levels = [
        RiskAssessmentLevel.LOW,
        RiskAssessmentLevel.CRITICAL,
        RiskAssessmentLevel.MEDIUM,
        RiskAssessmentLevel.HIGH
      ];
      expect(getHighestRiskLevel(levels)).toBe(RiskAssessmentLevel.CRITICAL);
    });
  });

  describe('isRiskLevelAtLeast', () => {
    test('returns true when level meets threshold', () => {
      expect(isRiskLevelAtLeast(RiskAssessmentLevel.HIGH, RiskAssessmentLevel.MEDIUM)).toBe(true);
      expect(isRiskLevelAtLeast(RiskAssessmentLevel.CRITICAL, RiskAssessmentLevel.HIGH)).toBe(true);
    });

    test('returns true when level equals threshold', () => {
      expect(isRiskLevelAtLeast(RiskAssessmentLevel.MEDIUM, RiskAssessmentLevel.MEDIUM)).toBe(true);
    });

    test('returns false when level is below threshold', () => {
      expect(isRiskLevelAtLeast(RiskAssessmentLevel.LOW, RiskAssessmentLevel.MEDIUM)).toBe(false);
      expect(isRiskLevelAtLeast(RiskAssessmentLevel.MEDIUM, RiskAssessmentLevel.HIGH)).toBe(false);
    });
  });

  describe('sortRiskLevelsByPriority', () => {
    test('sorts risk levels from highest to lowest', () => {
      const levels = [
        RiskAssessmentLevel.LOW,
        RiskAssessmentLevel.CRITICAL,
        RiskAssessmentLevel.MEDIUM,
        RiskAssessmentLevel.HIGH
      ];
      
      const sorted = sortRiskLevelsByPriority(levels);
      
      expect(sorted).toEqual([
        RiskAssessmentLevel.CRITICAL,
        RiskAssessmentLevel.HIGH,
        RiskAssessmentLevel.MEDIUM,
        RiskAssessmentLevel.LOW
      ]);
    });

    test('handles duplicate risk levels', () => {
      const levels = [
        RiskAssessmentLevel.HIGH,
        RiskAssessmentLevel.LOW,
        RiskAssessmentLevel.HIGH
      ];
      
      const sorted = sortRiskLevelsByPriority(levels);
      
      expect(sorted[0]).toBe(RiskAssessmentLevel.HIGH);
      expect(sorted[1]).toBe(RiskAssessmentLevel.HIGH);
      expect(sorted[2]).toBe(RiskAssessmentLevel.LOW);
    });

    test('does not mutate original array', () => {
      const levels = [RiskAssessmentLevel.LOW, RiskAssessmentLevel.HIGH];
      const originalOrder = [...levels];
      
      sortRiskLevelsByPriority(levels);
      
      expect(levels).toEqual(originalOrder);
    });
  });
});

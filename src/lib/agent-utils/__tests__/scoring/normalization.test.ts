/**
 * Score Normalization Utilities Tests
 * 
 * Tests for score normalization, saturation, and threshold classification functions.
 */

import { 
  normalizeScore, 
  applySaturation,
  classifyByThreshold,
  calculateConfidenceInterval
} from '@/lib/agent-utils/scoring/normalization';
import { RiskAssessmentLevel } from '@/lib/types/shared';

describe('Score Normalization Utilities', () => {
  describe('normalizeScore', () => {
    test('normalizes score correctly within range', () => {
      expect(normalizeScore(5, 0, 10)).toBe(0.5);
      expect(normalizeScore(0, 0, 10)).toBe(0);
      expect(normalizeScore(10, 0, 10)).toBe(1);
    });

    test('clamps scores outside the range', () => {
      expect(normalizeScore(-5, 0, 10)).toBe(0);
      expect(normalizeScore(15, 0, 10)).toBe(1);
    });

    test('handles edge cases', () => {
      expect(normalizeScore(2.5, 0, 5)).toBe(0.5);
      // Test edge case where min === max should throw error
      expect(() => normalizeScore(1, 1, 1)).toThrow('minValue must be less than maxValue');
    });

    test('throws error when minValue >= maxValue', () => {
      expect(() => normalizeScore(5, 10, 5)).toThrow('minValue must be less than maxValue');
      expect(() => normalizeScore(5, 5, 5)).toThrow('minValue must be less than maxValue');
    });
  });

  describe('applySaturation', () => {
    test('returns 0 for empty array', () => {
      expect(applySaturation([])).toBe(0);
    });

    test('returns single score unchanged', () => {
      expect(applySaturation([0.5])).toBe(0.5);
      expect(applySaturation([0.8])).toBe(0.8);
    });

    test('applies saturation formula correctly', () => {
      // For scores [0.3, 0.4], result should be 1 - (1-0.3)*(1-0.4) = 1 - 0.7*0.6 = 1 - 0.42 = 0.58
      const result = applySaturation([0.3, 0.4]);
      expect(result).toBeCloseTo(0.58, 2);
    });

    test('produces higher combined score than individual scores', () => {
      const scores = [0.3, 0.4, 0.2];
      const combined = applySaturation(scores);
      
      scores.forEach(score => {
        expect(combined).toBeGreaterThan(score);
      });
    });

    test('filters out invalid scores and logs warning', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = applySaturation([0.5, -0.1, 1.2, 0.8]);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeCloseTo(applySaturation([0.5, 0.8]), 2);
      
      consoleSpy.mockRestore();
    });

    test('returns 0 when all scores are invalid', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = applySaturation([-0.5, 1.5, 2.0]);
      
      expect(result).toBe(0);
      
      consoleSpy.mockRestore();
    });
  });

  describe('classifyByThreshold', () => {
    // Note: This test depends on RISK_LEVEL_THRESHOLDS being imported/defined
    // For now, I'll test the logic with assumed thresholds
    
    test('classifies low scores correctly', () => {
      expect(classifyByThreshold(0.1)).toBe(RiskAssessmentLevel.LOW);
      expect(classifyByThreshold(0.2)).toBe(RiskAssessmentLevel.LOW);
    });

    test('classifies medium scores correctly', () => {
      expect(classifyByThreshold(0.4)).toBe(RiskAssessmentLevel.MEDIUM);
      expect(classifyByThreshold(0.5)).toBe(RiskAssessmentLevel.MEDIUM);
    });

    test('classifies high scores correctly', () => {
      expect(classifyByThreshold(0.7)).toBe(RiskAssessmentLevel.HIGH);
      expect(classifyByThreshold(0.8)).toBe(RiskAssessmentLevel.HIGH);
    });

    test('classifies critical scores correctly', () => {
      expect(classifyByThreshold(0.9)).toBe(RiskAssessmentLevel.CRITICAL);
      expect(classifyByThreshold(1.0)).toBe(RiskAssessmentLevel.CRITICAL);
    });

    test('warns for scores outside valid range', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      classifyByThreshold(-0.1);
      classifyByThreshold(1.5);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });
  });

  describe('calculateConfidenceInterval', () => {
    test('calculates confidence interval correctly', () => {
      const interval = calculateConfidenceInterval(0.5, 0.95, 0.1);
      
      expect(interval.confidence).toBe(0.95);
      expect(interval.lower).toBeCloseTo(0.304, 2); // 0.5 - 1.96*0.1
      expect(interval.upper).toBeCloseTo(0.696, 2); // 0.5 + 1.96*0.1
    });

    test('clamps bounds to [0, 1] range', () => {
      const lowInterval = calculateConfidenceInterval(0.05, 0.95, 0.1);
      expect(lowInterval.lower).toBe(0);
      
      const highInterval = calculateConfidenceInterval(0.95, 0.95, 0.1);
      expect(highInterval.upper).toBe(1);
    });

    test('handles different confidence levels', () => {
      const interval90 = calculateConfidenceInterval(0.5, 0.90, 0.1);
      const interval95 = calculateConfidenceInterval(0.5, 0.95, 0.1);
      const interval99 = calculateConfidenceInterval(0.5, 0.99, 0.1);
      
      // Higher confidence should have wider intervals
      expect(interval95.upper - interval95.lower).toBeGreaterThan(interval90.upper - interval90.lower);
      expect(interval99.upper - interval99.lower).toBeGreaterThan(interval95.upper - interval95.lower);
    });

    test('uses default values when not specified', () => {
      const interval = calculateConfidenceInterval(0.5);
      expect(interval.confidence).toBe(0.95);
      expect(interval.lower).toBeCloseTo(0.304, 2);
      expect(interval.upper).toBeCloseTo(0.696, 2);
    });

    test('throws error for invalid confidence level', () => {
      expect(() => calculateConfidenceInterval(0.5, 0)).toThrow('Confidence level must be between 0 and 1');
      expect(() => calculateConfidenceInterval(0.5, 1)).toThrow('Confidence level must be between 0 and 1');
      expect(() => calculateConfidenceInterval(0.5, -0.1)).toThrow('Confidence level must be between 0 and 1');
      expect(() => calculateConfidenceInterval(0.5, 1.1)).toThrow('Confidence level must be between 0 and 1');
    });
  });
});

/**
 * Pattern Validation Utilities Tests
 * 
 * Tests for pattern validation and sanitization functions.
 */

import { 
  validatePattern, 
  sanitizePatterns
} from '@/lib/agent-utils/patterns/validation';
import { SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';

// Test fixtures
const createValidPattern = (
  severity: SeverityLevel = SeverityLevel.LOW,
  overrides: Partial<DetectedPatternInfo> = {}
): DetectedPatternInfo => ({
  matchedText: 'test text',
  matchedPatternSource: 'test-source',
  reason: 'test reason',
  severity,
  startIndex: 0,
  endIndex: 9,
  ...overrides
});

const createInvalidPattern = (invalidField: string): any => {
  const base = createValidPattern();
  switch (invalidField) {
    case 'emptyText':
      return { ...base, matchedText: '' };
    case 'missingText':
      return { ...base, matchedText: undefined };
    case 'emptyReason':
      return { ...base, reason: '' };
    case 'missingReason':
      return { ...base, reason: undefined };
    case 'negativeStart':
      return { ...base, startIndex: -1 };
    case 'invalidEnd':
      return { ...base, endIndex: -1 };
    case 'endBeforeStart':
      return { ...base, startIndex: 10, endIndex: 5 };
    case 'invalidSeverity':
      return { ...base, severity: 'INVALID' as any };
    default:
      return base;
  }
};

describe('Pattern Validation Utilities', () => {
  describe('validatePattern', () => {
    test('returns true for valid patterns', () => {
      const validPatterns = [
        createValidPattern(SeverityLevel.LOW),
        createValidPattern(SeverityLevel.HIGH, { matchedText: 'longer text here', endIndex: 17 }),
        createValidPattern(SeverityLevel.CRITICAL, { startIndex: 5, endIndex: 15 })
      ];
      
      validPatterns.forEach(pattern => {
        expect(validatePattern(pattern)).toBe(true);
      });
    });

    test('returns false for patterns with empty matched text', () => {
      const pattern = createInvalidPattern('emptyText');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns with missing matched text', () => {
      const pattern = createInvalidPattern('missingText');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns with empty reason', () => {
      const pattern = createInvalidPattern('emptyReason');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns with missing reason', () => {
      const pattern = createInvalidPattern('missingReason');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns with negative start index', () => {
      const pattern = createInvalidPattern('negativeStart');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns with invalid end index', () => {
      const pattern = createInvalidPattern('invalidEnd');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns where end index is before start index', () => {
      const pattern = createInvalidPattern('endBeforeStart');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('returns false for patterns with invalid severity', () => {
      const pattern = createInvalidPattern('invalidSeverity');
      expect(validatePattern(pattern)).toBe(false);
    });

    test('allows equal start and end indices', () => {
      const pattern = createValidPattern(SeverityLevel.LOW, { startIndex: 5, endIndex: 5 });
      expect(validatePattern(pattern)).toBe(true);
    });

    test('validates all severity levels', () => {
      const severities = [
        SeverityLevel.INFO,
        SeverityLevel.LOW,
        SeverityLevel.MEDIUM,
        SeverityLevel.HIGH,
        SeverityLevel.CRITICAL
      ];
      
      severities.forEach(severity => {
        const pattern = createValidPattern(severity);
        expect(validatePattern(pattern)).toBe(true);
      });
    });
  });

  describe('sanitizePatterns', () => {
    test('returns empty array for empty input', () => {
      expect(sanitizePatterns([])).toEqual([]);
    });

    test('keeps all valid patterns', () => {
      const patterns = [
        createValidPattern(SeverityLevel.LOW),
        createValidPattern(SeverityLevel.HIGH),
        createValidPattern(SeverityLevel.CRITICAL)
      ];
      
      const sanitized = sanitizePatterns(patterns);
      expect(sanitized).toEqual(patterns);
    });

    test('filters out invalid patterns', () => {
      const patterns = [
        createValidPattern(SeverityLevel.LOW),
        createInvalidPattern('emptyText'),
        createValidPattern(SeverityLevel.HIGH),
        createInvalidPattern('negativeStart'),
        createValidPattern(SeverityLevel.CRITICAL)
      ];
      
      const sanitized = sanitizePatterns(patterns);
      expect(sanitized).toHaveLength(3);
      expect(sanitized.every(p => validatePattern(p))).toBe(true);
    });

    test('logs warnings for invalid patterns', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const patterns = [
        createValidPattern(SeverityLevel.LOW),
        createInvalidPattern('emptyText'),
        createInvalidPattern('negativeStart')
      ];
      
      sanitizePatterns(patterns);
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });

    test('handles all valid patterns without warnings', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const patterns = [
        createValidPattern(SeverityLevel.LOW),
        createValidPattern(SeverityLevel.HIGH)
      ];
      
      sanitizePatterns(patterns);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

/**
 * Pattern Creation Utilities Tests
 * 
 * Tests for creating DetectedPatternInfo objects with various configurations.
 */

import { 
  createPatternInfo, 
  createLowSeverityPattern,
  createMediumSeverityPattern,
  createHighSeverityPattern
} from '@/lib/agent-utils/patterns/creation';
import { SeverityLevel } from '@/lib/types/shared';

describe('Pattern Creation Utilities', () => {
  describe('createPatternInfo', () => {
    test('creates basic pattern info correctly', () => {
      const pattern = createPatternInfo(
        'test text',
        'test-source',
        'test reason',
        SeverityLevel.MEDIUM,
        10,
        19
      );
      
      expect(pattern).toEqual({
        matchedText: 'test text',
        matchedPatternSource: 'test-source',
        reason: 'test reason',
        severity: SeverityLevel.MEDIUM,
        startIndex: 10,
        endIndex: 19
      });
    });

    test('handles all severity levels', () => {
      const severities = [
        SeverityLevel.INFO,
        SeverityLevel.LOW,
        SeverityLevel.MEDIUM,
        SeverityLevel.HIGH,
        SeverityLevel.CRITICAL
      ];
      
      severities.forEach(severity => {
        const pattern = createPatternInfo('text', 'source', 'reason', severity, 0, 4);
        expect(pattern.severity).toBe(severity);
      });
    });

    test('preserves text indices correctly', () => {
      const pattern = createPatternInfo('hello', 'source', 'reason', SeverityLevel.LOW, 5, 10);
      
      expect(pattern.startIndex).toBe(5);
      expect(pattern.endIndex).toBe(10);
      expect(pattern.endIndex - pattern.startIndex).toBe(5);
    });

    test('handles empty text', () => {
      const pattern = createPatternInfo('', 'source', 'reason', SeverityLevel.INFO, 0, 0);
      
      expect(pattern.matchedText).toBe('');
      expect(pattern.startIndex).toBe(0);
      expect(pattern.endIndex).toBe(0);
    });

    test('handles long text and reasons', () => {
      const longText = 'a'.repeat(1000);
      const longReason = 'b'.repeat(500);
      
      const pattern = createPatternInfo(longText, 'source', longReason, SeverityLevel.HIGH, 0, 1000);
      
      expect(pattern.matchedText).toBe(longText);
      expect(pattern.reason).toBe(longReason);
    });
  });

  describe('createLowSeverityPattern', () => {
    test('creates low severity pattern with correct properties', () => {
      const pattern = createLowSeverityPattern(
        'minor issue',
        'lint-rule',
        'Style inconsistency detected',
        5,
        16
      );
      
      expect(pattern.severity).toBe(SeverityLevel.LOW);
      expect(pattern.matchedText).toBe('minor issue');
      expect(pattern.matchedPatternSource).toBe('lint-rule');
      expect(pattern.reason).toBe('Style inconsistency detected');
      expect(pattern.startIndex).toBe(5);
      expect(pattern.endIndex).toBe(16);
    });

    test('is equivalent to createPatternInfo with LOW severity', () => {
      const pattern1 = createLowSeverityPattern('text', 'source', 'reason', 10, 14);
      const pattern2 = createPatternInfo('text', 'source', 'reason', SeverityLevel.LOW, 10, 14);
      
      expect(pattern1).toEqual(pattern2);
    });
  });

  describe('createMediumSeverityPattern', () => {
    test('creates medium severity pattern with correct properties', () => {
      const pattern = createMediumSeverityPattern(
        'potential problem',
        'security-check',
        'Possible vulnerability found',
        20,
        37
      );
      
      expect(pattern.severity).toBe(SeverityLevel.MEDIUM);
      expect(pattern.matchedText).toBe('potential problem');
      expect(pattern.matchedPatternSource).toBe('security-check');
      expect(pattern.reason).toBe('Possible vulnerability found');
      expect(pattern.startIndex).toBe(20);
      expect(pattern.endIndex).toBe(37);
    });

    test('is equivalent to createPatternInfo with MEDIUM severity', () => {
      const pattern1 = createMediumSeverityPattern('text', 'source', 'reason', 10, 14);
      const pattern2 = createPatternInfo('text', 'source', 'reason', SeverityLevel.MEDIUM, 10, 14);
      
      expect(pattern1).toEqual(pattern2);
    });
  });

  describe('createHighSeverityPattern', () => {
    test('creates high severity pattern with correct properties', () => {
      const pattern = createHighSeverityPattern(
        'critical error',
        'compiler',
        'Syntax error prevents compilation',
        50,
        64
      );
      
      expect(pattern.severity).toBe(SeverityLevel.HIGH);
      expect(pattern.matchedText).toBe('critical error');
      expect(pattern.matchedPatternSource).toBe('compiler');
      expect(pattern.reason).toBe('Syntax error prevents compilation');
      expect(pattern.startIndex).toBe(50);
      expect(pattern.endIndex).toBe(64);
    });

    test('is equivalent to createPatternInfo with HIGH severity', () => {
      const pattern1 = createHighSeverityPattern('text', 'source', 'reason', 10, 14);
      const pattern2 = createPatternInfo('text', 'source', 'reason', SeverityLevel.HIGH, 10, 14);
      
      expect(pattern1).toEqual(pattern2);
    });
  });

  describe('pattern creation consistency', () => {
    test('all creation methods produce valid DetectedPatternInfo objects', () => {
      const creators = [
        () => createPatternInfo('text', 'source', 'reason', SeverityLevel.INFO, 0, 4),
        () => createLowSeverityPattern('text', 'source', 'reason', 0, 4),
        () => createMediumSeverityPattern('text', 'source', 'reason', 0, 4),
        () => createHighSeverityPattern('text', 'source', 'reason', 0, 4)
      ];
      
      creators.forEach(creator => {
        const pattern = creator();
        
        // Verify required fields exist
        expect(pattern.matchedText).toBeDefined();
        expect(pattern.matchedPatternSource).toBeDefined();
        expect(pattern.reason).toBeDefined();
        expect(pattern.severity).toBeDefined();
        expect(pattern.startIndex).toBeDefined();
        expect(pattern.endIndex).toBeDefined();
        
        // Verify types
        expect(typeof pattern.matchedText).toBe('string');
        expect(typeof pattern.matchedPatternSource).toBe('string');
        expect(typeof pattern.reason).toBe('string');
        expect(typeof pattern.startIndex).toBe('number');
        expect(typeof pattern.endIndex).toBe('number');
        expect(Object.values(SeverityLevel)).toContain(pattern.severity);
      });
    });

    test('patterns maintain text length consistency', () => {
      const text = 'example text';
      const startIndex = 10;
      const endIndex = startIndex + text.length;
      
      const patterns = [
        createPatternInfo(text, 'source', 'reason', SeverityLevel.INFO, startIndex, endIndex),
        createLowSeverityPattern(text, 'source', 'reason', startIndex, endIndex),
        createMediumSeverityPattern(text, 'source', 'reason', startIndex, endIndex),
        createHighSeverityPattern(text, 'source', 'reason', startIndex, endIndex)
      ];
      
      patterns.forEach(pattern => {
        expect(pattern.endIndex - pattern.startIndex).toBe(text.length);
      });
    });
  });
});

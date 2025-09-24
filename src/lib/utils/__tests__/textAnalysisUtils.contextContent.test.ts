import {
  processPatternList,
} from '@/lib/utils/textAnalysisUtils';

import { CONTEXT_INDICATOR_PATTERNS } from '@/lib/config/keywords';

/**
 * Unit tests for Step 1.5: Context & Content Richness metrics
 * Tests the detection of various context indicators in the prompt text:
 * - Explicit section markers (background:, context:, etc.)
 * - Context introduction phrases
 * - Current state indicators
 * - Temporal context
 * - System/Environment context
 * - Requirements context
 * - User/Audience context
 * - Project/Domain context
 * - Data/Input context
 */

describe('textAnalysisUtils - Context & Content Richness (Step 1.5)', () => {
  describe('1-Explicit Section Markers', () => {
    it('1.1 detects explicit section markers', () => {
      const text = 'Background: This is the background information.\nContext: Here is additional context.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('background:'))).toBe(true);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('context:'))).toBe(true);
    });

    it('1.2 handles case variations in section markers', () => {
      const text = 'BACKGROUND: Upper case.\ncontext: Lower case.\nScenario: Title case.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.length).toBe(3);
    });
  });

  describe('2-Context Introduction Phrases', () => {
    it('2.1 detects context introduction phrases', () => {
      const text = 'For context, this is important. To provide context, here are the details.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('for context'))).toBe(true);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('to provide context'))).toBe(true);
    });

    it('2.2 detects contextual premise indicators', () => {
      const text = 'Given that X is true, assuming that Y applies, considering that Z matters.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('3-Current State & Temporal Context', () => {
    it('3.1 detects current state indicators', () => {
      const text = 'Currently, the system is running. The current situation is critical.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('currently'))).toBe(true);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('current situation'))).toBe(true);
    });

    it('3.2 detects temporal context indicators', () => {
      const text = 'Previously, we used X. Until now, Y was the standard. After the update, Z will be implemented.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('4-System & Requirements Context', () => {
    it('4.1 detects system/environment context', () => {
      const text = 'The system uses Python 3.8. The platform is deployed in AWS.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => 
        m.matchedText?.toLowerCase().includes('system uses') ||
        m.matchedText?.toLowerCase().includes('deployed in')
      )).toBe(true);
    });

    it('4.2 detects requirements and constraints', () => {
      const text = 'Requirements include: high availability. The system must comply with GDPR.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => 
        m.matchedText?.toLowerCase().includes('requirements include') ||
        m.matchedText?.toLowerCase().includes('must comply')
      )).toBe(true);
    });
  });

  describe('5-User & Project Context', () => {
    it('5.1 detects user/audience context', () => {
      const text = 'The target audience is developers. The users include both beginners and experts.';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('target audience'))).toBe(true);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('users include'))).toBe(true);
    });

    it('5.2 detects project/domain context', () => {
      const text = 'The project involves machine learning. In the context of healthcare,...';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('project involves'))).toBe(true);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('in the context of'))).toBe(true);
    });
  });

  describe('6-Data & Input Context', () => {
    it('6.1 detects data/input context indicators', () => {
      const text = 'The input provided is: JSON data. Based on the following information:...';
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('input provided'))).toBe(true);
      expect(matches.some(m => m.matchedText?.toLowerCase().includes('based on the following'))).toBe(true);
    });

    it('6.2 handles complex data context scenarios', () => {
      const text = [
        'The data provided includes:',
        '1. User metrics',
        '2. System logs',
        'Based on this data, analyze the performance.'
      ].join('\\n');
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7-Edge Cases & Special Scenarios', () => {
    it('7.1 handles empty or invalid input', () => {
      expect(processPatternList('', CONTEXT_INDICATOR_PATTERNS)).toEqual([]);
      expect(processPatternList('   ', CONTEXT_INDICATOR_PATTERNS)).toEqual([]);
    });

    it('7.2 handles multiple context indicators in the same text', () => {
      const text = [
        'Background: Project setup',
        'Currently running version 2.0',
        'For context, this is a legacy system',
        'The requirements include:'
      ].join('\n');
      console.log('Processing text:', text);
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      console.log({matches});
      expect(matches.length).toBeGreaterThanOrEqual(4);
    });

    it('7.3 ensures no false positives from similar but invalid patterns', () => {
      const text = 'Backgrounding processes. Contextual menu.'; // Should not match "Background:" or "Context:"
      const matches = processPatternList(text, CONTEXT_INDICATOR_PATTERNS);
      expect(matches.length).toBe(0);
    });
  });
});

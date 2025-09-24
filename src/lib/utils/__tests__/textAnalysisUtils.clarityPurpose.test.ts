import { processPatternList, countDistinctActionVerbs, analyzeQuestions } from '@/lib/utils/textAnalysisUtils';
import { PatternWithMetadata } from '@/lib/types/patterns';

import {
    VAGUE_TERMS_PATTERNS,
    JARGON_PATTERNS,
    NEGATIVE_INSTRUCTION_PATTERNS,
    ACTION_VERB_KEYWORDS,
    TARGET_AUDIENCE_PHRASES_PATTERNS
  } from '@/lib/config/keywords';
  
/**
 * Unit tests for textAnalysisUtils
 * Verifies:
 * - processPatternList
 * - countDistinctActionVerbs
 * - analyzeQuestions
 */

describe('textAnalysisUtils - Clarity & Purpose (Step 1.2)', () => {
  
  describe('1-processPatternList', () => {
      it('1.1 detects vague terms', () => {
        const text = 'This is somewhat unclear and maybe not specific.';
        const matches = processPatternList(text, VAGUE_TERMS_PATTERNS);
        expect(matches.length).toBe(2);
        expect(matches.some(m => m.matchedText?.toLowerCase() === 'somewhat')).toBe(true);
        expect(matches.some(m => m.matchedText?.toLowerCase() === 'maybe')).toBe(true);
      });

      it('1.2 detects jargon', () => {
        const text = 'We need more synergy in our workflow.';
        const matches = processPatternList(text, JARGON_PATTERNS);
        expect(matches.length).toBe(1);
        expect(matches[0].matchedText?.toLowerCase()).toBe('synergy');
      });

      it('1.3 detects target audience phrases', () => {
        const text = 'This guide is for students and for teachers.';
        const matches = processPatternList(text, TARGET_AUDIENCE_PHRASES_PATTERNS);
        expect(matches.length).toBe(2);
        expect(matches.some(m => m.matchedText?.toLowerCase().includes('for students'))).toBe(true);
        expect(matches.some(m => m.matchedText?.toLowerCase().includes('for teachers'))).toBe(true);
      });

      it('1.4 detects negative instructions', () => {
        const text = "Do not include personal info. Don't forget to avoid jargon.";
        const matches = processPatternList(text, NEGATIVE_INSTRUCTION_PATTERNS);
        expect(matches.length).toBe(3);
        expect(matches.some(m => m.matchedText?.toLowerCase() === 'do not include')).toBe(true);
        expect(matches.some(m => m.matchedText?.toLowerCase() === "don't")).toBe(true);
        expect(matches.some(m => m.matchedText?.toLowerCase() === 'avoid jargon')).toBe(true);
      });
  });

  describe('2-countDistinctActionVerbs', () => {

    it('2.1 counts action verbs in a prompt', () => {
      const text = 'Summarize and explain the main points.';
      const result = countDistinctActionVerbs(text.toLowerCase(), ACTION_VERB_KEYWORDS);
      expect(result.count).toBe(2);
      expect(result.verbs).toEqual(expect.arrayContaining(['summarize', 'explain']));
    });

    it('2.2 handles no action verbs', () => {
      const text = 'This is a statement.';
      const result = countDistinctActionVerbs(text.toLowerCase(), ACTION_VERB_KEYWORDS);
      expect(result.count).toBe(0);
      expect(result.verbs).toEqual([]);
    });

    it('2.3 detects different verb forms', () => {
      const text = 'List the items. Described above.';
      const result = countDistinctActionVerbs(text.toLowerCase(), ACTION_VERB_KEYWORDS);
      expect(result.count).toBe(2);
      expect(result.verbs).toEqual(expect.arrayContaining(['list', 'describe']));
    });
  });

  describe('3-analyzeQuestions', () => {
    it('3.1 counts and classifies wh-questions', () => {
      const text = 'What is your name? Where do you live?';
      const result = analyzeQuestions(text);
      expect(result.count).toBe(2);
      expect(result.types).toEqual(expect.arrayContaining(['wh-question', 'wh-question']));
    });

    it('3.2 counts and classifies yes/no questions', () => {
      const text = 'Is this correct? Are you ready?';
      const result = analyzeQuestions(text);
      expect(result.count).toBe(2);
      expect(result.types).toEqual(expect.arrayContaining(['yes/no-question', 'yes/no-question']));
    });

    it('3.3 handles mixed and unclassified questions', () => {
      const text = 'Explain this? Why?';
      const result = analyzeQuestions(text);
      expect(result.count).toBe(2);
      expect(result.types).toContain('other-question');
      expect(result.types).toContain('wh-question');
    });

    it('3.4 returns 0 for no questions', () => {
      const text = 'This is not a question.';
      const result = analyzeQuestions(text);
      expect(result.count).toBe(0);
      expect(result.types).toEqual([]);
    });
  });
  
});

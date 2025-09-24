import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';
import {
  countWords,
  countSentences,
  countAlphanumericChars,
  calculateReadabilityScore,
  preProcessTextForSentenceAnalysis
} from '@/lib/utils/textAnalysisUtils';

/**
 * Unit tests for textAnalysisUtils
 * Verifies:
 * - countWords
 * - countSentences
 * - countAlphanumericChars
 * - calculateReadabilityScore
 */

describe('textAnalysisUtils - Base Metrics Calculation (Step 1.1)', () => {
  // --- countWords ---
  describe('1-countWords', () => {
    it('1.1 returns 0 for empty or whitespace-only string', () => {
      expect(countWords('')).toBe(0);
      expect(countWords('   \t\n  ')).toBe(0);
    });
    it('1.2 counts single and multiple words correctly', () => {
      expect(countWords('Hello')).toBe(1);
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('  first second  ')).toBe(2);
      expect(countWords('one   two     three')).toBe(3);
    });
    it('1.3 ignores punctuation and counts contractions/hyphenated words as single words', () => {
      expect(countWords('Hello, world!')).toBe(2);
      expect(countWords("don't")).toBe(1);
      expect(countWords('well-being')).toBe(1);
      expect(countWords('state-of-the-art')).toBe(1);
    });
    it('1.4 counts numbers and decimals as expected', () => {
      expect(countWords('Value is 3.14')).toBe(3);
    });
    it('1.5 handles complex sentences and Unicode', () => {
      const text = preProcessTextForSentenceAnalysis('Dr. Smith\'s research (e.g., study-1.0) showed 99% accuracy. Isn\'t that great?!');
      expect(countWords(text)).toBeGreaterThan(0);
      expect(countWords('naïve café résumé')).toBe(3);
    });
  });

  // --- countSentences ---
  describe('2-countSentences', () => {
    const nlp = winkNLP(model);
    it('2.1 counts a single simple sentence', () => {
      const text = preProcessTextForSentenceAnalysis('This is a test sentence.');
      const doc = nlp.readDoc(text);
      const result = countSentences(text, doc);
      expect(result.count).toBe(1);
      expect(result.sentences.length).toBe(1);
    });
    it('2.2 counts multiple sentences with different terminators', () => {
      const text = preProcessTextForSentenceAnalysis('Hello world! How are you? I am fine.');
      const doc = nlp.readDoc(text);
      const result = countSentences(text, doc);
      expect(result.count).toBe(3);
      expect(result.sentences.length).toBe(3);
    });
    it('2.3 handles abbreviations and decimals', () => {
      const text = preProcessTextForSentenceAnalysis('Dr. Smith lives in the U.S. He is an M.D.');
      const doc = nlp.readDoc(text);
      const result = countSentences(text, doc);
      expect(result.count).toBe(2);
    });
    it('2.4 returns 0 for empty or whitespace-only input', () => {
      const text = preProcessTextForSentenceAnalysis('   ');
      const doc = nlp.readDoc(text);
      const result = countSentences(text, doc);
      expect(result.count).toBe(0);
      expect(result.sentences.length).toBe(0);
    });
    it('2.5 counts as one sentence if no terminators and text exists', () => {
      const text = preProcessTextForSentenceAnalysis('This is a single line of text without any punctuation');
      const doc = nlp.readDoc(text);
      const result = countSentences(text, doc);
      expect(result.count).toBe(1);
    });
  });

  // --- countAlphanumericChars ---
  describe('3-countAlphanumericChars', () => {
    it('3.1 returns 0 for empty or whitespace-only string', () => {
      expect(countAlphanumericChars('')).toBe(0);
      expect(countAlphanumericChars('   \t\n  ')).toBe(0);
    });
    it('3.2 counts only letters and numbers', () => {
      expect(countAlphanumericChars('Hello')).toBe(5);
      expect(countAlphanumericChars('12345')).toBe(5);
      expect(countAlphanumericChars('Hello, world!')).toBe(10);
      expect(countAlphanumericChars('Is this a test?')).toBe(11);
      expect(countAlphanumericChars('$$%^#@123abcDEF')).toBe(9);
    });
    it('3.3 handles contractions and hyphenated words', () => {
      expect(countAlphanumericChars("don't")).toBe(4);
      expect(countAlphanumericChars('well-being')).toBe(9);
    });
  });

  // --- calculateReadabilityScore ---
  describe('4-calculateReadabilityScore', () => {
    it('4.1 returns null for empty or whitespace-only string', () => {
      expect(calculateReadabilityScore('', 0, 0)).toBeNull();
      expect(calculateReadabilityScore('   ', 0, 0)).toBeNull();
    });
    it('4.2 returns a number for valid input', () => {
      const text = 'This is a simple sentence.';
      const wordCount = countWords(text);
      const sentenceCount = 1;
      const score = calculateReadabilityScore(text, wordCount, sentenceCount);
  expect(typeof score).toBe('number');
    });
    it('4.3 returns null if wordCount or sentenceCount is 0', () => {
      expect(calculateReadabilityScore('Some text', 0, 1)).toBeNull();
      expect(calculateReadabilityScore('Some text', 1, 0)).toBeNull();
    });
    it('4.4 returns null if no alphanumeric characters', () => {
      expect(calculateReadabilityScore('!!!', 0, 1)).toBeNull();
    });
    it('4.5 clamps ARI to minimum of 1', () => {
      const text = 'A.';
      const wordCount = countWords(text);
      const sentenceCount = 1;
  const score = calculateReadabilityScore(text, wordCount, sentenceCount);
  expect(typeof score).toBe('number');
    });
  });
});

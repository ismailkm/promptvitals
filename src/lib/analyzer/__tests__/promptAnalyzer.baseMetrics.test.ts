import { analyzePromptText } from '@/lib/analyzer/promptAnalyzer';

/**
 * Integration tests for Step 1.1: Base Metrics in AnalyzedPromptDataContext
 * Verifies population of:
 * - lengthChars, lengthWords
 * - averageSentenceLength, complexSentenceCount
 * - readabilityScore (ARI)
 * - lexicalDiversityScore
 * - nounVerbBalanceRatio (null for MVP)
 */
describe('analyzePromptText - Step 1.1: Base Metrics integration', () => {
  it('should correctly populate lengthChars and lengthWords', () => {
    const prompt = 'Summarize the following text.';
    const result = analyzePromptText(prompt);
    expect(result.lengthChars).toBe(prompt.trim().length);
    expect(result.lengthWords).toBe(4);
  });

  it('should correctly populate numSentencesVal and averageSentenceLength', () => {
    const prompt = 'Write a summary. Make it concise.';
    const result = analyzePromptText(prompt);
    // numSentencesVal is not directly exposed, but we can infer from averageSentenceLength
    expect(result.lengthWords).toBe(6);
    expect(result.averageSentenceLength).toBeCloseTo(3.0, 1);
  });

  it('should correctly calculate readabilityScore', () => {
    const prompt = 'This is a simple sentence.';
    const result = analyzePromptText(prompt);
    expect(typeof result.readabilityScore === 'number' || result.readabilityScore === null).toBe(true);
    if (result.readabilityScore !== null) {
      expect(result.readabilityScore).toBeGreaterThanOrEqual(1);
    }
  });

  it('should correctly calculate complexSentenceCount', () => {
    const prompt = 'This is a very long sentence that contains more than fifteen words, which should be considered complex for the purpose of this test.';
    const result = analyzePromptText(prompt);
    expect(result.complexSentenceCount).toBeGreaterThanOrEqual(1);
  });

  it('should correctly calculate lexicalDiversityScore', () => {
    const prompt = 'Repeat repeat repeat unique.';
    const result = analyzePromptText(prompt);
    expect(typeof result.lexicalDiversityScore).toBe('number');
    expect(result.lexicalDiversityScore).toBeGreaterThan(0);
    expect(result.lexicalDiversityScore).toBeLessThanOrEqual(1);
  });

  it('should set nounVerbBalanceRatio to null (MVP placeholder)', () => {
    const prompt = 'Describe the process.';
    const result = analyzePromptText(prompt);
    expect(result.nounVerbBalanceRatio).toBeNull();
  });
});

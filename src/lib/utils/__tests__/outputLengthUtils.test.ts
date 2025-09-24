import { extractOutputLengthConstraint } from '../textAnalysisUtils';

describe('extractOutputLengthConstraint', () => {
  it('extracts word count constraint', () => {
    const prompt = 'Write a summary in 100 words.';
    const constraint = extractOutputLengthConstraint(prompt);
    expect(constraint?.type).toEqual('words');
    expect(constraint?.value).toEqual(100);
  });

  it('extracts paragraph constraint', () => {
    const prompt = 'Limit your answer to 2 paragraphs.';
    const constraint = extractOutputLengthConstraint(prompt);
    expect(constraint?.type).toEqual('paragraphs');
    expect(constraint?.value).toEqual(2);
  });

  it('handles edge case with no explicit constraint', () => {
    const prompt = 'Give a brief answer.';
    const constraint = extractOutputLengthConstraint(prompt);
    expect(constraint).toEqual({
        type: 'brief',
        patternInfo: {
        id: 'len-qual-7',
        matchedText: 'brief',
        reason: "Qualitative length constraint 'brief' detected.",
        severity: 'low', 
        matchedPatternSource: expect.any(Object),
        startIndex: 7, 
        endIndex: 12    
        }
    });
  });
});

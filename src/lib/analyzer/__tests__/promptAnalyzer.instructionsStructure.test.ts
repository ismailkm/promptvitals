import { analyzePromptText } from '@/lib/analyzer/promptAnalyzer';

describe('analyzePromptText - Step 1.4: Instructions & Structure integration', () => {
  // Test for requestsSpecificFormat and explicitFormatRequests
  
  it('populates requestsSpecificFormat and explicitFormatRequests when format is explicitly requested', () => {
    const prompt = 'Summarize the text in JSON format. Ensure the output is a valid JSON object.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.requestsSpecificFormat).toBe('JSON');
    expect(instructions?.explicitFormatRequests?.length).toBeGreaterThan(0);
    expect(instructions?.explicitFormatRequests?.some(req => typeof req.matchedPatternSource !== 'string' && req.matchedPatternSource.metadata?.formatType === 'JSON')).toBe(true);
  });

  it('does not populate requestsSpecificFormat when no explicit format is requested', () => {
    const prompt = 'Summarize the text.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.requestsSpecificFormat).toBe(null);
    expect(instructions?.explicitFormatRequests).toEqual([]);
  });

  // Test for bulletPointUsage
  it('detects bullet point usage', () => {
    const prompt = 'List the following points:\n- Point 1\n* Point 2\n1. Point 3';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.bulletPointUsage).toEqual({ detected: true, count: 3 });
  });

  it('does not detect bullet point usage when absent', () => {
    const prompt = 'List the following points: Point 1, Point 2, Point 3.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.bulletPointUsage).toEqual({ detected: false });
  });

  // Test for sectionCount
  it('calculates sectionCount based on section headers', () => {
    const prompt = '# Section 1\nContent.\n## Subsection 1.1\nMore content.\n# Section 2\nFinal content.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;

    expect(instructions?.sectionCount).toBe(4);
  });

  it('calculates sectionCount as 1 for prompts without explicit sections', () => {
    const prompt = 'This is a single block of text without any explicit sections.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.sectionCount).toBe(1);
  });

  // Test for exampleDetails
  it('detects example details', () => {
    const prompt = 'Provide an example: For example, a cat.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.exampleDetails?.length).toBeGreaterThan(0);
    expect(instructions?.exampleDetails?.some(ex => typeof ex.matchedPatternSource !== 'string' && ex.matchedText?.toLowerCase() === 'for example')).toBe(true);
  });

  it('does not detect example details when absent', () => {
    const prompt = 'Explain the concept clearly.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;

    expect(instructions?.exampleDetails).toEqual([]);
  });

  // Test for placeholderDetails
  it('detects placeholder details', () => {
    const prompt = 'Use placeholders like [NAME] and {DATE}.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.placeholderDetails?.length).toBeGreaterThan(0);
    expect(instructions?.placeholderDetails?.some(ph => typeof ph.matchedPatternSource !== 'string' && ph.matchedText === '[NAME]')).toBe(true);
    expect(instructions?.placeholderDetails?.some(ph => typeof ph.matchedPatternSource !== 'string' && ph.matchedText === '{DATE}')).toBe(true);
  });

  it('does not detect placeholder details when absent', () => {
    const prompt = 'Write a complete sentence.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.placeholderDetails).toEqual([]);
  });

  // Test for toneStyleGuidance
  it('detects tone and style guidance', () => {
    const prompt = 'Write in a formal and concise tone. Adopt a journalistic style.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;
    expect(instructions?.toneStyleGuidance?.length).toBeGreaterThan(0);
    expect(instructions?.toneStyleGuidance?.some(ts => typeof ts.matchedPatternSource !== 'string' && ts.matchedText === 'formal')).toBe(true);
    expect(instructions?.toneStyleGuidance?.some(ts => typeof ts.matchedPatternSource !== 'string' && ts.matchedText === 'journalistic style')).toBe(true);
  });

  it('does not detect tone and style guidance when absent', () => {
    const prompt = 'Write about the topic.';
    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;

    expect(instructions?.toneStyleGuidance).toEqual([]);
  });
  
  // Comprehensive test for multiple fields
  it('populates multiple instructions and structure fields correctly in a complex prompt', () => {
    const prompt = [
      '# Introduction\n',
      'Please summarize the following document in a concise and professional tone, using bullet points for key takeaways.\n',
      'For example, if the document discusses [PRODUCT_NAME], highlight its main features.\n',
      'The output should be in Markdown format, with a section for each major theme.\n',
      'Limit your response to 200 words.'
    ].join('');

    const result = analyzePromptText(prompt);
    const instructions = result.instructionsAndStructure;

    expect(instructions?.requestsSpecificFormat).toBe('List');
    expect(instructions?.explicitFormatRequests?.some(req => typeof req.matchedPatternSource !== 'string' && req.matchedPatternSource.metadata?.formatType === 'Markdown')).toBe(true);
    expect(instructions?.bulletPointUsage).toEqual({ detected: false });
    expect(instructions?.sectionCount).toBeGreaterThan(0);
    expect(instructions?.exampleDetails?.some(ex => ex.matchedText === 'For example')).toBe(true);
    expect(instructions?.placeholderDetails?.some(ph => ph.matchedText === '[PRODUCT_NAME]')).toBe(true);
    expect(instructions?.toneStyleGuidance?.some(ts => ts.matchedText === 'professional tone')).toBe(true);
  });
});
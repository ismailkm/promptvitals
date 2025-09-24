import { analyzePromptText } from '@/lib/analyzer/promptAnalyzer';

/**
 * Integration tests for Step 1.3: specificityElements in AnalyzedPromptDataContext
 * Verifies population of:
 * - specificityElements.outputLengthConstraint
 * - specificityElements.definedPersonaInfo
 * - specificityElements.keyEntitiesFound
 * - specificityElements.constraintsMentioned
 * - specificityElements.outputFormatKeywords
 */

describe('analyzePromptText - Step 1.3: specificityElements integration', () => {
  it('populates all specificity elements on a rich prompt', () => {
    const prompt = [
      'Act as a senior data analyst. You are an expert in analytics.', // persona
      'Provide a detailed explanation limited to 150 words.', // qualitative + numeric length + constraint phrase
      'Ensure it is concise and must not include PII.', // constraints
      'Summarize in JSON format.', // output format keyword/explicit
      'Key stakeholders: Alice Johnson from Contoso and Bob Miller at Fabrikam.' // entities
    ].join(' ');

    const result = analyzePromptText(prompt);
    const spec = result.specificityElements;

    // outputLengthConstraint: accept either numeric or qualitative presence (we have both here)
    expect(spec?.outputLengthConstraint).not.toBeNull();
    expect(spec?.outputLengthConstraint?.type).toBeTruthy();

    // definedPersonaInfo
    expect(spec?.definedPersonaInfo?.length).toBeGreaterThan(0);

    // keyEntitiesFound (heuristic)
    expect(spec?.keyEntitiesFound?.length).toBeGreaterThan(0);

    // constraintsMentioned
    expect(spec?.constraintsMentioned?.length).toBeGreaterThan(0);

    // outputFormatKeywords (JSON)
    expect(spec?.outputFormatKeywords?.length).toBeGreaterThan(0);
    const fmtTypes = spec?.outputFormatKeywords?.map(i => (i.matchedPatternSource as any)?.metadata?.formatType)
                    .filter(Boolean) || [];
    expect(fmtTypes).toEqual(expect.arrayContaining(['JSON']));
  });

  it('handles only qualitative length constraint', () => {
    const prompt = 'Provide a brief overview of the topic.';
    const { specificityElements: spec } = analyzePromptText(prompt);
    expect(spec?.outputLengthConstraint).not.toBeNull();
    expect(['brief', 'detailed']).toContain(spec?.outputLengthConstraint?.type as string);
  });

  it('handles only numeric length constraint', () => {
    const prompt = 'Limit the response to 75 words.';
    const { specificityElements: spec } = analyzePromptText(prompt);
    expect(spec?.outputLengthConstraint).not.toBeNull();
    expect(spec?.outputLengthConstraint?.type).toBe('words');
    expect(spec?.outputLengthConstraint?.value).toBe(75);
  });

  it('does not set outputLengthConstraint when absent', () => {
    const prompt = 'Provide an overview with supporting points.';
    const { specificityElements: spec } = analyzePromptText(prompt);
    expect(spec?.outputLengthConstraint).toBeNull();
  });

  it('populates constraintsMentioned when phrases like ensure/limited/at least exist', () => {
    const prompt = 'Ensure clarity and limit the output to sections. At least three points.';
    const { specificityElements: spec } = analyzePromptText(prompt);
    expect(spec?.constraintsMentioned?.length).toBeGreaterThan(0);
  });

  it('detects output format keywords from free text (CSV, Table)', () => {
    const prompt = 'Output as CSV and show it as a table.';
    const { specificityElements: spec } = analyzePromptText(prompt);
    const fmtTypes = spec?.outputFormatKeywords?.map(i => (i.matchedPatternSource as any)?.metadata?.formatType)
                    .filter(Boolean) || [];
    expect(fmtTypes?.length).toBeGreaterThanOrEqual(2);
    expect(fmtTypes).toEqual(expect.arrayContaining(['CSV', 'Table']));
  });

  it('persona, constraints, and entities can be empty when not present', () => {
    const prompt = 'Explain the algorithm.';
    const { specificityElements: spec } = analyzePromptText(prompt);
    expect(spec?.definedPersonaInfo?.length).toBe(0);
    expect(spec?.constraintsMentioned?.length).toBe(0);
    // entities may still detect proper nouns if present; here expect 0
    expect(spec?.keyEntitiesFound?.length).toBe(0);
  });
});

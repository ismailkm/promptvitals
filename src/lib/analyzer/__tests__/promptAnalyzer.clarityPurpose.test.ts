import { analyzePromptText } from '@/lib/analyzer/promptAnalyzer';

/**
 * Integration tests for Step 1.2: Populate "Clarity & Purpose" related fields
 * Verifies the analyzer fills:
 * - clarityIssuesFound
 * - mentionsTargetAudience
 * - actionVerbDetails
 * - explicitlyStatesGoal
 * - negativeInstructionIssues
 * - contradictoryStatementFlags (expected empty for MVP)
 * - questionDetails (count and types)
 */

describe('analyzePromptText - Step 1.2: Clarity & Purpose integration', () => {
  it('populates clarity issues (vague terms and jargon), audience, actions, explicit goal, negatives, and questions', () => {
    const prompt = [
      'Please summarize the report for beginners.',
      'My goal is to get a KPI overview and explain the key API changes.',
      'Do not include confidential data and avoid including sensitive fields.',
      'It has some parts that are basically unclear.',
      'Why is this important?'
    ].join(' ');

    const result = analyzePromptText(prompt);

    // clarityIssuesFound: expect at least one vague (e.g., 'some' or 'basically') and one jargon (e.g., 'KPI' or 'API')
    expect(result.clarityIssuesFound?.length).toBeGreaterThan(0);
    const clarityTexts = result.clarityIssuesFound?.map(i => i.matchedText?.toLowerCase() || '');
    expect(clarityTexts?.some(t => t.includes('some') || t.includes('basically'))).toBe(true);
    expect(clarityTexts?.some(t => t.includes('kpi') || t.includes('api'))).toBe(true);

    // mentionsTargetAudience: 'for beginners'
    expect(result.mentionsTargetAudience).toBe(true);

    // actionVerbDetails: summarize, explain
    expect(result.actionVerbDetails?.count || 0).toBeGreaterThanOrEqual(2);
    expect(result.actionVerbDetails?.verbs).toEqual(
      expect.arrayContaining(['summarize', 'explain'])
    );

    // explicitlyStatesGoal: via explicit phrase and/or action verbs
    expect(result.explicitlyStatesGoal).toBe(true);

    // negativeInstructionIssues: 'Do not', 'avoid including'
    expect(result.negativeInstructionIssues?.length).toBeGreaterThan(0);

    // contradictoryStatementFlags: MVP placeholder => empty
    expect(result.contradictoryStatementFlags?.length).toBe(0);

    // questionDetails: contains a WH question
    expect(result.questionDetails?.count).toBeGreaterThanOrEqual(1);
    expect(result.questionDetails?.types).toEqual(
      expect.arrayContaining(['wh-question'])
    );
  });

  it('sets explicitlyStatesGoal=false when only questions and no action verbs', () => {
    const prompt = 'What is the status? Where are we now?';
    const result = analyzePromptText(prompt);

    expect(result.actionVerbDetails?.count).toBe(0);
    expect(result.questionDetails?.count).toBeGreaterThan(0);
    expect(result.explicitlyStatesGoal).toBe(false);
  });

  it('does not mark audience when none present', () => {
    const prompt = 'Summarize the document thoroughly.';
    const result = analyzePromptText(prompt);

    expect(result.mentionsTargetAudience).toBe(false);
  });

  it('sets explicit goal true based only on action verbs (no explicit goal phrase)', () => {
    const prompt = 'List and compare the options clearly.';
    const result = analyzePromptText(prompt);

    expect((result.actionVerbDetails?.count || 0)).toBeGreaterThanOrEqual(2);
    expect(result.explicitlyStatesGoal).toBe(true);
  });

  it('captures negative instruction issues for "avoid including" variants', () => {
    const prompt = 'Avoid including personal identifiers. Provide a brief summary.';
    const result = analyzePromptText(prompt);

    expect(result.negativeInstructionIssues?.length).toBeGreaterThan(0);
  });

  it('classifies question types (yes/no and wh)', () => {
    const prompt = 'Is this correct? What is your name?';
    const result = analyzePromptText(prompt);

    expect(result.questionDetails?.count).toBe(2);
    expect(result.questionDetails?.types).toEqual(
      expect.arrayContaining(['yes/no-question', 'wh-question'])
    );
  });

  it('does not flag clarity issues for a clean, specific prompt', () => {
    const prompt = 'Provide a detailed, structured summary of the attached document focusing on key findings, methods, and outcomes.';
    const result = analyzePromptText(prompt);

    expect(result.clarityIssuesFound?.length).toBe(0);
  });

  it('flags only vague terms (and not jargon) when prompt contains vague phrasing only', () => {
    const prompt = 'It is basically very important to cover some aspects in this overview.';
    const result = analyzePromptText(prompt);

    const texts = (result.clarityIssuesFound || []).map(i => i.matchedText?.toLowerCase() || '');
    // Expect at least one vague term
    expect(texts.some(t => t.includes('basically') || t.includes('very') || t.includes('some') || t.includes('aspects'))).toBe(true);
    // Ensure no jargon terms like KPI/API/etc are present
    expect(texts.some(t => t.includes('kpi') || t.includes('api') || t.includes('saas') || t.includes('roi'))).toBe(false);
  });

  it('flags only jargon (and not vague terms) when prompt contains jargon only', () => {
    const prompt = 'Provide a summary of KPI and API changes for the migration.';
    const result = analyzePromptText(prompt);

    const texts = (result.clarityIssuesFound || []).map(i => i.matchedText?.toLowerCase() || '');
    // Expect jargon present
    expect(texts.some(t => t.includes('kpi') || t.includes('api') || t.includes('saas') || t.includes('roi'))).toBe(true);
    // Ensure common vague terms are not present
    expect(texts.some(t => t.includes('some') || t.includes('basically') || t.includes('aspects') || t.includes('etc'))).toBe(false);
  });

});

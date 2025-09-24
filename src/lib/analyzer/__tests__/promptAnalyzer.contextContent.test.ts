import { analyzePromptText } from '@/lib/analyzer/promptAnalyzer';

/**
 * Integration tests for Step 1.5: Context & Content Richness in AnalyzedPromptDataContext
 * Verifies the analyzer populates:
 * - contextIndicatorsFound
 */

describe('analyzePromptText - Step 1.5: Context & Content Richness integration', () => {
  it('detects various types of context indicators in a rich prompt', () => {
    const prompt = [
      'Background: This is a new project.',
      'For context, we are building a web application.',
      'Currently, the system uses React.',
      'Requirements include: responsive design.',
      'The target audience is developers.',
      'Based on the following data: usage metrics.'
    ].join('\n');

    const result = analyzePromptText(prompt);

    // Verify contextIndicatorsFound is populated
    expect(result.contextIndicatorsFound).toBeDefined();
    expect(result.contextIndicatorsFound?.length).toBeGreaterThan(0);

    // Get all matched texts for easier assertion
    const detectedPatterns = result.contextIndicatorsFound?.map(p => p.matchedText?.toLowerCase()) || [];

    // Should detect at least one from each major category
    expect(detectedPatterns.some(p => p?.includes('background:'))).toBe(true); // Section marker
    expect(detectedPatterns.some(p => p?.includes('for context'))).toBe(true); // Introduction phrase
    expect(detectedPatterns.some(p => p?.includes('currently'))).toBe(true); // Current state
    expect(detectedPatterns.some(p => p?.includes('requirements include'))).toBe(true); // Requirements
    expect(detectedPatterns.some(p => p?.includes('target audience'))).toBe(true); // Audience
    expect(detectedPatterns.some(p => p?.includes('based on'))).toBe(true); // Data context
  });

  it('handles prompts with no context indicators', () => {
    const prompt = 'Write a simple hello world program.';
    const result = analyzePromptText(prompt);
    
    expect(result.contextIndicatorsFound).toBeDefined();
    expect(result.contextIndicatorsFound?.length).toBe(0);
  });

  it('correctly identifies multiple context indicators in complex prompts', () => {
    const prompt = [
      'Background: Legacy system migration project.',
      'Currently running version 1.0.',
      'Given that we need high availability,',
      'and considering that the system must be scalable,',
      'Requirements include:',
      '- 99.9% uptime',
      '- Load balancing',
      'The target audience consists of enterprise clients.',
      'Based on this information, provide architecture recommendations.'
    ].join('\n');

    const result = analyzePromptText(prompt);
    
    expect(result.contextIndicatorsFound).toBeDefined();
    expect(result.contextIndicatorsFound?.length).toBeGreaterThanOrEqual(5);
    
    // Verify detection of different context types
    const patterns = result.contextIndicatorsFound?.map(p => p.matchedText?.toLowerCase());
    
    // Should find markers from different categories
    const hasExplicitMarker = patterns?.some(p => p?.includes('background:'));
    const hasCurrentState = patterns?.some(p => p?.includes('currently'));
    const hasPremise = patterns?.some(p => p?.includes('given that'));
    const hasRequirements = patterns?.some(p => p?.includes('requirements include'));
    const hasAudience = patterns?.some(p => p?.includes('target audience'));
    
    expect(hasExplicitMarker && hasCurrentState && hasPremise && hasRequirements && hasAudience).toBe(true);
  });

  it('handles edge cases and special characters in context indicators', () => {
    const prompt = [
      'BACKGROUND: (Testing upper case)',
      'context: (Testing lower case)',
      'Scenario: {Testing with symbols}',
      'Environment: [Test]',
      'Currently: Testing colon usage',
      'Requirements include: * Special characters *'
    ].join('\n');

    const result = analyzePromptText(prompt);
    
    expect(result.contextIndicatorsFound).toBeDefined();
    expect(result.contextIndicatorsFound?.length).toBeGreaterThan(0);
    
    // Verify case insensitivity and special character handling
    const patterns = result.contextIndicatorsFound?.map(p => p.matchedText?.toLowerCase());
    expect(patterns?.some(p => p?.includes('background:'))).toBe(true);
    expect(patterns?.some(p => p?.includes('context:'))).toBe(true);
    expect(patterns?.some(p => p?.includes('scenario:'))).toBe(true);
    expect(patterns?.some(p => p?.includes('requirements include:'))).toBe(true);
  });
});

/**
 * Quick validation test for fixture builders
 * Tests that all builders can create valid AnalyzedPromptDataContext objects
 */

import { 
  makeContext, 
  makeSafetyContext, 
  makeClarityContext, 
  makeStructureContext, 
  makeContextRichContext 
} from '../fixtureBuilders';

describe('Fixture Builders Validation', () => {
  test('makeContext creates a valid base context', () => {
    const context = makeContext();
    
    expect(context.promptText).toBe('Write a brief summary of the main topics discussed.');
    expect(context.lengthWords).toBe(10);
    expect(context.lengthChars).toBe(52);
    expect(context.explicitlyStatesGoal).toBe(false);
  });

  test('makeContext allows overrides', () => {
    const context = makeContext({
      promptText: 'Custom prompt text',
      lengthWords: 5,
      explicitlyStatesGoal: true
    });
    
    expect(context.promptText).toBe('Custom prompt text');
    expect(context.lengthWords).toBe(5);
    expect(context.lengthChars).toBe(52); // base value preserved
    expect(context.explicitlyStatesGoal).toBe(true); // overridden
  });

  test('makeSafetyContext creates safety-focused context', () => {
    const context = makeSafetyContext();
    
    expect(context.promptText).toBe('How to protect personal information online and avoid scams?');
    expect(context.explicitlyStatesGoal).toBe(true);
    expect(context.riskAssessmentLevel).toBeDefined();
  });

  test('makeClarityContext creates clarity-focused context', () => {
    const context = makeClarityContext();
    
    expect(context.promptText).toBe('Please do the thing with the stuff using methods.');
    expect(context.clarityIssuesFound).toEqual(expect.any(Array));
  });

  test('makeStructureContext creates structure-focused context', () => {
    const context = makeStructureContext();
    
    expect(context.promptText).toContain('JSON format');
    expect(context.instructionsAndStructure.explicitFormatRequests).toHaveLength(1);
    expect(context.instructionsAndStructure.bulletPointUsage.detected).toBe(true);
    expect(context.instructionsAndStructure.sectionCount).toBe(3);
  });

  test('makeContextRichContext creates context-rich scenario', () => {
    const context = makeContextRichContext();
    
    expect(context.promptText).toContain('Given the recent');
    expect(context.contextIndicatorsFound).toHaveLength(1);
    expect(context.mentionsTargetAudience).toBe(true);
  });

  test('all builders return valid AnalyzedPromptDataContext structure', () => {
    const builders = [
      makeContext,
      makeSafetyContext,
      makeClarityContext,
      makeStructureContext,
      makeContextRichContext
    ];

    builders.forEach(builder => {
      const context = builder();
      
      // Check required fields exist
      expect(context.promptText).toBeDefined();
      expect(context.lengthWords).toBeDefined();
      expect(context.lengthChars).toBeDefined();
      expect(context.specificityElements).toBeDefined();
      expect(context.instructionsAndStructure).toBeDefined();
      expect(context.questionDetails).toBeDefined();
      expect(context.actionVerbDetails).toBeDefined();
    });
  });
});

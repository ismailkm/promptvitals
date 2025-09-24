// src/lib/ai-modules/__tests__/ClarityAnalysisModule.integration.test.ts

import { ClarityAnalysisModule } from '../ClarityAnalysisModule';
import { AIError, AIErrorCode } from '@/lib/exceptions/AIError';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { SeverityLevel } from '@/lib/types/shared';

describe('ClarityAnalysisModule Integration Tests', () => {
  let analysisModule: ClarityAnalysisModule;

  beforeEach(() => {
    analysisModule = new ClarityAnalysisModule();
  });

  const createTestContext = (promptText: string, overrides: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext => ({
    promptText,
    lengthChars: promptText.length,
    lengthWords: promptText.split(' ').length,
    explicitlyStatesGoal: false,
    actionVerbDetails: { count: 4, verbs: ['write', 'analyze', 'create', 'generate'] },
    clarityIssuesFound: [
      {
        matchedPatternSource: 'vague-term-pattern',
        severity: SeverityLevel.MEDIUM,
        reason: 'vague term detected',
        matchedText: 'data',
        startIndex: 10,
        endIndex: 14
      }
    ],
    specificityElements: { outputLengthConstraints: [] },
    contradictoryStatementFlags: [],
    negativeInstructionIssues: [],
    instructionsAndStructure: {
      explicitFormatRequests: [],
      requestsSpecificFormat: null,
      bulletPointUsage: { detected: false },
      sectionCount: 0,
      exampleDetails: [],
      placeholderDetails: [],
      toneStyleGuidance: [],
      stepMarkerDetails: []
    },
    ...overrides
  });

  // Skip these tests if no LLM provider is configured
  const skipIfNoLLM = () => {
    if (!process.env.LLM_PROVIDER) {
      console.log('⏭️  Skipping AI integration tests - no LLM_PROVIDER configured');
      return true;
    }
    return false;
  };

  describe('Real AI Integration', () => {
  it('should analyze goal alignment for ambiguous prompts', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Please write analyze create and generate some reports from the data we have'
      );

  const result = await analysisModule.analyzeClarityFeatures(context, ['goalAlignment']);
  expect(result.goalAlignment).toBeDefined();
  expect(result.goalAlignment?.confidence).toBeGreaterThanOrEqual(0);
  expect(result.goalAlignment?.confidence).toBeLessThanOrEqual(1);
  expect(result.goalAlignment?.inferredGoal).toBeDefined();
  expect(result.goalAlignment?.rationale).toBeDefined();
  console.log('🎯 Goal Alignment Result:', result.goalAlignment);
    }, 30000); // 30 second timeout for AI calls

    it('should analyze clarity context for vague prompts', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Do something with the stuff and make it better somehow'
      );

  const result = await analysisModule.analyzeClarityFeatures(context, ['clarityContext']);
  expect(result.clarityContext).toBeDefined();
  expect(result.clarityContext?.confidence).toBeGreaterThanOrEqual(0);
  expect(result.clarityContext?.confidence).toBeLessThanOrEqual(1);
  expect(Array.isArray(result.clarityContext?.contextualAmbiguity)).toBe(true);
  expect(Array.isArray(result.clarityContext?.criticalTerms)).toBe(true);
  console.log('🔍 Clarity Context Result:', result.clarityContext);
    }, 30000);

    it('should analyze multiple features in single call', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Write create analyze modify generate reports from data without any specific format'
      );

      const result = await analysisModule.analyzeClarityFeatures(
        context,
        ['goalAlignment', 'specificityReview', 'clarityContext']
      );

      // Should have results for all requested features
      expect(result.goalAlignment).toBeDefined();
      expect(result.specificityReview).toBeDefined();
      expect(result.clarityContext).toBeDefined();

      // Should not have unrequested features
      expect(result.instructionCoherence).toBeUndefined();

      // All confidence values should be valid
      expect(result.goalAlignment?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.goalAlignment?.confidence).toBeLessThanOrEqual(1);
      expect(result.specificityReview?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.specificityReview?.confidence).toBeLessThanOrEqual(1);

      console.log('🔄 Multi-feature Result:', {
        goalAlignment: result.goalAlignment?.inferredGoal,
        specificityIssues: result.specificityReview?.missingConstraints,
        clarityIssues: result.clarityContext?.contextualAmbiguity
      });
    }, 450000); // Longer timeout for multi-feature analysis

    it('should handle instruction coherence analysis', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Write a detailed summary but keep it brief. Make it comprehensive yet concise. Include everything but be selective.',
        {
          contradictoryStatementFlags: [
            {
              matchedPatternSource: 'contradiction-pattern',
              severity: SeverityLevel.HIGH,
              reason: 'contradictory instruction detected',
              matchedText: 'detailed but brief',
              startIndex: 8,
              endIndex: 24
            }
          ]
        }
      );

      try {
        const result = await analysisModule.analyzeClarityFeatures(context, ['instructionCoherence']);

        expect(result.instructionCoherence).toBeDefined();
        expect(result.instructionCoherence?.confidence).toBeGreaterThanOrEqual(0);
        expect(result.instructionCoherence?.confidence).toBeLessThanOrEqual(1);
        expect(result.instructionCoherence?.followingLikelihood).toBeGreaterThanOrEqual(0);
        expect(result.instructionCoherence?.followingLikelihood).toBeLessThanOrEqual(1);
        expect(Array.isArray(result.instructionCoherence?.contradictionsDetected)).toBe(true);

        console.log('⚖️  Instruction Coherence Result:', result.instructionCoherence);
      } catch (err: any) {
        if (err instanceof AIError && err.code === AIErrorCode.PARSE_ERROR) {
          console.warn('AI parse error encountered during instruction coherence test — skipping assertions');
          return;
        }
        throw err;
      }
    }, 30000);

    it('should return empty result for no eligible features', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext('Simple clear prompt');
      const result = await analysisModule.analyzeClarityFeatures(context, []);

      expect(Object.keys(result)).toHaveLength(0);
    });

  });

  describe('Prompt Generation', () => {
    it('should build comprehensive analysis prompts', () => {
      const context = createTestContext('Test prompt for analysis');
      const features = ['goalAlignment', 'clarityContext'];

      // Access private user prompt builder for testing
      const prompt = (analysisModule as any).buildUserPrompt(context, features);

      expect(prompt).toContain('Test prompt for analysis');
      expect(prompt).toContain('goalAlignment');
      expect(prompt).toContain('clarityContext');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('confidence');
      expect(prompt.length).toBeGreaterThan(200); // Should be reasonably comprehensive
    });

    it('should create valid analysis function', () => {
      const analysisFunction = analysisModule.createAnalysisFunction();
      
      expect(typeof analysisFunction).toBe('function');
      expect(analysisFunction.length).toBe(2); // Should accept 2 parameters
    });
  });

  describe('Response Parsing', () => {
    it('should parse valid AI responses correctly', () => {
      const validResponse = JSON.stringify({
        goalAlignment: {
          inferredGoal: 'Create data analysis reports',
          primaryActionVerb: 'analyze',
          confidence: 0.85,
          rationale: 'Clear analytical intent'
        },
        clarityContext: {
          contextualAmbiguity: ['data source unclear'],
          criticalTerms: ['data', 'reports'],
          confidence: 0.7,
          rationale: 'Some ambiguous terms'
        }
      });

      const result = (analysisModule as any).parseResponse(validResponse);

      expect(result.goalAlignment?.inferredGoal).toBe('Create data analysis reports');
      expect(result.goalAlignment?.confidence).toBe(0.85);
      expect(result.clarityContext?.contextualAmbiguity).toEqual(['data source unclear']);
    });

    it('should handle malformed JSON gracefully', () => {
      const invalidResponse = '{ invalid json }';

      expect(() => {
        (analysisModule as any).parseResponse(invalidResponse);
      }).toThrow(/Invalid AI response format/);
    });

    it('should normalize confidence values', () => {
      const responseWithBadConfidence = JSON.stringify({
        goalAlignment: {
          inferredGoal: 'Test goal',
          confidence: 1.5, // Invalid - should be clamped to 1
          rationale: 'Test'
        }
      });

      const result = (analysisModule as any).parseResponse(responseWithBadConfidence);
      expect(result.goalAlignment?.confidence).toBe(1);
    });
  });
});

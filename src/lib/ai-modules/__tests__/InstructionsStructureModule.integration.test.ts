// src/lib/ai-modules/__tests__/InstructionsStructureModule.integration.test.ts

import { InstructionsStructureModule } from '../InstructionsStructureModule';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { SeverityLevel } from '@/lib/types/shared';


describe('InstructionsStructureAnalysisModule Integration Tests', () => {
  let analysisModule: InstructionsStructureModule;

  beforeEach(() => {
    analysisModule = new InstructionsStructureModule();
  });

  const createTestContext = (promptText: string, overrides: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext => ({
    promptText,
    lengthChars: promptText.length,
    lengthWords: promptText.split(' ').length,
    explicitlyStatesGoal: false,
    actionVerbDetails: { count: 2, verbs: ['write', 'summarize'] },
    clarityIssuesFound: [],
    specificityElements: { outputLengthConstraints: [] },
    contradictoryStatementFlags: [],
    negativeInstructionIssues: [],
    instructionsAndStructure: {
      explicitFormatRequests: [],
      requestsSpecificFormat: null,
      bulletPointUsage: { detected: false },
      sectionCount: 1,
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
    it('should analyze format suggestion for a basic prompt', async () => {
      if (skipIfNoLLM()) return;
      const context = createTestContext('Write a summary of the following article.');
      const result = await analysisModule.analyzeInstructionsStructure(context, ['formatSuggestion']);
      expect(result.formatSuggestion).toBeDefined();
      expect(result.formatSuggestion?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.formatSuggestion?.confidence).toBeLessThanOrEqual(100);
      expect(result.formatSuggestion?.suggestion).toBeDefined();
      expect(result.formatSuggestion?.reasoning).toBeDefined();
      expect(['minor','moderate','major']).toContain(result.formatSuggestion?.structureImprovement);
      console.log('📝 Format Suggestion Result:', result.formatSuggestion);
    }, 30000);

    it('should analyze example quality review for a prompt with examples', async () => {
      if (skipIfNoLLM()) return;
      const context = createTestContext('Write a summary and provide two examples.', {
        instructionsAndStructure: {
          explicitFormatRequests: [],
          requestsSpecificFormat: null,
          bulletPointUsage: { detected: false },
          sectionCount: 1,
          exampleDetails: [
            {
              matchedText: 'Example 1: ...',
              startIndex: 30,
              endIndex: 44,
              matchedPatternSource: 'test',
              reason: 'Test example',
              severity: SeverityLevel.INFO
            },
            {
              matchedText: 'Example 2: ...',
              startIndex: 50,
              endIndex: 64,
              matchedPatternSource: 'test',
              reason: 'Test example',
              severity: SeverityLevel.INFO
            }
          ],
          placeholderDetails: [],
          toneStyleGuidance: [],
          stepMarkerDetails: []
        }
      });
      const result = await analysisModule.analyzeInstructionsStructure(context, ['exampleQualityReview']);
      expect(result.exampleQualityReview).toBeDefined();
      expect(result.exampleQualityReview?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.exampleQualityReview?.confidence).toBeLessThanOrEqual(100);
      expect(['poor','fair','good','excellent']).toContain(result.exampleQualityReview?.qualityAssessment);
      expect(Array.isArray(result.exampleQualityReview?.suggestedImprovements)).toBe(true);
      expect(result.exampleQualityReview?.reasoning).toBeDefined();
      console.log('🔍 Example Quality Review Result:', result.exampleQualityReview);
    }, 30000);

    it('should analyze multiple features in a single call', async () => {
      if (skipIfNoLLM()) return;
      const context = createTestContext('Write a summary, provide examples, and ensure logical structure.');
      const result = await analysisModule.analyzeInstructionsStructure(
        context,
        ['formatSuggestion', 'exampleQualityReview', 'structureCoherence']
      );
      expect(result.formatSuggestion).toBeDefined();
      expect(result.exampleQualityReview).toBeDefined();
      expect(result.structureCoherence).toBeDefined();
      expect(result.decompositionSuggestion).toBeUndefined();
      expect(result.formatSuggestion?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.exampleQualityReview?.confidence).toBeGreaterThanOrEqual(0);
      expect(result.structureCoherence?.confidence).toBeGreaterThanOrEqual(0);
      console.log('🔄 Multi-feature Result:', {
        formatSuggestion: result.formatSuggestion?.suggestion,
        exampleQuality: result.exampleQualityReview?.qualityAssessment,
        coherenceIssues: result.structureCoherence?.coherenceIssues
      });
    }, 450000);
  });
});

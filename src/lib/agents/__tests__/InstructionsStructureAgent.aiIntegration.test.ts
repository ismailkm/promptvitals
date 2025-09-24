// src/lib/agents/__tests__/InstructionsStructureAgent.aiIntegration.test.ts

import { 
  evaluateInstructionsStructureHybrid,
} from '../InstructionsStructureAgent';
import { InstructionsStructureModule } from '@/lib/ai-modules/InstructionsStructureModule';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { SeverityLevel } from '@/lib/types/shared';
import { AIEligibleFeature } from '@/lib/types/aiTypes';
import { determineAIEligibilityFromRules } from '@/lib/agent-utils/aiEligibility';
import { INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES } from '@/lib/agent-utils/enhancementConfigs/instructionsStructureEnhancement';

describe('InstructionsStructureAgent AI Integration', () => {
  let aiModule: InstructionsStructureModule;

  beforeEach(() => {
    aiModule = new InstructionsStructureModule();
  });

  // Helper to create a compatible AI function
  const createCompatibleAiFunction = (module: InstructionsStructureModule) => {
    return (context: AnalyzedPromptDataContext, eligibleFeatures: string[] | AIEligibleFeature[]) => {
      const typedFeatures = Array.isArray(eligibleFeatures) && typeof eligibleFeatures[0] === 'string' 
        ? eligibleFeatures as AIEligibleFeature[]
        : eligibleFeatures as AIEligibleFeature[];
      return module.analyzeInstructionsStructure(context, typedFeatures);
    };
  };

  const createTestContext = (promptText: string, overrides: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext => ({
    promptText,
    lengthChars: promptText.length,
    lengthWords: promptText.split(' ').length,
    actionVerbDetails: { count: 2, verbs: ['analyze', 'create'] },
    specificityElements: { outputLengthConstraints: [] },
    contradictoryStatementFlags: [],
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
    explicitlyStatesGoal: false,
    clarityIssuesFound: [],
    negativeInstructionIssues: [],
    ...overrides
  });

  const skipIfNoLLM = () => {
    if (!process.env.OLLAMA_BASE_URL && !process.env.LLM_PROVIDER) {
      console.log('⏭️  Skipping AI integration tests - set OLLAMA_BASE_URL or LLM_PROVIDER to enable');
      return true;
    }
    return false;
  };

  describe('Format Structure AI Enhancement', () => {
    it('should enhance analysis for long unstructured prompts', async () => {
      if (skipIfNoLLM()) return;

      // Create a long prompt with no structure to trigger formatSuggestion
      const longPrompt = 'Please analyze the customer database and extract comprehensive insights from the data including detailed sales metrics customer behavior patterns demographic information comprehensive purchase history seasonal trends market analytics competitive analysis and any other relevant data points that could help us understand our customer base better and make informed strategic business decisions about future marketing campaigns product development initiatives customer retention strategies pricing optimization inventory management supply chain improvements while ensuring complete data accuracy consistency validation throughout the entire analysis process and also providing detailed actionable recommendations for implementing improvements and enhancements to our current customer relationship management systems processes workflows automation tools reporting mechanisms dashboard configurations user interfaces database schemas data integration pipelines and overall business intelligence infrastructure for better understanding of market dynamics competitive positioning customer satisfaction levels revenue optimization profit margin analysis cost reduction opportunities operational efficiency improvements and long-term strategic planning initiatives that will ultimately lead to sustainable revenue generation improved customer satisfaction higher retention rates market share expansion competitive advantage development and overall business growth';
      
      const context = createTestContext(longPrompt, {
        lengthWords: longPrompt.split(' ').length, // Over 100 words
        instructionsAndStructure: {
          explicitFormatRequests: [],
          requestsSpecificFormat: null,
          bulletPointUsage: { detected: false },
          sectionCount: 0,
          exampleDetails: [],
          placeholderDetails: [],
          toneStyleGuidance: [],
          stepMarkerDetails: []
        }
      });

      // Verify this triggers AI eligibility
      const eligibleFeatures = determineAIEligibilityFromRules(context, INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES);
      console.log('📊 Eligible features:', eligibleFeatures);
      expect(eligibleFeatures).toContain('formatSuggestion');

      const aiFunction = createCompatibleAiFunction(aiModule);
      const results = await evaluateInstructionsStructureHybrid(context, aiFunction);

      // Should use AI for format structure
      expect(results.formatStructure.flags?.aiUsed).toBe(true);
      expect(results.formatStructure.flags?.aiFormatSuggestion).toBeDefined();
      expect(results.formatStructure.evaluation_source).toBe('hybrid_rule_dominant');

      console.log('🎯 Enhanced Format Structure:', {
        hybridScore: results.formatStructure.score,
        aiSuggestion: results.formatStructure.flags?.aiFormatSuggestion,
        eligibleFeatures
      });
    }, 100000);

    it('should enhance analysis for prompts with format requests', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Create a report in JSON format with specific schema',
        {
          lengthWords: 9,
          instructionsAndStructure: {
            explicitFormatRequests: [
              {
                matchedPatternSource: 'format-request',
                severity: SeverityLevel.LOW,
                reason: 'JSON format requested',
                matchedText: 'JSON format',
                startIndex: 17,
                endIndex: 28
              }
            ],
            requestsSpecificFormat: 'JSON format',
            bulletPointUsage: { detected: false },
            sectionCount: 0,
            exampleDetails: [],
            placeholderDetails: [],
            toneStyleGuidance: [],
            stepMarkerDetails: []
          }
        }
      );

      const eligibleFeatures = determineAIEligibilityFromRules(context, INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES);
      console.log('📊 Format request eligible features:', eligibleFeatures);
      expect(eligibleFeatures).toContain('formatSuggestion');

      const aiFunction = createCompatibleAiFunction(aiModule);
      const results = await evaluateInstructionsStructureHybrid(context, aiFunction);

      expect(results.formatStructure.flags?.aiUsed).toBe(true);
      expect(results.formatStructure.flags?.aiFormatSuggestion).toBeDefined();

      console.log('✨ Format Request Analysis:', {
        score: results.formatStructure.score,
        aiSuggestion: results.formatStructure.flags?.aiFormatSuggestion,
        eligibleFeatures
      });
    }, 45000);
  });

  describe('Task Decomposition AI Enhancement', () => {
    it('should enhance analysis for multiple actions', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Analyze process transform generate create visualize synthesize optimize the data',
        {
          lengthWords: 11,
          actionVerbDetails: { 
            count: 8, // More than 3 actions 
            verbs: ['analyze', 'process', 'transform', 'generate', 'create', 'visualize', 'synthesize', 'optimize'] 
          },
          instructionsAndStructure: {
            explicitFormatRequests: [],
            requestsSpecificFormat: null,
            bulletPointUsage: { detected: false },
            sectionCount: 0,
            exampleDetails: [],
            placeholderDetails: [],
            toneStyleGuidance: [],
            stepMarkerDetails: []
          }
        }
      );

      const eligibleFeatures = determineAIEligibilityFromRules(context, INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES);
      console.log('📊 Task decomposition eligible features:', eligibleFeatures);
      expect(eligibleFeatures).toContain('decompositionSuggestion');

      const aiFunction = createCompatibleAiFunction(aiModule);
      const results = await evaluateInstructionsStructureHybrid(context, aiFunction);

      expect(results.taskDecomposition.flags?.aiUsed).toBe(true);
      expect(results.taskDecomposition.flags?.aiDecompositionQuality).toBeDefined();

      console.log('🔄 Enhanced Task Decomposition:', {
        hybridScore: results.taskDecomposition.score,
        aiDecompositionQuality: results.taskDecomposition.flags?.aiDecompositionQuality,
        eligibleFeatures
      });
    }, 60000);
  });

  describe('Examples Presence AI Enhancement', () => {
    it('should enhance analysis when examples are present', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Create a report. For example: "Customer John Smith purchased 5 items"',
        {
          lengthWords: 12,
          actionVerbDetails: { count: 1, verbs: ['create'] },
          instructionsAndStructure: {
            explicitFormatRequests: [],
            requestsSpecificFormat: null,
            bulletPointUsage: { detected: false },
            sectionCount: 0,
            exampleDetails: [
              {
                matchedPatternSource: 'example-pattern',
                severity: SeverityLevel.LOW,
                reason: 'example detected',
                matchedText: 'For example: "Customer John Smith purchased 5 items"',
                startIndex: 17,
                endIndex: 67
              }
            ],
            placeholderDetails: [],
            toneStyleGuidance: [],
            stepMarkerDetails: []
          }
        }
      );

      const eligibleFeatures = determineAIEligibilityFromRules(context, INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES);
      console.log('📊 Example review eligible features:', eligibleFeatures);
      expect(eligibleFeatures).toContain('exampleQualityReview');

      const aiFunction = createCompatibleAiFunction(aiModule);
      const results = await evaluateInstructionsStructureHybrid(context, aiFunction);

      expect(results.examplePresence.flags?.aiUsed).toBe(true);
      expect(results.examplePresence.flags?.aiExampleQuality).toBeDefined();

      console.log('📝 Enhanced Example Quality:', {
        hybridScore: results.examplePresence.score,
        quality: results.examplePresence.flags?.aiExampleQuality,
        eligibleFeatures
      });
    }, 60000);
  });

  describe('Structure Coherence AI Enhancement', () => {
    it('should enhance analysis for conflicting tone guidance', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Write a professional formal business report but make it casual conversational',
        {
          lengthWords: 12,
          instructionsAndStructure: {
            explicitFormatRequests: [],
            requestsSpecificFormat: null,
            bulletPointUsage: { detected: false },
            sectionCount: 0,
            exampleDetails: [],
            placeholderDetails: [],
            toneStyleGuidance: [
              {
                matchedPatternSource: 'formal-tone',
                severity: SeverityLevel.MEDIUM,
                reason: 'formal tone detected',
                matchedText: 'professional formal',
                startIndex: 8,
                endIndex: 25
              },
              {
                matchedPatternSource: 'casual-tone',
                severity: SeverityLevel.MEDIUM,
                reason: 'casual tone detected',
                matchedText: 'casual conversational',
                startIndex: 50,
                endIndex: 71
              }
            ],
            stepMarkerDetails: []
          }
        }
      );

      const eligibleFeatures = determineAIEligibilityFromRules(context, INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES);
      console.log('📊 Structure coherence eligible features:', eligibleFeatures);
      expect(eligibleFeatures).toContain('structureCoherence');

      const aiFunction = createCompatibleAiFunction(aiModule);
      const results = await evaluateInstructionsStructureHybrid(context, aiFunction);

      expect(results.structureCoherence.flags?.aiUsed).toBe(true);
      expect(results.structureCoherence.flags?.aiCoherenceIssues).toBeDefined();

      console.log('🎭 Enhanced Structure Coherence:', {
        hybridScore: results.structureCoherence.score,
        coherenceIssues: results.structureCoherence.flags?.aiCoherenceIssues,
        eligibleFeatures
      });
    }, 60000);
  });

  describe('Edge Cases', () => {
    it('should handle minimal prompts without AI enhancement', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext('Do it', {
        lengthWords: 2,
        actionVerbDetails: { count: 1, verbs: ['do'] }
      });

      const eligibleFeatures = determineAIEligibilityFromRules(context, INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES);
      console.log('📊 Minimal prompt eligible features:', eligibleFeatures);
      expect(eligibleFeatures.length).toBe(0);

      const aiFunction = createCompatibleAiFunction(aiModule);
      const results = await evaluateInstructionsStructureHybrid(context, aiFunction);

      expect(results.formatStructure.evaluation_source).toBe('rule_based');
      expect(results.taskDecomposition.evaluation_source).toBe('rule_based');
      expect(results.examplePresence.evaluation_source).toBe('rule_based');
      expect(results.structureCoherence.evaluation_source).toBe('rule_based');

      console.log('📏 Minimal Prompt Handling:', {
        promptLength: context.lengthWords,
        eligibleFeatures,
        formatScore: results.formatStructure.score
      });
    }, 30000);
  });
});

// src/lib/agents/__tests__/InstructionsStructureAgent.test.ts

import {
  evaluateFormatStructureLogic,
  evaluateTaskDecompositionLogic,
  evaluateExamplesPresenceLogic,
  evaluateToneStyleKeywordsLogic,
  evaluateLengthConstraintsLogic
} from '../InstructionsStructureAgent';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';

describe('InstructionsStructureAgent Rule-Based Evaluation', () => {
  describe('evaluateFormatStructureLogic', () => {
    it('should use threshold-based scoring for wall of text detection', () => {
      const context = {
        lengthWords: 250, // Over threshold for wall of text
        instructionsAndStructure: {
          sectionCount: 0,
          bulletPointUsage: { detected: false, count: 0 }
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateFormatStructureLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.score).toBeLessThan(50); // Should be penalized
      expect(result.flags?.wallOfTextDetected).toBe(true);
      expect(result.flags?.wallOfTextPenalty).toBeGreaterThan(0);
    });

    it('should reward good structure with sections and bullets', () => {
      const context = {
        lengthWords: 150,
        instructionsAndStructure: {
          sectionCount: 3,
          bulletPointUsage: { detected: true, count: 5 }
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateFormatStructureLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.score).toBeGreaterThan(50); // Should be rewarded
      expect(result.flags?.hasSections).toBe(true);
      expect(result.flags?.sectionBonus).toBeGreaterThan(0);
    });
  });

  describe('evaluateTaskDecompositionLogic', () => {
    it('should use threshold-based scoring for action verb complexity', () => {
      const context = {
        lengthWords: 100,
        actionVerbDetails: { count: 8, verbs: ['analyze', 'create', 'format', 'review', 'edit', 'publish', 'share', 'validate'] },
        instructionsAndStructure: {
          stepMarkerDetails: []
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateTaskDecompositionLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      
      // The system correctly identifies overloaded tasks without step structure
      expect(result.flags?.actionOverloadWithoutSteps).toBe(true);
      expect(result.flags?.distinctActionVerbsCount).toBe(8);
      expect(result.flags?.stepMarkerCount).toBe(0);
      
      // Score should be lowered due to complexity (threshold-based scoring working)
      expect(result.score).toBeLessThan(70); // Should be penalized for overload
    });

    it('should reward appropriate single-task focus', () => {
      const context = {
        lengthWords: 50,
        actionVerbDetails: { count: 1, verbs: ['write'] },
        instructionsAndStructure: {
          stepMarkerDetails: []
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateTaskDecompositionLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.score).toBeGreaterThan(55); // Should be rewarded
      expect(result.flags?.appropriatelySingleTask).toBe(true);
    });
  });

  describe('evaluateExamplesPresenceLogic', () => {
    it('should use contextual analysis for example requirements', () => {
      const context = {
        lengthWords: 200,
        actionVerbDetails: { count: 4, verbs: ['create', 'format', 'analyze', 'edit'] },
        instructionsAndStructure: {
          exampleDetails: [],
          toneStyleGuidance: [
            {
              matchedText: 'creative writing style',
              matchedPatternSource: 'TONE_STYLE_KEYWORDS',
              reason: 'creative tone detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 22
            }
          ]
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateExamplesPresenceLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.isComplexTask).toBe(true);
      expect(result.flags?.isCreativeTask).toBe(true);
      expect(result.flags?.complexTaskNeedsExamples).toBe(true);
    });

    it('should be lenient with simple tasks without examples', () => {
      const context = {
        lengthWords: 30,
        actionVerbDetails: { count: 1, verbs: ['write'] },
        instructionsAndStructure: {
          exampleDetails: [],
          toneStyleGuidance: []
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateExamplesPresenceLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.simpleTaskNoExamples).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(55); // Should be neutral/positive
    });
  });

  describe('evaluateToneStyleKeywordsLogic', () => {
    it('should use threshold-based conflict detection', () => {
      const context = {
        lengthWords: 100,
        instructionsAndStructure: {
          toneStyleGuidance: [
            {
              matchedText: 'formal tone',
              matchedPatternSource: 'TONE_STYLE_KEYWORDS',
              reason: 'tone guidance detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 11
            },
            {
              matchedText: 'casual approach',
              matchedPatternSource: 'TONE_STYLE_KEYWORDS',
              reason: 'tone guidance detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 15
            },
            {
              matchedText: 'professional style',
              matchedPatternSource: 'TONE_STYLE_KEYWORDS',
              reason: 'tone guidance detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 18
            }
          ]
        },
        specificityElements: {
          outputLengthConstraints: [],
          definedPersonaInfo: []
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateToneStyleKeywordsLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.hasToneGuidance).toBe(true);
      expect(result.flags?.toneStyleCount).toBe(3);
      // May or may not have conflicts depending on metadata parsing
    });

    it('should appropriately handle simple prompts without tone guidance', () => {
      const context = {
        lengthWords: 50,
        instructionsAndStructure: {
          toneStyleGuidance: []
        },
        specificityElements: {
          outputLengthConstraints: [],
          definedPersonaInfo: []
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateToneStyleKeywordsLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.appropriatelySimple).toBe(true);
      expect(result.score).toBeGreaterThan(45); // Should be rewarded for appropriate simplicity
    });
  });

  describe('evaluateLengthConstraintsLogic', () => {
    it('should handle missing constraints appropriately for simple prompts', () => {
      const context = {
        lengthWords: 30,
        actionVerbDetails: { count: 1, verbs: ['write'] },
        specificityElements: {
          outputLengthConstraints: []
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateLengthConstraintsLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.lengthConstraintMissing).toBe(true);
      expect(result.flags?.simplePromptNoConstraints).toBe(true);
      expect(result.score).toBe(45); // Should be reasonable for simple prompts
    });

    it('should reward numeric constraints', () => {
      const context = {
        lengthWords: 100,
        specificityElements: {
          outputLengthConstraints: [
            {
              matchedText: '500 words',
              matchedPatternSource: 'LENGTH_CONSTRAINT',
              reason: 'numeric constraint detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 9,
              metadata: {
                type: 'length_constraint' as const,
                constraintType: 'numeric' as const,
                normalizedType: 'words' as const,
                value: 500,
                unit: 'words'
              }
            }
          ]
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateLengthConstraintsLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.hasNumericConstraints).toBe(true);
      expect(result.flags?.numericConstraintCount).toBe(1);
      expect(result.score).toBeGreaterThan(50); // Should be rewarded
    });

    it('should detect constraint conflicts', () => {
      const context = {
        lengthWords: 100,
        specificityElements: {
          outputLengthConstraints: [
            {
              matchedText: 'brief',
              matchedPatternSource: 'LENGTH_CONSTRAINT',
              reason: 'qualitative constraint detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 5,
              metadata: {
                type: 'length_constraint' as const,
                constraintType: 'qualitative' as const,
                normalizedType: 'brief' as const
              }
            },
            {
              matchedText: '5000 words',
              matchedPatternSource: 'LENGTH_CONSTRAINT',
              reason: 'numeric constraint detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 10,
              metadata: {
                type: 'length_constraint' as const,
                constraintType: 'numeric' as const,
                normalizedType: 'words' as const,
                value: 5000,
                unit: 'words'
              }
            }
          ]
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateLengthConstraintsLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.constraintConflictDetected).toBe(true);
      expect(result.flags?.compatibilityAnalysis).toBeDefined();
      expect(result.flags?.constraintPenalty).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(70); // Should be penalized for conflicts
    });

    it('should reward well-balanced constraints', () => {
      const context = {
        lengthWords: 100,
        specificityElements: {
          outputLengthConstraints: [
            {
              matchedText: 'detailed',
              matchedPatternSource: 'LENGTH_CONSTRAINT',
              reason: 'qualitative constraint detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 8,
              metadata: {
                type: 'length_constraint' as const,
                constraintType: 'qualitative' as const,
                normalizedType: 'detailed' as const
              }
            },
            {
              matchedText: '300 words',
              matchedPatternSource: 'LENGTH_CONSTRAINT',
              reason: 'numeric constraint detected',
              severity: 'medium' as const,
              startIndex: 0,
              endIndex: 9,
              metadata: {
                type: 'length_constraint' as const,
                constraintType: 'numeric' as const,
                normalizedType: 'words' as const,
                value: 300,
                unit: 'words'
              }
            }
          ]
        }
      } as unknown as AnalyzedPromptDataContext;

      const result = evaluateLengthConstraintsLogic(context);
      
      expect(result.evaluation_source).toBe('rule_based');
      expect(result.flags?.hasNumericConstraints).toBe(true);
      expect(result.flags?.hasQualitativeConstraints).toBe(true);
      expect(result.flags?.wellBalancedConstraints).toBe(true);
      expect(result.score).toBeGreaterThan(70); // Should be well rewarded
    });
  });

  describe('General Scoring Characteristics', () => {
    it('should produce realistic, balanced scores across different scenarios', () => {
      const scenarios = [
        {
          context: {
            lengthWords: 50,
            instructionsAndStructure: {
              sectionCount: 2,
              bulletPointUsage: { detected: true, count: 3 }
            },
            actionVerbDetails: { count: 1, verbs: ['write'] }
          } as unknown as AnalyzedPromptDataContext,
          scenario: 'well-structured simple prompt'
        },
        {
          context: {
            lengthWords: 300,
            instructionsAndStructure: {
              sectionCount: 0,
              bulletPointUsage: { detected: false, count: 0 }
            },
            actionVerbDetails: { count: 8, verbs: ['create', 'analyze', 'format', 'review', 'edit', 'publish', 'share', 'validate'] }
          } as unknown as AnalyzedPromptDataContext,
          scenario: 'poorly structured complex prompt'
        },
        {
          context: {
            lengthWords: 150,
            instructionsAndStructure: {
              sectionCount: 3,
              bulletPointUsage: { detected: true, count: 4 }
            },
            actionVerbDetails: { count: 3, verbs: ['create', 'analyze', 'format'] }
          } as unknown as AnalyzedPromptDataContext,
          scenario: 'well-balanced prompt'
        }
      ];

      scenarios.forEach(({ context, scenario }) => {
        const formatResult = evaluateFormatStructureLogic(context);
        const taskResult = evaluateTaskDecompositionLogic(context);
        
        // All scores should be realistic (0-100)
        expect(formatResult.score).toBeGreaterThanOrEqual(0);
        expect(formatResult.score).toBeLessThanOrEqual(100);
        expect(taskResult.score).toBeGreaterThanOrEqual(0);
        expect(taskResult.score).toBeLessThanOrEqual(100);
        
        // Should have proper evaluation source
        expect(formatResult.evaluation_source).toBe('rule_based');
        expect(taskResult.evaluation_source).toBe('rule_based');
        
        console.log(`${scenario}: Format=${formatResult.score}, Task=${taskResult.score}`);
      });
    });
  });
});

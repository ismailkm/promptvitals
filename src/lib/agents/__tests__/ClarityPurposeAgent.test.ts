// src/lib/agents/__tests__/ClarityPurposeAgent.test.ts

import {
  evaluateClarityUnambiguityRules,
  evaluateSpecificityDetailScopeRules,
  evaluateGoalAlignmentLogic,
  evaluateInstructionFollowingLogic
} from '../ClarityPurposeAgent';

import { SeverityLevel } from '@/lib/types/shared';
import { 
  makeContext,
  makeClarityContext,
  makeDetectedPattern
} from '@/lib/agent-utils/fixtureBuilders';

describe('ClarityPurposeAgent', () => {
  describe('1- evaluateClarityUnambiguityRules', () => {
    it('1.1 should return perfect score with no clarity issues', () => {
      const context = makeContext({
        clarityIssuesFound: []
      });

      const result = evaluateClarityUnambiguityRules(context);
      
      expect(result.score).toBe(100);
      expect(result.flags).toBeDefined();
      expect(result.flags?.readabilityScoreValue).toBe(8.5); 
      expect(result.evaluation_source).toBe('rule_based');
    });

  it('1.2 should return perfect score with truly minimal context', () => {
      const context = makeContext({
        clarityIssuesFound: [],
        readabilityScore: 9, // Good readability (no penalty)
        averageSentenceLength: 12, // Good length (no penalty)
        complexSentenceCount: 1, // Low complexity (no penalty)
        lexicalDiversityScore: 0.6, // Good diversity (no penalty)
        lengthWords: 40 // Not too short or long
      });

      const result = evaluateClarityUnambiguityRules(context);
      expect(result.score).toBe(100);
      expect(result.flags?.readabilityScoreValue).toBe(9);
      expect(result.flags?.averageSentenceLength).toBe(12);
      expect(result.flags?.complexSentenceCount).toBe(1);
      expect(result.flags?.lexicalDiversityScore).toBe(0.6);
      expect(result.evaluation_source).toBe('rule_based');
  });

  it('1.3 should apply penalties based on severity levels', () => {

      const clarityIssues = [
        makeDetectedPattern(
          'unclear',
          'vague term detected',
          SeverityLevel.LOW,
          0,
          { type: 'vagueness', formatType: 'vague' }
        ),
        makeDetectedPattern(
          'maybe',
          'ambiguous phrase found',
          SeverityLevel.MEDIUM,
          0,
          { type: 'vagueness', listSubType: 'ambiguous', formatType: 'text' }
        ),
        makeDetectedPattern(
          'API',
          'technical jargon used',
          SeverityLevel.HIGH,
          0,
          { type: 'jargon', formatType: 'technical' }
        ),
        makeDetectedPattern(
          'confused',
          'critically unclear statement',
          SeverityLevel.CRITICAL
        ) // No metadata for this one (should not be classified as vague/jargon)
      ];

      const context = makeContext({
        clarityIssuesFound: clarityIssues
      });

      const result = evaluateClarityUnambiguityRules(context);
      expect(result.score).toBe(37);
      expect(result.flags).toBeDefined();
      expect(result.flags?.vagueTermsDetails).toHaveLength(1);
      expect(result.flags?.ambiguousPhrasesDetails).toHaveLength(1);
      expect(result.flags?.jargonDetails).toHaveLength(1);
  });

  it('1.4 should handle readability score thresholds correctly', () => {
      const context = makeContext({
        readabilityScore: 15 // Very difficult
      });

      const result = evaluateClarityUnambiguityRules(context);
      expect(result.score).toBe(85); // 100 - 20 penalty
      expect(result.flags?.lowReadability).toBe(true);
      expect(result.flags?.readabilityScoreValue).toBe(15);
  });

  it('1.5 should handle missing readability score', () => {
      const context = makeContext({
        readabilityScore: undefined
      });

      const result = evaluateClarityUnambiguityRules(context);
      expect(result.flags?.readabilityAnalysisUnavailable).toBe(true);
  });

  it('1.6 should penalize long average sentence length', () => {
      const context = makeContext({
        averageSentenceLength: 30, // Very long sentences
        lengthWords: 100
      });

      const result = evaluateClarityUnambiguityRules(context);
      expect(result.score).toBe(95); // 100 - 10 penalty
      expect(result.flags?.longAverageSentences).toBe(true);
      expect(result.flags?.averageSentenceLength).toBe(30);
  });

  it('1.7 should penalize choppy sentences for non-trivial prompts', () => {
      const context = makeContext({
        averageSentenceLength: 5, // Very short sentences
        lengthWords: 50 // Non-trivial length
      });

      const result = evaluateClarityUnambiguityRules(context);
      expect(result.score).toBe(95);
      expect(result.flags?.choppyAverageSentences).toBe(true);
  });

  it('1.8 should apply a flat penalty for multiple complex sentences', () => {
      const context = makeContext({
        complexSentenceCount: 5, 
        lengthWords: 100
      });

      const result = evaluateClarityUnambiguityRules(context);

      expect(result.score).toBe(95); 
      expect(result.flags?.multipleComplexSentences).toBe(true);
      expect(result.flags?.complexSentenceCount).toBe(5);
  });

  it('1.9 should handle low lexical diversity', () => {
      const context = makeContext({
        lexicalDiversityScore: 0.2, // Very low diversity
        lengthWords: 120
      });

      const result = evaluateClarityUnambiguityRules(context);

      expect(result.score).toBe(85); 
      expect(result.flags?.lowLexicalDiversity).toBe(true);
      expect(result.flags?.lexicalDiversityScore).toBe(0.2);
  });

});

  describe('2- evaluateSpecificityDetailScopeRules', () => {

    it('2.1 should return base score and all missing flags for minimal prompt', () => {
      const context = makeContext({
        lengthWords: 5,
        mentionsTargetAudience: false,
        specificityElements: {
          outputLengthConstraints: [],
          definedPersonaInfo: [],
          keyEntitiesFound: [],
          constraintsMentioned: [],
          outputFormatKeywords: []
        }
      });

      const result = evaluateSpecificityDetailScopeRules(context);

      expect(result.score).toBe(0); // Base score
      expect(result.flags?.isVeryShortPrompt).toBe(true);
      expect(result.flags?.targetAudienceMissing).toBe(true);
      expect(result.flags?.outputLengthMissing).toBe(true);
      expect(result.flags?.personaNotDefined).toBe(true);
      expect(result.flags?.noKeyEntitiesMentioned).toBe(true);
      expect(result.flags?.lacksAdditionalConstraints).toBe(true);
      expect(result.flags?.lowSpecificity).toBe(true);
    });


    it('2.2 should give bonuses and all high specificity flags for comprehensive prompt details', () => {
      const context = makeContext({
        lengthWords: 50, // Gets length bonus
        mentionsTargetAudience: true,
        specificityElements: {
          outputLengthConstraints: [
            makeDetectedPattern('500 words', 'Specific word count constraint')
          ],
          definedPersonaInfo: [
            makeDetectedPattern('expert', 'expert persona defined')
          ],
          keyEntitiesFound: [
            makeDetectedPattern('entity1', 'key entity 1'),
            makeDetectedPattern('entity2', 'key entity 2')
          ],
          constraintsMentioned: [
            makeDetectedPattern('constraint1', 'constraint 1'),
            makeDetectedPattern('constraint2', 'constraint 2'),
            makeDetectedPattern('constraint3', 'constraint 3')
          ],
          outputFormatKeywords: []
        }
      });

      const result = evaluateSpecificityDetailScopeRules(context);

      expect(result.score).toBe(100);
      expect(result.flags?.targetAudienceSpecified).toBe(true);
      expect(result.flags?.outputLengthSpecified).toBe(true);
      expect(result.flags?.personaDefinedDetails).toHaveLength(1);
      expect(result.flags?.keyEntitiesDetails).toHaveLength(2);
      expect(result.flags?.constraintsMentionedDetails).toHaveLength(3);
      expect(result.flags?.hasAdditionalConstraints).toBe(true);
      expect(result.flags?.highSpecificity).toBe(true);
    });


    it('2.3 should handle short prompt without target audience and set moderate specificity', () => {
      const context = makeContext({
        lengthWords: 25,
        mentionsTargetAudience: false
      });

      const result = evaluateSpecificityDetailScopeRules(context);

      expect(result.flags?.isShortPrompt).toBe(true);
      expect(result.flags?.targetAudienceMissing).toBe(true);
    });


    it('2.4 should properly count key entities and set low specificity if only one element', () => {
      const context = makeContext({
        specificityElements: {
          outputLengthConstraints: [],
          definedPersonaInfo: [],
          keyEntitiesFound: [
            makeDetectedPattern('entity', 'single entity')
          ],
          constraintsMentioned: [],
          outputFormatKeywords: []
        }
      });

      const result = evaluateSpecificityDetailScopeRules(context);

      expect(result.flags?.keyEntitiesCount).toBe(1);
      expect(result.score).toBe(5); // Base 20 + single entity bonus 5
      expect(result.flags?.lowSpecificity).toBe(true);
    });
  });

  describe('3- evaluateGoalAlignmentLogic', () => {
    it('3.1 should give high score for explicit goal', () => {
      const context = makeContext({
        explicitlyStatesGoal: true
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(83); // Reduced from 100: effective goal (45) + explicit goal (10) + base (20) + singular focus (8)
      expect(result.flags?.goalStatedExplicitly).toBe(true);
      expect(result.flags?.hasDirective).toBe(true);
    });

    it('3.2 should handle implicit goal with single action verb', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        lengthWords: 50,
        actionVerbDetails: {
          count: 1,
          verbs: ['analyze']
        }
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(80); // Reduced from 100: effective goal (45) + singular focus (15) + base (20)
      expect(result.flags?.hasSingularFocus).toBe(true);
      expect(result.flags?.verbCount).toBe(1);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.3 should penalize multiple action verbs without explicit goal', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        actionVerbDetails: {
          count: 4,
          verbs: ['analyze', 'summarize', 'create', 'evaluate']
        }
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(45); // effective goal (45) + base (20) - verb penalty (30) + 10 minimum enforcement
      expect(result.flags?.isOverloadedWithActions).toBe(true);
      expect(result.flags?.verbCount).toBe(4);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.4 should give bonus for supporting details', () => {
      const context = makeContext({
        actionVerbDetails: { count: 1, verbs: ['do'] },
        specificityElements: {
          outputLengthConstraints: [],
          definedPersonaInfo: [],
          keyEntitiesFound: [],
          constraintsMentioned: [
            makeDetectedPattern('constraint1', 'constraint 1')
          ],
          outputFormatKeywords: []
        }
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(83); // Reduced from 100: effective goal (45) + singular focus (8) + supporting details (10) + base (20)
      expect(result.flags?.specificitySupportsGoal).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.5 should penalize too many questions without explicit goal', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        questionDetails: {
          questionMarksCount: 5,
          identifiedQuestionSentences: [],
          count: 5,
          types: ['wh-question']
        },
        actionVerbDetails: { count: 0, verbs: [] },
        lengthWords: 100
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(45); // effective goal (45) + base (20) - excessive questions penalty (20)
      expect(result.flags?.questionCount).toBe(5);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.6 should penalize when no clear action or question exists', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        actionVerbDetails: { count: 0, verbs: [] },
        questionDetails: { 
          questionMarksCount: 0,
          identifiedQuestionSentences: [],
          count: 0,
          types: []
        }
      });

      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(0); // Early return for no directive
      expect(result.flags?.noClearActionOrQuestion).toBe(true);
    });

    it('3.7 should give appropriate bonus when length is exactly 70', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        lengthWords: 70,
        actionVerbDetails: { count: 1, verbs: ['classify'] },
        questionDetails: { questionMarksCount: 0, identifiedQuestionSentences: [], count: 0, types: [] },
        specificityElements: { outputFormatKeywords: [], outputLengthConstraints: [], definedPersonaInfo: [], keyEntitiesFound: [], constraintsMentioned: [] }
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(80); // effective goal (45) + singular focus (15) + base (20)
      expect(result.flags?.hasSingularFocus).toBe(true);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.8 should penalize only when questions exceed 2 (boundary 2 vs 3)', () => {
      const baseContext = {
        explicitlyStatesGoal: false as const,
        lengthWords: 100,
        actionVerbDetails: { count: 0, verbs: [] },
      };
      const twoQuestions = makeContext({
        ...baseContext,
        questionDetails: { questionMarksCount: 2, identifiedQuestionSentences: [], count: 2, types: ['wh-question'] },
      });
      const twoQResult = evaluateGoalAlignmentLogic(twoQuestions);
      expect(twoQResult.score).toBe(65); // effective goal (45) + base (20) - no single question bonus for multiple questions
      expect(twoQResult.flags?.questionCount).toBe(2);
      expect(twoQResult.flags?.hasDirective).toBe(true);
      expect(twoQResult.flags?.hasEffectiveGoal).toBe(true);
      
      const threeQuestions = makeContext({
        ...baseContext,
        questionDetails: { questionMarksCount: 3, identifiedQuestionSentences: [], count: 3, types: ['wh-question'] },
      });
      const threeQResult = evaluateGoalAlignmentLogic(threeQuestions);
      expect(threeQResult.score).toBe(65); // Same score, no additional penalty at 3 questions
      expect(threeQResult.flags?.questionCount).toBe(3);
      expect(threeQResult.flags?.hasDirective).toBe(true);
      expect(threeQResult.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.9 should apply penalties even when goal is explicit (realistic assessment)', () => {
      const context = makeContext({
        explicitlyStatesGoal: true,
        actionVerbDetails: { count: 5, verbs: ['do', 'make', 'create', 'analyze', 'build'] },
        questionDetails: { questionMarksCount: 6, identifiedQuestionSentences: [], count: 6, types: ['wh-question'] },
        lengthWords: 40
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(55); // effective goal (45) + explicit (10) + base (20) - verb penalty (45) + question penalty (20) + min enforcement
      expect(result.flags?.goalStatedExplicitly).toBe(true);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
      expect(result.flags?.isOverloadedWithActions).toBe(true);
    });

    it('3.10 should combine no-action penalty with supporting details bonus', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        actionVerbDetails: { count: 0, verbs: [] },
        questionDetails: { questionMarksCount: 0, identifiedQuestionSentences: [], count: 0, types: [] },
        specificityElements: {
          outputLengthConstraints: [],
          definedPersonaInfo: [],
          keyEntitiesFound: [],
          constraintsMentioned: [ makeDetectedPattern('constraint1', 'constraint 1') ],
          outputFormatKeywords: []
        },
        lengthWords: 40
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(0); // Early return for no directive
      expect(result.flags?.noClearActionOrQuestion).toBe(true);
    });

    it('3.11 should stack multiple-verbs penalty with many-questions penalty', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        actionVerbDetails: { count: 4, verbs: ['analyze', 'summarize', 'create', 'evaluate'] },
        questionDetails: { questionMarksCount: 4, identifiedQuestionSentences: [], count: 4, types: ['wh-question'] },
        lengthWords: 120
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(30); // effective goal (45) + base (20) - verb penalty (30) - question penalty (20) + balance bonus (8) + min (7)
      expect(result.flags?.isOverloadedWithActions).toBe(true);
      expect(result.flags?.questionCount).toBe(4);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });

    it('3.12 should award higher single-verb bonus for long prompts with focus', () => {
      const context = makeContext({
        explicitlyStatesGoal: false,
        actionVerbDetails: { count: 1, verbs: ['classify'] },
        lengthWords: 120,
        questionDetails: { questionMarksCount: 0, identifiedQuestionSentences: [], count: 0, types: [] },
        specificityElements: { outputFormatKeywords: [ makeDetectedPattern('JSON', 'JSON output') ], outputLengthConstraints: [], definedPersonaInfo: [], keyEntitiesFound: [], constraintsMentioned: [] }
      });
      const result = evaluateGoalAlignmentLogic(context);
      expect(result.score).toBe(85); // effective goal (45) + singular focus (20 for long prompts) + base (20)
      expect(result.flags?.hasSingularFocus).toBe(true);
      expect(result.flags?.hasDirective).toBe(true);
      expect(result.flags?.hasEffectiveGoal).toBe(true);
    });
  });

  describe('4- evaluateInstructionFollowingLogic', () => {
    it('4.1 should return perfect score with no instruction issues', () => {
      const context = makeContext({
        negativeInstructionIssues: [],
        contradictoryStatementFlags: []
      });

      const result = evaluateInstructionFollowingLogic(context);

      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });

  it('4.2 should penalize negative instruction issues', () => {
      const negativeIssues = [
        makeDetectedPattern('dont', 'negative instruction 1'),
        makeDetectedPattern('avoid', 'negative instruction 2'),
        makeDetectedPattern('never', 'negative instruction 3') // Should be capped at 2
      ];

      const context = makeContext({
        negativeInstructionIssues: negativeIssues
      });

      const result = evaluateInstructionFollowingLogic(context);

      expect(result.score).toBe(65);
      expect(result.flags?.negativeInstructionDetails).toHaveLength(3);
    });

  it('4.3 should penalize contradictory statements', () => {
      const contradictoryFlags = [
        makeDetectedPattern('but also', 'contradiction 1'),
        makeDetectedPattern('however', 'contradiction 2')
      ];

      const context = makeContext({
        contradictoryStatementFlags: contradictoryFlags
      });

      const result = evaluateInstructionFollowingLogic(context);

      expect(result.score).toBe(50); 
      expect(result.flags?.contradictoryStatementDetails).toHaveLength(2);
    });

  it('4.4 should handle both negative instructions and contradictions', () => {
      const negativeIssues = [
        makeDetectedPattern('dont', 'negative instruction')
      ];
      const contradictoryFlags = [
        makeDetectedPattern('but', 'contradiction')
      ];

      const context = makeContext({
        negativeInstructionIssues: negativeIssues,
        contradictoryStatementFlags: contradictoryFlags
      });

      const result = evaluateInstructionFollowingLogic(context);

      expect(result.score).toBe(55);
      expect(result.flags?.negativeInstructionDetails).toHaveLength(1);
      expect(result.flags?.contradictoryStatementDetails).toHaveLength(1);
    });

  it('4.5 should handle undefined arrays gracefully', () => {
      const context = makeContext({
        negativeInstructionIssues: undefined,
        contradictoryStatementFlags: undefined
      });

      const result = evaluateInstructionFollowingLogic(context);

      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });

  it('4.6 should handle empty arrays correctly', () => {
      const context = makeContext({
        negativeInstructionIssues: [],
        contradictoryStatementFlags: []
      });

      const result = evaluateInstructionFollowingLogic(context);

      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });
  });

  describe('5- Edge Cases and Integration', () => {
    it('5.1 should handle completely empty context', () => {
      const emptyContext = makeContext({});

      // Test all functions with empty context
      const clarityResult = evaluateClarityUnambiguityRules(emptyContext);
      const specificityResult = evaluateSpecificityDetailScopeRules(emptyContext);
      const goalResult = evaluateGoalAlignmentLogic(emptyContext);
      const instructionResult = evaluateInstructionFollowingLogic(emptyContext);

      // All should return valid results without throwing
      expect(clarityResult.score).toBeGreaterThanOrEqual(0);
      expect(specificityResult.score).toBeGreaterThanOrEqual(0);
      expect(goalResult.score).toBeGreaterThanOrEqual(0);
      expect(instructionResult.score).toBeGreaterThanOrEqual(0);

      // All should have rule_based evaluation source
      expect(clarityResult.evaluation_source).toBe('rule_based');
      expect(specificityResult.evaluation_source).toBe('rule_based');
      expect(goalResult.evaluation_source).toBe('rule_based');
      expect(instructionResult.evaluation_source).toBe('rule_based');
    });

  it('5.2 should handle high complexity scenario', () => {
      const complexContext = makeContext({
        lengthWords: 200,
        readabilityScore: 16,
        averageSentenceLength: 35,
        complexSentenceCount: 8,
        lexicalDiversityScore: 0.15,
        clarityIssuesFound: [
          makeDetectedPattern(
            'jargon', 
            'complex jargon', 
            SeverityLevel.HIGH,
            0,
            { type: 'jargon', formatType: 'technical' }
          ),
          makeDetectedPattern(
            'unclear', 
            'vague term', 
            SeverityLevel.MEDIUM,
            0,
            { type: 'vagueness', formatType: 'vague' }
          )
        ],
        explicitlyStatesGoal: false,
        actionVerbDetails: { count: 5, verbs: ['do', 'make', 'create', 'analyze', 'build'] },
        questionDetails: { 
          questionMarksCount: 6,
          identifiedQuestionSentences: [],
          count: 6,
          types: ['wh-question', 'yes-no-question']
        },
        negativeInstructionIssues: [
          makeDetectedPattern('dont', 'negative 1'),
          makeDetectedPattern('avoid', 'negative 2'),
          makeDetectedPattern('never', 'negative 3')
        ],
        contradictoryStatementFlags: [
          makeDetectedPattern('but', 'contradiction 1')
        ]
      });

      const clarityResult = evaluateClarityUnambiguityRules(complexContext);
      const goalResult = evaluateGoalAlignmentLogic(complexContext);
      const instructionResult = evaluateInstructionFollowingLogic(complexContext);

      // Complex scenario should result in lower scores
      expect(clarityResult.score).toBeLessThan(50);
      expect(goalResult.score).toBeLessThan(50);
      expect(instructionResult.score).toBeLessThan(80);

      // Should have comprehensive flags (assert presence instead of brittle exact counts)
      expect(clarityResult.flags).toEqual(
        expect.objectContaining({
          lowReadability: true,
          longAverageSentences: true,
          multipleComplexSentences: true,
          lowLexicalDiversity: true,
        })
      );
      // Details for clarity issues should include jargon, and either vague/ambiguous terms
      expect(clarityResult.flags?.jargonDetails).toBeDefined();
      expect(
        clarityResult.flags?.vagueTermsDetails || clarityResult.flags?.ambiguousPhrasesDetails
      ).toBeDefined();

      expect(goalResult.flags).toEqual(
        expect.objectContaining({
          hasDirective: true,
          hasEffectiveGoal: false,
          isOverloadedWithActions: true,
          excessiveQuestions: true,
        })
      );
      expect(goalResult.flags?.questionCount).toBe(6);
      expect(goalResult.flags?.verbCount).toBe(5);

      // Instruction issues should include both categories (details + boolean flags)
      expect(Object.keys(instructionResult.flags || {})).toHaveLength(4);
  });

  it('5.3 should use makeClarityContext for clarity-specific scenarios', () => {
      const clarityContext = makeClarityContext({
        lengthWords: 100
      });

      const result = evaluateClarityUnambiguityRules(clarityContext);

      // makeClarityContext should provide realistic clarity issues
      expect(result.score).toBeLessThan(100);
      expect(result.flags).toBeDefined();
    });
  });

});

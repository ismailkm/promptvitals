// src/lib/agents/__tests__/ContextContentAgent.test.ts

import {
  evaluateContextSufficiencyLogic,
  evaluateContextRelevanceLogic
} from '../ContextContentAgent';
import { makeContext } from '@/lib/agent-utils/fixtureBuilders';
import { SeverityLevel } from '@/lib/types/shared';

describe('ContextContentAgent - Rule-based', () => {
  describe('evaluateContextSufficiencyLogic', () => {
    it('returns high score for sufficient context', () => {
      const context = makeContext({
        contextIndicatorsFound: [],
        specificityElements: { keyEntitiesFound: [], outputLengthConstraints: [] },
        mentionsTargetAudience: true,
        explicitlyStatesGoal: true,
        actionVerbDetails: { count: 1, verbs: ['write'] },
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
        clarityIssuesFound: [],
        lengthWords: 50
      });
      const result = evaluateContextSufficiencyLogic(context);
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.flags!.mentionsTargetAudience).toBe(true);
      expect(result.flags!.explicitGoalStated).toBe(true);
      expect(result.flags!.singleActionVerb).toBe(true);
      expect(result.evaluation_source).toBe('rule_based');
    });

    it('applies penalties for vague terms and insufficient context', () => {
      const context = makeContext({
        contextIndicatorsFound: [],
        specificityElements: { keyEntitiesFound: [], outputLengthConstraints: [] },
  clarityIssuesFound: [{ matchedPatternSource: 'test', severity: SeverityLevel.LOW, reason: 'vague', matchedText: 'vague', startIndex: 0, endIndex: 5 }],
        lengthWords: 10,
        actionVerbDetails: { count: 2, verbs: ['do', 'make'] },
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
      const result = evaluateContextSufficiencyLogic(context);
      expect(result.score).toBeLessThan(50);
  expect(result.flags!.vagueTermsHurtContext).toBe(true);
  expect(result.flags!.insufficientContextForTask).toBe(true);
    });
  });

  describe('evaluateContextRelevanceLogic', () => {
    it('returns high score for relevant context', () => {
      const context = makeContext({
        lengthWords: 100,
        lexicalDiversityScore: 0.7,
        mentionsExternalReference: false,
        specificityElements: { keyEntitiesFound: [], outputLengthConstraints: [] },
        instructionsAndStructure: {
          explicitFormatRequests: [],
          requestsSpecificFormat: null,
          bulletPointUsage: { detected: false },
          sectionCount: 1,
          exampleDetails: [],
          placeholderDetails: [],
          toneStyleGuidance: [],
          stepMarkerDetails: []
        }
      });
      const result = evaluateContextRelevanceLogic(context);
      expect(result.score).toBe(100);
  expect(result.flags!.potentialRedundancy).toBeUndefined();
  expect(result.flags!.mentionsExternalReference).toBeUndefined();
    });

    it('applies penalty for redundancy and external references', () => {
      const context = makeContext({
        lengthWords: 200,
        lexicalDiversityScore: 0.2,
        mentionsExternalReference: true,
        specificityElements: { keyEntitiesFound: [], outputLengthConstraints: [] },
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
      const result = evaluateContextRelevanceLogic(context);
      expect(result.score).toBeLessThan(100);
  expect(result.flags!.potentialRedundancy).toBeDefined();
  expect(result.flags!.mentionsExternalReference).toBe(true);
    });
  });
});

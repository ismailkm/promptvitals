// src/lib/agents/__tests__/ContextContentAgent.hybrid.test.ts

import { evaluateContextContentHybrid } from '../ContextContentAgent';
import { makeContext, makeDetectedPattern } from '@/lib/agent-utils/fixtureBuilders';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';

describe('ContextContentAgent - Hybrid', () => {
  const fakeAI = async (
    context: AnalyzedPromptDataContext,
    eligibleFeatures: string[]
  ) => {
    // Simulate AI returning a boost for sufficiency if eligible
    const result: any = {};
    if (eligibleFeatures.includes('contextSufficiencyReview')) {
      result.contextSufficiency = {
        confidence: 0.95,
        assessment: 'excellent',
        missingInfo: [],
        relevanceIssues: [],
        rationale: 'All context provided.'
      };
    }
    if (eligibleFeatures.includes('contextRelevanceReview')) {
      result.contextRelevance = {
        confidence: 0.9,
        assessment: 'excellent',
        missingInfo: [],
        relevanceIssues: [],
        rationale: 'No redundancy.'
      };
    }
    return result;
  };

  it('returns enhanced results when AI is eligible', async () => {
    const context = makeContext({
      contextIndicatorsFound: [makeDetectedPattern('background', 'context indicator')],
      specificityElements: {
        keyEntitiesFound: [makeDetectedPattern('entity1', 'key entity')],
        outputLengthConstraints: []
      },
      lengthWords: 201, // triggers AI eligibility for both sufficiency and relevance
      mentionsExternalReference: true // also triggers eligibility
    });
    const res = await evaluateContextContentHybrid(context, fakeAI);
    console.log({res})
    expect(res.contextSufficiency).toBeDefined();
    expect(res.contextRelevance).toBeDefined();
    expect(res.contextSufficiency.evaluation_source).toBe('hybrid_rule_dominant');
    expect(res.contextRelevance.evaluation_source).toBe('hybrid_rule_dominant');
    expect(res.contextSufficiency.score).toBeGreaterThan(0);
    expect(res.contextRelevance.score).toBeGreaterThan(0);
  });

  it('returns rule-based results if AI not eligible', async () => {
    const context = makeContext({
      contextIndicatorsFound: [],
      specificityElements: { keyEntitiesFound: [], outputLengthConstraints: [] },
      lengthWords: 5
    });
    // Simulate AI never called (empty eligibleFeatures)
    // (no-op, not needed for this test)
    const res = await evaluateContextContentHybrid(context, fakeAI);
    expect(res.contextSufficiency).toBeDefined();
    expect(res.contextRelevance).toBeDefined();
    expect(res.contextSufficiency.evaluation_source).toBe('rule_based');
    expect(res.contextRelevance.evaluation_source).toBe('rule_based');
  });
});

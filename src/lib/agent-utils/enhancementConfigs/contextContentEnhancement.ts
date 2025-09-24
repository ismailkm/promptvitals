// src/lib/agent-utils/enhancementConfigs/contextContentEnhancement.ts

import { EnhancementConfig, AIEligibilityRule } from '@/lib/types/aiTypes';
import { evaluateContextSufficiencyLogic } from '@/lib/agents/ContextContentAgent';
import { createGenericEnhancement } from '../hybridEnhancement';
import { createEligibilityRule } from '../aiEligibility';

/**
 * AI eligibility rules for ContextContentAgent.
 * Keep these conservative: prefer AI when external refs present, borderline rule scores, or long prompts with few entities.
 */
export const CONTEXT_CONTENT_AI_ELIGIBILITY_RULES: AIEligibilityRule[] = [
  createEligibilityRule('contextSufficiencyReview', (ctx) => {
    // trigger when analyzer finds external references
    if (ctx.mentionsExternalReference) return true;
    // long prompt with few key entities
    const keyEntities = ctx.specificityElements?.keyEntitiesFound?.length ?? 0;
    if ((ctx.lengthWords ?? 0) > 200 && keyEntities <= 1) return true;
    // borderline rule-based score should trigger review (50-75)
    try {
      const ruleScore = evaluateContextSufficiencyLogic(ctx).score ?? 0;
      if (ruleScore >= 50 && ruleScore <= 75) return true;
    } catch (e) {
      // ignore
    }
    // borderline rule-based score (handled by caller via ruleResults, keep simple here)
    return false;
  }),
  createEligibilityRule('contextRelevanceReview', (ctx) => {
    // trigger relevance review for long prompts
    return (ctx.lengthWords ?? 0) > 150 || !!ctx.mentionsExternalReference;
  }),
];

// Enhancement configs
const CONTEXT_SUFFICIENCY_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 30,
  mediumConfidenceBonus: 10,
  lowConfidenceBonus: 3,
  lowConfidencePenalty: -15,
  customLogic: (ai, confidence) => {
    // Map assessment labels to adjustments
    const assessment = ai.assessment || '';
    if (assessment === 'insufficient') return -30;
    if (assessment === 'sufficient') return 10;
    if (assessment === 'excellent') return 30;
    // fallback to confidence-driven heuristic
    if (confidence >= 0.9) return 10;
    if (confidence >= 0.7) return 5;
    if (confidence < 0.5) return -10;
    return 0;
  },
};

const CONTEXT_RELEVANCE_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 15,
  mediumConfidenceBonus: 6,
  lowConfidenceBonus: 2,
  lowConfidencePenalty: -12,
  customLogic: (ai, confidence) => {
    // Penalize when AI finds many relevanceIssues, reward otherwise.
    const issues = Array.isArray(ai.relevanceIssues) ? ai.relevanceIssues.length : 0;
    if (issues > 2 && confidence >= 0.8) return -20;
    if (issues > 0 && confidence >= 0.6) return -8;
    if (issues === 0 && confidence >= 0.8) return 10;
    return 0;
  },
};

export const createContextContentEnhancements = () => ({
  contextSufficiencyReview: createGenericEnhancement(CONTEXT_SUFFICIENCY_CONFIG, (ai) => ({
    assessment: ai.assessment,
    missingInfo: ai.missingInfo,
  })),

  contextRelevanceReview: createGenericEnhancement(CONTEXT_RELEVANCE_CONFIG, (ai) => ({
    relevanceIssues: ai.relevanceIssues,
  })),
});

export const CONTEXT_CONTENT_ENHANCEMENT_MAP = {
  contextSufficiencyReview: {
    enhancer: createContextContentEnhancements().contextSufficiencyReview,
    aiField: 'contextSufficiency',
    resultField: 'contextSufficiency' as const,
  },
  contextRelevanceReview: {
    enhancer: createContextContentEnhancements().contextRelevanceReview,
    aiField: 'contextRelevance',
    resultField: 'contextRelevance' as const,
  },
};

 
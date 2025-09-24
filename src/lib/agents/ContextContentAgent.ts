// src/lib/agents/ContextContentAgent.ts

import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { AIContextContentAnalysisFactory } from '@/lib/types/aiTypes';
import { applyScoreBonus, applyScorePenalty, clampScore, getScoreFromThresholds } from '@/lib/agent-utils/scoring';
import { CONTEXT_INDICATOR_BONUS_THRESHOLDS, CONTEXT_KEY_ENTITY_BONUS_THRESHOLDS, LEXICAL_DIVERSITY_PENALTY_THRESHOLDS } from '@/lib/config/scoringThresholds';
import { computeRuleBasedResults } from '@/lib/agent-utils/ruleBasedEvaluation';
import { determineAIEligibilityFromRules } from '@/lib/agent-utils/aiEligibility';
import { executeAIAnalysisWithErrorHandling, applyAIEnhancements } from '@/lib/agent-utils/hybridEnhancement';
import { CONTEXT_CONTENT_AI_ELIGIBILITY_RULES, CONTEXT_CONTENT_ENHANCEMENT_MAP } from '@/lib/agent-utils/enhancementConfigs';

import { KpiMistakeKeys, MISTAKE_KEYS } from '@/lib/config/kpis/kpiMistakes';
import { filterVagueTermsWithContext } from '@/lib/agent-utils/clarityUtils';
import { extractPatternMetadata, isPatternMetadataOfType } from '@/lib/agent-utils/patterns';

/**
 * Evaluates Context Sufficiency.
 * This function provides a score based on explicit signals that the user has provided enough context.
 */
export const evaluateContextSufficiencyLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 20; // Start with a low base score.
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  // --- Use thresholds for primary bonuses ---
  const contextIndicatorsCount = analyzedContext.contextIndicatorsFound?.length ?? 0;
  const indicatorBonus = getScoreFromThresholds(contextIndicatorsCount, CONTEXT_INDICATOR_BONUS_THRESHOLDS, 0);
  score += indicatorBonus;
  flags.contextIndicatorsCount = contextIndicatorsCount;

  const keyEntitiesCount = analyzedContext.specificityElements?.keyEntitiesFound?.length ?? 0;
  const entityBonus = getScoreFromThresholds(keyEntitiesCount, CONTEXT_KEY_ENTITY_BONUS_THRESHOLDS, 0);
  score += entityBonus;
  flags.keyEntitiesCount = keyEntitiesCount;

  // --- Apply secondary, contextual bonuses ---
  const audienceDetails = analyzedContext.audienceDetails || [];

  if (analyzedContext.mentionsTargetAudience) {
    flags.audienceDetails = audienceDetails;

    if (analyzedContext.hasConfidentAudienceMention) {
      // A large, +20 point bonus for an explicit, high-quality audience definition.
      score = applyScoreBonus(true, 20, score);
      flags.audienceBonus = 20;
    } else {
      // A smaller, +10 point bonus for a lower-confidence, implicit mention.
      score = applyScoreBonus(true, 10, score);
      flags.audienceBonus = 10;
    }
  } else {
    // If the prompt is long and complex but has no audience, it's a flaw.
    const wordCount = analyzedContext.lengthWords ?? 0;
    if (wordCount > 50) {
      score = applyScorePenalty(true, 10, score);
      flags.audienceIsMissingPenalty = 10;
      mistakes.add(MISTAKE_KEYS.IgnoringAudience);
    }
  }
  // Bonus: explicitly stated goal
  if (analyzedContext.explicitlyStatesGoal) {
    score = applyScoreBonus(true, 15, score);
    flags.explicitGoalStated = true;
  }
  // Bonus: single clear action verb
  const actionVerbCountForBonus = analyzedContext.actionVerbDetails?.count ?? 0;
  if (actionVerbCountForBonus === 1) {
    score = applyScoreBonus(true, 10, score);
    flags.singleActionVerb = true;
  }
  const exampleCount = analyzedContext.instructionsAndStructure?.exampleDetails?.length ?? 0;
  if (exampleCount > 0) {
    // Reduce example bonus if explicit context indicators already provided (avoid double-crediting)
    const exampleBonus = contextIndicatorsCount > 0 ? 8 : 15;
    score = applyScoreBonus(true, exampleBonus, score);
    flags.hasExamplesAsContext = exampleCount;
  }

  // --- Apply Penalties ---
  // Apply context-aware vague term filtering
  const rawVagueMatches = analyzedContext.clarityIssuesFound?.filter(m => {
    // Use pattern metadata utilities for robust detection
    const metadata = extractPatternMetadata(m);
    if (isPatternMetadataOfType(metadata, 'vagueness')) {
      return true;
    }
    if (typeof m.reason === 'string' && m.reason.toLowerCase().includes('vague')) {
      return true;
    }
    return false;
  }) || [];

  const contextAwareVagueMatches = filterVagueTermsWithContext(
    rawVagueMatches,
    analyzedContext.promptText,
    analyzedContext.lengthWords ?? 0
  );

  const vagueCount = contextAwareVagueMatches.length;
  if (vagueCount > 0) {
    score = applyScorePenalty(true, Math.min(25, 8 * vagueCount), score);
    flags.vagueTermsHurtContext = true;
    flags.vagueTermsCount = vagueCount;
    flags.vagueTermsMatched = contextAwareVagueMatches.map(m => m.matchedText);
    mistakes.add(MISTAKE_KEYS.VagueOrUnclearPrompts);
  }
  
  const wordCount = analyzedContext.lengthWords ?? 0;
  const actionVerbCount = analyzedContext.actionVerbDetails?.count ?? 0;
  if (wordCount < 25 && actionVerbCount > 1) {
    score = applyScorePenalty(true, 20, score);
    flags.insufficientContextForTask = true;
    mistakes.add(MISTAKE_KEYS.MissingContext);
  }

  // Cap combined threshold-derived bonuses to avoid runaway scores
  const maxThresholdBonus = 60;
  const thresholdDerived = (indicatorBonus || 0) + (entityBonus || 0);
  if (thresholdDerived > maxThresholdBonus) {
    const excess = thresholdDerived - maxThresholdBonus;
    score = applyScorePenalty(true, excess, score); // remove excess
    flags.thresholdBonusCapped = true;
  }

  // Only flag MissingContext if the score is low AND there is actual evidence of missing context
  if (clampScore(score) < 40) {
    // Evidence: no context indicators, no key entities, no audience, no examples
    const hasNoContextIndicators = contextIndicatorsCount === 0;
    const hasNoKeyEntities = keyEntitiesCount === 0;
    const hasNoAudience = !analyzedContext.mentionsTargetAudience;
    const hasNoExamples = exampleCount === 0;
    if (hasNoContextIndicators && hasNoKeyEntities && hasNoAudience && hasNoExamples) {
      mistakes.add(MISTAKE_KEYS.MissingContext);
    }
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based',
  };
};

/**
 * Evaluates Context Relevance.
 * Penalizes signals of redundant or irrelevant information.
 */
export const evaluateContextRelevanceLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 100; // Start high and penalize for relevance issues.
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  const wordCount = analyzedContext.lengthWords ?? 0;
  const lexicalDiversity = analyzedContext.lexicalDiversityScore ?? null;

  // Use lexical diversity penalty thresholds for long prompts
  if (wordCount > 150 && lexicalDiversity !== null) {
    const lexPenalty = getScoreFromThresholds(lexicalDiversity, LEXICAL_DIVERSITY_PENALTY_THRESHOLDS, 0);
    if (lexPenalty > 0) {
      score = applyScorePenalty(true, lexPenalty, score);
      flags.potentialRedundancy = { lexicalDiversity, wordCount, penaltyApplied: lexPenalty };
      // Low diversity in a long prompt can be a sign of overloading with irrelevant, repetitive info.
      mistakes.add(MISTAKE_KEYS.OverloadingPrompts);
    }
  }

  // External-reference detection comes from the analyzer (`mentionsExternalReference`)
  if (analyzedContext.mentionsExternalReference) {
    flags.mentionsExternalReference = true;
  }
  
  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based',
  };
};

/**
 * Hybrid evaluator: uses rule-based logic, optionally triggers an AI analysis, and reconciles results.
 */

export async function evaluateContextContentHybrid(
  analyzedContext: AnalyzedPromptDataContext,
  aiContextContentAnalysis: AIContextContentAnalysisFactory
): Promise<{
  contextSufficiency: KpiEvaluationOutput;
  contextRelevance: KpiEvaluationOutput;
}> {
  // Compute rule-based results for all context-related KPIs using centralized utility
  const ruleResults = computeRuleBasedResults(analyzedContext, {
    contextSufficiency: evaluateContextSufficiencyLogic,
    contextRelevance: evaluateContextRelevanceLogic,
  });

  // Determine eligible features for AI enhancement using the configurable rules
  const eligibleFeatures = determineAIEligibilityFromRules(analyzedContext, CONTEXT_CONTENT_AI_ELIGIBILITY_RULES);

  if (eligibleFeatures.length === 0) {
    return ruleResults;
  }

  // Execute AI analysis with standardized error handling
  const aiResult = await executeAIAnalysisWithErrorHandling(aiContextContentAnalysis, analyzedContext, eligibleFeatures, 'ContextContentAgent');

  if (!aiResult) {
    return ruleResults; 
  }

  // Apply AI enhancements using centralized utility and enhancement map
  return applyAIEnhancements(
    ruleResults,
    aiResult,
    eligibleFeatures,
    CONTEXT_CONTENT_ENHANCEMENT_MAP
  );

}
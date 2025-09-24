// src/lib/agents/SafetyEthicsAgent.ts

import { KpiEvaluationSource, RiskAssessmentLevel, SeverityLevel } from '@/lib/types/shared';
import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { DetectedPatternInfo } from '@/lib/types/patterns';
import { AISafetyAnalysisFactory } from '@/lib/types/aiTypes';

import { 
  applyScorePenalty, 
  clampScore,
  getScoreFromThresholds,
  getBiasRiskLevel, 
  getMaliciousIntentRiskLevel,
  getHighestRiskLevel,
  isRiskLevelAtLeast,
  getRiskLevelNumericValue,
  isHighOrCriticalSeverity,
  mapSeverityToRiskLevel,
  reconcileSafetyKpis
} from '@/lib/agent-utils/scoring';

import {
  BIAS_RISK_PENALTY_THRESHOLDS,
  MALICIOUS_INTENT_PENALTY_THRESHOLDS,
  SECURITY_RISK_SCORE_CAPS
} from '@/lib/config/scoringThresholds';

import {
  SAFETY_ETHICS_AI_ELIGIBILITY_RULES,
  SAFETY_ETHICS_ENHANCEMENT_MAP
} from '@/lib/agent-utils/enhancementConfigs/safetyEthicsEnhancement';

import { computeRuleBasedResults } from '@/lib/agent-utils/ruleBasedEvaluation';
import { determineAIEligibilityFromRules } from '@/lib/agent-utils/aiEligibility';
import {
  executeAIAnalysisWithErrorHandling,
  applyAIEnhancements
} from '@/lib/agent-utils/hybridEnhancement';

import { KpiMistakeKeys, MISTAKE_KEYS } from '@/lib/config/kpis/kpiMistakes';

/**
 * Evaluates the rule-based aspects of "Ethical Safety / Bias Mitigation" KPI.
 * Uses pre-computed bias risk indicators from PromptAnalyzer for efficient, centralized evaluation.
 * This focuses on explicit keyword detection for MVP. AI is crucial for nuanced bias.
 * Corresponds to rule_based_logic_fn: evaluateBasicEthicalKeywordsLogic
 * 
 * @param analyzedContext Contains pre-computed biasRiskIndicators from PromptAnalyzer
 * @returns KPI evaluation with score, flags, and evaluation source
 */
export const evaluateBasicEthicalKeywordsLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 100; // Start assuming ethically safe from a keyword perspective
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>(); 
  let identifiedBiasRiskLevel: RiskAssessmentLevel | null = null;

  // Rule 1: Use pre-computed bias risk indicators from PromptAnalyzer
  // This centralizes the source of truth and avoids re-computation
  const biasIndicators = analyzedContext.biasRiskIndicators;

  // DEBUG: Log bias indicators and their severities for troubleshooting
  if (biasIndicators && biasIndicators.length > 0) {

    // Use centralized scoring thresholds for consistency
    const biasPenalty = getScoreFromThresholds(biasIndicators.length, BIAS_RISK_PENALTY_THRESHOLDS);
    score = applyScorePenalty(true, biasPenalty, score);

    // Store detected bias indicators for detailed analysis
    flags.biasRiskIndicatorsFound = biasIndicators;
    flags.biasIndicatorCount = biasIndicators.length;

    // Determine overall bias risk level using centralized utility
    identifiedBiasRiskLevel = getBiasRiskLevel(biasIndicators);

    // If any indicator is HIGH or CRITICAL severity, flag mistake and set assessment comment
    const hasHighOrCritical = biasIndicators.some((ind: any) => isHighOrCriticalSeverity(ind.severity));
    if (hasHighOrCritical) {
      score = Math.min(score, 40); // Cap score for severe bias
      flags.assessment_comment =
        'CRITICAL: Exclusionary, elitist, or discriminatory language detected. Revise to avoid bias or denial of access.';
      mistakes.add(MISTAKE_KEYS.BiasedOrDiscriminatoryLanguage);
    }
  }

  // Adjust score based on manipulation indicators using helper functions
  const manipulationIndicators = analyzedContext.manipulationIndicators;
  if (manipulationIndicators && manipulationIndicators.length > 0) {

    // Use centralized scoring thresholds for penalties
    const manipulationRiskLevel = getHighestRiskLevel(
      manipulationIndicators.map((ind) => mapSeverityToRiskLevel(ind.severity))
    );
    const penalty = getScoreFromThresholds(
      getRiskLevelNumericValue(manipulationRiskLevel),
      MALICIOUS_INTENT_PENALTY_THRESHOLDS
    );
    score = applyScorePenalty(true, penalty, score);

    // Store detected manipulation indicators for detailed analysis
    flags.manipulationIndicatorsFound = manipulationIndicators;
    flags.manipulationIndicatorCount = manipulationIndicators.length;
    if (isRiskLevelAtLeast(manipulationRiskLevel, RiskAssessmentLevel.HIGH)) {
        mistakes.add(MISTAKE_KEYS.InstructingUnethicalBehaviour); // High-risk manipulation is unethical
    }
  }

  // Only flag bias risk level if it's above LOW threshold
  if (identifiedBiasRiskLevel && isRiskLevelAtLeast(identifiedBiasRiskLevel, RiskAssessmentLevel.MEDIUM)) {
    flags.biasRiskLevel = identifiedBiasRiskLevel;
  }

  // Adjust score based on privacy violation indicators.
  const privacyViolationIndicators = analyzedContext.privacyViolationIndicators;
  if (privacyViolationIndicators && privacyViolationIndicators.length > 0) {
    const privacyRiskLevel = getHighestRiskLevel(
      privacyViolationIndicators.map((ind) => mapSeverityToRiskLevel(ind.severity))
    );
    
    // Use a very high penalty for this type of violation.
    const penalty = getScoreFromThresholds(
      getRiskLevelNumericValue(privacyRiskLevel),
      MALICIOUS_INTENT_PENALTY_THRESHOLDS // You can reuse this or create a new threshold set
    );
    
    score = applyScorePenalty(true, penalty, score);
    
    // Add the findings to the flags for detailed reporting.
    flags.privacyViolationIndicatorsFound = privacyViolationIndicators;
    
    // If the risk is high or critical, add a specific assessment comment.
    if (isRiskLevelAtLeast(privacyRiskLevel, RiskAssessmentLevel.HIGH)) {
      mistakes.add(MISTAKE_KEYS.DataPrivacyViolation);
      flags.assessment_comment = 
        'CRITICAL: The prompt requests instructions for violating data privacy and collecting information without consent.';
    }
  }

  // Penalize for dangerous behavior indicators
  const dangerousBehaviorIndicators = analyzedContext.dangerousBehaviorIndicators;
  if (dangerousBehaviorIndicators && dangerousBehaviorIndicators.length > 0) {
    // Apply severe penalty for dangerous behavior
    score = Math.min(score, 20); // Severe penalty, can be adjusted as needed
    flags.dangerousBehaviorIndicatorsFound = dangerousBehaviorIndicators;
    flags.dangerousBehaviorIndicatorCount = dangerousBehaviorIndicators.length;
    flags.assessment_comment = 'CRITICAL: Dangerous or harmful behavior detected. Revise to ensure safety and ethical compliance.';
    mistakes.add(MISTAKE_KEYS.InstructingUnethicalBehaviour); 
  }

  if (mistakes.size > 0) {
    flags.associated_pdd_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags: Object.keys(flags).length > 0 ? flags : undefined,
    evaluation_source: "rule_based" as KpiEvaluationSource,
  };
};

/**
 * Evaluates "Malicious Intent & Misuse Prevention" KPI based on rules.
 * This is critical and strict.
 * Corresponds to rule_based_logic_fn: evaluateMaliciousIntentLogic
 */
export const evaluateMaliciousIntentLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 100; // Start assuming no malicious intent
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();
  let overallRiskLevel: RiskAssessmentLevel = RiskAssessmentLevel.LOW;
  const matchedMaliciousPatterns: DetectedPatternInfo[] = [];

  // Rule 1: Check for explicitly restricted/harmful content indicators (from PromptAnalyzer)
  if (analyzedContext.restrictedContentIndicators && analyzedContext.restrictedContentIndicators.length > 0) {
    score = 0; // CRITICAL - Immediate low score
    flags.directHarmfulContentAttempt = true;
    overallRiskLevel = RiskAssessmentLevel.CRITICAL;
    matchedMaliciousPatterns.push(...analyzedContext.restrictedContentIndicators);
  }

  // Rule 2: Check for descriptions of system vulnerabilities (from PromptAnalyzer)
  if (analyzedContext.highPrivilegeDescriptions && analyzedContext.highPrivilegeDescriptions.length > 0) {
    flags.describesSystemVulnerability = true;
    // Use centralized utility for risk level escalation
    if (!isRiskLevelAtLeast(overallRiskLevel, RiskAssessmentLevel.CRITICAL)) {
      overallRiskLevel = RiskAssessmentLevel.HIGH;
    }
    matchedMaliciousPatterns.push(...analyzedContext.highPrivilegeDescriptions);
  }

  // Rule 3: Use pre-computed malicious intent patterns from PromptAnalyzer
  if (analyzedContext.misusePatternIndicators && analyzedContext.misusePatternIndicators.length > 0) {
    const misusePatterns = analyzedContext.misusePatternIndicators;
    matchedMaliciousPatterns.push(...misusePatterns);
    
    // Determine risk level using centralized utility
    const misuseRiskLevel = getMaliciousIntentRiskLevel(misusePatterns);
    
    // Use centralized utility to get the highest risk level
    overallRiskLevel = getHighestRiskLevel([overallRiskLevel, misuseRiskLevel]);
  }

  // Apply score penalties based on overall risk level and matched patterns
  if (matchedMaliciousPatterns.length > 0) {
    flags.detectedMaliciousPatterns = matchedMaliciousPatterns;

    // Use centralized scoring thresholds for penalty calculation
    const riskLevelValue = getRiskLevelNumericValue(overallRiskLevel);
    const penalty = getScoreFromThresholds(riskLevelValue, MALICIOUS_INTENT_PENALTY_THRESHOLDS);

    if (penalty > 0) {
      if (overallRiskLevel === RiskAssessmentLevel.CRITICAL) {
        score = 0; // Direct assignment for critical
      } else {
        score = applyScorePenalty(true, penalty, score);
      }
    }

    if (isRiskLevelAtLeast(overallRiskLevel, RiskAssessmentLevel.HIGH)) {
        mistakes.add(MISTAKE_KEYS.InstructingMaliciousBehaviour);
    }
  }

  // Set security risk level flag if above LOW threshold
  if (isRiskLevelAtLeast(overallRiskLevel, RiskAssessmentLevel.MEDIUM)) {
    flags.securityRiskLevel = overallRiskLevel;
  }

  // Apply score cap based on risk level using centralized thresholds
  const riskLevelValue = (() => {
    switch (overallRiskLevel) {
      case RiskAssessmentLevel.CRITICAL: return 3;
      case RiskAssessmentLevel.HIGH: return 2;
      case RiskAssessmentLevel.MEDIUM: return 1;
      default: return 0;
    }
  })();
  const scoreCap = getScoreFromThresholds(riskLevelValue, SECURITY_RISK_SCORE_CAPS);
  score = Math.min(score, scoreCap);
  
  if (mistakes.size > 0) {
    flags.associated_pdd_mistake_keys_flagged = Array.from(mistakes);
  }
  
  return {
    score: clampScore(score),
    flags: Object.keys(flags).length > 0 ? flags : undefined,
    evaluation_source: "rule_based" as KpiEvaluationSource,
  };
};


/**
 * Hybrid Safety & Ethics Evaluation
 * Combines rule-based safety analysis with AI-powered nuanced assessment.
 * 
 * This function follows the hybrid pattern established by ClarityPurposeAgent:
 * 1. Run rule-based evaluations first (fast, reliable baseline)
 * 2. Determine AI eligibility based on configurable rules  
 * 3. If eligible, call AI module for nuanced analysis
 * 4. Merge AI insights with rule-based results using confidence weighting
 * 
 * @param analyzedContext The analyzed prompt data context
 * @param aiSafetyAnalysis Factory function for AI safety analysis
 * @returns Promise resolving to enhanced safety evaluation results
 */
export const evaluateEthicalSafetyHybrid = async (
  analyzedContext: AnalyzedPromptDataContext,
  aiSafetyAnalysis: AISafetyAnalysisFactory
): Promise<{
  ethicalSafetyBiasMitigation: KpiEvaluationOutput;
  maliciousIntentMisusePrevention: KpiEvaluationOutput;
}> => {

  // STEP 1: Compute the raw rule-based results, just as before.
  const initialRuleResults = computeRuleBasedResults(analyzedContext, {
    ethicalSafetyBiasMitigation: evaluateBasicEthicalKeywordsLogic,
    maliciousIntentMisusePrevention: evaluateMaliciousIntentLogic,
  });

  // STEP 2: Reconcile the rule-based results using our new centralized helper.
  const ruleResults = reconcileSafetyKpis(
    initialRuleResults.ethicalSafetyBiasMitigation,
    initialRuleResults.maliciousIntentMisusePrevention
  );

  // Determine eligible features using configurable rules
  const eligibleFeatures = determineAIEligibilityFromRules(
    analyzedContext, 
    SAFETY_ETHICS_AI_ELIGIBILITY_RULES
  );

  if (eligibleFeatures.length === 0) {
    return ruleResults;
  }

  // Execute AI analysis with standardized error handling
  const aiResult = await executeAIAnalysisWithErrorHandling(
    aiSafetyAnalysis,
    analyzedContext,
    eligibleFeatures,
    'SafetyEthicsAgent'
  );

  if (!aiResult) {
    return ruleResults; 
  }

  // Apply AI enhancements using centralized utility
  return applyAIEnhancements(
    ruleResults,
    aiResult,
    eligibleFeatures,
    SAFETY_ETHICS_ENHANCEMENT_MAP
  );
};
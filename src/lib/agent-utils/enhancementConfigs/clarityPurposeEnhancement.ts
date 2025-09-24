// src/lib/agent-utils/enhancementConfigs/clarityPurposeEnhancement.ts

/**
 * Configuration and enhancement functions for ClarityPurposeAgent hybrid AI evaluation.
 * Defines specific enhancement logic for goal alignment, clarity, specificity, and instruction following.
 * Migrated from hard-coded enhancement functions to configurable, reusable approach.
 */

import { EnhancementConfig, AIEligibilityRule } from '@/lib/types/aiTypes';
import { createGenericEnhancement } from '../hybridEnhancement';
import { createEligibilityRule } from '../aiEligibility';

// === AI ELIGIBILITY RULES ===

/**
 * Configurable rules for determining when AI enhancement should be applied.
 * Replaces the hard-coded determineAIEligibility function.
 */
export const CLARITY_PURPOSE_AI_ELIGIBILITY_RULES: AIEligibilityRule[] = [
  createEligibilityRule(
    'goalAlignment',
    (ctx) => !ctx.explicitlyStatesGoal && (ctx.actionVerbDetails?.count ?? 0) > 2
  ),
  createEligibilityRule(
    'clarityContext',
    (ctx) => (ctx.clarityIssuesFound?.length ?? 0) > 2
  ),
  createEligibilityRule(
    'specificityReview',
    (ctx) => {
      const hasOutputLength = !!ctx.specificityElements?.outputLengthConstraints;
      const hasPersona = !!(ctx.specificityElements?.definedPersonaInfo?.length);
      const isShort = ctx.lengthWords < 30;
      return !hasOutputLength && !hasPersona && isShort;
    }
  ),
  createEligibilityRule(
    'instructionCoherence',
    (ctx) => {
      const contradictions = ctx.contradictoryStatementFlags?.length ?? 0;
      const negativeInstructions = ctx.negativeInstructionIssues?.length ?? 0;
      return contradictions > 0 || negativeInstructions > 1;
    }
  ),
];

// === ENHANCEMENT CONFIGURATIONS ===

/**
 * Goal alignment enhancement with realistic scoring adjustments
 */
const GOAL_ALIGNMENT_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 15,
  mediumConfidenceBonus: 8,
  lowConfidenceBonus: 3,
  lowConfidencePenalty: -10,
};

/**
 * Clarity enhancement with conservative approach and contextual ambiguity penalties
 */
const CLARITY_UNAMBIGUITY_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 8,
  mediumConfidenceBonus: 5,
  lowConfidenceBonus: 0,
  lowConfidencePenalty: -8,
  customLogic: (ai, confidence) => {
    // Custom logic for handling contextual ambiguity
    if (confidence >= 0.9) {
      return ai.contextualAmbiguity?.length ? -15 : 8;
    } else if (confidence >= 0.8) {
      return ai.contextualAmbiguity?.length ? -12 : 5;
    } else if (confidence >= 0.6) {
      return ai.contextualAmbiguity?.length ? -8 : 0;
    } else if (confidence < 0.5) {
      return -8;
    }
    return 0;
  },
};

/**
 * Specificity enhancement with stricter approach for missing constraints
 */
const SPECIFICITY_DETAIL_SCOPE_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 10,
  mediumConfidenceBonus: 3,
  lowConfidenceBonus: 0,
  lowConfidencePenalty: -12,
  customLogic: (ai, confidence) => {
    // Custom logic for missing constraints
    if (confidence >= 0.9) {
      if (ai.missingConstraints?.length) {
        return -20;
      } else if (ai.outputFormatClarity) {
        return 10;
      } else {
        return 5;
      }
    } else if (confidence >= 0.8) {
      return ai.missingConstraints?.length ? -15 : 3;
    } else if (confidence >= 0.6) {
      return ai.missingConstraints?.length ? -10 : 0;
    } else if (confidence < 0.5) {
      return -12;
    }
    return 0;
  },
};

/**
 * Instruction following enhancement with likelihood-based adjustments
 */
const INSTRUCTION_FOLLOWING_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 8,
  mediumConfidenceBonus: 5,
  lowConfidenceBonus: 0,
  lowConfidencePenalty: -10,
  customLogic: (ai, confidence) => {
    // Custom logic based on following likelihood
    if (confidence >= 0.9) {
      const followingLikelihood = ai.followingLikelihood ?? 0.5;
      if (followingLikelihood < 0.3) {
        return -25;
      } else if (followingLikelihood > 0.8) {
        return 8;
      }
    } else if (confidence >= 0.8) {
      const followingLikelihood = ai.followingLikelihood ?? 0.5;
      if (followingLikelihood < 0.4) {
        return -15;
      } else if (followingLikelihood > 0.7) {
        return 5;
      }
    } else if (confidence < 0.5) {
      return -10;
    }
    return 0;
  },
};

// === ENHANCEMENT FUNCTIONS ===

/**
 * Creates all enhancement functions for ClarityPurposeAgent using generic enhancement factory
 */
export const createClarityPurposeEnhancements = () => ({
  goalAlignment: createGenericEnhancement(
    GOAL_ALIGNMENT_CONFIG,
    (ai) => ({
      aiImpliedGoal: ai.inferredGoal,
      aiPrimaryActionVerb: ai.primaryActionVerb,
    })
  ),

  clarityUnambiguity: createGenericEnhancement(
    CLARITY_UNAMBIGUITY_CONFIG,
    (ai) => ({
      aiContextualAmbiguity: ai.contextualAmbiguity,
      aiCriticalTerms: ai.criticalTerms,
    })
  ),

  specificityDetailScope: createGenericEnhancement(
    SPECIFICITY_DETAIL_SCOPE_CONFIG,
    (ai) => ({
      aiMissingConstraints: ai.missingConstraints,
      aiOutputFormatClarity: ai.outputFormatClarity,
    })
  ),

  instructionFollowing: createGenericEnhancement(
    INSTRUCTION_FOLLOWING_CONFIG,
    (ai) => ({
      aiContradictionsDetected: ai.contradictionsDetected,
      aiFollowingLikelihood: ai.followingLikelihood,
    })
  ),
});

// === FEATURE MAPPING ===

/**
 * Maps eligible features to their corresponding enhancement functions and AI result fields.
 * Used by the generic enhancement application logic.
 */
export const CLARITY_PURPOSE_ENHANCEMENT_MAP = {
  goalAlignment: {
    enhancer: createClarityPurposeEnhancements().goalAlignment,
    aiField: 'goalAlignment',
    resultField: 'goalAlignment' as const,
  },
  clarityContext: {
    enhancer: createClarityPurposeEnhancements().clarityUnambiguity,
    aiField: 'clarityContext',
    resultField: 'clarityUnambiguity' as const,
  },
  specificityReview: {
    enhancer: createClarityPurposeEnhancements().specificityDetailScope,
    aiField: 'specificityReview',
    resultField: 'specificityDetailScope' as const,
  },
  instructionCoherence: {
    enhancer: createClarityPurposeEnhancements().instructionFollowing,
    aiField: 'instructionCoherence',
    resultField: 'instructionFollowing' as const,
  },
};

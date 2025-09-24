// src/lib/agent-utils/enhancementConfigs/instructionsStructureEnhancement.ts

/**
 * Configuration and enhancement functions for InstructionsStructureAgent hybrid AI evaluation.
 * Defines specific enhancement logic for format structure, examples, coherence, and decomposition.
 */

import { EnhancementConfig, AIEligibilityRule } from '@/lib/types/aiTypes';
import { createGenericEnhancement } from '../hybridEnhancement';
import { createEligibilityRule } from '../aiEligibility';

// === AI ELIGIBILITY RULES ===

/**
 * Configurable rules for determining when AI enhancement should be applied.
 */
export const INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES: AIEligibilityRule[] = [
  createEligibilityRule(
    'formatSuggestion',
    (ctx) => {
      const wordCount = ctx.lengthWords;
      const sectionCount = ctx.instructionsAndStructure.sectionCount ?? 0;
      const hasBulletPoints = ctx.instructionsAndStructure.bulletPointUsage?.detected ?? false;
      const hasFormatRequests = (ctx.instructionsAndStructure.explicitFormatRequests?.length ?? 0) > 0;
      
      return (wordCount > 100 && sectionCount === 0 && !hasBulletPoints) || // Wall of text
             (sectionCount > 3) || // Complex structure
             hasFormatRequests; // Has format requests
    }
  ),
  createEligibilityRule(
    'exampleQualityReview',
    (ctx) => (ctx.instructionsAndStructure.exampleDetails?.length ?? 0) > 0
  ),
  createEligibilityRule(
    'structureCoherence',
    (ctx) => {
      const toneStyleCount = ctx.instructionsAndStructure.toneStyleGuidance?.length ?? 0;
      const personaCount = ctx.specificityElements?.definedPersonaInfo?.length ?? 0;
      const contradictions = ctx.contradictoryStatementFlags?.length ?? 0;
      
      return toneStyleCount > 1 || personaCount > 0 || contradictions > 0;
    }
  ),
  createEligibilityRule(
    'decompositionSuggestion',
    (ctx) => {
      const actionVerbCount = ctx.actionVerbDetails?.count ?? 0;
      const stepMarkerCount = ctx.instructionsAndStructure.stepMarkerDetails?.length ?? 0;
      const wordCount = ctx.lengthWords;
      
      return (actionVerbCount > 3) || // Multiple actions
             (actionVerbCount > 0 && stepMarkerCount === 0 && wordCount > 100) || // Actions without steps
             (stepMarkerCount > 2); // Complex step structure
    }
  )
];

// === ENHANCEMENT CONFIGURATIONS ===

/**
 * Format structure enhancement configuration
 */
const FORMAT_STRUCTURE_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 8,
  mediumConfidenceBonus: 5,
  lowConfidenceBonus: 2,
  lowConfidencePenalty: 0,
  customLogic: (aiResult: any, confidence: number) => {
    let adjustment = 0;

    // Provide a sensible default if the field is missing.
    // If the AI omits it, we can assume the improvement needed is 'moderate' as a neutral default.
    const improvementNeeded = aiResult.structureImprovement ?? 'moderate';
    if (improvementNeeded === 'major') {
      adjustment = -15 * confidence;
    } else if (improvementNeeded === 'moderate') {
      adjustment = -8 * confidence;
    } else if (improvementNeeded === 'minor') {
      adjustment = 5 * confidence;
    }
    return adjustment;
  }
};

/**
 * Example quality review enhancement configuration
 */
const EXAMPLE_QUALITY_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 15,
  mediumConfidenceBonus: 8,
  lowConfidenceBonus: 3,
  lowConfidencePenalty: 0,
  customLogic: (aiResult: any, confidence: number) => {
    let adjustment = 0;
    if (aiResult.qualityAssessment === 'excellent') {
      adjustment = 15 * confidence;
    } else if (aiResult.qualityAssessment === 'good') {
      adjustment = 8 * confidence;
    } else if (aiResult.qualityAssessment === 'fair') {
      adjustment = 2 * confidence;
    } else if (aiResult.qualityAssessment === 'poor') {
      adjustment = -12 * confidence;
    }
    return adjustment;
  }
};

/**
 * Structure coherence enhancement configuration
 */
const STRUCTURE_COHERENCE_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 10,
  mediumConfidenceBonus: 6,
  lowConfidenceBonus: 2,
  lowConfidencePenalty: 0,
  customLogic: (aiResult: any, confidence: number) => {
    let adjustment = 0;
    if (aiResult.conflictSeverity === 'severe') {
      adjustment = -20 * confidence;
    } else if (aiResult.conflictSeverity === 'moderate') {
      adjustment = -10 * confidence;
    } else if (aiResult.conflictSeverity === 'minor') {
      adjustment = -3 * confidence;
    }
    
    // Bonus for no coherence issues
    if (aiResult.coherenceIssues?.length === 0) {
      adjustment += 8 * confidence;
    }
    return adjustment;
  }
};

/**
 * Task decomposition enhancement configuration
 */
const TASK_DECOMPOSITION_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 20,
  mediumConfidenceBonus: 12,
  lowConfidenceBonus: 5,
  lowConfidencePenalty: 0,
  customLogic: (aiResult: any, confidence: number) => {
    let adjustment = 0;
    if (aiResult.decompositionQuality === 'excellent') {
      adjustment = 20 * confidence;
    } else if (aiResult.decompositionQuality === 'good') {
      adjustment = 10 * confidence;
    } else if (aiResult.decompositionQuality === 'fair') {
      adjustment = 0;
    } else if (aiResult.decompositionQuality === 'poor') {
      adjustment = -15 * confidence;
    }
    return adjustment;
  }
};

/**
 * Factory function to create all enhancement functions for InstructionsStructureAgent
 */
export const createInstructionsStructureEnhancements = () => ({
  formatStructure: createGenericEnhancement(
    FORMAT_STRUCTURE_CONFIG,
    (ai: any) => ({
      aiFormatSuggestion: ai.suggestion,
      aiStructureImprovement: ai.structureImprovement,
      aiFormatReasoning: ai.reasoning
    })
  ),

  examplePresence: createGenericEnhancement(
    EXAMPLE_QUALITY_CONFIG,
    (ai: any) => ({
      aiExampleQuality: ai.qualityAssessment,
      aiSuggestedImprovements: ai.suggestedImprovements,
      aiExampleReasoning: ai.reasoning
    })
  ),

  structureCoherence: createGenericEnhancement(
    STRUCTURE_COHERENCE_CONFIG,
    (ai: any) => ({
      aiCoherenceIssues: ai.coherenceIssues,
      aiConflictSeverity: ai.conflictSeverity,
      aiResolutionSuggestions: ai.resolutionSuggestions
    })
  ),

  taskDecomposition: createGenericEnhancement(
    TASK_DECOMPOSITION_CONFIG,
    (ai: any) => ({
      aiDecompositionQuality: ai.decompositionQuality,
      aiSuggestedBreakdown: ai.suggestedBreakdown,
      aiDecompositionReasoning: ai.reasoning
    })
  ),
});

// === FEATURE MAPPING ===

/**
 * Maps eligible features to their corresponding enhancement functions and AI result fields.
 */
export const INSTRUCTIONS_STRUCTURE_ENHANCEMENT_MAP = {
  formatSuggestion: {
    enhancer: createInstructionsStructureEnhancements().formatStructure,
    aiField: 'formatSuggestion',
    resultField: 'formatStructure' as const
  },

  exampleQualityReview: {
    enhancer: createInstructionsStructureEnhancements().examplePresence,
    aiField: 'exampleQualityReview',
    resultField: 'examplePresence' as const
  },

  structureCoherence: {
    enhancer: createInstructionsStructureEnhancements().structureCoherence,
    aiField: 'structureCoherence',
    resultField: 'structureCoherence' as const
  },

  decompositionSuggestion: {
    enhancer: createInstructionsStructureEnhancements().taskDecomposition,
    aiField: 'decompositionSuggestion',
    resultField: 'taskDecomposition' as const
  }
};

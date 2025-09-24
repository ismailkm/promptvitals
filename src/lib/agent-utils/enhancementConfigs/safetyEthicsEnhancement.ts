// src/lib/agent-utils/enhancementConfigs/safetyEthicsEnhancement.ts

/**
 * Configuration and enhancement functions for SafetyEthicsAgent hybrid AI evaluation.
 * Defines specific enhancement logic for implicit bias assessment, subtle maliciousness detection,
 * and cultural sensitivity analysis.
 */

import { EnhancementConfig, AIEligibilityRule } from '@/lib/types/aiTypes';
import { createGenericEnhancement } from '../hybridEnhancement';
import { createEligibilityRule } from '../aiEligibility';
import { RiskAssessmentLevel } from '@/lib/types/shared';

// === AI ELIGIBILITY RULES ===

/**
 * Configurable rules for determining when AI enhancement should be applied for safety analysis.
 * AI enhancement is most valuable when rule-based systems show low-to-medium risk 
 * but nuanced analysis might reveal hidden issues.
 */
export const SAFETY_ETHICS_AI_ELIGIBILITY_RULES: AIEligibilityRule[] = [
  createEligibilityRule(
    'implicitBiasAssessment',
    (ctx) => {
      // Apply AI analysis when:
      // 1. No explicit bias indicators found but prompt mentions demographics/groups
      // 2. Low-medium bias risk detected that could have hidden nuances
      // 3. Prompt deals with sensitive social topics
      const hasBiasIndicators = (ctx.biasRiskIndicators?.length ?? 0) > 0;
      const hasGroupMentions = !!ctx.promptText.toLowerCase().match(/\b(people|person|group|community|culture|race|gender|age|religion|nationality)\b/);
      const isSocialContext = !!ctx.promptText.toLowerCase().match(/\b(society|social|community|cultural|diversity|inclusion|equity|fair|stereotype)\b/);
      const isLowMediumBias = hasBiasIndicators && (ctx.biasRiskIndicators?.length ?? 0) <= 3;
      
      return (!hasBiasIndicators && (hasGroupMentions || isSocialContext)) || isLowMediumBias;
    }
  ),
  
  createEligibilityRule(
    'subtleMaliciousness',
    (ctx) => {
      // Apply AI analysis when:
      // 1. No explicit malicious patterns but sophisticated language used
      // 2. Low-medium malicious indicators that could be more sophisticated
      // 3. Requests involving system interactions, instructions, or complex scenarios
      const hasMaliciousIndicators = (ctx.misusePatternIndicators?.length ?? 0) > 0 || 
                                    (ctx.restrictedContentIndicators?.length ?? 0) > 0 ||
                                    (ctx.highPrivilegeDescriptions?.length ?? 0) > 0;
      const hasSystemMentions = !!ctx.promptText.toLowerCase().match(/\b(system|instruction|command|access|privilege|security|bypass|ignore|override)\b/);
      const isComplexScenario = ctx.lengthWords > 50 && (ctx.actionVerbDetails?.count ?? 0) > 3;
      const isLowMediumThreat = hasMaliciousIndicators && 
                               (ctx.misusePatternIndicators?.length ?? 0) + 
                               (ctx.restrictedContentIndicators?.length ?? 0) + 
                               (ctx.highPrivilegeDescriptions?.length ?? 0) <= 2;
      
      return (!hasMaliciousIndicators && (hasSystemMentions || isComplexScenario)) || isLowMediumThreat;
    }
  ),
  
  createEligibilityRule(
    'culturalSensitivity',
    (ctx) => {
      // Apply AI analysis when:
      // 1. Prompt mentions cultural, religious, or ethnic topics
      // 2. International or cross-cultural context indicated
      // 3. Content generation requests that could touch on cultural themes
      const hasCulturalMentions = !!ctx.promptText.toLowerCase().match(/\b(culture|cultural|religion|religious|ethnic|tradition|traditional|custom|belief|heritage|indigenous|native|international|global|country|nation|communities|community)\b/);
      const hasContentGeneration = !!ctx.promptText.toLowerCase().match(/\b(write|create|generate|story|article|content|description|explain|describe|design|craft|develop)\b/);
      const hasPersonaReference = !!(ctx.specificityElements?.definedPersonaInfo?.length);
      
      return hasCulturalMentions || (hasContentGeneration && hasPersonaReference);
    }
  ),
];

// === ENHANCEMENT CONFIGURATIONS ===

/**
 * Implicit bias assessment enhancement with risk-aware scoring
 */
const IMPLICIT_BIAS_ASSESSMENT_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 0,      // No bonus for finding no bias
  mediumConfidenceBonus: -5,   // Small penalty for uncertainty
  lowConfidenceBonus: 0,       // Neutral for low confidence
  lowConfidencePenalty: -15,   // Penalty for AI detecting bias with low confidence
  customLogic: (ai, confidence) => {
    if (!ai.riskLevel) return 0;
    
    // AI found bias - apply penalties based on risk level and confidence
    if (confidence >= 0.8) {
      switch (ai.riskLevel) {
        case 'CRITICAL': return -50;
        case 'HIGH': return -30;
        case 'MEDIUM': return -15;
        case 'LOW': return -5;
        default: return 0;
      }
    } else if (confidence >= 0.6) {
      // Medium confidence - reduced penalties
      switch (ai.riskLevel) {
        case 'CRITICAL': return -35;
        case 'HIGH': return -20;
        case 'MEDIUM': return -10;
        case 'LOW': return -3;
        default: return 0;
      }
    } else {
      // Low confidence - minimal penalties but still flag concern
      switch (ai.riskLevel) {
        case 'CRITICAL': return -20;
        case 'HIGH': return -10;
        case 'MEDIUM': return -5;
        case 'LOW': return 0;
        default: return 0;
      }
    }
  },
};

/**
 * Subtle maliciousness detection with critical safety focus
 */
const SUBTLE_MALICIOUSNESS_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 0,      // No bonus for finding no maliciousness
  mediumConfidenceBonus: 0,    // Neutral for uncertainty
  lowConfidenceBonus: 0,       // Neutral for low confidence
  lowConfidencePenalty: -25,   // Penalty for AI detecting maliciousness with low confidence
  customLogic: (ai, confidence) => {
    if (!ai.riskLevel) return 0;
    
    // AI found maliciousness - apply severe penalties based on risk level and confidence
    if (confidence >= 0.8) {
      switch (ai.riskLevel) {
        case 'CRITICAL': return -100; // Immediate zero score
        case 'HIGH': return -60;
        case 'MEDIUM': return -30;
        case 'LOW': return -10;
        default: return 0;
      }
    } else if (confidence >= 0.6) {
      // Medium confidence - still serious penalties
      switch (ai.riskLevel) {
        case 'CRITICAL': return -80;
        case 'HIGH': return -45;
        case 'MEDIUM': return -20;
        case 'LOW': return -5;
        default: return 0;
      }
    } else {
      // Low confidence - conservative penalties but flag for review
      switch (ai.riskLevel) {
        case 'CRITICAL': return -50;
        case 'HIGH': return -25;
        case 'MEDIUM': return -10;
        case 'LOW': return 0;
        default: return 0;
      }
    }
  },
};

/**
 * Cultural sensitivity enhancement with educational focus
 */
const CULTURAL_SENSITIVITY_CONFIG: EnhancementConfig = {
  highConfidenceBonus: 0,      // No bonus for finding no issues
  mediumConfidenceBonus: -3,   // Small penalty for uncertainty
  lowConfidenceBonus: 0,       // Neutral for low confidence
  lowConfidencePenalty: -10,   // Moderate penalty for AI detecting issues with low confidence
  customLogic: (ai, confidence) => {
    if (!ai.sensitivityLevel) return 0;
    
    // AI found cultural sensitivity issues - apply educational penalties
    if (confidence >= 0.8) {
      switch (ai.sensitivityLevel) {
        case 'CRITICAL': return -40;
        case 'HIGH': return -25;
        case 'MEDIUM': return -15;
        case 'LOW': return -5;
        default: return 0;
      }
    } else if (confidence >= 0.6) {
      // Medium confidence - reduced penalties
      switch (ai.sensitivityLevel) {
        case 'CRITICAL': return -30;
        case 'HIGH': return -18;
        case 'MEDIUM': return -10;
        case 'LOW': return -3;
        default: return 0;
      }
    } else {
      // Low confidence - minimal penalties but educational flags
      switch (ai.sensitivityLevel) {
        case 'CRITICAL': return -15;
        case 'HIGH': return -8;
        case 'MEDIUM': return -5;
        case 'LOW': return 0;
        default: return 0;
      }
    }
  },
};

// === ENHANCEMENT FUNCTIONS ===

/**
 * Creates and returns all safety enhancement functions
 */
const createSafetyEthicsEnhancements = () => ({
  implicitBias: createGenericEnhancement(
    IMPLICIT_BIAS_ASSESSMENT_CONFIG,
    (ai) => ({
      aiImplicitBiasAssessment: {
        biasTypes: ai.biasTypes,
        affectedGroups: ai.affectedGroups,
        biasConfidence: ai.biasConfidence,
        riskLevel: ai.riskLevel,
        confidence: ai.confidence,
        rationale: ai.rationale,
      }
    })
  ),

  subtleMaliciousness: createGenericEnhancement(
    SUBTLE_MALICIOUSNESS_CONFIG,
    (ai) => ({
      aiSubtleMaliciousness: {
        manipulationTactics: ai.manipulationTactics,
        harmfulIntent: ai.harmfulIntent,
        sophisticationLevel: ai.sophisticationLevel,
        riskLevel: ai.riskLevel,
        confidence: ai.confidence,
        rationale: ai.rationale,
      }
    })
  ),

  culturalSensitivity: createGenericEnhancement(
    CULTURAL_SENSITIVITY_CONFIG,
    (ai) => ({
      aiCulturalSensitivity: {
        culturalConcerns: ai.culturalConcerns,
        affectedCultures: ai.affectedCultures,
        sensitivityLevel: ai.sensitivityLevel,
        confidence: ai.confidence,
        rationale: ai.rationale,
      }
    })
  ),
});

// === ENHANCEMENT MAP ===

/**
 * Maps feature names to their corresponding enhancement configurations
 */
export const SAFETY_ETHICS_ENHANCEMENT_MAP: Record<string, any> = {
  implicitBiasAssessment: {
    enhancer: createSafetyEthicsEnhancements().implicitBias,
    aiField: 'implicitBiasAssessment',
    resultField: 'ethicalSafetyBiasMitigation' as const,
  },
  subtleMaliciousness: {
    enhancer: createSafetyEthicsEnhancements().subtleMaliciousness,
    aiField: 'subtleMaliciousness',
    resultField: 'maliciousIntentMisusePrevention' as const,
  },
  culturalSensitivity: {
    enhancer: createSafetyEthicsEnhancements().culturalSensitivity,
    aiField: 'culturalSensitivity',
    resultField: 'ethicalSafetyBiasMitigation' as const,
  },
};

// src/lib/agent-utils/hybridEnhancement.ts

/**
 * Generic hybrid enhancement utilities for AI-enhanced KPI evaluations.
 * Provides reusable functions for combining rule-based scores with AI insights,
 * using confidence-weighted adjustments and standardized flag merging.
 */

import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';
import { KpiEvaluationSource } from '@/lib/types/shared';
import { EnhancementConfig, EnhancementFunction, AIEligibleFeature } from '@/lib/types/aiTypes';
import { clampScore } from './scoring';
import { AIError } from '@/lib/exceptions/AIError';

// === CORE HYBRID ENHANCEMENT UTILITIES ===

/**
 * Sanitizes a sub-part of an AI analysis result to ensure type safety.
 * Ensures 'confidence' is a number between 0-1 and validates basic structure.
 * This is a generic version - specific modules can extend this as needed.
 * 
 * @param aiSubObject - Raw AI result object to sanitize
 * @returns Sanitized object with validated confidence and preserved properties
 */
export function sanitizeAIResult(aiSubObject: any): any {
    if (!aiSubObject) return { confidence: 0 };
    
    // Ensure confidence is a valid number between 0-1
    const confidence = Math.max(0, Math.min(1, Number(aiSubObject.confidence) || 0));
    
    // Preserve all original properties while ensuring confidence is valid
    return { 
      ...aiSubObject, 
      confidence 
    };
}

/**
 * Ensures that specified properties are always arrays in an AI result object.
 * Useful for normalizing LLM responses that might return non-array values.
 * 
 * @param obj - Object to normalize
 * @param arrayFields - Array of field names that should be arrays
 * @returns Object with specified fields guaranteed to be arrays
 */
export function ensureArrayFields(obj: any, arrayFields: string[]): any {
    if (!obj) return obj;
    
    const normalized = { ...obj };
    for (const field of arrayFields) {
        if (normalized[field] !== undefined && !Array.isArray(normalized[field])) {
            normalized[field] = [];
        } else if (normalized[field] === undefined) {
            normalized[field] = [];
        }
    }
    return normalized;
}

/**
 * Reconciles a rule-based score with an AI-driven score adjustment using confidence weighting.
 * This is a standard way to blend human-defined rules with AI insights.
 *
 * @param ruleScore The original score from the rule-based engine (0-100).
 * @param aiAdjustment The score adjustment suggested by the AI logic (e.g., -15 or +10).
 * @param aiConfidence The AI's confidence in its assessment (0-1).
 * @returns The final, reconciled score.
 */
export function reconcileScoreWithAI(
  ruleScore: number,
  aiAdjustment: number,
  aiConfidence: number
): number {
  // Clamp confidence to a valid 0-1 range
  const confidence = Math.max(0, Math.min(1, aiConfidence));

  // The final adjustment is scaled by the AI's confidence.
  const weightedAdjustment = aiAdjustment * confidence;
  
  const finalScore = ruleScore + weightedAdjustment;
  
  return clampScore(finalScore); // Ensure the final score is within 0-100
}

/**
 * Merges flags from a rule-based evaluation with new flags from an AI analysis.
 * Also includes the core AI confidence and rationale flags.
 *
 * @param ruleFlags The original flags object from the rule-based evaluation.
 * @param aiResult The sub-object from the AI's response for a specific feature.
 * @param additionalAiFlags An object containing specific AI findings to be added as flags.
 * @returns A new, merged flags object.
 */
export function mergeEnhancementFlags(
  ruleFlags: Record<string, any> | undefined,
  aiResult: { confidence: number; rationale?: string },
  additionalAiFlags: Record<string, any>
): Record<string, any> {
  return {
    ...(ruleFlags || {}), // Keep all original rule-based flags
    aiUsed: true,
    aiConfidence: aiResult.confidence,
    aiRationale: aiResult.rationale,
    ...additionalAiFlags, // Add the specific new findings from the AI
  };
}

/**
 * Calculates standard confidence-based score adjustment using predefined thresholds
 */
export function calculateStandardAdjustment(confidence: number, config: EnhancementConfig): number {
  if (confidence >= 0.9) {
    return config.highConfidenceBonus;
  } else if (confidence >= 0.8) {
    return config.mediumConfidenceBonus;
  } else if (confidence >= 0.6) {
    return config.lowConfidenceBonus;
  } else if (confidence < 0.5) {
    return config.lowConfidencePenalty;
  }
  return 0;
}

/**
 * Creates a generic enhancement function that follows standard hybrid evaluation patterns.
 * Standardizes: confidence normalization, score adjustment calculation, flag merging, and score clamping.
 * 
 * @param config - Configuration for confidence-based adjustments
 * @param flagExtractor - Function to extract relevant flags from AI result
 * @returns Enhancement function that can be used for any KPI
 */
export function createGenericEnhancement(
  config: EnhancementConfig,
  flagExtractor: (aiResult: any) => Record<string, any>
): EnhancementFunction {
  return (ruleResult: KpiEvaluationOutput, aiResult: any): KpiEvaluationOutput => {
    // Sanitize AI result to ensure type safety
    const sanitizedAI = sanitizeAIResult(aiResult);
    
    // Calculate score adjustment using custom logic or standard thresholds
    const adjustment = config.customLogic 
      ? config.customLogic(sanitizedAI, sanitizedAI.confidence)
      : calculateStandardAdjustment(sanitizedAI.confidence, config);
    
    // Use existing utility to reconcile scores with confidence weighting
    const finalScore = reconcileScoreWithAI(ruleResult.score, adjustment, sanitizedAI.confidence);
    
    // Merge flags using existing utility
    const extractedFlags = flagExtractor(sanitizedAI);
    const mergedFlags = mergeEnhancementFlags(ruleResult.flags, sanitizedAI, extractedFlags);
    
    return {
      score: finalScore,
      flags: Object.keys(mergedFlags).length > 0 ? mergedFlags : undefined,
      evaluation_source: "hybrid_ai_enhanced" as KpiEvaluationSource,
    };
  };
}

/**
 * Applies multiple AI enhancements to rule-based results based on eligible features.
 * Centralizes the enhancement application logic to reduce code duplication.
 * 
 * @param ruleResults - Original rule-based evaluation results
 * @param aiResult - AI analysis results for all features
 * @param eligibleFeatures - Features that should be enhanced with AI
 * @param enhancementMap - Map of feature names to their enhancement functions
 * @returns Enhanced results with AI improvements applied
 */
export function applyAIEnhancements<T extends Record<string, KpiEvaluationOutput>>(
  ruleResults: T,
  aiResult: any,
  eligibleFeatures: string[],
  enhancementMap: Record<string, { enhancer: EnhancementFunction; aiField: string; resultField: keyof T }>
): T {
  const enhancedResults = { ...ruleResults };

  for (const feature of eligibleFeatures) {
    const enhancement = enhancementMap[feature];
    if (enhancement && aiResult[enhancement.aiField]) {
      const newEnhanced = enhancement.enhancer(
        ruleResults[enhancement.resultField],
        aiResult[enhancement.aiField]
      ) as T[keyof T];

      // If this result field was already enhanced by a previous feature, merge flags and reconcile scores
      const existing = enhancedResults[enhancement.resultField];
      if (existing && existing !== ruleResults[enhancement.resultField]) {
        const mergedFlags = {
          ...(existing.flags || {}),
          ...(newEnhanced.flags || {}),
        } as Record<string, any>;

        // Conservative score: take the minimum (most severe) of existing and new enhanced scores
        const mergedScore = Math.min(existing.score ?? 100, newEnhanced.score ?? 100);

        enhancedResults[enhancement.resultField] = {
          ...existing,
          ...newEnhanced,
          score: mergedScore,
          flags: Object.keys(mergedFlags).length > 0 ? mergedFlags : undefined,
          evaluation_source: "hybrid_ai_enhanced" as any,
        } as T[keyof T];
      } else {
        enhancedResults[enhancement.resultField] = newEnhanced as T[keyof T];
      }
    }
  }

  return enhancedResults;
}

/**
 * Executes AI analysis with standardized error handling and fallback logic.
 * Provides consistent error logging and graceful degradation across all agents.
 */
export async function executeAIAnalysisWithErrorHandling<T>(
  aiAnalysisFactory: (context: any, features: string[]) => Promise<T> | T,
  context: any,
  eligibleFeatures: string[],
  agentName: string = 'UnknownAgent'
): Promise<T | null> {
  try {
    return await Promise.resolve(aiAnalysisFactory(context, eligibleFeatures));
  } catch (error) {
    console.error(`[${agentName}] AI analysis failed:`, error);
    
    // Use existing AIError handling from agentUtils
    if (error instanceof AIError) {
      console.log('AI Analysis Error:', error.toLogObject());
      console.log('User Message:', error.getUserMessage());
    } else {
      console.log('Unexpected AI Analysis Error:', error);
    }
    
    return null; // Signal fallback to rule-only results
  }
}

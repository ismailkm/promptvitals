// src/lib/agent-utils/aiEligibility.ts

/**
 * Centralized AI eligibility determination utilities.
 * Provides configurable, rule-based logic for determining when AI enhancement
 * should be applied to specific KPI evaluations based on analyzed context.
 */

import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { AIEligibilityRule } from '@/lib/types/aiTypes';

/**
 * Determines eligible features for AI enhancement based on configurable rules.
 * Replaces hard-coded eligibility logic with a flexible, rule-based approach.
 * 
 * @param context - The analyzed prompt data context
 * @param rules - Array of eligibility rules to evaluate
 * @returns Array of feature names that are eligible for AI enhancement
 */
export function determineAIEligibilityFromRules(
  context: AnalyzedPromptDataContext,
  rules: AIEligibilityRule[]
): string[] {
  const eligible: string[] = [];

  for (const rule of rules) {
    try {
      if (rule.condition(context)) {
        eligible.push(rule.feature);
      }
    } catch (error) {
      console.warn(`AI eligibility rule failed for feature "${rule.feature}":`, error);
      // Continue processing other rules rather than failing completely
    }
  }

  return eligible;
}

/**
 * Creates a rule builder helper for more readable rule definitions.
 * Provides a fluent interface for constructing eligibility rules.
 */
export class AIEligibilityRuleBuilder {
  private feature: string;

  constructor(feature: string) {
    this.feature = feature;
  }

  /**
   * Sets the condition for this rule
   */
  when(condition: (context: AnalyzedPromptDataContext) => boolean): AIEligibilityRule {
    return {
      feature: this.feature,
      condition,
    };
  }

  /**
   * Static factory method for creating a new rule builder
   */
  static forFeature(feature: string): AIEligibilityRuleBuilder {
    return new AIEligibilityRuleBuilder(feature);
  }
}

/**
 * Convenience function for creating simple eligibility rules
 */
export function createEligibilityRule(
  feature: string,
  condition: (context: AnalyzedPromptDataContext) => boolean
): AIEligibilityRule {
  return { feature, condition };
}

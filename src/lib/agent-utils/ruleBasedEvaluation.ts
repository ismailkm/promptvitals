// src/lib/agent-utils/ruleBasedEvaluation.ts

/**
 * Utilities for computing and managing rule-based KPI evaluations.
 * Provides consistent interfaces for rule-based evaluation results across agents.
 */

import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';

/**
 * Generic function signature for rule-based evaluation functions
 */
export type RuleBasedEvaluationFunction = (
  context: AnalyzedPromptDataContext
) => KpiEvaluationOutput;

/**
 * Computes rule-based results for multiple KPIs using provided evaluation functions.
 * Centralizes the computation of rule-based results with error handling.
 * 
 * @param context - The analyzed prompt data context
 * @param evaluationFunctions - Map of KPI names to their evaluation functions
 * @returns Object containing all rule-based evaluation results
 */
export function computeRuleBasedResults<T extends Record<string, RuleBasedEvaluationFunction>>(
  context: AnalyzedPromptDataContext,
  evaluationFunctions: T
): { [K in keyof T]: KpiEvaluationOutput } {
  const results = {} as { [K in keyof T]: KpiEvaluationOutput };

  for (const [kpiName, evaluationFn] of Object.entries(evaluationFunctions)) {
    try {
      results[kpiName as keyof T] = evaluationFn(context);
    } catch (error) {
      console.error(`Rule-based evaluation failed for ${kpiName}:`, error);
      // Provide fallback result
      results[kpiName as keyof T] = {
        score: 0,
        flags: { evaluationError: true },
        evaluation_source: 'rule_based',
      };
    }
  }

  return results;
}

// src/lib/types/kpiEvaluation.ts

import {
    MainCategoryKey,
    KpiEvaluationSource,
    KpiEvaluationMethodType,
    OutputVitalKey
  } from './shared'; // Import shared types
  
  import { KpiMistakeKeys } from '@/lib/config/kpis/kpiMistakes'
  
  import { AnalyzedPromptDataContext } from './promptAnalysis'; // Import analyzer output type
  
  /**
   * Standardized output structure from an individual KPI's core evaluation logic
   * (e.g., a rule_based_logic_fn or the processed result of an AI call before final rubric application for text).
   */
  export interface KpiEvaluationOutput {
    score: number; // The calculated numerical score (0-100) for the KPI
    flags?: Record<string, any>; // Specific findings, often including DetectedPatternInfo arrays or counts, to be used for personalizing rubric feedback
    ai_evaluation_confidence?: number; // If from an AI evaluation (0-100)
    evaluation_source: KpiEvaluationSource; // How this score was primarily derived
  }
  
  /**
   * Defines a single criterion within a KPI's scoring rubric.
   * The rubric maps a score (and potentially flags) to user-facing feedback.
   */
  export interface KpiRubricCriterion {
    minScore?: number; // Inclusive minimum score of KpiEvaluationOutput.score for this criterion
    maxScore?: number; // Inclusive maximum score of KpiEvaluationOutput.score for this criterion
    assignedScore?: number; // Inclusive assigned score of KpiEvaluationOutput.score for this criterion
    condition?: (analyzedContext: AnalyzedPromptDataContext, kpiOutputFlags?: Record<string, any>) => boolean; // For more complex conditional feedback based on flags
    assessmentComment: string; // User-facing comment template (can have placeholders like {flagValue})
    improvementSuggestions?: string[]; // User-facing suggestion templates
    qualityLevel?: string; // User-facing quality level (e.g., "Critical Attention Needed")
  }
  
  /**
   * Defines the complete structure for a single Key Performance Indicator (KPI)
   * that is directly evaluated from the input prompt.
   */
  export interface KpiDefinition {
    id: string; // Stable, unique, URL-friendly identifier (e.g., "clarity-unambiguity")
    key: string; // Programmatic key for internal use (e.g., "clarityUnambiguity")
    name_pdd: string; // Human-readable name from the Product Definition Document
    description: string; // What this KPI measures and why it's important
    category_key: MainCategoryKey; // Which of the 4 input-focused categories it belongs to
    evaluation_type: KpiEvaluationMethodType; // How it's generally evaluated
  
    // Reference to the primary rule-based logic function for this KPI.
    // This function will be implemented in an agent file (e.g., ClarityPurposeAgent.ts).
    rule_based_logic_fn?: (analyzedContext: AnalyzedPromptDataContext) => KpiEvaluationOutput;
  
    // Template for the meta-prompt if AI is used for this KPI (for hybrid/ai_powered types).
    ai_meta_prompt_template?: string;
  
    // The rubric maps the KpiEvaluationOutput.score (and potentially flags) to user-facing text.
    rubric: KpiRubricCriterion[];
  
    // Weight of this KPI within its category for calculating the category score.
    default_weight_in_category?: number;
  
    // Which output-driven KPIs (from the 5th category) this input KPI primarily influences.
    directly_impacts_output_vitals?: OutputVitalKey[];

  }
  
  /**
   * Defines the configuration for a main evaluation category.
   */
  export interface MainCategoryConfig {
      key: MainCategoryKey; // Unique key for the category
      name: string;         // Display name (e.g., "Clarity & Purpose")
      description: string;  // What this category generally assesses
      default_weight_overall: number; // Weight for calculating the overall prompt score (for input categories)
      strength_snippet?: string; // Optional positive feedback snippet if this is a strength
      issue_snippet?: string;    // Optional improvement feedback snippet if this is a primary area for improvement
  }
// src/lib/types/common.ts

/**
 * Defines the possible keys for the main evaluation categories.
 */
export type MainCategoryKey =
  | "clarity_purpose"
  | "instructions_structure"
  | "context_content_richness"
  | "safety_ethics"
  | "predicted_output_quality";

/**
 * Defines the overall risk assessment level for the prompt.
 * This aggregates various risk indicators into a single, comprehensive level.
 */
export enum RiskAssessmentLevel {
  /**
   * Indicates a minimal or negligible risk.
   */
  LOW = 'Low',
  /**
   * Indicates a moderate level of risk that should be monitored or reviewed.
   */
  MEDIUM = 'Medium',
  /**
   * Indicates a significant risk that requires attention and potential mitigation.
   */
  HIGH = 'High',
  /**
   * Indicates a severe or critical risk that necessitates immediate action or rejection.
   */
  CRITICAL = 'Critical',
}

/**
 * Defines the severity level for a detected pattern, issue, or characteristic.
 */
export enum SeverityLevel {
  /**
   * Indicates a minor observation or a characteristic of the prompt
   * that is generally neutral or slightly positive (e.g., explicit format request).
   */
  INFO = 'info',
  /**
   * Indicates a low-impact issue or a minor suggestion for improvement.
   */
  LOW = 'low',
  /**
   * Indicates a moderate issue that should be considered for improvement.
   */
  MEDIUM = 'medium',
  /**
   * Indicates a significant issue that likely impacts prompt effectiveness or safety.
   */
  HIGH = 'high',
  /**
   * Indicates a critical issue requiring immediate attention,
   * potentially impacting functionality, safety, or core requirements.
   */
  CRITICAL = 'critical',
}

/**
 * Defines the possible sources for a KPI evaluation's score and initial feedback.
 */
export type KpiEvaluationSource =
  | "rule_based"
  | "ai_powered"
  | "hybrid_rule_dominant"
  | "hybrid_ai_dominant"
  | "manual_override";

/**
 * Defines the primary method intended for evaluating a KPI as configured.
 */
export type KpiEvaluationMethodType = "rule_based" | "ai_powered" | "hybrid";

/**
 * Defines possible keys for output vitals that input KPIs can influence.
 * These correspond to the PDD V2 "Output Driven" KPIs.
 */
export type OutputVitalKey =
  | "Readability_Coherence"
  | "Accuracy_Correctness"
  | "Consistency"
  | "Verbosity"
  | "Model_Confidence_Proxy"
  | "Safety";

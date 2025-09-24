// src/lib/types/reportTypes.ts

  import { 
          MainCategoryKey, 
          KpiEvaluationSource, 
          OutputVitalKey } from './shared'
  
  import { KpiMistakeKeys } from '@/lib/config/kpis/kpiMistakes'
    // === Types for Summary API Response ===
  
  export type StatusIndicator = "Excellent" | "Good" | "Fair" | "Needs Improvement" | "Critical Attention Needed" | "Informational";


  export type StatusCode = 5 | 4 | 3 | 2 | 1;

  // Unified status levels array for mapping score to indicator and code
  export const STATUS_LEVELS: Array<{
    minScore: number;
    indicator: StatusIndicator;
    code: StatusCode;
  }> = [
    { minScore: 85, indicator: "Excellent", code: 5 },
    { minScore: 70, indicator: "Good", code: 4 },
    { minScore: 50, indicator: "Fair", code: 3 },
    { minScore: 25, indicator: "Needs Improvement", code: 2 },
    { minScore: 0, indicator: "Critical Attention Needed", code: 1 },
  ];

  export interface CategoryOverviewItem {
    category_key: MainCategoryKey; 
    category_name: string;
    category_score: number | null; 
  }
  
  export interface Highlights {
    potential_strengths_identified?: string[];
    critical_areas_for_review_snippet?: string;
  }
  
  export interface UnlockDetailedReport {
    message: string;
    benefits: string[];
    registration_cta: string;
    login_cta: string;
  }
  
  export interface PromptAnalysisSummary {
    report_id: string; 
    analysis_timestamp: string; 
    overall_prompt_score: number | null; 
    overall_assessment_snippet: string;
    category_overview: CategoryOverviewItem[]; 
    key_areas_analyzed_count?: number; 
    improvement_suggestions_available?: number; 
    highlights?: Highlights;
    unlock_detailed_report: UnlockDetailedReport;
  }
  
  export interface SummaryApiResponse {
    prompt_analysis_summary: PromptAnalysisSummary;
  }
  
  // === Types for Detailed API Response ===
  
  export interface IndividualKpiEvaluation {
    kpi_id: string; // Stable ID from KpiDefinition (e.g., "clarity-unambiguity")
    kpi_key: string; // Programmatic key from KpiDefinition (e.g., "clarityUnambiguity")
    kpi_name_pdd: string; // Human-readable name from KpiDefinition
    score: number; // 0-100
    assessment_comment: string;
    improvement_suggestions?: string[];
    evaluation_source: KpiEvaluationSource; // From kpiTypes.ts
    ai_evaluation_confidence?: number; // From kpiTypes.ts (0-100)
  }
  
  export interface OutputVitalAssessment {
    vital_id: string; // e.g., "readability-coherence-output"
    vital_key: OutputVitalKey; // e.g., "Readability_Coherence"
    vital_name_pdd: string; // e.g., "Readability & Coherence (Output Driven)"
    prediction_level: "Excellent" | "Good" | "Fair" | "Needs Improvement" | "Critical Concern" | "Informational" | string;
    reasoning: string; // Explanation linking to input category scores/KPIs
  }
  
  interface BaseCategoryEvaluation {
    category_key: MainCategoryKey;
    category_name: string;
    description: string; // Description of the category
  }
  
  export interface InputCategoryDetailedEvaluation extends BaseCategoryEvaluation {
    category_score: number; // Numerical score for input categories
    status_indicator?: StatusIndicator;
    status_code?: StatusCode;
    category_weight_in_overall_score?: number; // e.g., 0.30
    kpi_evaluations: IndividualKpiEvaluation[];
    associated_mistake_keys_flagged?: MistakeDefinitionType[];
  }
  
  export interface OutputCategoryDetailedEvaluation extends BaseCategoryEvaluation {
    category_score: null; // The 5th category doesn't have a numerical score in the same way
    category_weight_in_overall_score: null;
    output_vital_assessments: OutputVitalAssessment[];
    associated_mistake_keys_flagged: MistakeDefinitionType[];
  }
  
  export type MainCategoryDetailedEvaluation = InputCategoryDetailedEvaluation | OutputCategoryDetailedEvaluation;
  
  export interface AchievementBadgeAwarded {
    badge_id: string;
    badge_name: string;
    badge_level?: "Bronze" | "Silver" | "Gold" | "Platinum" | "Alert" | string;
    icon_url?: string;
    description: string;
    criteria_met: string;
  }
  
  export interface ActionableRecommendation {
    priority: number; // e.g., 1 (highest), 2, 3
    recommendation: string;
    related_category_key?: MainCategoryKey;
    related_kpi_key?: string; // Programmatic key of the KPI
  }
  
  export interface OverallReportSummary {
    overall_prompt_score: number | null; // Score for input prompt quality (Cat 1-4)
    headline_assessment: string;
    key_strengths?: string[];
    critical_issues_to_address?: string[];
    safety_status?: "pass" | "warn" | "block";
    safety_note?: string;
    human_review_required?: boolean;
    human_review_reason?: string;
  }
  
  export interface PromptAnalysisReportDetailed {
    report_id: string;
    analysis_timestamp: string; // ISO 8601 format
    prompt_text_analyzed: string;
    prompt_version?: string;
    prompt_use_case_type?: string;
  
    overall_summary: OverallReportSummary;
    main_category_evaluations: MainCategoryDetailedEvaluation[];

    achievement_badges_awarded?: AchievementBadgeAwarded[];
    overall_actionable_recommendations?: ActionableRecommendation[];
  }
  
  export interface DetailedApiResponse {
    prompt_analysis_report: PromptAnalysisReportDetailed;
  }

  // the shape of a single, fully resolved mistake object.
  export interface MistakeDefinitionType {
    key: string; // The raw key, e.g., "VagueOrUnclearPrompts"
    name: string; // The human-readable name, e.g., "Vague or Unclear"
    description: string; // The detailed explanation
  }
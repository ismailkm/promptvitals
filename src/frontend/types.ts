export interface PromptAnalysisResult {
  overall_prompt_score: number | null;
  headline_assessment: string;
  key_strengths: string[];
  critical_issues_to_address: string[];
  safety_status: 'pass' | 'warn' | 'block';
  safety_note?: string;
  human_review_required?: boolean;
  human_review_reason?: string;
}

export interface CategoryEvaluation {
  category_key: string;
  category_name: string;
  description: string;
  category_score: number;
  kpi_evaluations: Array<{
    kpi_name_pdd: string;
    score: number;
    assessment_comment: string;
    improvement_suggestions?: string[];
    associated_mistake_keys_flagged?: Array<{
      key: string;
      name: string;
      description: string;
    }>;
  }>;
  associated_mistake_keys_flagged?: Array<{
    key: string;
    name: string;
    description: string;
  }>;
}

export interface PromptResultsSectionProps {
  analysisResult: PromptAnalysisResult | null;
  categoryEvaluations?: CategoryEvaluation[];
}

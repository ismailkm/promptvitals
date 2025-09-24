// src/lib/config/kpis/contextContentKpis.ts
import { KpiDefinition } from '@/lib/types/kpiEvaluation';

import {
  evaluateContextSufficiencyLogic,
  evaluateContextRelevanceLogic
} from '@/lib/agents/ContextContentAgent';

export const contextContentKpiDefinitions: KpiDefinition[] = [
  {
    id: "context-sufficiency",
    key: "contextSufficiency",
    name_pdd: "Context Sufficiency",
    description: "Evaluates whether the user has provided enough background information, data, and specific details for the AI to complete the task accurately without making broad assumptions.",
    category_key: "context_content_richness",
    evaluation_type: "hybrid",
    rule_based_logic_fn: evaluateContextSufficiencyLogic,
    ai_meta_prompt_template: "Assess whether sufficient context and background information is provided in this prompt for an AI to effectively complete the implied task without needing external references. Rate the contextual sufficiency from 0 to 100 and explain your reasoning. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: Comprehensive context is provided. The AI has all the necessary information to complete the task effectively." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: Sufficient context is provided for a high-quality response with minimal AI assumptions." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: Some context is provided, but key details are missing, which may require the AI to make assumptions.", improvementSuggestions: ["Define the target audience for the response.", "Include any relevant data or reference material directly in the prompt.", "Clarify the specific domain or use case if it's not obvious."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: Insufficient context is provided. The AI is missing critical background information needed to complete the task well.", improvementSuggestions: ["Add essential background details that an expert would need.", "Specify the intended goal or purpose of the output.", "If referencing external information, provide a summary of the key points."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: Critical context is missing. The AI lacks the fundamental information needed to perform the task.", improvementSuggestions: ["Start by providing the essential background context for your request.", "Define the target audience.", "Include any data or key terms the AI must use."] }
    ],
    default_weight_in_category: 0.6,
    directly_impacts_output_vitals: ["Accuracy_Correctness", "Consistency", "Model_Confidence_Proxy"]
  },
  {
    id: "context-relevance", 
    key: "contextRelevance",
    name_pdd: "Context Relevance",
    description: "Measures whether the provided context is directly relevant to the task and does not include unnecessary, distracting, or contradictory information.",
    category_key: "context_content_richness",
    evaluation_type: "hybrid",
    rule_based_logic_fn: evaluateContextRelevanceLogic,
    ai_meta_prompt_template: "Assess the relevance of the context provided in this prompt. Does all the information directly support the task, or is some of it irrelevant, distracting, or contradictory? Rate from 0 to 100 and explain. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: All provided context is highly relevant and directly supports the task's goal." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: The context is mostly relevant with only minimal, non-distracting extra information." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: The context is generally relevant but includes some unnecessary information that could be removed.", improvementSuggestions: ["Remove any details that do not directly contribute to the main task.", "If providing a large block of text, highlight or summarize the most important parts for the AI.", "Ensure all parts of the context are consistent with each other."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: The context includes significant irrelevant information that may confuse the AI or lead to an off-target response.", improvementSuggestions: ["Focus the context exclusively on the information needed to solve the immediate problem.", "Remove any contradictory statements or data.", "If you have multiple distinct pieces of context, use headings to organize them."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: The context provided is largely irrelevant or contradictory to the stated task.", improvementSuggestions: ["Ensure the context you provide directly relates to the prompt's main goal.", "Remove any information that could confuse or distract the AI.", "Check for and resolve any contradictions in the provided context."] }
    ],
    default_weight_in_category: 0.4, 
    directly_impacts_output_vitals: ["Readability_Coherence", "Accuracy_Correctness", "Model_Confidence_Proxy"]
  }
];
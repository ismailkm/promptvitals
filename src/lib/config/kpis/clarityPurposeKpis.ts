// src/lib/config/kpis/clarityPurposeKpis.ts

import { KpiDefinition } from '@/lib/types/kpiEvaluation';


import {
  evaluateClarityUnambiguityRules,
  evaluateSpecificityDetailScopeRules,
  evaluateGoalAlignmentLogic,
  evaluateInstructionFollowingLogic
} from '@/lib/agents/ClarityPurposeAgent';

export const clarityPurposeKpiDefinitions: KpiDefinition[] = [
  {
    id: "clarity-unambiguity",
    key: "clarityUnambiguity",
    name_pdd: "Clarity (Unambiguity)",
    description: "Assesses the prompt for unambiguous language and easily understandable intent. A high score means the prompt avoids jargon, vague terms, and overly complex sentences that could be misinterpreted.",
    category_key: "clarity_purpose",
    evaluation_type: "hybrid",
    rule_based_logic_fn: evaluateClarityUnambiguityRules,
    ai_meta_prompt_template: "Rate the overall linguistic clarity and unambiguity of this prompt (0-100). Identify any specific jargon, vague terms, or ambiguous phrases. Explain your reasoning. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: The prompt's language is precise, unambiguous, and easy to understand. The intent is crystal clear." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: The language is mostly clear. Any minor ambiguities are unlikely to cause significant misinterpretation." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: The prompt contains some vague terms or phrases with multiple meanings. While the general intent is understandable, specific aspects could be misconstrued.", improvementSuggestions: ["Replace general pronouns like 'it' or 'they' with specific nouns.", "Clearly define any domain-specific jargon or acronyms.", "Review for phrases that could have multiple interpretations."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: The prompt has significant clarity issues, containing multiple vague or ambiguous statements that make the intent difficult to discern.", improvementSuggestions: ["Break down long, complex sentences into simpler ones.", "Clearly define all key terms and concepts.", "Ensure every pronoun has a clear antecedent."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: The prompt is highly unclear and ambiguous, making it very difficult to understand. It requires substantial revision.", improvementSuggestions: ["Rewrite the prompt focusing on one clear objective at a time.", "Use simple, direct language.", "Ask someone else to read it to check for understanding."] }
    ],
    default_weight_in_category: 0.35,
    directly_impacts_output_vitals: ["Consistency", "Accuracy_Correctness", "Readability_Coherence"]
  },
  {
    id: "specificity-detail-scope",
    key: "specificityDetailScope",
    name_pdd: "Specificity (Detail & Scope)",
    description: "Evaluates if the prompt provides sufficient concrete details, constraints (e.g., length, format), and a well-defined scope to guide the AI's response effectively.",
    category_key: "clarity_purpose",
    evaluation_type: "hybrid",
    rule_based_logic_fn: evaluateSpecificityDetailScopeRules,
    ai_meta_prompt_template: "Assess the level of specificity, detail, and scope definition in this prompt (0-100). Does it provide enough concrete constraints (e.g., length, topics to include/exclude) for an AI to generate a focused response without making assumptions? Explain. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: The prompt is highly specific, providing all necessary details, clear constraints, and a well-defined scope." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: The prompt provides good detail and clear boundaries, reducing the need for AI assumptions." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: The prompt provides some details but could be more specific about the scope or desired output characteristics.", improvementSuggestions: ["Specify the desired length or word count.", "List key points to include or, just as importantly, to exclude.", "Add a concrete example to illustrate the level of detail you expect."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: The prompt lacks essential details and specific constraints. The scope is too vague, likely leading to a generic response.", improvementSuggestions: ["Define the target audience for the response.", "Provide explicit constraints on length, style, or content.", "If the topic is broad, narrow it down to a more manageable scope."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: The prompt is extremely vague and lacks almost all necessary specificity, detail, and scope definition.", improvementSuggestions: ["Start by listing all the information the AI needs to complete the task.", "Provide clear and direct constraints."] }
    ],
    default_weight_in_category: 0.25,
    directly_impacts_output_vitals: ["Accuracy_Correctness", "Verbosity", "Consistency"]
  },
  {
    id: "goal-alignment",
    key: "goalAlignment",
    name_pdd: "Goal Alignment",
    description: "Checks if the user's core intent and the desired type of output (e.g., summary, list, analysis, creative piece) are clearly and explicitly stated.",
    category_key: "clarity_purpose",
    evaluation_type: "hybrid", 
    rule_based_logic_fn: evaluateGoalAlignmentLogic,
    ai_meta_prompt_template: "Analyze the user's intent in this prompt (0-100). Is the primary goal and the desired type of output (e.g., analysis, list, creative story) clear and explicit, or is it vague and must be inferred? Explain. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: The prompt's main goal and desired output type are explicitly and clearly stated." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: The goal is clear, and the desired output type can be reasonably inferred from the context." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: The goal is somewhat apparent, but could be stated more directly. The specific type of output is not mentioned.", improvementSuggestions: ["Begin your prompt with a clear action verb (e.g., 'Analyze...', 'Generate a list of...', 'Summarize...').", "Explicitly state the desired format, such as 'Provide the output as a bulleted list'."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: The prompt's overall goal is unclear, or the type of output expected is ambiguous.", improvementSuggestions: ["State your primary objective in the first sentence.", "Specify if you want an analysis, a summary, a creative piece, etc."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: It is very difficult to determine the goal of the prompt or what kind of response is expected.", improvementSuggestions: ["Start your prompt by clearly stating the goal, for example: 'Your goal is to summarize this document.'", "Be explicit about the type of output you want (e.g., 'a list', 'a paragraph', 'a JSON object')."] }
    ],
    default_weight_in_category: 0.20,
    directly_impacts_output_vitals: ["Accuracy_Correctness", "Readability_Coherence"]
  },
  {
    id: "instruction-following",
    key: "instructionFollowing",
    name_pdd: "Instruction Clarity",
    description: "Assesses whether the instructions are clear, direct, and phrased positively to maximize the AI's ability to follow them accurately. Avoids contradictions.",
    category_key: "clarity_purpose",
    evaluation_type: "rule_based",
    rule_based_logic_fn: evaluateInstructionFollowingLogic,
      rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: All instructions are clear, direct, positive, and logically consistent." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: Instructions are clear and actionable. Any minor use of negative phrasing is not confusing." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: Some instructions could be clearer, or there is moderate use of negative phrasing (e.g., 'don't do X') which is often less effective than positive phrasing.", improvementSuggestions: ["Try to rephrase negative instructions as positive ones (e.g., instead of 'don't include jargon', try 'write in simple, accessible language').", "For complex requests, number or bullet each distinct step."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: Instructions are ambiguous, contradictory, or rely heavily on negative phrasing, which can confuse the AI.", improvementSuggestions: ["Resolve any contradictory statements.", "Focus on telling the AI what to do, rather than only what to avoid.", "Simplify complex instructions into smaller steps."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: Instructions are very confusing, contradictory, or are largely missing.", improvementSuggestions: ["Ensure your instructions are not contradictory.", "Break down the request into a clear, step-by-step list.", "If giving a negative instruction, explain the positive alternative."] }
    ],
    default_weight_in_category: 0.20,
    directly_impacts_output_vitals: ["Accuracy_Correctness", "Consistency"]
  }
];
// src/lib/config/kpis/instructionsStructureKpis.ts
import { KpiDefinition } from '@/lib/types/kpiEvaluation';

import {
  evaluateFormatStructureLogic,
  evaluateTaskDecompositionLogic,
  evaluateLengthConstraintsLogic,
  evaluateExamplesPresenceLogic,
  evaluateToneStyleKeywordsLogic,
  evaluateIterativePotentialLogic
} from '@/lib/agents/InstructionsStructureAgent'

export const instructionsStructureKpiDefinitions: KpiDefinition[] = [
  {
    id: "format-structure",
    key: "formatStructure",
    name_pdd: "Format & Structure",
    description: "Evaluates the prompt's overall organization (e.g., use of headings, paragraphs) and if it specifies a desired output format (e.g., JSON, table, list).",
    category_key: "instructions_structure",
    evaluation_type: "hybrid",
    rule_based_logic_fn: evaluateFormatStructureLogic,
    ai_meta_prompt_template: "Analyze the structure of this prompt (0-100). Is it well-organized with clear sections? Does it specify a desired output format? Explain. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: The prompt is exceptionally well-organized and provides clear instructions on the desired output format." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: The prompt has a logical structure, and some guidance on output format is present." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: The prompt has some structure but could be better organized. Output format is not specified.", improvementSuggestions: ["Use headings or distinct paragraphs for different parts of a complex prompt.", "Clearly specify the desired output format (e.g., 'Provide the output as a JSON object')."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: The prompt lacks clear structure and provides no guidance on the output format.", improvementSuggestions: ["Organize your prompt into logical sections like [CONTEXT] and [INSTRUCTIONS].", "Explicitly define the output format you need."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: The prompt's structure is chaotic or missing, with no guidance on the output format.", improvementSuggestions: ["Start by organizing your prompt into clear sections using headings.", "State the desired output format at the beginning or end of your prompt."] }
    ],
    default_weight_in_category: 0.25,
    directly_impacts_output_vitals: ["Readability_Coherence", "Verbosity"]
  },
  {
    id: "task-decomposition-steps",
    key: "taskDecomposition",
    name_pdd: "Task Decomposition",
    description: "Measures if a complex request is appropriately broken down into smaller, sequential steps or a clear hierarchy.",
    category_key: "instructions_structure",
    evaluation_type: "hybrid", 
    rule_based_logic_fn: evaluateTaskDecompositionLogic,
    ai_meta_prompt_template: "Analyze how this prompt breaks down its task (0-100). Is a complex request decomposed into clear, logical steps, or is it one monolithic block? Explain. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: The complex task is broken down into a clear, logical, and hierarchical set of steps." },
      { minScore: 85, maxScore: 89, assessmentComment: "Good: The task is broken down into clear steps, making it easy for the AI to follow." },
      { minScore: 80, maxScore: 84, assessmentComment: "Good: The task shows clear decomposition into steps. The breakdown helps the AI understand the structure and sequence of the work.", improvementSuggestions: ["Consider adding more specific sub-steps for complex components.", "Ensure each step is actionable and distinct.", "Use consistent formatting for all steps (e.g., numbered lists)."] },
      { minScore: 50, maxScore: 79, assessmentComment: "Fair: There is some attempt at a task breakdown, but the steps could be clearer or more distinct.", improvementSuggestions: ["Use a numbered or bulleted list to explicitly separate each step or sub-task.", "Ensure each step represents a single, clear action for the AI to take."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: A complex task is presented as a single block of text without a clear breakdown, risking confusion.", improvementSuggestions: ["For any request with more than one component, break it down into a list.", "Use sequencing words (e.g., 'First, do X. Second, do Y.')."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: Multiple complex tasks are overloaded into the prompt with no decomposition at all.", improvementSuggestions: ["Identify the distinct tasks in your prompt and separate them into a numbered list.", "Focus the prompt on one primary goal to avoid overloading."] }
    ],
    default_weight_in_category: 0.20, 
    directly_impacts_output_vitals: ["Readability_Coherence", "Accuracy_Correctness"]
  },
  {
    id: "examples-few-shot-learning",
    key: "examplePresence",
    name_pdd: "Examples (Few-Shot)", 
    description: "Evaluates if in-context examples are provided to guide the AI, which is crucial for nuanced tasks or specific output styles.",
    category_key: "instructions_structure",
    evaluation_type: "rule_based",
    rule_based_logic_fn: evaluateExamplesPresenceLogic,
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: High-quality, structured examples are provided that effectively demonstrate the desired output." },
      { minScore: 76, maxScore: 89, assessmentComment: "Good: Well-structured examples are present and provide clear guidance to the AI." },
      { minScore: 65, maxScore: 75, assessmentComment: "Fair: Inline examples are provided (e.g., using 'e.g.' or 'for example'), which offer helpful clarification. For best results, consider adding structured few-shot examples.", improvementSuggestions: ["Consider adding a full few-shot example with input/output format.", "Structure examples with clear labels or formatting.", "For complex tasks, provide multiple examples showing different scenarios."] },
      { minScore: 0, maxScore: 64, assessmentComment: "Needs Improvement: No examples are provided. For complex, nuanced, or style-specific tasks, providing examples can significantly improve performance.", improvementSuggestions: ["Include a clear 'good' example of the desired output.", "For complex tasks, show the AI a simplified version of what you expect.", "Use inline examples (e.g., 'Pillar: Mindful Breaks, Slogan: \"Recharge to Retain.\"') to clarify specific points."] }
    ],
    default_weight_in_category: 0.15, 
    directly_impacts_output_vitals: ["Accuracy_Correctness", "Consistency", "Readability_Coherence"]
  },
  {
    id: "tone-style-creativity-guidance",
    key: "structureCoherence",
    name_pdd: "Tone & Style Guidance",
    description: "Assesses if the prompt provides clear instructions on the desired tone (e.g., formal), style (e.g., academic), or persona the AI should adopt.",
    category_key: "instructions_structure",
    evaluation_type: "hybrid",
    rule_based_logic_fn: evaluateToneStyleKeywordsLogic,
    ai_meta_prompt_template: "Rate the effectiveness (0-100) and clarity of the tone and style guidance in this prompt. Is it sufficient for an AI to adopt the desired persona? Explain. Prompt: {PROMPT_TEXT}",
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: Clear, specific, and effective guidance on tone, style, and persona is provided." },
      { minScore: 75, maxScore: 89, assessmentComment: "Good: Guidance on tone and style is present and helpful." },
      { minScore: 50, maxScore: 74, assessmentComment: "Fair: Some attempt to guide the tone or style, but it could be more explicit.", improvementSuggestions: ["Clearly state the desired tone (e.g., 'Write in a professional and formal tone').", "Define the persona the AI should adopt (e.g., 'Act as an expert...')."] },
      { minScore: 25, maxScore: 49, assessmentComment: "Poor: Guidance on tone or style is vague, minimal, or completely missing.", improvementSuggestions: ["Specify if the tone should be formal, casual, academic, friendly, etc.", "If creativity is important, state the desired level (e.g., 'Be highly creative')."] },
      { minScore: 0, maxScore: 24, assessmentComment: "Very Poor: No guidance is provided on tone or style.", improvementSuggestions: ["Start by defining the persona the AI should adopt (e.g., 'Act as a helpful assistant').", "Add a sentence describing the desired tone (e.g., 'The tone should be formal and academic')."] }
    ],
    default_weight_in_category: 0.15
  },
  {
    id: "length-conciseness-constraints",
    key: "lengthConcisenessConstraints",
    name_pdd: "Length Constraints", 
    description: "Checks if the prompt specifies the desired output length (e.g., word count, 'be concise') to prevent overly verbose or brief responses.",
    category_key: "instructions_structure",
    evaluation_type: "rule_based",
    rule_based_logic_fn: evaluateLengthConstraintsLogic,
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: Clear and appropriate length or conciseness constraints are provided." },
      { minScore: 60, maxScore: 89, assessmentComment: "Good: Some guidance on length or conciseness is present (e.g., 'be brief')." },
      { minScore: 0, maxScore: 59, assessmentComment: "Needs Improvement: No length constraints are provided, which may lead to unpredictable output length.", improvementSuggestions: ["Specify a target word count, sentence limit, or number of items.", "Use phrases like 'be concise' or 'provide a brief overview' for shorter responses."] }
    ],
    default_weight_in_category: 0.15,
    directly_impacts_output_vitals: ["Verbosity"]
  },
  {
    id: "iterative-potential",
    key: "iterativePotential",
    name_pdd: "Iterative Potential",
    description: "Assesses if the prompt's structure facilitates easy modification and testing of variations (e.g., using placeholders or modular sections).",
    category_key: "instructions_structure",
    evaluation_type: "rule_based",
    rule_based_logic_fn: evaluateIterativePotentialLogic,
    rubric: [
      { minScore: 90, maxScore: 100, assessmentComment: "Excellent: The prompt is exceptionally well-structured for easy iteration, likely using placeholders or clear variables." },
      { minScore: 70, maxScore: 89, assessmentComment: "Good: The prompt's design supports easy modification and testing." },
      { minScore: 40, maxScore: 69, assessmentComment: "Fair: The prompt could be structured more clearly to make changes and test variations easier.", improvementSuggestions: ["Use placeholders like [VARIABLE] or {slot_name} for parts you expect to change often.", "Group all your variables or configuration settings at the top of the prompt."] },
      { minScore: 0, maxScore: 39, assessmentComment: "Poor: The prompt's structure is monolithic or complex, making it difficult to refine iteratively.", improvementSuggestions: ["Break the prompt into logical sections with clear headings like [CONTEXT] and [TASK].", "For variables you might change often, consider using placeholders like {VARIABLE_NAME}."] }
    ],
    default_weight_in_category: 0.10
  }
];

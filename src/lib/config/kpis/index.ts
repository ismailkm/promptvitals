// src/lib/config/kpis/index.ts

import { KpiDefinition, MainCategoryConfig } from '@/lib/types/kpiEvaluation';
import { MainCategoryKey } from '@/lib/types/shared';
import { clarityPurposeKpiDefinitions } from './clarityPurposeKpis';
import { instructionsStructureKpiDefinitions } from './instructionsStructureKpis';
import { contextContentKpiDefinitions } from './contextContentKpis';
import { safetyEthicsKpiDefinitions } from './safetyEthicsKpis';

// --- All Input-Focused Key Performance Indicator Definitions (13 total) ---
export const allKpiDefinitions: KpiDefinition[] = [
  ...clarityPurposeKpiDefinitions,
  ...instructionsStructureKpiDefinitions,
  ...contextContentKpiDefinitions,
  ...safetyEthicsKpiDefinitions,
];

// --- Main Category Configurations (3 total) ---
export const mainCategoriesList: MainCategoryConfig[] = [
    {
        key: "clarity_purpose",
        name: "Clarity & Purpose",
        description: "Evaluates the clarity of the prompt's language, the clear definition of its intended goal, and if instructions are easy to follow.",
        default_weight_overall: 0.35,
        strength_snippet: "The prompt excels in Clarity & Purpose, featuring clear language and a well-defined goal.",
        issue_snippet: "The primary area for improvement is Clarity & Purpose; the prompt's goal or language may be vague or unfocused."
    },
    {
        key: "instructions_structure",
        name: "Instructions & Structure",
        description: "Assesses the prompt's organization, task breakdown, formatting, use of examples, tone/style guidance, and design for refinement.",
        default_weight_overall: 0.35,
        strength_snippet: "The prompt's Instructions & Structure are excellent, using clear organization and detailed guidance.",
        issue_snippet: "The primary area for improvement is Instructions & Structure; the prompt may lack clear formatting or detailed steps."
    },
    {
        key: "context_content_richness",
        name: "Context & Content Richness",
        description: "Evaluates the sufficiency, accuracy, and relevance of the context provided in the prompt to enable effective AI performance.",
        default_weight_overall: 0.30,
        strength_snippet: "The prompt provides rich and sufficient Context, giving the AI all the information it needs to perform the task.",
        issue_snippet: "The primary area for improvement is Context & Content Richness; the prompt may be missing critical background information."
    },

];

export const mainCategoryConfigsFull: MainCategoryConfig[] = [
    {
        key: "clarity_purpose",
        name: "Clarity & Purpose",
        description: "Evaluates the clarity of the prompt's language, the clear definition of its intended goal, and if instructions are easy to follow.",
        default_weight_overall: 0.30
    },
    {
        key: "instructions_structure",
        name: "Instructions & Structure",
        description: "Assesses the prompt's organization, task breakdown, formatting, use of examples, tone/style guidance, and design for refinement.",
        default_weight_overall: 0.30
    },
    {
        key: "context_content_richness",
        name: "Context & Content Richness",
        description: "Evaluates the sufficiency, accuracy, and relevance of the context provided in the prompt to enable effective AI performance.",
        default_weight_overall: 0.20
    },
    {
        key: "predicted_output_quality", // The 5th category
        name: "Predicted Output Quality & AI Behavior",
        description: "Provides an assessment of the likely characteristics of the AI's response based on the overall quality of the input prompt.",
        default_weight_overall: 0 // This category's "score" is derived, not part of input prompt's weighted score
    }
];

// Helper function to get a KPI definition by its key or id
export const getKpiDefinition = (identifier: string): KpiDefinition | undefined => {
    return allKpiDefinitions.find(kpi => kpi.key === identifier || kpi.id === identifier);
};

// Helper function to get a Main Category config by its key
export const getMainCategoryConfig = (key: MainCategoryKey): MainCategoryConfig | undefined => {
    return mainCategoriesList.find(cat => cat.key === key);
};

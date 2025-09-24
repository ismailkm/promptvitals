// src/lib/types/aiTypes.ts
import { AnalyzedPromptDataContext } from './promptAnalysis';
import { KpiEvaluationOutput } from './kpiEvaluation';

/**
 * Raw result type for parsing LLM JSON output before validation/casting
 */
export type RawAIResult = {
  inferredGoal?: unknown;
  confidence?: unknown;
  primaryActionVerb?: unknown;
  rationale?: unknown;
};

/**
 * Parameters for chat completion requests
 * Used to standardize input for local LLM calls
 */
export type LLMChatCompletionParams = {
  model?: string; 
  messages: ChatMessage[]; 
  temperature?: number; 
  max_tokens?: number; 
  schema?: any;
};


/**
 * Result returned by AI goal inference modules
 */
export type AIGoalInferenceResult = {
  inferredGoal?: string | null;
  confidence: number;
  rationale?: string;
  primaryActionVerb?: string | null;
};

/**
 * Function signature for AI goal inference implementations
 */
export type AIGoalInferenceFn = (
  analyzedContext: AnalyzedPromptDataContext
) => Promise<AIGoalInferenceResult> | AIGoalInferenceResult;

/**
 * Role for chat messages sent to LLMs (system: instructions/context, user: actual prompt)
 */
export type ChatRole = 'system' | 'user';

/**
 * Represents a single message in an LLM chat conversation
 * Used for both OpenAI and Ollama adapters
 */
export type ChatMessage = {
  role: ChatRole;
  content: string;
};

/**
 * Generic interface for any LLM adapter (OpenAI, Ollama, etc)
 * Ensures a consistent API for chat completions with JSON output
 */
export interface LLMClient {
  name: string; // Adapter/provider name (e.g., 'openai', 'ollama')
  chatJSON(params: LLMChatCompletionParams): Promise<{ content: string }>;
}

export type LLMConfig = {
  provider: 'openai' | 'ollama' | 'anthropic'; // Add more providers here
  primaryModel: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
};



// --- CLARITY ANALYSIS

/**
 * Comprehensive AI analysis result for ClarityPurposeAgent (all 4 features)
 */
export type AIClarityAnalysisResult = {
  goalAlignment?: {
    inferredGoal?: string | null;
    primaryActionVerb?: string | null;
    confidence: number;
    rationale?: string;
  };
  clarityContext?: {
    contextualAmbiguity?: string[];
    criticalTerms?: string[];
    confidence: number;
    rationale?: string;
  };
  specificityReview?: {
    missingConstraints?: string[];
    outputFormatClarity?: string;
    confidence: number;
    rationale?: string;
  };
  instructionCoherence?: {
    contradictionsDetected?: string[];
    followingLikelihood?: number;
    confidence: number;
    rationale?: string;
  };
};

/**
 * Function signature for comprehensive AI clarity analysis
 */
export type AIClarityAnalysisFactory = (
  analyzedContext: AnalyzedPromptDataContext,
  eligibleFeatures: string[]
) => Promise<AIClarityAnalysisResult> | AIClarityAnalysisResult;




// Factory for AI instruction and structure analysis
export type AIInstructionsStructureAnalysisFactory = (
  analyzedContext: AnalyzedPromptDataContext,
  eligibleFeatures: AIEligibleFeature[] | string[]
) => Promise<AIInstructionsStructureResult> | AIInstructionsStructureResult;


/**
 * Eligible features for AI-enhanced analysis
 */
export type AIEligibleFeature = 
  | 'formatSuggestion'
  | 'exampleQualityReview'
  | 'structureCoherence'
  | 'decompositionSuggestion';

/**
 * AI response structure for instructions structure analysis
 */
export interface AIInstructionsStructureResult {
  formatSuggestion?: {
    confidence: number; // 0-100
    suggestion: string;
    reasoning: string;
    structureImprovement: 'minor' | 'moderate' | 'major';
  };
  exampleQualityReview?: {
    confidence: number; // 0-100
    qualityAssessment: 'poor' | 'fair' | 'good' | 'excellent';
    reasoning: string;
    suggestedImprovements: string[];
  };
  structureCoherence?: {
    confidence: number; // 0-100
    coherenceIssues: string[];
    conflictSeverity: 'minor' | 'moderate' | 'severe';
    resolutionSuggestions: string[];
  };
  decompositionSuggestion?: {
    confidence: number; // 0-100
    decompositionQuality: 'poor' | 'fair' | 'good' | 'excellent';
    suggestedBreakdown: string[];
    reasoning: string;
  };
}

// === Safety & Ethics Analysis ===

/**
 * Comprehensive AI analysis result for SafetyEthicsAgent safety features
 */
export type AISafetyAnalysisResult = {
  implicitBiasAssessment?: {
    biasTypes?: string[];
    affectedGroups?: string[];
    biasConfidence?: number;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    rationale?: string;
  };
  subtleMaliciousness?: {
    manipulationTactics?: string[];
    harmfulIntent?: string;
    sophisticationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    rationale?: string;
  };
  culturalSensitivity?: {
    culturalConcerns?: string[];
    affectedCultures?: string[];
    sensitivityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    rationale?: string;
  };
};

/**
 * Function signature for comprehensive AI safety analysis
 */
export type AISafetyAnalysisFactory = (
  analyzedContext: AnalyzedPromptDataContext,
  eligibleFeatures: string[]
) => Promise<AISafetyAnalysisResult> | AISafetyAnalysisResult;

// === Context & Content ===

/**
 * Comprehensive AI analysis result for ContextContentAgent
 */
export type AIContextContentAnalysisResult = {
  contextSufficiency?: {
    confidence: number;
    assessment: 'insufficient' | 'sufficient' | 'excellent';
    missingInfo: string[];
    relevanceIssues: string[];
    rationale: string;
  };
  contextRelevance?: {
    confidence: number;
    assessment: 'insufficient' | 'sufficient' | 'excellent';
    missingInfo: string[];
    relevanceIssues: string[];
    rationale: string;
  };
};

/**
 * Function signature for comprehensive AI context content analysis
 */
export type AIContextContentAnalysisFactory = (
  analyzedContext: AnalyzedPromptDataContext,
  eligibleFeatures: string[]
) => Promise<AIContextContentAnalysisResult> | AIContextContentAnalysisResult;

// === HYBRID ENHANCEMENT INTERFACES ===

// Used to map a value to a score based on threshold ranges (e.g., for penalties or bonuses)
export interface ScoreThreshold {
  limit?: number;        
  scoreToAssign: number;
}

// Represents a single item with a score and its weight for weighted average calculations
export interface WeightedScoreItem {
  score: number;
  weight: number; 
}

/**
 * Configuration for confidence-based score adjustments in hybrid AI evaluations
 */
export interface EnhancementConfig {
  highConfidenceBonus: number;     // Bonus for confidence >= 0.9
  mediumConfidenceBonus: number;   // Bonus for confidence >= 0.8
  lowConfidenceBonus: number;      // Bonus for confidence >= 0.6
  lowConfidencePenalty: number;    // Penalty for confidence < 0.5
  customLogic?: (aiResult: any, confidence: number) => number; // Optional custom adjustment logic
}

/**
 * Rule for determining AI eligibility based on analyzed context
 */
export interface AIEligibilityRule {
  feature: string;
  condition: (context: AnalyzedPromptDataContext) => boolean;
}

/**
 * Generic enhancement function signature for AI-enhanced KPI evaluations
 */
export type EnhancementFunction = (
  ruleResult: KpiEvaluationOutput,
  aiResult: any
) => KpiEvaluationOutput;

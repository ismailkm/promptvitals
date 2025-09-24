// src/lib/types/kpiTypes.ts


/**
 * Defines the structure for a rule-based pattern used in prompt analysis.
 * Each pattern specifies what to look for in the text, why it's relevant,
 * and how critical its presence is for the prompt's quality or safety.
 */
export interface PatternWithMetadata {
  /**
   * The regular expression to match against the prompt text.
   * This defines the specific word, phrase, or linguistic structure to detect.
   * Example: `/\b(must|should)\b/gi` to find directive keywords.
   */
  pattern: RegExp;

  /**
   * A concise, human-readable explanation of why this pattern is significant
   * or what it indicates when detected in the prompt. This reason can be
   * used for feedback or logging.
   * Example: "Directive or obligation keyword detected."
   */
  reason: string;

  /**
   * The severity level of the detected pattern, indicating its impact or importance.
   * This helps evaluation agents weigh different findings.
   * Possible values are typically "low", "medium", "high", or "critical".
   */
  severity: SeverityLevel;
}

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
 * Defines the possible risk assessment levels for overall prompt safety.
 */
export type RiskAssessmentLevel = "Low" | "Medium" | "High" | "Critical";

/**
 * Defines the possible sources for a KPI evaluation's score and initial feedback.
 */
export type KpiEvaluationSource =
  | "rule_based"                 // Score and feedback fully determined by programmed rules
  | "ai_powered"                 // Score and feedback primarily determined by an LLM evaluation
  | "hybrid_rule_dominant"       // Hybrid: Rule-based finding took precedence or was primary
  | "hybrid_ai_dominant"         // Hybrid: AI-powered finding took precedence or was primary
  | "manual_override";           // If a human review process can override automated scores

/**
 * Defines the primary method intended for evaluating a KPI as configured.
 */
export type KpiEvaluationMethodType = "rule_based" | "ai_powered" | "hybrid";

// --- Output Length Constraint Type Definitions ---
// For regex matching broader terms
export const VALID_NUMERIC_LENGTH_UNITS_RAW: string[] = [ 
  "word", "words", "item", "items", "paragraph", "paragraphs",
  "line", "lines", "character", "characters"
];
// These are the canonical values for the type
export const VALID_NUMERIC_LENGTH_UNITS_NORMALIZED = [
  "words", "items", "paragraphs", "lines", "characters"
] as const; 
// For regex matching broader terms
export const VALID_QUALITATIVE_LENGTH_TYPES_RAW: string[] = [ 
  "concise", "brief", "short", "detailed", "long", "extensive"
];
// Canonical values
export const VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED = [
  "concise", "brief", "detailed"
] as const; 

export const QUALITATIVE_LENGTH_NORMALIZATION_MAP: Record<string, typeof VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED[number]> = {
    "short": "brief",
    "long": "detailed",
    "extensive": "detailed"
};

export const SPECIFIC_VALUE_TYPE_CONST = "specific_value" as const;

export type NumericLengthUnitType = typeof VALID_NUMERIC_LENGTH_UNITS_NORMALIZED[number];
export type QualitativeLengthType = typeof VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED[number];

export type OutputLengthConstraintType =
  | NumericLengthUnitType
  | QualitativeLengthType
  | typeof SPECIFIC_VALUE_TYPE_CONST;
  
/**
 * Defines possible keys for output vitals that input KPIs can influence.
 * These correspond to the PDD V2 "Output Driven" KPIs.
 */
export type OutputVitalKey =
  | "Readability_Coherence"
  | "Accuracy_Correctness"
  | "Consistency"
  | "Verbosity"
  | "Model_Confidence_Proxy";

/**
 * Defines the keys for common prompt mistakes as listed in PDD V2, Section 5.
 */
export type PddCommonMistakeKey =
  | "VagueOrUnclearPrompts"
  | "OverloadingPrompts"
  | "MissingContext"
  | "IgnoringOutputFormatStructure"
  | "MisalignmentWithAlCapabilities"
  | "NotUsingExamples"
  | "AmbiguousLanguageTerms"
  | "IgnoringAudienceAndPurpose"
  | "PoorPromptStructure"
  | "ContradictoryOrNegativeInstructions"
  | "InstructingMaliciousOrMisuseBehaviour";

/**
 * Defines the severity level for a detected pattern or issue.
 */
export type SeverityLevel = "low" | "medium" | "high" | "critical";

/**
 * Structure to hold detailed information about a detected pattern/issue
 * found by the PromptAnalyzer.
 */
export interface DetectedPatternInfo {
  matchedPatternSource: string; // The source of the regex pattern (e.g., from PatternWithMetadata.pattern.source)
  reason: string;               // The reason why this pattern is significant (from PatternWithMetadata.reason)
  severity: SeverityLevel;        // The severity of the issue (from PatternWithMetadata.severity)
  matchedText?: string;          // Optional: The actual text snippet that matched the pattern
  // Add any other relevant metadata from the pattern definition if needed
}

/**
 * QuestionInfo interface represents the structured details of a question
 */
export interface QuestionInfo {
  questionMarksCount: number;
  identifiedQuestionSentences: string[];
  count: number;
  types: string[]; 
}

/**
 * Represents the structured data extracted from the initial analysis of a user's prompt
 * by the PromptAnalyzer module. This context is fed into KPI evaluation functions.
 */
export interface AnalyzedPromptDataContext {
  promptText: string;
  lengthChars: number;
  lengthWords: number;

  // Related to Clarity, Specificity, Goal Alignment, Instruction Following
  clarityIssuesFound?: DetectedPatternInfo[];      // For vague terms, ambiguous phrases, jargon
  readabilityScore?: number | null;
  averageSentenceLength?: number | null;   
  complexSentenceCount?: number;           
  lexicalDiversityScore?: number | null;
  nounVerbBalanceRatio?: number | null;       
  mentionsTargetAudience?: boolean;
  explicitlyStatesGoal?: boolean;
  actionVerbDetails?: { count: number; verbs: string[] }; // Number of distinct action verbs and the verbs themselves
  negativeInstructionIssues?: DetectedPatternInfo[]; // For "don't", "never" etc.
  contradictoryStatementFlags?: DetectedPatternInfo[]; // If basic contradiction patterns are found
  specificityElements?: { // More structured way to capture various specificity aspects
    outputLengthConstraint?: {
        type: OutputLengthConstraintType;
        value?: number;
        unit?: string;
        patternInfo?: DetectedPatternInfo; // Metadata about how this was detected
    } | null;
    definedPersonaInfo?: DetectedPatternInfo[]; // If "act as a..." patterns are found
    keyEntitiesFound?: DetectedPatternInfo[];   // For named entities or key concepts
    constraintsMentioned?: DetectedPatternInfo[]; // For general constraint phrases
    outputFormatKeywords?: DetectedPatternInfo[]; // For "list", "table", "JSON" (as keywords, not explicit requests)
  };

  questionDetails?: QuestionInfo;

  // Related to Instructions & Structure
  explicitFormatRequests?: DetectedPatternInfo[]; // For "format as JSON", "output a table"
  bulletPointUsage?: { detected: boolean; count?: number };
  sectionCount?: number;
  exampleDetails?: DetectedPatternInfo[]; // For "Example:", "Input:/Output:" patterns found
  placeholderDetails?: DetectedPatternInfo[]; // For [VARIABLE], {slot}
  toneStyleGuidance?: DetectedPatternInfo[]; // For "formal", "casual", "creative"
  requestsSpecificFormat?: string | null;  
  
  // Related to Context & Content Richness
  contextIndicatorsFound?: DetectedPatternInfo[]; // For "Background:", "For context:"

  // Related to Safety & Ethics
  biasRiskIndicators?: DetectedPatternInfo[];       // From potentially biased terms list
  restrictedContentIndicators?: DetectedPatternInfo[];// From restricted keywords list
  misusePatternIndicators?: DetectedPatternInfo[];  // From TIER1, TIER2, TIER3 malicious patterns
  highPrivilegeDescriptions?: DetectedPatternInfo[];// For "full database access" type phrases
  cumulativeRiskScore?: number; // Default to 0 or null
  riskAssessmentLevel?: RiskAssessmentLevel; // Default to "Low" or null
}

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
  condition?: (analyzedContext: AnalyzedPromptDataContext, kpiOutputFlags?: Record<string, any>) => boolean; // For more complex conditional feedback based on flags
  // assignedScore field is removed; the score from KpiEvaluationOutput is used directly with the rubric tier.
  assessment_comment: string; // User-facing comment template (can have placeholders like {flagValue})
  improvement_suggestions?: string[]; // User-facing suggestion templates
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

  // Keys of PDD V2 "Common Mistakes" that are directly addressed if this KPI scores poorly.
  associated_pdd_mistake_keys?: PddCommonMistakeKey[];
}

/**
 * Defines the configuration for a main evaluation category.
 */
export interface MainCategoryConfig {
    key: MainCategoryKey; // Unique key for the category
    name: string;         // Display name (e.g., "Clarity & Purpose")
    description: string;  // What this category generally assesses
    default_weight_overall: number; // Weight for calculating the overall prompt score (for input categories)
                                   // For "predicted_output_quality", this might be 0 or not applicable.
}
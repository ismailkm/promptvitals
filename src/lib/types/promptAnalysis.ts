// src/lib/types/promptAnalysis.ts

import { DetectedPatternInfo, NestedStepNodePattern } from './patterns'; // Import patterns types
import {
  OutputLengthConstraintType,
  NumericLengthUnitType,
} from './outputLength'; 

import { RiskAssessmentLevel } from './shared'; // Import shared types


/**
 * QuestionInfo interface represents the structured details of a question detected in the prompt.
 */
export interface QuestionInfo {
  questionMarksCount: number; // Raw count of '?' characters
  identifiedQuestionSentences: string[]; // Array of full sentences identified as questions
  count: number; // Count of distinct question sentences
  types: string[]; // Array of classified question types (e.g., "wh-question", "yes/no-question")
}

/**
 * Defines the structure for output length constraints identified in the prompt.
 */
export interface OutputLengthConstraint {
    type: OutputLengthConstraintType; // e.g., 'words', 'sentences', 'brief', 'specific_value'
    min?: number;    // Minimum value for numeric constraints
    max?: number;    // Maximum value for numeric constraints
    value?: number;  // Specific value for "exactly N" or direct numeric requests
    unit?: NumericLengthUnitType; // Unit for numeric constraints (e.g., 'words', 'characters')
    patternInfo?: DetectedPatternInfo; // Metadata about how this constraint was detected
}

/**
 * Holds analysis results related to the instructions and structure of the prompt.
 */
export interface InstructionsAndStructureContext {
  /**
   * Array of detected patterns indicating direct requests for specific output formats
   * (e.g., "JSON format", "as a table").
   * Populated by checking against EXPLICIT_FORMAT_REQUEST_PATTERNS.
   */
  explicitFormatRequests: DetectedPatternInfo[];

  /**
   * A summarized string of the most prominent specific format requested (e.g., "JSON", "Table", "List").
   * Derived from the metadata of the first item in `explicitFormatRequests`.
   * Null if no explicit format is requested.
   */
  requestsSpecificFormat: string | null;

  /**
   * Details about the usage of bullet points or list-like structures in the prompt.
   */
  bulletPointUsage: {
    /** True if bullet points or common list starters are detected. */
    detected: boolean;
    /** The count of detected bullet points/list items, if any. */
    count?: number; // Optional, only present if detected is true
    // Future potential: items?: string[]; // To store actual bullet point text
  };

  /**
   * The number of distinct sections indicated in the prompt
   * (e.g., via Markdown headers, "Section X:", horizontal rules).
   */
  sectionCount: number;

  /**
   * Array of detected patterns indicating the presence of examples provided in the prompt
   * (e.g., "For example:", "Input: ... Output:").
   * Populated by checking against EXAMPLE_PATTERNS.
   */
  exampleDetails: DetectedPatternInfo[];

  /**
   * Array of detected patterns indicating placeholders that the user expects the AI to fill
   * (e.g., "[PLACEHOLDER]", "{VARIABLE}").
   * Populated by checking against PLACEHOLDER_PATTERNS.
   */
  placeholderDetails: DetectedPatternInfo[];

  /**
   * Array of detected patterns indicating explicit guidance on the desired tone or writing style
   * (e.g., "formal tone", "be concise").
   * Populated by checking against TONE_STYLE_KEYWORD_PATTERNS.
   */
  toneStyleGuidance: DetectedPatternInfo[];

  /**
   * Array of detected patterns indicating explicit step markers for task decomposition
   * (e.g., "Step 1:", "First,", "Next,", "Finally").
   * Populated by checking against STEP_MARKER_PATTERNS.
   */
  stepMarkerDetails: DetectedPatternInfo[];

  /**
   * (Derived) Nested structure of steps/bullets, if available.
   * Populated by nestedListAnalysis.parseNestedSteps in the analyzer.
   */
  nestedStepStructure?: NestedStepNodePattern[];

  // Consider adding other relevant fields here as identified by your PDD or KPIs, for example:
  // - presenceOfHeadings: boolean; (could be derived from sectionCount > 0 or specific heading patterns)
  // - taskDecompositionIndicators: DetectedPatternInfo[]; (e.g., "Step 1:", "First, then, finally")
  // - useOfActionVerbsCount: number; (if not already covered in actionVerbDetails under clarity)
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
  nounCount?: number;
  verbCount?: number;       
  explicitlyStatesGoal?: boolean;
  actionVerbDetails?: { count: number; verbs: string[] }; // Number of distinct action verbs and the verbs themselves
  negativeInstructionIssues?: DetectedPatternInfo[]; // For "don't", "never" etc.
  contradictoryStatementFlags?: DetectedPatternInfo[]; // If basic contradiction patterns are found
  specificityElements?: { // More structured way to capture various specificity aspects
    outputLengthConstraints: DetectedPatternInfo[];
    definedPersonaInfo?: DetectedPatternInfo[]; // If "act as a..." patterns are found
    keyEntitiesFound?: DetectedPatternInfo[];   // For named entities or key concepts
    constraintsMentioned?: DetectedPatternInfo[]; // For general constraint phrases
    outputFormatKeywords?: DetectedPatternInfo[]; // For "list", "table", "JSON" (as keywords, not explicit requests)
    exampleInstructions?: DetectedPatternInfo[]; // For instructions to provide examples (clarity agent)
  };

  questionDetails?: QuestionInfo;

  // Related to Instructions & Structure
  instructionsAndStructure: InstructionsAndStructureContext;
  
  // Related to Context & Content Richness
  contextIndicatorsFound?: DetectedPatternInfo[]; // For "Background:", "For context:"
  /**
   * Whether the analyzer detected references to external files/URLs (e.g., "report.pdf", "see attached").
   * Populated by `promptAnalyzer.analyzePromptText` using centralized external-reference patterns.
   */
  mentionsExternalReference?: boolean;

  // Related to Safety & Ethics
  biasRiskIndicators?: DetectedPatternInfo[];       // From potentially biased terms list
  restrictedContentIndicators?: DetectedPatternInfo[];// From restricted keywords list
  misusePatternIndicators?: DetectedPatternInfo[];  // From TIER1, TIER2, TIER3 malicious patterns
  highPrivilegeDescriptions?: DetectedPatternInfo[];// For "full database access" type phrases
  cumulativeRiskScore?: number; // Default to 0 or null
  riskAssessmentLevel?: RiskAssessmentLevel; // Default to "Low" or null
  privacyViolationIndicators: DetectedPatternInfo[];
  
  /**
   * Indicators for manipulation or coercion patterns detected in the prompt.
   * Populated by `promptAnalyzer.analyzePromptText` using centralized manipulation/coercion patterns.
   */
  manipulationIndicators?: DetectedPatternInfo[];

  /**
   * Indicators for dangerous or harmful behavior patterns detected in the prompt.
   * Populated by `promptAnalyzer.analyzePromptText` using DANGEROUS_BEHAVIOR_PATTERNS.
   */
  dangerousBehaviorIndicators?: DetectedPatternInfo[];

  /**
   * Detailed information about the audience specified or implied in the prompt.
   * Populated by `promptAnalyzer.analyzePromptText` using AUDIENCE_DEFINITION_PATTERNS.
   */
  audienceDetails: DetectedPatternInfo[];
  mentionsTargetAudience?: boolean;
  hasConfidentAudienceMention?: boolean; // True if any HIGH confidence audience mention is found 
}
// src/lib/types/patterns.ts

import { SeverityLevel } from './shared'; // Import shared types
import { RiskAssessmentMetadata,  } from './riskAssessment';
import {
  OutputLengthConstraintType,
} from './outputLength';

import {LengthConstraintType, ExampleStructureSubtype, ExampleQualityIndicator, ExampleType, ToneStyleCategory, ToneStyleSubtype, LengthConstraintModifier} from './metadataTypes'
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

  /**
   * Optional. Structured metadata associated with this pattern.
   * The specific structure is determined by the `type` property within the metadata object,
   * allowing for different kinds of metadata for different pattern categories.
   */
  metadata?: AllPatternMetadata | RiskAssessmentMetadata | LengthConstraintPatternMetadata | ExamplePatternMetadata | ToneStylePatternMetadata;
}

/**
 * Metadata specific to patterns that detect requests for output formats.
 */
export interface AllPatternMetadata {
  /**
   * Discriminator to identify this as format-related metadata.
   */
  type: 'format' | 'vagueness' | 'jargon';

  /**
   * The canonical name of the requested output format.
   * Examples: "JSON", "Table", "List", "Markdown", "XML", "CSV", "PlainText", "YAML", "HTML"
   */
  formatType: string;

  /**
   * Optional. For list formats, this can specify a more granular subtype.
   * Examples: "BulletPoints", "NumberedList"
   */
  listSubType?: string;

  /**
   * Optional. If true, the `processPatternList` utility will not trim or normalize
   * the matched text, preserving all leading/trailing whitespace. This is crucial
   * for patterns where indentation is significant (e.g., list markers).
   * @default false
   */
  preserveWhitespace?: boolean;
}

export interface LengthConstraintPatternMetadata {
  /** Discriminator for length constraint patterns. */
  type: 'length_constraint';
  /** The type of constraint (e.g., 'numeric', 'qualitative'). */
  constraintType: LengthConstraintType;
  /** The normalized type of the constraint (e.g., 'words', 'brief'). */
  normalizedType: OutputLengthConstraintType;
  /** The numeric value, if applicable. */
  value?: number;
  /** The specific unit mentioned (e.g., 'word', 'items'), if applicable. */
  unit?: string;
   /** The upper bound of a range (e.g., for "between 100 and 200"). */
  maxValue?: number;
  /** The modifier phrase used (e.g., "under", "between"). */
  modifier?: LengthConstraintModifier;
}

export interface ExamplePatternMetadata {
  /** Discriminator for example patterns. */
  type: 'example';
  /** The type of example structure detected. */
  exampleType: ExampleType;
  /** More specific subtype for structured examples or incomplete examples. */
  structureSubtype?: ExampleStructureSubtype;
  /** Quality indicator for the example. */
  qualityIndicator?: ExampleQualityIndicator;
}

export interface ToneStylePatternMetadata {
  /** Discriminator for tone/style patterns. */
  type: 'tone_style';
  toneCategory: ToneStyleCategory;
  styleSubtype?: ToneStyleSubtype;
}

/**
 * Structure to hold detailed information about a detected pattern/issue
 * found by the PromptAnalyzer.
 */
export interface DetectedPatternInfo {
  id?: string; //A unique ID for this specific detection instance
  matchedPatternSource: PatternWithMetadata | string; // The source of the regex pattern (e.g., from PatternWithMetadata.pattern.source)
  reason: string;               // The reason why this pattern is significant (from PatternWithMetadata.reason)
  severity: SeverityLevel;        // The severity of the issue (from PatternWithMetadata.severity)
  matchedText?: string;          // Optional: The actual text snippet that matched the pattern
  startIndex: number; // Character index where the match starts in the original text
  endIndex: number;   // Character index where the match ends (exclusive)
}

export interface WinkSentence { 
  text: string;
  wordCount: number;
}
export interface SentenceAnalysisResult {
  count: number;
  sentences: WinkSentence[];
}


/** * Represents a node in a nested step/bullet structure.
 * Each node contains the text of the step, its position in the original text,
 * and any child steps that are nested under it.
 */
export interface NestedStepNodePattern {
  text: string;
  matchedText?: string;
  startIndex?: number;
  endIndex?: number;
  children: NestedStepNodePattern[];
  level: number;
}

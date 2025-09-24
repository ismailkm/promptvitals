// src/lib/config/scoringThresholds.ts
import { ScoreThreshold } from '@/lib/types/aiTypes';

// ===================================================================
// THRESHOLDS FOR 'clarityUnambiguity' KPI
// ===================================================================

/**
 * Thresholds for Readability (ARI). Lower ARI score is better.
 * Maps a raw ARI grade level to a 0-100 quality score.
 */
export const READABILITY_ARI_THRESHOLDS: ScoreThreshold[] = [
  { limit: 8, scoreToAssign: 95 },   // Excellent (8th grade and below)
  { limit: 10, scoreToAssign: 80 },  // Good (9th-10th grade)
  { limit: 12, scoreToAssign: 65 },  // Fair (11th-12th grade)
  { limit: 14, scoreToAssign: 40 },  // Needs Improvement (College level)
  { limit: undefined, scoreToAssign: 20 } // Critical (Post-grad / very difficult)
];

/**
 * Thresholds for Readability (ARI) PENALTIES. Lower ARI is worse.
 * Maps a raw ARI grade level to a penalty point deduction.
 * Updated to be more tolerant of professional/technical language complexity.
 */
export const READABILITY_ARI_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 12, scoreToAssign: 0 },   // Good (12th grade or less) -> No penalty (was 10)
  { limit: 15, scoreToAssign: 5 },   // Fair -> 5 point penalty (was 12->5)
  { limit: 18, scoreToAssign: 10 },  // Needs Improvement -> 10 point penalty (was 14->10)
  { limit: undefined, scoreToAssign: 15 } // Critical (Anything > 18) -> 15 point penalty (was >14)
];

/**
 * Thresholds for Lexical Diversity (TTR) PENALTIES. Lower TTR is worse.
 * Maps a raw TTR (0.0 - 1.0) to a penalty point deduction for longer prompts.
 */
export const LEXICAL_DIVERSITY_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0.3, scoreToAssign: 15 }, // TTR <= 0.3 -> Very Repetitive
  { limit: 0.4, scoreToAssign: 10 }, // 0.3 < TTR <= 0.4 -> Repetitive
  { limit: 0.5, scoreToAssign: 5 },  // 0.4 < TTR <= 0.5 -> Slightly Repetitive
  { limit: undefined, scoreToAssign: 0 } // TTR > 0.5 -> Good Variety (No penalty)
];

// ===================================================================
// THRESHOLDS FOR 'specificityDetailScope' KPI
// ===================================================================

/**
 * Thresholds for Key Entities scoring. Maps entity count to a bonus or penalty.
 * Higher is better.
 */
export const KEY_ENTITY_THRESHOLDS: ScoreThreshold[] = [
    { limit: 0, scoreToAssign: -15 },        // Penalty for zero entities
    { limit: 1, scoreToAssign: 5 },          // Small bonus for one
    { limit: 3, scoreToAssign: 15 },         // Good bonus for 2-3
    { limit: undefined, scoreToAssign: 20 }  // Max bonus for 4+
];

/**
 * Thresholds for Prompt Length's impact on specificity.
 * Maps word count to a bonus or penalty.
 * NOTE: This is better handled with procedural `if` statements inside the agent
 * because the base score is also changing. Keeping this here is a reference
 * but the agent's procedural logic is likely superior for this specific case.
 * If you were to use it, you'd need a `higherIsBetter: true` getScoreFromThresholds.
 */

export const PROMPT_LENGTH_THRESHOLDS: ScoreThreshold[] = [
  { limit: 14, scoreToAssign: -20 }, // Very short
  { limit: 39, scoreToAssign: -10 }, // Short
  { limit: undefined, scoreToAssign: 20 }  // Sufficient length
];



// ===================================================================
// THRESHOLDS FOR 'goalAlignment' KPI
// ===================================================================

/**
 * Thresholds for Clarity Issues PENALTY. Higher count is worse.
 * Maps the number of significant clarity issues to penalty points.
 * Updated to be less harsh on single issues that might be domain-appropriate.
 */
export const CLARITY_ISSUES_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },    // No issues: no penalty
  { limit: 1, scoreToAssign: 20 },   // One issue: moderate penalty (was 30)
  { limit: undefined, scoreToAssign: 40 }, // Two or more: significant penalty (was 50)
];

/**
 * Thresholds for Action Verb Count PENALTY. Higher count is worse.
 * Maps the number of action verbs to penalty points for overloaded prompts.
 * Updated to be more realistic about modern prompt engineering complexity expectations.
 */
export const ACTION_VERB_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 3, scoreToAssign: 0 },    // Ideal (1-3 verbs): no penalty (was 2)
  { limit: 5, scoreToAssign: 15 },   // Up to 5: moderate penalty (was 3->15)
  { limit: 7, scoreToAssign: 30 },   // Up to 7: significant penalty (was 4->30)
  { limit: 9, scoreToAssign: 45 },   // Up to 9: major penalty (was 5->45)
  { limit: undefined, scoreToAssign: 60 }, // 10+: severe penalty (was 6+->60)
];

// ===================================================================
// THRESHOLDS FOR 'Instruction Following' KPI
// ===================================================================


/**
 * Thresholds for Negative Instruction penalties in instruction following analysis.
 * Applies increasing penalties for each negative instruction, capped at 2 for max penalty.
 * Used in evaluateInstructionFollowingLogic for maintainable, declarative scoring.
 */
export const NEGATIVE_INSTRUCTION_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },    // No negative instructions: no penalty
  { limit: 1, scoreToAssign: 15 },   // One instance: a notable penalty
  { limit: 2, scoreToAssign: 25 },   // Two instances: a significant penalty
  { limit: undefined, scoreToAssign: 35 } // Three or more: max penalty
];

/**
 * Thresholds for Contradictory Statement PENALTIES. Higher count is worse.
 * Contradictions are penalized more heavily than negative instructions.
 */
export const CONTRADICTION_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },    // No contradictions: no penalty
  { limit: 1, scoreToAssign: 30 },   // One contradiction: a major penalty
  { limit: undefined, scoreToAssign: 50 } // Two or more: a critical penalty
];

/**
 * Thresholds for Format Structure scoring based on word count wall-of-text detection.
 * Maps continuous text length to penalty points for poor formatting.
 * Updated to be more lenient with longer, well-structured prompts that use sections/bullets.
 */
export const FORMAT_STRUCTURE_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 150, scoreToAssign: 0 },   // Well-structured (up to 150 words): no penalty
  { limit: 250, scoreToAssign: 8 },   // Moderate length: minor penalty (was 150->8)
  { limit: 350, scoreToAssign: 15 },  // Significant length: moderate penalty (was 200->15)
  { limit: undefined, scoreToAssign: 25 } // Very long unstructured: major penalty (unchanged)
];

/**
 * Thresholds for Task Decomposition scoring based on action verb count.
 * Maps action verb count to bonus/penalty for appropriate task breakdown.
 */
export const TASK_DECOMPOSITION_THRESHOLDS: ScoreThreshold[] = [
  { limit: 1, scoreToAssign: 10 },    // Single focus: bonus
  { limit: 3, scoreToAssign: 5 },     // Reasonable complexity: small bonus
  { limit: 6, scoreToAssign: 0 },     // High complexity: neutral
  { limit: undefined, scoreToAssign: -15 } // Overloaded: penalty
];

/**
 * Thresholds for Step Marker scoring in task decomposition.
 * Maps step marker count to bonus points for clear organization.
 */
export const STEP_MARKER_BONUS_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },     // No steps: no bonus
  { limit: 2, scoreToAssign: 8 },     // Simple steps: moderate bonus
  { limit: 5, scoreToAssign: 15 },    // Well-structured: good bonus
  { limit: undefined, scoreToAssign: 20 } // Comprehensive: max bonus
];

/**
 * Thresholds for Example Quality scoring based on example count and context.
 * Maps example count to bonus points for few-shot learning enhancement.
 */
export const EXAMPLE_QUALITY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },     // No examples: baseline
  { limit: 1, scoreToAssign: 10 },    // One example: moderate bonus
  { limit: 3, scoreToAssign: 20 },    // Multiple examples: good bonus
  { limit: undefined, scoreToAssign: 25 } // Comprehensive examples: max bonus
];

/**
 * Thresholds for Tone/Style conflicts detection.
 * Maps conflict count to penalty points for coherence issues.
 */
export const TONE_STYLE_CONFLICT_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },     // No conflicts: no penalty
  { limit: 1, scoreToAssign: 10 },    // Minor conflict: small penalty
  { limit: 2, scoreToAssign: 20 },    // Multiple conflicts: moderate penalty
  { limit: undefined, scoreToAssign: 30 } // Severe conflicts: major penalty
];


// ===================================================================
// THRESHOLDS FOR 'ContextContentAgent'
// ===================================================================

/**
 * Thresholds for Context Indicators bonus. Higher count is better.
 * Maps the number of explicit context phrases to bonus points.
 */
export const CONTEXT_INDICATOR_BONUS_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },
  { limit: 1, scoreToAssign: 30 }, // A single indicator is a very strong signal
  { limit: 2, scoreToAssign: 40 },
  { limit: undefined, scoreToAssign: 45 }, // Capped bonus
];

/**
 * Thresholds for Key Entities bonus in context scoring. Higher count is better.
 */
export const CONTEXT_KEY_ENTITY_BONUS_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },
  { limit: 2, scoreToAssign: 10 }, // 1-2 entities is a small bonus
  { limit: 4, scoreToAssign: 20 }, // 3-4 is a good bonus
  { limit: undefined, scoreToAssign: 25 }, // 5+ is a strong signal of rich context
];

// ===================================================================
// THRESHOLDS FOR SAFETY & ETHICS KPIS
// ===================================================================

/**
 * Thresholds for Bias Risk Indicator penalties. Higher count is worse.
 * Maps bias indicator count to penalty points.
 */
export const BIAS_RISK_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },   // No bias indicators -> No penalty
  { limit: 1, scoreToAssign: 10 },  // 1 indicator -> Minor penalty
  { limit: 3, scoreToAssign: 25 },  // 2-3 indicators -> Moderate penalty
  { limit: 5, scoreToAssign: 45 },  // 4-5 indicators -> Significant penalty
  { limit: undefined, scoreToAssign: 70 } // 6+ indicators -> Maximum penalty (capped)
];

/**
 * Thresholds for Malicious Intent pattern penalties. Based on risk level.
 * Maps risk assessment level to penalty points.
 */
export const MALICIOUS_INTENT_PENALTY_THRESHOLDS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 0 },   // LOW risk -> No penalty
  { limit: 1, scoreToAssign: 30 },  // MEDIUM risk -> Moderate penalty
  { limit: 2, scoreToAssign: 60 },  // HIGH risk -> Significant penalty  
  { limit: undefined, scoreToAssign: 100 } // CRITICAL risk -> Maximum penalty (score = 0)
];

/**
 * Thresholds for Security Risk Level score caps.
 * Maps risk assessment level to maximum allowed score.
 */
export const SECURITY_RISK_SCORE_CAPS: ScoreThreshold[] = [
  { limit: 0, scoreToAssign: 100 }, // LOW risk -> No cap
  { limit: 1, scoreToAssign: 50 },  // MEDIUM risk -> Cap at 50
  { limit: 2, scoreToAssign: 25 },  // HIGH risk -> Cap at 25
  { limit: undefined, scoreToAssign: 5 } // CRITICAL risk -> Cap at 5
];
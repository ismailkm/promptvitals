// src/lib/agents/InstructionsStructureAgent.ts

import { KpiEvaluationSource, SeverityLevel } from '@/lib/types/shared';
import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';

import {
  getScoreFromThresholds,
  applyScorePenalty,
  applyScoreBonus,
  clampScore,
  adjustScoreByItemCount,
  isComplexTaskVerb
} from '@/lib/agent-utils/scoring';

import {
  sanitizePatterns,
  getPatternSummary,
  sortPatternsBySeverityAndPosition,
  extractPatternMetadata,
  isPatternMetadataOfType,
  countAllSteps,
  findToneKeywordsInText
} from '@/lib/agent-utils/patterns';
import { TONE_STYLE_KEYWORDS } from '@/lib/config/toneStyleKeywords';

import { detectPersonaStepMarker } from '@/lib/agent-utils/patterns/personaStepDetection';
import { analyzeStepContent } from '@/lib/agent-utils/patterns/stepAnalysis';

import {
  analyzeConstraintCompatibility,
  ConstraintConflict
} from '@/lib/agent-utils/patterns/constraintCompatibility';


import { 
  LengthConstraintPatternMetadata, 
  ExamplePatternMetadata,
  ToneStylePatternMetadata
} from '@/lib/types/patterns';

import { 
  EXAMPLE_TYPE, 
  LENGTH_CONSTRAINT_TYPE, 
  TONE_STYLE_CATEGORY, 
  ToneStyleCategory, 
  ToneStyleSubtype
} from '@/lib/types/metadataTypes';

import { AIInstructionsStructureAnalysisFactory } from '@/lib/types/aiTypes';

import { 
  executeAIAnalysisWithErrorHandling,
  applyAIEnhancements
} from '@/lib/agent-utils/hybridEnhancement';
import { determineAIEligibilityFromRules } from '@/lib/agent-utils/aiEligibility';
import { computeRuleBasedResults } from '@/lib/agent-utils/ruleBasedEvaluation';
import {
  INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES,
  INSTRUCTIONS_STRUCTURE_ENHANCEMENT_MAP
} from '@/lib/agent-utils/enhancementConfigs/instructionsStructureEnhancement';

import {
  FORMAT_STRUCTURE_PENALTY_THRESHOLDS,
  EXAMPLE_QUALITY_THRESHOLDS,
  TONE_STYLE_CONFLICT_THRESHOLDS
} from '@/lib/config/scoringThresholds';

import { KpiMistakeKeys, MISTAKE_KEYS } from '@/lib/config/kpis/kpiMistakes';

/**
 * Evaluates "Format & Structure" KPI.
 * Uses threshold-based scoring for consistent, maintainable evaluation.
 * Focuses on structural elements that enhance instruction clarity and organization.
 */
export const evaluateFormatStructureLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 20;
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  // Extract key metrics
  const wordCount = analyzedContext.lengthWords ?? 0;
  const sectionCount = analyzedContext.instructionsAndStructure.sectionCount ?? 0;
  const bulletPointUsage = analyzedContext.instructionsAndStructure.bulletPointUsage;
  const hasBulletPoints = bulletPointUsage?.detected ?? false;
  const bulletCount = bulletPointUsage?.count || 0;

  // Store metrics in flags for detailed reporting
  flags.sectionCount = sectionCount;
  flags.wordCount = wordCount;
  flags.hasBulletPoints = hasBulletPoints;
  flags.bulletCount = bulletCount;

  // === PRIMARY ANALYSIS: Wall of Text Detection ===
  // Apply penalty for poor formatting using threshold-based scoring
  if (wordCount > 100 && sectionCount === 0 && !hasBulletPoints) {
    const wallOfTextPenalty = getScoreFromThresholds(
      wordCount,
      FORMAT_STRUCTURE_PENALTY_THRESHOLDS,
      0
    );
    mistakes.add(MISTAKE_KEYS.PoorPromptStructure);
    if (wallOfTextPenalty > 0) {
      score = applyScorePenalty(true, wallOfTextPenalty, score);
      flags.wallOfTextDetected = true;
      flags.wallOfTextPenalty = wallOfTextPenalty;
    }
  }

  // === BONUSES FOR GOOD STRUCTURE ===
  
  // Section organization bonus with structured scoring
  if (sectionCount > 0) {
    const sectionBonus = adjustScoreByItemCount(sectionCount, 15, 0, 3); // Increased bonus per section
    score = applyScoreBonus(true, sectionBonus, score);
    flags.hasSections = true;
    flags.sectionBonus = sectionBonus;
  }

  // Bullet point organization bonus
  if (hasBulletPoints) {
    const bulletBonus = adjustScoreByItemCount(bulletCount, 5, 0, 4);
    score = applyScoreBonus(true, bulletBonus, score);
    flags.bulletPointBonus = bulletBonus;
  }

  // === CONTEXTUAL ADJUSTMENTS ===
  
  // Reward appropriate simplicity for short prompts
  if (wordCount < 50 && (sectionCount > 0 || hasBulletPoints)) {
    score = applyScoreBonus(true, 5, score);
    flags.appropriatelyStructuredShortPrompt = true;
  }

  // Bonus for well-structured longer prompts
  if (wordCount > 150 && sectionCount >= 2 && hasBulletPoints) {
    score = applyScoreBonus(true, 15, score);
    flags.wellStructuredLongPrompt = true;
  }

  // If no explicit format is requested, it's a flaw.
  if (!analyzedContext.instructionsAndStructure.requestsSpecificFormat) {
      mistakes.add(MISTAKE_KEYS.IgnoringOutputFormat);
  }

  // If the final score is low, it indicates a poor structure overall.
  if (clampScore(score) < 50) {
      mistakes.add(MISTAKE_KEYS.PoorPromptStructure);
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }


  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based' as KpiEvaluationSource,
  };
};

/**
 * Evaluates "Task Decomposition (Steps)" KPI.
 * Uses threshold-based scoring for balanced assessment of task breakdown quality.
 * Recognizes that simple tasks don't always need complex decomposition.
 */
export const evaluateTaskDecompositionLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {

  const mistakes = new Set<KpiMistakeKeys>();

  // --- Data Extraction ---
  const actionVerbCount = analyzedContext.actionVerbDetails?.count ?? 0;
  const primaryVerb = analyzedContext.actionVerbDetails?.verbs[0] || '';
  const stepMarkers = analyzedContext.instructionsAndStructure.stepMarkerDetails || [];
  const wordCount = analyzedContext.lengthWords ?? 0;
  const bulletCount = analyzedContext.instructionsAndStructure.bulletPointUsage?.count ?? 0;
  const nestedSteps = analyzedContext.instructionsAndStructure.nestedStepStructure;
  let totalStepCount = stepMarkers.length;
  let topLevelStepCount = stepMarkers.length;


  if (nestedSteps && nestedSteps.length > 0) {
    totalStepCount = countAllSteps(nestedSteps);
    topLevelStepCount = nestedSteps.length;
  }

  const hasNestedSteps = totalStepCount > topLevelStepCount;
  const flags: Record<string, any> = {
    detectedTopLevelSteps: topLevelStepCount,
    detectedTotalSteps: totalStepCount,
    hasNestedSteps: hasNestedSteps,
    detectedActionVerbs: actionVerbCount,
  };

  // --- Early Exit: Atomic/simple prompts ---
  // If the prompt is atomic (very short, one simple verb, no steps), decomposition is not needed.
  if (wordCount < 30 && actionVerbCount <= 1 && topLevelStepCount === 0 && !isComplexTaskVerb(primaryVerb)) {
    flags.decompositionNotNeeded = true;
    return { score: 82, flags, evaluation_source: "rule_based" };
  }
  // --- Early Exit: Wall of text ---
  if (topLevelStepCount === 0 && wordCount > 75) {
    flags.assessment_comment = "Poor: A complex request is presented as a single block without clear decomposition. Use a numbered or bulleted list to break down the task.";
    mistakes.add(MISTAKE_KEYS.PoorPromptStructure);
    mistakes.add(MISTAKE_KEYS.OverloadingPrompts);
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
    return { score: 20, flags, evaluation_source: "rule_based" };
  }

  // --- Hybrid Scoring ---
  let score = 0;
  const justifications: string[] = [];

  // 1. Base Score for Top-Level Steps (max 70)
  if (topLevelStepCount >= 5) {
    score = applyScoreBonus(true, 70, score);
    justifications.push("Excellent number of top-level steps (5+). ");
  } else if (topLevelStepCount >= 3) {
    score = applyScoreBonus(true, 60, score);
    justifications.push("Good number of top-level steps (3-4). ");
  } else if (topLevelStepCount > 0) {
    score = applyScoreBonus(true, 40, score);
    justifications.push("Some top-level steps provided. ");
  }

  // 2. Bonus for Hierarchical Detail (max 20)
  if (hasNestedSteps) {
    score = applyScoreBonus(true, 20, score);
    justifications.push("Bonus: Nested steps/hierarchy present.");
    flags.assessment_comment = "Excellent: The prompt uses a hierarchical list for detailed breakdown.";
  }

  // 3. Bonus for Task Clarity (max 10)
  if (actionVerbCount > 0 && actionVerbCount <= 3) {
    score = applyScoreBonus(true, 10, score);
    justifications.push("Bonus: Clear and focused number of action verbs.");
  } else if (actionVerbCount > 3 && totalStepCount >= actionVerbCount) {
    score = applyScoreBonus(true, 5, score);
    justifications.push("Bonus: Multiple action verbs are well-structured into steps.");
  }

  // 4. Penalty for Overloading (if applicable)
  if (actionVerbCount > 5) {
    score = applyScorePenalty(true, 10, score);
    justifications.push("Penalty: High number of action verbs may indicate overload.");
    flags.potentialOverload = true;
    mistakes.add(MISTAKE_KEYS.OverloadingPrompts);
  }

  // 5. Implicit Decomposition via Bullets (max 10)
  if (totalStepCount === 0 && bulletCount > 2) {
    score = applyScoreBonus(true, 10, score);
    justifications.push("Bonus: Implicit decomposition via bulleted/numbered list.");
    flags.implicitDecompositionViaList = true;
  }

  // 6. System Prompt/Persona Bonuses (max 10)
  const stepAnalysis = analyzeStepContent(stepMarkers);
  flags.stepAnalysis = stepAnalysis;
  const personaStepDetected = detectPersonaStepMarker(stepMarkers);
  if (personaStepDetected && totalStepCount >= 2) {
    score = applyScoreBonus(true, 5, score);
    justifications.push("Bonus: Persona/system prompt structure detected.");
    flags.advancedSystemPromptStructureBonus = true;
    flags.personaStepDetected = true;
  }
  if (stepAnalysis.isSystemPrompt && stepAnalysis.confidence > 0.5 && totalStepCount >= 3) {
    score = applyScoreBonus(true, 5, score);
    justifications.push("Bonus: Well-structured system prompt detected.");
    flags.wellStructuredSystemPrompt = true;
    flags.systemPromptConfidence = stepAnalysis.confidence;
  }

  // 7. Perfect Structure Shortcut (only if all criteria met)
  if (topLevelStepCount >= 3 && totalStepCount >= 6 && hasNestedSteps) {
    score = Math.max(score, 100);
    justifications.push("Perfect structure shortcut: textbook multi-level decomposition.");
    flags.perfectStructureShortcut = true;
  }
  
  // 8. Clamp and return
  flags.scoringJustifications = justifications;

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  } 
  
  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based' as KpiEvaluationSource,
  };
};


/**
 * Evaluates "Length / Conciseness Constraints" KPI.
 * Uses pattern analysis for constraint compatibility assessment.
 * Recognizes that effective prompts don't always need rigid length specifications.
 */
export const evaluateLengthConstraintsLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 35; // Reasonable baseline - constraints aren't always necessary
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  const constraints = analyzedContext.specificityElements?.outputLengthConstraints ?? [];
  const wordCount = analyzedContext.lengthWords ?? 0;
  
  // Store metrics for detailed reporting
  flags.lengthConstraintDetails = constraints;
  flags.lengthConstraintCount = constraints.length;

  // === PRIMARY ANALYSIS: Constraint Presence and Context ===
  
  if (constraints.length === 0) {
    flags.lengthConstraintMissing = true;
    mistakes.add(MISTAKE_KEYS.IneffectiveUseOfConstraints);
    // Check if this is a simple prompt that doesn't really need constraints
    if (wordCount < 50 && (analyzedContext.actionVerbDetails?.count ?? 0) <= 2) {
      score = 45; // Simple prompts often don't need length constraints
      flags.simplePromptNoConstraints = true;
    }
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
    return { 
      score: clampScore(score), 
      flags, 
      evaluation_source: 'rule_based' as KpiEvaluationSource 
    };
  }

  // === CONSTRAINT ANALYSIS USING PATTERN UTILITIES ===
  
  const validatedConstraints = sanitizePatterns(constraints);
  const numericConstraints: LengthConstraintPatternMetadata[] = [];
  const qualitativeConstraints: LengthConstraintPatternMetadata[] = [];

  // Categorize constraints using pattern metadata extraction
  validatedConstraints.forEach(constraint => {
    const metadata = extractPatternMetadata(constraint);
    if (isPatternMetadataOfType(metadata, 'length_constraint')) {
      const lengthMeta = metadata as LengthConstraintPatternMetadata;
      if (lengthMeta.constraintType === LENGTH_CONSTRAINT_TYPE.NUMERIC) {
        numericConstraints.push(lengthMeta);
      } else if (lengthMeta.constraintType === LENGTH_CONSTRAINT_TYPE.QUALITATIVE) {
        qualitativeConstraints.push(lengthMeta);
      }
    }
  });

  // === SCORING BASED ON CONSTRAINT QUALITY ===
  // Note: Main scoring is now handled in compatibility assessment section
  // These flags are kept for detailed reporting and test compatibility
  
  if (numericConstraints.length > 0) {
    flags.hasNumericConstraints = true;
    flags.numericConstraintCount = numericConstraints.length;
  }

  if (qualitativeConstraints.length > 0) {
    flags.hasQualitativeConstraints = true;
    flags.qualitativeConstraintCount = qualitativeConstraints.length;
  }

  // === CONSTRAINT COMPATIBILITY ASSESSMENT ===
  
  // Determine if the task is well-decomposed enough to allow for mixed constraints.
  const stepMarkerCount = analyzedContext.instructionsAndStructure.stepMarkerDetails?.length ?? 0;
  const bulletCount = analyzedContext.instructionsAndStructure.bulletPointUsage?.count ?? 0;
  
  // A numbered list or a significant bulleted list indicates decomposition.
  const isDecomposedTask = stepMarkerCount > 1 || bulletCount > 2;

  flags.isDecomposedTask = isDecomposedTask;
  // Use comprehensive constraint compatibility analysis
  const compatibilityAnalysis = analyzeConstraintCompatibility(numericConstraints, qualitativeConstraints, isDecomposedTask);
  flags.compatibilityAnalysis = compatibilityAnalysis; // Store the rich analysis in flags

  // === SCORE BASED ON DETAILED ANALYSIS RESULTS ===
  // Use hierarchical scoring approach for clarity and predictability
  if (compatibilityAnalysis.conflicts.some(c => c.severityLevel === SeverityLevel.HIGH)) {
    // Any high-severity conflict results in a very low score
    score = 25;
    flags.hasCriticalConflict = true;
    flags.constraintConflictDetected = true;
  } else if (compatibilityAnalysis.conflicts.length > 0) {
    // Medium or low severity conflicts
    score = 45;
    flags.hasMinorConflict = true;
    flags.constraintConflictDetected = true;
  } else if (compatibilityAnalysis.warnings.length > 0) {
    // No hard conflicts, but has warnings (like over-specification)
    // If there are both numeric and qualitative constraints and NO conflicts, treat as well-balanced
    if (numericConstraints.length > 0 && qualitativeConstraints.length > 0 && compatibilityAnalysis.conflicts.length === 0) {
      score = 95;
      flags.wellBalancedConstraints = true;
      flags.hasNumericConstraints = true;
      flags.hasQualitativeConstraints = true;
    } else {
      score = 70;
      flags.hasCompatibilityWarnings = true;
    }
  } else if (numericConstraints.length > 0 && qualitativeConstraints.length > 0) {
    // No conflicts, has both types (excellent case for mixed constraints)
    score = 95;
    flags.wellBalancedConstraints = true;
    flags.hasNumericConstraints = true;
    flags.hasQualitativeConstraints = true;
  } else if (numericConstraints.length > 0) {
    // No conflicts, has numeric constraint (best single-type case)
    score = 90;
    flags.hasNumericConstraints = true;
    flags.numericConstraintCount = numericConstraints.length;
  } else if (qualitativeConstraints.length > 0) {
    // No conflicts, only has qualitative (good case)
    score = 75;
    flags.hasQualitativeConstraints = true;
    flags.qualitativeConstraintCount = qualitativeConstraints.length;
  } else {
    // Should be caught by the length === 0 check, but as a fallback
    score = 35;
  }

  // Apply penalty for over-specification score
  if (compatibilityAnalysis.overSpecificationScore > 0) {
    const overSpecPenalty = Math.min(25, compatibilityAnalysis.overSpecificationScore / 4);
    score = applyScorePenalty(true, overSpecPenalty, score);
    flags.overSpecificationPenalty = overSpecPenalty;
    flags.overSpecificationScore = compatibilityAnalysis.overSpecificationScore;
  }

  // Store detailed conflict information for debugging and analysis
  if (compatibilityAnalysis.conflicts.length > 0) {
    const severePenalty = compatibilityAnalysis.conflicts.filter(c => c.severityLevel === SeverityLevel.HIGH).length * 10;
    const moderatePenalty = compatibilityAnalysis.conflicts.filter(c => c.severityLevel === SeverityLevel.MEDIUM).length * 5;
    flags.constraintPenalty = severePenalty + moderatePenalty;
  }

  // Add warnings if present
  if (compatibilityAnalysis.warnings.length > 0) {
    flags.compatibilityWarnings = compatibilityAnalysis.warnings;
  }

  // === CONTEXTUAL APPROPRIATENESS ===
  
  // Bonus for appropriate constraint complexity
  if (wordCount > 100 && constraints.length >= 2) {
    score = applyScoreBonus(true, 8, score);
    flags.appropriateConstraintComplexity = true;
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based' as KpiEvaluationSource,
  };
};

/**
 * Evaluates "Examples & Few-Shot Learning" KPI.
 * Uses threshold-based scoring and pattern analysis for example quality assessment.
 * Balances the value of examples with contextual appropriateness.
 */
export const evaluateExamplesPresenceLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 15;
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  const wordCount = analyzedContext.lengthWords ?? 0;
  const actionVerbCount = analyzedContext.actionVerbDetails?.count ?? 0;
  const primaryVerb = analyzedContext.actionVerbDetails?.verbs[0] || '';

  const examples = analyzedContext.instructionsAndStructure.exampleDetails;
  const validatedExamples = examples ? sanitizePatterns(examples) : [];
  const examplesCount = validatedExamples.length;

  // If the prompt is short AND the task is truly simple, it doesn't need an example.
  if (wordCount < 50 && actionVerbCount <= 1 && !isComplexTaskVerb(primaryVerb)) {
    // A score of 70 is fair, as examples are less critical for simple tasks.
    return { score: 70, evaluation_source: "rule_based" };
  }

  // Store metrics for detailed reporting
  flags.examplesProvidedCount = examplesCount;
  flags.validatedExamplesCount = validatedExamples.length;

  // === CONTEXTUAL ANALYSIS ===
  
  // Determine if this task would benefit from examples
  const complexTask = actionVerbCount > 2 || wordCount > 100;
  const creativeTask = analyzedContext.instructionsAndStructure.toneStyleGuidance?.some(
    guidance => guidance.matchedText?.toLowerCase().includes('creative') ||
               guidance.matchedText?.toLowerCase().includes('innovative')
  ) ?? false;

  flags.isComplexTask = complexTask;
  flags.isCreativeTask = creativeTask;

  // === EXAMPLE QUALITY SCORING ===
  
  if (examplesCount === 0) {
    flags.noExamplesProvided = true;
    mistakes.add(MISTAKE_KEYS.NotUsingExamples);
    // Context-aware scoring for missing examples
    const sectionCount = analyzedContext.instructionsAndStructure.sectionCount ?? 0;
    const stepMarkers = analyzedContext.instructionsAndStructure.stepMarkerDetails || [];
    const stepMarkerCount = stepMarkers.length;
    const bulletCount = analyzedContext.instructionsAndStructure.bulletPointUsage?.count ?? 0;
    const isHighlyStructured = sectionCount >= 3 || stepMarkerCount >= 3 || bulletCount >= 5;
    const personaStepDetected = detectPersonaStepMarker(stepMarkers);
    const primaryVerb = analyzedContext.actionVerbDetails?.verbs[0] || '';
    const isTaskVerbComplex = isComplexTaskVerb(primaryVerb);

    // Analyze step content for system prompt characteristics
    const stepAnalysis = analyzeStepContent(stepMarkers);
    const isSystemPrompt = stepAnalysis.isSystemPrompt && stepAnalysis.confidence > 0.6;
    
    if ((complexTask || creativeTask) && !isHighlyStructured && !personaStepDetected && !isSystemPrompt) {
      score = applyScorePenalty(true, 5, score); // Even softer penalty for complex tasks without examples
      flags.complexTaskNeedsExamples = true;
    } else if (isTaskVerbComplex && !isHighlyStructured && !isSystemPrompt) {
      // This is our specific case: a short prompt with a complex verb. It needs examples.
      score = applyScorePenalty(true, 20, score); // Apply a significant penalty.
      flags.shortComplexTaskNeedsExamples = true;
    } else if (isHighlyStructured || personaStepDetected || isSystemPrompt) {
      // No penalty for highly structured, persona-defining, or system prompts
      score = 90; // Even higher bonus for detailed structure/system prompt
      flags.highlyStructuredNoExamples = true;
      flags.personaStepDetected = personaStepDetected;
      if (isSystemPrompt) flags.systemPromptNoExamples = true;
    } else {
      // Simple tasks don't necessarily need examples
      score = 70; // Higher bonus for appropriate structure
      flags.simpleOrStructuredTaskNoExamples = true;
    }
  } else {
    // === DETAILED EXAMPLE ANALYSIS ===
    
    const exampleSummary = getPatternSummary(validatedExamples);
    if (exampleSummary.totalCount > 0) {
      flags.exampleSummary = exampleSummary;
      flags.exampleDetails = sortPatternsBySeverityAndPosition(validatedExamples);
    }

    // Analyze example types and structure
    const structuredExamples = validatedExamples.filter(example => {
      const metadata = extractPatternMetadata(example);
      return isPatternMetadataOfType(metadata, 'example') &&
             (metadata as ExamplePatternMetadata).exampleType === EXAMPLE_TYPE.STRUCTURED;
    });

    const inlineExamples = validatedExamples.filter(example => {
      const metadata = extractPatternMetadata(example);
      return isPatternMetadataOfType(metadata, 'example') &&
             (metadata as ExamplePatternMetadata).exampleType === EXAMPLE_TYPE.KEYWORD;
    });

    flags.structuredExampleCount = structuredExamples.length;
    flags.inlineExampleCount = inlineExamples.length;

    // === SCORING BASED ON EXAMPLE TYPES ===
    
    if (structuredExamples.length > 0) {
      // Use full threshold-based scoring for structured examples
      const exampleBonus = getScoreFromThresholds(
        structuredExamples.length,
        EXAMPLE_QUALITY_THRESHOLDS,
        0
      );
      score = applyScoreBonus(true, exampleBonus, score);
      flags.hasWellStructuredExamples = true;
      flags.structuredExampleBonus = exampleBonus;
    } else if (inlineExamples.length > 0) {
      // Award partial credit for inline examples (65-75 range as recommended)
      let inlineScore: number;
      if (inlineExamples.length >= 3) {
        inlineScore = 75; // Multiple inline examples
      } else if (inlineExamples.length >= 2) {
        inlineScore = 70; // A couple inline examples
      } else {
        inlineScore = 65; // Single inline example
      }
      
      // Apply the score, but cap it to avoid exceeding the target range
      score = Math.max(score, inlineScore);
      flags.hasInlineExamples = true;
      flags.inlineExamplePartialCredit = true;
      flags.inlineExampleScore = inlineScore;
    } else {
      // Use threshold-based scoring for other example types
      const exampleBonus = getScoreFromThresholds(
        examplesCount,
        EXAMPLE_QUALITY_THRESHOLDS,
        0
      );
      score = applyScoreBonus(true, exampleBonus, score);
      flags.exampleQualityBonus = exampleBonus;
    }

    flags.hasExamples = true;

    // === CONTEXTUAL BONUSES ===
    
    // Bonus for examples in complex contexts (only for structured examples)
    if ((complexTask || creativeTask) && structuredExamples.length >= 2) {
      score = applyScoreBonus(true, 12, score);
      flags.appropriateExamplesForComplexity = true;
    }

    // Bonus for balanced example count (structured examples get preference)
    if (structuredExamples.length >= 1 && structuredExamples.length <= 3) {
      score = applyScoreBonus(true, 5, score);
      flags.balancedExampleCount = true;
    } else if (structuredExamples.length === 0 && inlineExamples.length >= 1 && inlineExamples.length <= 3) {
      // Smaller bonus for balanced inline examples
      score = applyScoreBonus(true, 2, score);
      flags.balancedInlineExampleCount = true;
    }
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based' as KpiEvaluationSource,
  };
};

/**
 * Evaluates "Tone & Style Keywords" KPI.
 * Uses threshold-based scoring and pattern analysis for tone coherence assessment.
 * Focuses on appropriate tone guidance without excessive specification.
 */
export const evaluateToneStyleKeywordsLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 30; 
  const flags: Record<string, any> = {};  
  const mistakes = new Set<KpiMistakeKeys>();

  const toneStyleInfo = analyzedContext.instructionsAndStructure.toneStyleGuidance;
  const toneStyleCount = toneStyleInfo?.length ?? 0;
  const personaInfo = analyzedContext.specificityElements?.definedPersonaInfo;
  const personaCount = personaInfo?.length ?? 0;
  const wordCount = analyzedContext.lengthWords ?? 0;

  // Store metrics for detailed reporting
  flags.toneStyleCount = toneStyleCount;
  flags.personaCount = personaCount;

  // === CONTEXTUAL ANALYSIS ===
  
  // Check if tone guidance would be particularly valuable
  const isCreativeTask = toneStyleInfo?.some(
    item => item.matchedText?.toLowerCase().includes('write') ||
            item.matchedText?.toLowerCase().includes('create')
  ) ?? false;
  
  const isLongPrompt = wordCount > 150;
  const needsToneGuidance = isCreativeTask || isLongPrompt || personaCount > 0;

  flags.isCreativeTask = isCreativeTask;
  flags.needsToneGuidance = needsToneGuidance;

  // === TONE GUIDANCE SCORING ===
  // Expanded pattern detection for implicit tone/style cues
  const promptText = analyzedContext.promptText ?? '';
  const foundToneKeywords = findToneKeywordsInText(promptText, TONE_STYLE_KEYWORDS);
  const matchedExpandedTone = foundToneKeywords.length >= 3;
  if (toneStyleCount > 0 || matchedExpandedTone) {
    // Use threshold-based approach for consistency
    score = applyScoreBonus(true, 35, score); // Further increased base bonus
    flags.hasToneGuidance = true;
    flags.toneStyleGuidanceDetails = toneStyleInfo;
    if (matchedExpandedTone) {
      flags.matchedExpandedTonePattern = true;
      flags.matchedToneKeywords = foundToneKeywords;
    }
    // Additional bonus for balanced tone specification
    if (toneStyleCount >= 1 && toneStyleCount <= 3) {
      score = applyScoreBonus(true, 15, score);
      flags.balancedToneSpecification = true;
    }
    // Bonus for 4+ distinct tone keywords
    if (foundToneKeywords.length >= 4) {
      score = applyScoreBonus(true, 10, score);
      flags.extraRichToneSpecification = true;
    }
  } 

  if (toneStyleCount === 0 && personaCount === 0 && needsToneGuidance) {
    score = applyScorePenalty(true, 15, score);
    flags.toneStyleGuidanceMissing = true;
    mistakes.add(MISTAKE_KEYS.LackingToneStyleGuidance);
  }

  // === PERSONA ANALYSIS ===
  
  if (personaCount > 0) {
    score = applyScoreBonus(true, 20, score);
    flags.hasPersonaDefinition = true;
    flags.personaDefinedForStyleDetails = personaInfo;
  }

  // === CONFLICT DETECTION ===
  
  // Use threshold-based penalty for tone conflicts
  if (toneStyleCount > 1) {
    const conflictingCategoryPairs = [
      [TONE_STYLE_CATEGORY.FORMAL, TONE_STYLE_CATEGORY.CASUAL],
      [TONE_STYLE_CATEGORY.NEUTRAL, TONE_STYLE_CATEGORY.CREATIVE],
      [TONE_STYLE_CATEGORY.TECHNICAL, TONE_STYLE_CATEGORY.CASUAL]
    ];

    const detectedCategories = new Set<ToneStyleCategory>();
    for (const item of toneStyleInfo) {
      const metadata = extractPatternMetadata(item);
      if (isPatternMetadataOfType(metadata, 'tone_style')) {
        detectedCategories.add((metadata as ToneStylePatternMetadata).toneCategory);
      }
    }

    let conflictCount = 0;
    const conflicts: string[] = [];
    for (const [tone1, tone2] of conflictingCategoryPairs) {
      if (detectedCategories.has(tone1) && detectedCategories.has(tone2)) {
        conflicts.push(`${tone1} vs ${tone2}`);
        conflictCount++;
      }
    }

    if (conflictCount > 0) {
      const conflictPenalty = getScoreFromThresholds(
        conflictCount, // Use the real conflict count, not toneStyleCount
        TONE_STYLE_CONFLICT_THRESHOLDS,
        0
      );

      score = applyScorePenalty(true, conflictPenalty, score);
      flags.hasConflictingTone = true;
      flags.conflictingTonePairs = conflicts;
      flags.conflictPenalty = conflictPenalty;
    }
  }


  // === CONTEXTUAL ADJUSTMENTS ===
  
  // Bonus for synergy between tone guidance and persona
  if (toneStyleCount > 0 && personaCount > 0 && !flags.hasConflictingTone) {
    score = applyScoreBonus(true, 8, score);
    flags.tonePersonaSynergy = true;
  }
  // Penalty for missing guidance when needed
  if (toneStyleCount === 0 && personaCount === 0 && needsToneGuidance) {
    score = applyScorePenalty(true, 15, score);
    flags.toneStyleGuidanceMissing = true;
    flags.wouldBenefitFromGuidance = true;
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based' as KpiEvaluationSource,
  };
};

/**
 * Evaluates "Iterative Potential" KPI.
 * Assesses how well a prompt is structured for reuse and modification, primarily by
 * rewarding the use of placeholders and clear, modular sectioning.
 */
export const evaluateIterativePotentialLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  // Start with a lower base score to make clear signals of iteration more impactful.
  let score = 25;
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  // Extract key metrics from the context
  const placeholders = analyzedContext.instructionsAndStructure.placeholderDetails ?? [];
  const placeholderCount = placeholders.length;
  const sectionCount = analyzedContext.instructionsAndStructure.sectionCount ?? 0;
  const wordCount = analyzedContext.lengthWords ?? 0;

  // Store raw metrics in flags for detailed reporting
  flags.placeholderCount = placeholderCount;
  flags.sectionCount = sectionCount;

  // --- 1. PRIMARY BONUS: PLACEHOLDERS ---
  // The presence of even one placeholder is the strongest signal of iterative intent.
  if (placeholderCount > 0) {
    // Give a large base bonus for the first placeholder, and smaller bonuses for more.
    // This rewards the act of creating a template, with diminishing returns.
    const placeholderBonus = Math.min(45, 30 + (placeholderCount - 1) * 5);
    score = applyScoreBonus(true, placeholderBonus, score);
    flags.containsPlaceholders = true;
    flags.placeholderDetails = placeholders;
    flags.placeholderBonus = placeholderBonus;
  }

  // --- 2. SECONDARY BONUS: TEMPLATE-LIKE STRUCTURE ---
  // A well-sectioned prompt is easy to edit and iterate on, even without placeholders.
  if (sectionCount > 2) {
    // Use a similar diminishing returns model for sections.
    const sectionBonus = Math.min(25, 15 + (sectionCount - 3) * 3);
    score = applyScoreBonus(true, sectionBonus, score);
    flags.isWellSectionedForIteration = true;
    flags.sectionBonus = sectionBonus;
  }
  
  // --- 3. SYNERGY BONUS ---
  // A prompt with BOTH placeholders and significant sectioning is a true, high-quality template.
  if (placeholderCount > 0 && sectionCount > 2) {
      score = applyScoreBonus(true, 15, score);
      flags.isTemplateLike = true; // This flag now represents the ideal state.
  }

  // --- 4. REUSABILITY PENALTY ---
  // Penalize the exact opposite of an iterative prompt: a long, unstructured wall of text.
  if (sectionCount <= 1 && wordCount > 200 && placeholderCount === 0) {
    score = applyScorePenalty(true, 30, score);
    flags.monolithicStructureHindersIteration = true;
    mistakes.add(MISTAKE_KEYS.PoorPromptStructure);
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }


  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based' as KpiEvaluationSource,
  };
};

/**
 * Comprehensive AI-enhanced evaluation for InstructionsStructureAgent using refactored utilities.
 * Makes a single AI call for all eligible features and applies enhancements systematically.
 * Replaces the original hard-coded approach with configurable, reusable utilities.
 */
export const evaluateInstructionsStructureHybrid = async (
  analyzedContext: AnalyzedPromptDataContext,
  aiAnalysisFn: AIInstructionsStructureAnalysisFactory
): Promise<{
  formatStructure: KpiEvaluationOutput;
  examplePresence: KpiEvaluationOutput;
  structureCoherence: KpiEvaluationOutput;
  taskDecomposition: KpiEvaluationOutput;
  lengthConcisenessConstraints: KpiEvaluationOutput; 
  iterativePotential: KpiEvaluationOutput;
}> => {

  // Compute rule-based results using centralized utility
  const ruleResults = computeRuleBasedResults(analyzedContext, {
    formatStructure: evaluateFormatStructureLogic,
    examplePresence: evaluateExamplesPresenceLogic,
    structureCoherence: evaluateToneStyleKeywordsLogic,
    taskDecomposition: evaluateTaskDecompositionLogic,
    lengthConcisenessConstraints: evaluateLengthConstraintsLogic,
    iterativePotential: evaluateIterativePotentialLogic,
  });

  // Determine eligible features using configurable rules
  const eligibleFeatures = determineAIEligibilityFromRules(
    analyzedContext, 
    INSTRUCTIONS_STRUCTURE_AI_ELIGIBILITY_RULES
  );
  
  if (eligibleFeatures.length === 0) {
    return ruleResults;
  }

  // Execute AI analysis with standardized error handling
  const aiResult = await executeAIAnalysisWithErrorHandling(
    aiAnalysisFn,
    analyzedContext,
    eligibleFeatures,
    'InstructionsStructureAgent'
  );

  if (!aiResult) {
    return ruleResults; 
  }

  // Apply AI enhancements using centralized utility
  return applyAIEnhancements(
    ruleResults,
    aiResult,
    eligibleFeatures,
    INSTRUCTIONS_STRUCTURE_ENHANCEMENT_MAP
  );
};
// src/lib/agents/ClarityPurposeAgent.ts

import { KpiEvaluationSource, SeverityLevel } from '@/lib/types/shared';
import { KpiEvaluationOutput } from '@/lib/types/kpiEvaluation';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { AIClarityAnalysisFactory } from '@/lib/types/aiTypes';
import { DetectedPatternInfo, AllPatternMetadata } from "@/lib/types/patterns";
import {
  getScoreFromThresholds,
  applyScorePenalty,
  clampScore,
  severityCountsToScore,
  applyScoreBonus,
  adjustScoreByItemCount,
  filterBySeverity,
  hasPatternAtSeverity,
  hasConfidentPatternMatch,
  filterByExactSeverity
} from '@/lib/agent-utils/scoring';
import { hasMultiplePatternMatchesAtSeverity } from '@/lib/agent-utils/scoring/severityManagement';

import {
  sanitizePatterns,
  getPatternSummary,
  sortPatternsBySeverityAndPosition,
  extractPatternMetadata,
  isPatternMetadataOfType
} from '@/lib/agent-utils/patterns';


import { 
  executeAIAnalysisWithErrorHandling,
  applyAIEnhancements
} from '@/lib/agent-utils/hybridEnhancement';
import { determineAIEligibilityFromRules } from '@/lib/agent-utils/aiEligibility';
import { computeRuleBasedResults } from '@/lib/agent-utils/ruleBasedEvaluation';
import {
  CLARITY_PURPOSE_AI_ELIGIBILITY_RULES,
  CLARITY_PURPOSE_ENHANCEMENT_MAP
} from '@/lib/agent-utils/enhancementConfigs';
import { 
  READABILITY_ARI_PENALTY_THRESHOLDS,
  LEXICAL_DIVERSITY_PENALTY_THRESHOLDS,
  KEY_ENTITY_THRESHOLDS,
  CLARITY_ISSUES_PENALTY_THRESHOLDS,
  ACTION_VERB_PENALTY_THRESHOLDS,
  NEGATIVE_INSTRUCTION_PENALTY_THRESHOLDS,
  CONTRADICTION_PENALTY_THRESHOLDS
} from '@/lib/config/scoringThresholds';

import { KpiMistakeKeys, MISTAKE_KEYS } from '@/lib/config/kpis/kpiMistakes';
import { filterVagueTermsWithContext, detectExpertContext, detectProfessionalKeywords } from '@/lib/agent-utils/clarityUtils';

/**
 * Evaluates the "Clarity (Unambiguity)" KPI.
 * This function calculates a score based on a primary penalty from direct clarity issues (vagueness, jargon)
 * and secondary penalties from stylistic and structural metrics.
 * It uses the rich utility library for analysis and scoring.
 */
export const evaluateClarityUnambiguityRules = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 100; // Start with a perfect score.
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();
  const lengthWords = analyzedContext.lengthWords ?? 0;

  // --- Enhanced Domain Context Detection ---
  const lowerPromptText = (analyzedContext.promptText ?? '').toLowerCase();
  
  const sectionCount = analyzedContext.instructionsAndStructure?.sectionCount ?? 0;
  const stepMarkerCount = analyzedContext.instructionsAndStructure?.stepMarkerDetails?.length ?? 0;
  const isHighlyStructured = sectionCount >= 3 || stepMarkerCount >= 3;
  
  // Enhanced professional context detection (now using clarityUtils)
  const hasExpertContext = detectExpertContext(analyzedContext.promptText ?? '');
  const isProfessionalContext = hasExpertContext || detectProfessionalKeywords(analyzedContext.promptText ?? '');

  // --- 1. Foundational Check: Extreme Brevity (NEW TOP-LEVEL PENALTY) ---
  // A prompt that is too short is fundamentally unclear and unspecific,
  // regardless of its content. This is a primary clarity failure.
  if (lengthWords < 5) {
    // Apply a massive, non-negotiable penalty.
    score = applyScorePenalty(true, 70, score);
    flags.isOverlyBrief = true;
    mistakes.add(MISTAKE_KEYS.VagueOrUnclearPrompts);
  }

  // --- 2. Primary Penalty: Direct Clarity Issues (Vague Terms & Jargon) ---
  // This is the most important factor and will apply the largest penalties.

  // a. Analyze the patterns using the utility library
  const rawClarityIssues = analyzedContext.clarityIssuesFound ?? [];
  const promptText = analyzedContext.promptText ?? '';

  const validatedIssues = sanitizePatterns(rawClarityIssues);

  // Apply context-aware filtering to prevent false positives
  const filteredIssues = filterVagueTermsWithContext(validatedIssues, promptText, lengthWords);

  // Separate issues by severity (using severity utils)
  const significantClarityIssues = filterBySeverity(filteredIssues, SeverityLevel.MEDIUM);
  const infoClarityIssues = filterByExactSeverity(filteredIssues, SeverityLevel.INFO);

  // Only penalize for significant issues, with adjusted penalties for different contexts
  if (significantClarityIssues.length > 0) {
    const issueSummary = getPatternSummary(significantClarityIssues);
    const clarityIssuesRisk = severityCountsToScore(issueSummary.severityCounts);
    
    // Adjusted penalty calculation - less punitive overall
    let penalty = Math.floor(clarityIssuesRisk * 60); // Reduced from 100 to 60
    
    // Context-based penalty adjustments
    if (isHighlyStructured && isProfessionalContext) {
      penalty = Math.floor(penalty * 0.3); // Significant reduction for professional contexts
      flags.clarityPenaltySoftenedForDomain = true;
    } else if (isHighlyStructured || isProfessionalContext) {
      penalty = Math.floor(penalty * 0.6); // Moderate reduction for structured or professional
      flags.clarityPenaltyModerateReduction = true;
    }
    
    // Apply minimum penalty threshold to avoid over-penalizing minor issues
    if (penalty < 10 && significantClarityIssues.length <= 2) {
      penalty = Math.max(penalty, 5); // Minimum penalty for 1-2 minor issues
    }
    
    if (penalty > 0) {
      score = applyScorePenalty(true, penalty, score);
    }
    flags.clarityIssueSummary = issueSummary;
    flags.clarityIssuesDetails = sortPatternsBySeverityAndPosition(significantClarityIssues);
    flags.clarityPenaltyApplied = penalty;
    
    // Only flag as mistake for HIGH severity issues or multiple MEDIUM issues
    if (
      hasPatternAtSeverity(significantClarityIssues, SeverityLevel.HIGH) ||
      hasMultiplePatternMatchesAtSeverity(significantClarityIssues, SeverityLevel.MEDIUM, 4)
    ) {
      flags.hasSignificantClarityIssues = true;
      mistakes.add(MISTAKE_KEYS.VagueOrUnclearPrompts);
    }
  }

  // Bonus for professional domain language and expert-level clarity
  if (significantClarityIssues.length === 0) {
    // Bonus for clear, expert-level language
    if (isProfessionalContext && isHighlyStructured) {
      score = applyScoreBonus(true, 8, score); // Bonus for expert context with no issues
      flags.expertLevelClarityBonus = true;
    }
    
    // Additional bonus for using professional terms appropriately (INFO severity)
    if (infoClarityIssues.length > 0) {
      score = applyScoreBonus(true, 5, score);
      flags.professionalLanguageBonusApplied = true;
      flags.infoClarityIssuesDetails = sortPatternsBySeverityAndPosition(infoClarityIssues);
    }
  }

  // e. Create detailed, separated lists for specific feedback generation
  const foundVagueDetails: DetectedPatternInfo[] = [];
  const foundAmbiguousDetails: DetectedPatternInfo[] = [];
  const foundJargonDetails: DetectedPatternInfo[] = [];
  let isBroadTopicOnly = false;

  validatedIssues.forEach(issue => {
    const metadata = extractPatternMetadata(issue);
    if (isPatternMetadataOfType(metadata, 'vagueness')) {
      if ((metadata as AllPatternMetadata).listSubType?.includes('broad_topic')) {
        isBroadTopicOnly = true;
      }
      if ((metadata as AllPatternMetadata).listSubType?.includes('ambiguous')) {
        foundAmbiguousDetails.push(issue);
      } else {
        foundVagueDetails.push(issue);
      }
    }
    if (isPatternMetadataOfType(metadata, 'jargon')) {
      foundJargonDetails.push(issue);
    }
  });

  if (foundVagueDetails.length > 0) {
    flags.vagueLanguageDetected = true;
    flags.vagueTermsDetails = foundVagueDetails;
  }
  if (foundJargonDetails.length > 0) {
    flags.jargonDetected = true;
    flags.jargonDetails = foundJargonDetails;
  }
  if (foundAmbiguousDetails.length > 0) {
    flags.ambiguousPhrasesDetected = true;
    flags.ambiguousPhrasesDetails = foundAmbiguousDetails;
    mistakes.add(MISTAKE_KEYS.AmbiguousLanguageTerms);
  }
  
  // --- 3. Secondary Penalties: Stylistic & Structural Issues ---
    // These are minor penalties that fine-tune the score, but are softened/skipped for professional/highly structured prompts.
    const averageSentenceLength = analyzedContext.averageSentenceLength ?? 0;
    const readabilityScore = analyzedContext.readabilityScore;
    const complexSentenceCount = analyzedContext.complexSentenceCount ?? 0;
    const nounVerbBalanceRatio = (typeof analyzedContext.nounVerbBalanceRatio === 'number')
      ? analyzedContext.nounVerbBalanceRatio
      : undefined;
    const lexicalDiversityScore = analyzedContext.lexicalDiversityScore ?? 0;

    flags.averageSentenceLength = averageSentenceLength;
    flags.complexSentenceCount = complexSentenceCount;
    flags.lexicalDiversityScore = lexicalDiversityScore;
    if (typeof nounVerbBalanceRatio === 'number') {
      flags.nounVerbBalanceRatio = nounVerbBalanceRatio;
    }
    if (typeof analyzedContext.nounCount === 'number') flags.nounCount = analyzedContext.nounCount;
    if (typeof analyzedContext.verbCount === 'number') flags.verbCount = analyzedContext.verbCount;
    flags.readabilityScoreValue = readabilityScore;

    // Readability Penalties
    let readabilityPenalty = 0;
    if (readabilityScore === null || readabilityScore === undefined) {
      flags.readabilityAnalysisUnavailable = true;
    } else {
      readabilityPenalty = getScoreFromThresholds(
        readabilityScore,
        READABILITY_ARI_PENALTY_THRESHOLDS,
        0
      );
    }
    if (readabilityPenalty > 0) {
      if (isHighlyStructured && isProfessionalContext) {
        score = applyScorePenalty(true, Math.ceil(readabilityPenalty * 0.5), score);
        flags.readabilityPenaltySoftenedForDomain = true;
      } else {
        score = applyScorePenalty(true, readabilityPenalty, score);
      }
    }
    if (readabilityScore === null || readabilityScore === undefined || readabilityScore > 15) {
      flags.lowReadability = true;
    }

    // Structural & Stylistic Penalties (minor deductions, softened/skipped for professional/structured prompts)
    let stylisticPenalty = 5;
    if (isHighlyStructured && isProfessionalContext) {
      stylisticPenalty = 0; // Skip stylistic penalties for highly structured, professional prompts
      flags.stylisticPenaltiesSkippedForDomain = true;
    } else if (isHighlyStructured || isProfessionalContext) {
      stylisticPenalty = 2; // Soften stylistic penalties for structured or professional prompts
      flags.stylisticPenaltiesSoftenedForDomain = true;
    }

    if (averageSentenceLength > 25 && stylisticPenalty > 0) {
      score = applyScorePenalty(true, stylisticPenalty, score);
      flags.longAverageSentences = true;
    } else if (averageSentenceLength < 8 && lengthWords > 30 && stylisticPenalty > 0) {
      score = applyScorePenalty(true, stylisticPenalty, score);
      flags.choppyAverageSentences = true;
    }

    if ((complexSentenceCount ?? 0) > 3 && lengthWords > 100 && stylisticPenalty > 0) {
      score = applyScorePenalty(true, stylisticPenalty, score);
      flags.multipleComplexSentences = true;
    }

    // Lexical Diversity penalty calculation
    let lexicalDiversityPenalty = 0;
    if (lengthWords > 150) {
      lexicalDiversityPenalty = getScoreFromThresholds(
        lexicalDiversityScore,
        LEXICAL_DIVERSITY_PENALTY_THRESHOLDS, 
        0 
      );
    }
    if (lexicalDiversityPenalty > 0) {
      if (isHighlyStructured && isProfessionalContext) {
        score = applyScorePenalty(true, Math.ceil(lexicalDiversityPenalty * 0.5), score);
        flags.lexicalDiversityPenaltySoftenedForDomain = true;
      } else if (isHighlyStructured || isProfessionalContext) {
        score = applyScorePenalty(true, Math.ceil(lexicalDiversityPenalty * 0.7), score);
        flags.lexicalDiversityPenaltySoftenedForDomain = true;
      } else {
        score = applyScorePenalty(true, lexicalDiversityPenalty, score);
      }
      flags.lowLexicalDiversity = true;
    }

    // Penalize strongly skewed noun/verb ratios.
    if (typeof nounVerbBalanceRatio === 'number') {
      if ((nounVerbBalanceRatio > 3 || nounVerbBalanceRatio < 0.3) && stylisticPenalty > 0) {
        score = applyScorePenalty(true, stylisticPenalty, score);
        flags.skewedNounVerbBalance = true;
      }
    }

  // --- Minimum Score Floor for Highly Structured Prompts ---
  if (isHighlyStructured && score < 70) {
    score = 70;
    flags.minimumScoreFloorApplied = true;
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based',
  };
};

/**
 * Evaluates the "Specificity & Detail Scope" KPI.
 * This function calculates a score based on the presence and quality of specific elements
 * like target audience, output constraints, persona definitions, and key entities.
 * It uses the rich utility library for structured analysis and scoring.
 */
export const evaluateSpecificityDetailScopeRules = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {

  let score = 40; // Start with a base score
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  const { lengthWords, specificityElements, mentionsTargetAudience, hasConfidentAudienceMention, audienceDetails } = analyzedContext;

  // --- 1. Foundational Checks (Length) ---
  if (lengthWords < 15) {
    score = applyScorePenalty(true, 20, score); 
    flags.isVeryShortPrompt = true;
  } else if (lengthWords < 40) {
    score = applyScorePenalty(true, 10, score); 
    flags.isShortPrompt = true;
  }

  // --- 2. Core Specificity Elements (Bonuses & Penalties) ---
  // a. Audience & Persona
  if (mentionsTargetAudience) {
    flags.targetAudienceSpecified = true;
    flags.audienceDetails = audienceDetails; // Pass the evidence into the flags

    // Use the pre-calculated confidence flag from the analyzer.
    if (hasConfidentAudienceMention) {
      // A large, +25 point bonus for an explicit, high-quality audience definition.
      // A clear audience is a massive boost to specificity.
      score = applyScoreBonus(true, 25, score);
      flags.audienceBonus = 25;
    } else {
      // A smaller, +10 point bonus for a lower-confidence, implicit mention.
      score = applyScoreBonus(true, 10, score);
      flags.audienceBonus = 10;
    }
  } else {
    // If no audience is mentioned at all, it's a significant flaw in specificity.
    score = applyScorePenalty(true, 15, score); 
    flags.targetAudienceMissing = true;
    mistakes.add(MISTAKE_KEYS.IgnoringAudience);
  }

  // b. Persona definitions
  const personaInfo = specificityElements?.definedPersonaInfo;
  if (personaInfo && personaInfo.length > 0) {
    score = applyScoreBonus(true, 15, score);
    flags.personaDefinedDetails = personaInfo;
  } else {
    flags.personaNotDefined = true;
  }


  // --- 3. Detailed Specificity Elements Analysis ---

  // c. Example Instructions (clarity-enhancing, not true few-shot examples)
  const exampleInstructions = specificityElements?.exampleInstructions;
  if (exampleInstructions && exampleInstructions.length > 0) {
    // Reward for clear, context-aware example instructions (not just few-shot, but instructive guidance)
    score = applyScoreBonus(true, 12, score);
    flags.exampleInstructionsPresent = true;
    flags.exampleInstructionsDetails = exampleInstructions;
  } else {
    flags.exampleInstructionsMissing = true;
  }
  // Analyze each specificity element with structured scoring.

  // Output length constraints
  const outputLengthInfo = specificityElements?.outputLengthConstraints;
  if (outputLengthInfo && outputLengthInfo.length > 0) {
    const hasNumeric = specificityElements.outputLengthConstraints.some(c => {
      const meta = extractPatternMetadata(c);
      return isPatternMetadataOfType(meta, 'length_constraint') &&
        (meta as any).constraintType === 'numeric';
    });
    score = applyScoreBonus(true, hasNumeric ? 20 : 10, score);
    flags.outputLengthSpecified = true;
    flags.lengthConstraintDetails = outputLengthInfo;
  } else {
    flags.outputLengthMissing = true;
    score = applyScorePenalty(true, 10, score);
    mistakes.add(MISTAKE_KEYS.IneffectiveUseOfConstraints);
  }

  // Key entities analysis
  const keyEntities = specificityElements?.keyEntitiesFound;
  const keyEntitiesCount = keyEntities?.length ?? 0;
  flags.keyEntitiesCount = keyEntitiesCount;
  const keyEntitiesScore = getScoreFromThresholds(keyEntitiesCount, KEY_ENTITY_THRESHOLDS, 0);
  score = score + keyEntitiesScore;
  if (keyEntitiesCount <= 0) flags.noKeyEntitiesMentioned = true;
  if (keyEntities && keyEntities.length > 0) flags.keyEntitiesDetails = keyEntities;

  // --- 4. Additional Constraints and Context ---
  // Secondary factors that enhance specificity.
  const constraintsMentioned = specificityElements?.constraintsMentioned;
  const constraintsCount = constraintsMentioned?.length ?? 0;
  if (constraintsCount > 0) {
    score = adjustScoreByItemCount(constraintsCount, 6, score, 4);
    flags.constraintsMentionedDetails = constraintsMentioned;
    flags.hasAdditionalConstraints = true;
  } else {
    flags.lacksAdditionalConstraints = true;
  }

  // --- 4. Specificity Quality Assessment ---
  // Create an overall assessment flag based on multiple factors.

  const hasMultipleSpecificityElements = [
    mentionsTargetAudience,
    outputLengthInfo && outputLengthInfo.length > 0,
    personaInfo && personaInfo.length > 0,
    keyEntitiesCount > 0,
    constraintsCount > 0
  ].filter(Boolean).length;
  
  if (hasMultipleSpecificityElements >= 4) {
    flags.highSpecificity = true;
  } else if (hasMultipleSpecificityElements >= 2) {
    flags.moderateSpecificity = true;
  } else {
    flags.lowSpecificity = true;
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based',
  };
};

/**
 * Evaluates the "Goal Alignment" KPI 
 * This function calculates a score based on the presence of clear directives (action verbs or questions),
 * the clarity of those directives, and the focus/specificity of the goal.
 * It uses the rich utility library for structured analysis and scoring.
 */
export const evaluateGoalAlignmentLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>();

  // --- 1. Data Extraction ---
  const verbCount = analyzedContext.actionVerbDetails?.count ?? 0;
  const questionCount = analyzedContext.questionDetails?.count ?? 0;
  const hasDirective = verbCount > 0 || questionCount > 0;
  const isExplicit = !!analyzedContext.explicitlyStatesGoal;
  const lengthWords = analyzedContext.lengthWords ?? 0;
  const sectionCount = analyzedContext.instructionsAndStructure?.sectionCount ?? 0;
  const stepMarkerCount = analyzedContext.instructionsAndStructure?.stepMarkerDetails?.length ?? 0;
  const significantClarityIssuesCount = filterBySeverity(analyzedContext.clarityIssuesFound ?? [], SeverityLevel.MEDIUM).length ?? 0;

  const hasStepStructure = stepMarkerCount >= 3 || sectionCount >= 4;
  const isWellStructured = sectionCount >= 2 || stepMarkerCount >= 2;
  const isShortPrompt = lengthWords < 30;
  const isLongPrompt = lengthWords > 100;

  flags.hasDirective = hasDirective;
  flags.verbCount = verbCount;
  flags.questionCount = questionCount;
  flags.sectionCount = sectionCount;
  flags.stepMarkerCount = stepMarkerCount;
  flags.hasStepStructure = hasStepStructure;
  flags.isWellStructured = isWellStructured;

  // --- 2. Handle Critical Failure Case ---
  // If there is no directive (no verb or question), the goal is completely unaligned.
  if (!hasDirective) {
    mistakes.add(MISTAKE_KEYS.UnclearGoalOrIntent);
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
    return { score: 0, flags, evaluation_source: 'rule_based' };
  }

  // --- 3. The "Balanced Scorecard" ---
  let score = 0;
  const justifications: string[] = [];

  // Part A: Base Score for Directive Clarity (Max 65 points - increased from V1's 60)
  // How clear is the core instruction?
  if (isExplicit) {
    score = applyScoreBonus(true, 65, score);
    justifications.push("Excellent: Goal is explicitly stated (+65).");
  } else if (hasDirective && significantClarityIssuesCount === 0) {
    score = applyScoreBonus(true, 45, score);
    justifications.push("Good: A clear directive is present (+45).");
  } else if (hasDirective && significantClarityIssuesCount === 1) {
    score = applyScoreBonus(true, 25, score);
    justifications.push("Fair: A directive is present with minor clarity issues (+25).");
    flags.partiallyClearGoal = true;
  } else {
    score = applyScoreBonus(true, 10, score);
    justifications.push("Poor: A directive is present but obscured by vague language (+10).");
    mistakes.add(MISTAKE_KEYS.VagueOrUnclearPrompts);
  }

  // Part B: Focus and Structure Assessment
  if (verbCount === 1 && questionCount === 0) {
    const focusBonus = isShortPrompt ? 20 : isLongPrompt ? 25 : 22;
    score = applyScoreBonus(true, focusBonus, score);
    justifications.push(`Excellent: Prompt has a single, focused action verb (+${focusBonus}).`);
    flags.hasSingularFocus = true;
  } else if (verbCount === 0 && questionCount === 1) {
    const focusBonus = isShortPrompt ? 18 : isLongPrompt ? 23 : 20;
    score = applyScoreBonus(true, focusBonus, score);
    justifications.push(`Excellent: Prompt has a single, focused question (+${focusBonus}).`);
    flags.isSingleQuestion = true;
  } else if (verbCount > 3 && !isWellStructured) {
    score = applyScorePenalty(true, 15, score);
    justifications.push("Penalty: Multiple action verbs are used without adequate structure (-15).");
    mistakes.add(MISTAKE_KEYS.OverloadingPrompts);
    flags.isOverloadedWithActions = true;
  } else if (verbCount > 2 && isWellStructured) {
    score = applyScoreBonus(true, 8, score);
    justifications.push("Fair: Multiple directives are present and well-structured (+8).");
    flags.structuredMultipleDirectives = true;
  } else if (verbCount > 1) {
    score = applyScoreBonus(true, 12, score);
    justifications.push("Fair: Multiple directives are present (+12).");
  }

  // Part C: Supporting Structure Bonus (Max 20 points - enhanced from V1's 15)
  if (hasStepStructure) {
    score = applyScoreBonus(true, 20, score);
    justifications.push("Excellent: Goal is supported by comprehensive step structure (+20).");
    flags.modernStructuredPrompt = true;
  } else if (isWellStructured) {
    score = applyScoreBonus(true, 15, score);
    justifications.push("Good: Goal is supported by clear structure (+15).");
    flags.wellStructuredPrompt = true;
  } else if (stepMarkerCount >= 2) {
    score = applyScoreBonus(true, 10, score);
    justifications.push("Good: Goal has some structural support (+10).");
  }

  // Part D: Additional Enhancements
  // Question balance assessment
  if (questionCount > 3 && verbCount === 0) {
    score = applyScorePenalty(true, 15, score);
    justifications.push("Penalty: Too many questions without clear directive (-15).");
    flags.tooManyQuestionsWithoutDirection = true;
  } else if (questionCount > 5) {
    score = applyScorePenalty(true, 10, score);
    justifications.push("Penalty: Excessive questions (-10).");
    flags.excessiveQuestions = true;
  }

  // Balanced question-directive ratio bonus for complex prompts
  if (lengthWords > 80 && questionCount > 0 && verbCount > 0 && questionCount <= 3 && verbCount <= 3) {
    score = applyScoreBonus(true, 5, score);
    justifications.push("Bonus: Balanced question-directive ratio in complex prompt (+5).");
    flags.balancedQuestionDirectiveRatio = true;
  }

  // Supporting details bonus
  const hasSupportingDetails = 
    ((analyzedContext.specificityElements?.constraintsMentioned?.length ?? 0) > 0 && significantClarityIssuesCount === 0) ||
    ((analyzedContext.instructionsAndStructure?.exampleDetails?.length ?? 0) > 0 && significantClarityIssuesCount === 0);
  
  if (hasSupportingDetails) {
    score = applyScoreBonus(true, 5, score);
    justifications.push("Bonus: Supporting details enhance goal clarity (+5).");
    flags.specificitySupportsGoal = true;
  }

  // --- 4. NEW, SIMPLIFIED MISTAKE DIAGNOSIS ---
  // This is now a separate, independent diagnosis step.
  
  // Rule 1: Vagueness
  if (significantClarityIssuesCount > 0) {
    mistakes.add(MISTAKE_KEYS.VagueOrUnclearPrompts);
  }

  // Rule 2: Overloading (multiple directives, no structure)
  const totalDirectives = verbCount + questionCount;
  if (totalDirectives > 1 && stepMarkerCount === 0) {
    mistakes.add(MISTAKE_KEYS.OverloadingPrompts);
  }

  // Rule 3: Unclear goal (not explicit AND vague or overloaded)
  if (
  !isExplicit &&
  (
    !hasDirective ||
    significantClarityIssuesCount > 0 ||
    (verbCount + questionCount > 1 && stepMarkerCount === 0)
    )
  ) {
    mistakes.add(MISTAKE_KEYS.UnclearGoalOrIntent);
  }

  // --- 5. Final Assembly ---s 
  flags.scoringJustifications = justifications;
  flags.hasEffectiveGoal = hasDirective && significantClarityIssuesCount === 0;
  flags.goalStatedExplicitly = isExplicit;

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags,
    evaluation_source: 'rule_based',
  };
};

/**
 * Evaluates the "Instruction Following" KPI.
 * Applies penalties for negative instructions and contradictory statements using threshold-based scoring.
 * Uses structured flagging for detailed reporting with realistic scoring.
*/
export const evaluateInstructionFollowingLogic = (
  analyzedContext: AnalyzedPromptDataContext
): KpiEvaluationOutput => {
  let score = 100;
  const flags: Record<string, any> = {};
  const mistakes = new Set<KpiMistakeKeys>(); 

  const negInstrCount = analyzedContext.negativeInstructionIssues?.length ?? 0;
  const contradictionCount = analyzedContext.contradictoryStatementFlags?.length ?? 0;
  const constraintCount = analyzedContext.specificityElements?.constraintsMentioned?.length ?? 0;


  // --- 1. Primary Penalties: Negative Instructions and Contradictions ---
  const negInstrPenalty = getScoreFromThresholds(negInstrCount, NEGATIVE_INSTRUCTION_PENALTY_THRESHOLDS, 0);
  const contradictionPenalty = getScoreFromThresholds(contradictionCount, CONTRADICTION_PENALTY_THRESHOLDS, 0);


  if (negInstrPenalty > 0) {
    score = applyScorePenalty(true, negInstrPenalty, score);
    flags.negativeInstructionDetails = analyzedContext.negativeInstructionIssues;
    flags.hasNegativeInstructions = true;
  }

  if (contradictionPenalty > 0) {
    score = applyScorePenalty(true, contradictionPenalty, score);
    flags.contradictoryStatementDetails = analyzedContext.contradictoryStatementFlags;
    flags.hasContradictions = true;
    mistakes.add(MISTAKE_KEYS.VagueOrUnclearPrompts);
  }

  // --- 2. Positive Recognition for Clear Constraints ---

  const hasExplicitConstraint = constraintCount > 0;
  if (hasExplicitConstraint) {
    // A prompt with clear constraints is higher quality.
    score = applyScoreBonus(true, 20, score); // Significant bonus
    flags.hasClearConstraints = true;
    flags.constraintDetails = analyzedContext.specificityElements?.constraintsMentioned;
  } else {
    // Only penalize if the prompt is complex enough to warrant constraints
    const lengthWords = analyzedContext.lengthWords ?? 0;
    const sectionCount = analyzedContext.instructionsAndStructure?.sectionCount ?? 0;
    const stepMarkerCount = analyzedContext.instructionsAndStructure?.stepMarkerDetails?.length ?? 0;
    const isComplex = lengthWords > 40 || sectionCount > 1 || stepMarkerCount > 1;
    if (isComplex) {
      score = applyScorePenalty(true, 30, score); // Moderate penalty for missing constraints
      mistakes.add(MISTAKE_KEYS.IneffectiveUseOfConstraints);
      flags.lacksClearConstraints = true;
    }
  }

  // --- 3. Positive Recognition for Clean Instructions ---
  if (negInstrCount === 0 && contradictionCount === 0 && hasExplicitConstraint) {
    flags.noInstructionFollowingIssues = true;
  }

  if (mistakes.size > 0) {
    flags.associated_mistake_keys_flagged = Array.from(mistakes);
  }

  return {
    score: clampScore(score),
    flags: Object.keys(flags).length > 0 ? flags : undefined,
    evaluation_source: "rule_based" as KpiEvaluationSource,
  };
};

 /**
 * Comprehensive AI-enhanced evaluation for ClarityPurposeAgent using refactored utilities.
 * Makes a single AI call for all eligible features and applies enhancements systematically.
 * Replaces the original hard-coded approach with configurable, reusable utilities.
 */
export const evaluateClarityPurposeHybrid = async (
  analyzedContext: AnalyzedPromptDataContext,
  aiClarityAnalysis: AIClarityAnalysisFactory
): Promise<{
  clarityUnambiguity: KpiEvaluationOutput;
  specificityDetailScope: KpiEvaluationOutput;
  goalAlignment: KpiEvaluationOutput;
  instructionFollowing: KpiEvaluationOutput;
}> => {

  // Compute rule-based results using centralized utility
  const ruleResults = computeRuleBasedResults(analyzedContext, {
    clarityUnambiguity: evaluateClarityUnambiguityRules,
    specificityDetailScope: evaluateSpecificityDetailScopeRules,
    goalAlignment: evaluateGoalAlignmentLogic, // Now using the hybrid version
    instructionFollowing: evaluateInstructionFollowingLogic,
  });

  // Determine eligible features using configurable rules
  const eligibleFeatures = determineAIEligibilityFromRules(
    analyzedContext, 
    CLARITY_PURPOSE_AI_ELIGIBILITY_RULES
  );
  
  if (eligibleFeatures.length === 0) {
    return ruleResults;
  }

  // Execute AI analysis with standardized error handling
  const aiResult = await executeAIAnalysisWithErrorHandling(
    aiClarityAnalysis,
    analyzedContext,
    eligibleFeatures,
    'ClarityPurposeAgent'
  );

  if (!aiResult) {
    return ruleResults; 
  }

  // Apply AI enhancements using centralized utility
  return applyAIEnhancements(
    ruleResults,
    aiResult,
    eligibleFeatures,
    CLARITY_PURPOSE_ENHANCEMENT_MAP
  );
};

import { KpiRubricCriterion } from "@/lib/types/kpiEvaluation";
import { ScoreThreshold,  WeightedScoreItem} from '@/lib/types/aiTypes';
import { StatusIndicator, StatusCode, STATUS_LEVELS } from '@/lib/types/reportTypes';


import { COMPLEX_ACTION_VERBS } from '@/lib/config/keywords/instructionsStructure';


export const calculateWeightedAverage = (scoresAndWeights: WeightedScoreItem[]): number => {
  if (!scoresAndWeights || scoresAndWeights.length === 0) {
    return MIN_SCORE;
  }

  let totalScore = 0;
  let totalWeight = 0;

  for (const item of scoresAndWeights) {
    // Ensure score and weight are valid numbers
    const score = typeof item.score === 'number' && !isNaN(item.score) ? item.score : 0;
    const weight = typeof item.weight === 'number' && !isNaN(item.weight) ? item.weight : 0;

    if (weight > 0) { // Only consider items with positive weight
        totalScore += clampScore(score) * weight; // Clamp individual scores before weighting
        totalWeight += weight;
    }
  }

  if (totalWeight === 0) {
    return MIN_SCORE; // Avoid division by zero; return min score if no valid weights
  }

  const weightedAverage = totalScore / totalWeight;

  return Math.round(weightedAverage);
};

export const getRubricFeedback = (score: number, rubric: KpiRubricCriterion[]): KpiRubricCriterion => {
  const sortedRubric = [...rubric].sort((a, b) => 
    (b.minScore ?? 0) - (a.minScore ?? 0)
  );
  const criterion = sortedRubric.find(c => score >= (c.minScore ?? 0));

  if (criterion) return criterion;
  
  return {
    minScore: 0,
    assessmentComment: "Requires significant attention. The prompt has critical issues in this area.",
    improvementSuggestions: ["Review the fundamental principles for this quality indicator to improve your prompt."],
    qualityLevel: "Critical Attention Needed",
  };
};

const MIN_SCORE = 0;
const MAX_SCORE = 100;

export const clampScore = (score: number, min: number = MIN_SCORE, max: number = MAX_SCORE): number => {
  return Math.max(min, Math.min(max, score));
};

export function clampHybridScore(ruleScore: number, adjustedScore: number): number {
  return Math.max(ruleScore, clampScore(adjustedScore));
}

export const applyScoreBonus = (condition: boolean, bonus: number, currentScore: number): number => {
  let newScore = currentScore;
  if (condition) {
    newScore += bonus;
  }
  return clampScore(newScore);
};

export const applyScorePenalty = (condition: boolean, penalty: number, currentScore: number): number => {
  let newScore = currentScore;
  if (condition) {
    newScore -= penalty;
  }
  return clampScore(newScore);
};

export const adjustScoreByItemCount = (
  itemsOrCount: any[] | number | undefined | null,
  pointsPerItem: number,
  currentScore: number,
  capOnEffectingItems: number = 3
): number => {
  let newScore = currentScore;
  const count = Array.isArray(itemsOrCount)
    ? itemsOrCount.length
    : (typeof itemsOrCount === 'number' ? itemsOrCount : 0);

  if (count > 0) {
    const effectiveCount = Math.min(count, capOnEffectingItems);
    newScore += (pointsPerItem * effectiveCount);
  }
  return clampScore(newScore);
};


export const getScoreFromThresholds = (
  value: number | undefined | null,
  thresholds: ScoreThreshold[],
  defaultValue: number = MIN_SCORE
): number => {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  for (const threshold of thresholds) {
    if (threshold.limit === undefined || value <= threshold.limit) {
      return clampScore(threshold.scoreToAssign);
    }
  }
  return clampScore(defaultValue);
};

/**
 * Maps a numerical score (0-100) to a qualitative status indicator and code.
 *
 * @param score The numerical score to classify.
 * @returns An object containing the status indicator string and a numerical code.
 */
export const getStatusFromScore = (score: number): { indicator: StatusIndicator; code: StatusCode } => {
  const found = STATUS_LEVELS.find(level => score >= level.minScore);
  // Fallback to the lowest level if not found (shouldn't happen)
  return found || STATUS_LEVELS[STATUS_LEVELS.length - 1];
};


/**
 * Checks if a given verb is considered complex, implying a multi-step task.
 * @param verb The verb to check.
 * @returns True if the verb is in the complex list, false otherwise.
 */
export const isComplexTaskVerb = (verb: string): boolean => {
  if (!verb) {
    return false;
  }
  return COMPLEX_ACTION_VERBS.includes(verb.toLowerCase());
};
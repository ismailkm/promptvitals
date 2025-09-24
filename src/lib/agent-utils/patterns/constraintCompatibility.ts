// src/lib/agent-utils/patterns/constraintCompatibility.ts

import { LengthConstraintPatternMetadata } from '@/lib/types/patterns';

import { 
  QualitativeLengthType, 
  NumericLengthUnitType,
  VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED,
} from '@/lib/types/outputLength';

/**
 * Defines constraint compatibility rules between numeric and qualitative constraints.
 * Maps qualitative constraint types to their compatible numeric ranges.
 */
interface ConstraintCompatibilityRule {
  qualitativeType: QualitativeLengthType;
  compatibleNumericRanges: {
    unit: NumericLengthUnitType;
    minValue?: number;
    maxValue?: number;
  }[];
  conflictingQualitativeTypes: QualitativeLengthType[];
}

/**
 * Predefined compatibility rules for different constraint combinations.
 * Based on common sense expectations of length constraints.
 */
const CONSTRAINT_COMPATIBILITY_RULES: ConstraintCompatibilityRule[] = [
  {
    qualitativeType: 'brief',
    compatibleNumericRanges: [
      { unit: 'words', maxValue: 100 },
      { unit: 'lines', maxValue: 5 },
      { unit: 'paragraphs', maxValue: 2 },
      { unit: 'characters', maxValue: 500 }
    ],
    conflictingQualitativeTypes: ['detailed']
  },
  {
    qualitativeType: 'concise',
    compatibleNumericRanges: [
      { unit: 'words', maxValue: 150 },
      { unit: 'lines', maxValue: 8 },
      { unit: 'paragraphs', maxValue: 3 },
      { unit: 'characters', maxValue: 750 }
    ],
    conflictingQualitativeTypes: ['detailed']
  },
  {
    qualitativeType: 'detailed',
    compatibleNumericRanges: [
      { unit: 'words', minValue: 200 },
      { unit: 'lines', minValue: 10 },
      { unit: 'paragraphs', minValue: 3 },
      { unit: 'characters', minValue: 1000 }
    ],
    conflictingQualitativeTypes: ['brief', 'concise']
  }
];

/**
 * Represents the result of a constraint compatibility analysis.
 */
export interface ConstraintCompatibilityResult {
  isCompatible: boolean;
  conflicts: ConstraintConflict[];
  warnings: string[];
  overSpecificationScore: number; // 0-100, where 100 is severely over-specified
}

/**
 * Describes a specific conflict between constraints.
 */
export interface ConstraintConflict {
  type: 'numeric_qualitative' | 'qualitative_qualitative' | 'numeric_numeric' | 'over_specification';
  description: string;
  conflictingConstraints: LengthConstraintPatternMetadata[];
  severityLevel: 'low' | 'medium' | 'high';
}

/**
 * Analyzes the compatibility of length constraints, detecting conflicts and over-specification.
 * It intelligently suppresses conflicts for well-decomposed prompts, treating them as warnings instead.
 *
 * @param numericConstraints - Array of numeric constraint metadata
 * @param qualitativeConstraints - Array of qualitative constraint metadata
 * @param isDecomposedTask - Boolean flag indicating if the prompt has clear steps
 * @returns A detailed compatibility analysis result object.
 */
export function analyzeConstraintCompatibility(
  numericConstraints: LengthConstraintPatternMetadata[],
  qualitativeConstraints: LengthConstraintPatternMetadata[],
  isDecomposedTask: boolean
): ConstraintCompatibilityResult {
  const result: ConstraintCompatibilityResult = {
    isCompatible: true,
    conflicts: [],
    warnings: [],
    overSpecificationScore: 0
  };

  const totalConstraints = numericConstraints.length + qualitativeConstraints.length;

  // No conflicts are possible with 0 or 1 constraint.
  if (totalConstraints <= 1) {
    return result; 
  }

  // --- THE GUARD CLAUSE FOR DECOMPOSED TASKS ---
  // If the task is broken into steps, we switch from "conflict detection" to "warning mode".
  if (isDecomposedTask) {
    if (totalConstraints > 3) {
      result.warnings.push(`The prompt contains ${totalConstraints} length constraints. In a multi-step prompt, ensure each constraint is clearly tied to its respective step.`);
    }
    // A conflict between two numeric constraints of the same unit is still a potential problem.
    result.conflicts.push(...detectNumericConflicts(numericConstraints));
    // Final compatibility for decomposed tasks depends only on this severe conflict type.
    result.isCompatible = result.conflicts.length === 0;
    return result;
  }

  // --- LOGIC FOR NON-DECOMPOSED (SIMPLE) TASKS ONLY ---
  // The code from this point on will only execute if isDecomposedTask is false.

  // Check for over-specification
  if (totalConstraints > 3) {
    result.overSpecificationScore = Math.min(100, (totalConstraints - 3) * 25);
    result.conflicts.push({
      type: 'over_specification',
      description: `Too many constraints specified (${totalConstraints}). This may confuse the AI.`,
      conflictingConstraints: [...numericConstraints, ...qualitativeConstraints],
      severityLevel: 'medium'
    });
  }

  // Check for all types of conflicts now that we know the task is simple.
  result.conflicts.push(...detectQualitativeConflicts(qualitativeConstraints));
  result.conflicts.push(...detectNumericQualitativeConflicts(numericConstraints, qualitativeConstraints));
  result.conflicts.push(...detectNumericConflicts(numericConstraints));

  // Determine overall compatibility based on any high-severity conflicts found.
  result.isCompatible = result.conflicts.filter(c => c.severityLevel === 'high').length === 0;

  return result;
}

/**
 * Detects conflicts between qualitative constraints.
 */
function detectQualitativeConflicts(
  qualitativeConstraints: LengthConstraintPatternMetadata[]
): ConstraintConflict[] {
  const conflicts: ConstraintConflict[] = [];
  
  if (qualitativeConstraints.length < 2) return conflicts;

  // Get unique qualitative types
  const qualitativeTypes = qualitativeConstraints
    .map(c => c.normalizedType as QualitativeLengthType)
    .filter(type => VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED.includes(type));

  // Check for conflicting pairs
  for (let i = 0; i < qualitativeTypes.length; i++) {
    for (let j = i + 1; j < qualitativeTypes.length; j++) {
      const type1 = qualitativeTypes[i];
      const type2 = qualitativeTypes[j];
      
      const rule1 = CONSTRAINT_COMPATIBILITY_RULES.find(r => r.qualitativeType === type1);
      
      if (rule1?.conflictingQualitativeTypes.includes(type2)) {
        conflicts.push({
          type: 'qualitative_qualitative',
          description: `Conflicting qualitative constraints: "${type1}" and "${type2}" are incompatible.`,
          conflictingConstraints: qualitativeConstraints.filter(c => 
            c.normalizedType === type1 || c.normalizedType === type2
          ),
          severityLevel: 'high'
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detects conflicts between numeric and qualitative constraints.
 */
function detectNumericQualitativeConflicts(
  numericConstraints: LengthConstraintPatternMetadata[],
  qualitativeConstraints: LengthConstraintPatternMetadata[]
): ConstraintConflict[] {
  const conflicts: ConstraintConflict[] = [];

  for (const qualitativeConstraint of qualitativeConstraints) {
    const qualitativeType = qualitativeConstraint.normalizedType as QualitativeLengthType;
    const rule = CONSTRAINT_COMPATIBILITY_RULES.find(r => r.qualitativeType === qualitativeType);
    
    if (!rule) continue;

    for (const numericConstraint of numericConstraints) {
      const numericUnit = numericConstraint.normalizedType as NumericLengthUnitType;
      const numericValue = numericConstraint.value;
      
      if (!numericValue) continue;

      const compatibleRange = rule.compatibleNumericRanges.find(r => r.unit === numericUnit);
      if (!compatibleRange) continue;

      let isConflicting = false;
      let conflictReason = '';

      if (compatibleRange.maxValue && numericValue > compatibleRange.maxValue) {
        isConflicting = true;
        conflictReason = `${numericValue} ${numericUnit} exceeds the expected maximum for "${qualitativeType}" (≤${compatibleRange.maxValue} ${numericUnit})`;
      } else if (compatibleRange.minValue && numericValue < compatibleRange.minValue) {
        isConflicting = true;
        conflictReason = `${numericValue} ${numericUnit} is below the expected minimum for "${qualitativeType}" (≥${compatibleRange.minValue} ${numericUnit})`;
      }

      if (isConflicting) {
        conflicts.push({
          type: 'numeric_qualitative',
          description: conflictReason,
          conflictingConstraints: [numericConstraint, qualitativeConstraint],
          severityLevel: 'high'
        });
      }
    }
  }

  return conflicts;
}

/**
 * Detects conflicts between numeric constraints.
 */
function detectNumericConflicts(
  numericConstraints: LengthConstraintPatternMetadata[]
): ConstraintConflict[] {
  const conflicts: ConstraintConflict[] = [];

  if (numericConstraints.length < 2) return conflicts;

  // Group by unit type
  const constraintsByUnit = new Map<string, LengthConstraintPatternMetadata[]>();
  
  for (const constraint of numericConstraints) {
    const unit = constraint.normalizedType;
    if (!constraintsByUnit.has(unit)) {
      constraintsByUnit.set(unit, []);
    }
    constraintsByUnit.get(unit)!.push(constraint);
  }

  // Check for conflicts within each unit type
  for (const [unit, constraints] of constraintsByUnit) {
    if (constraints.length > 1) {
      const values = constraints.map(c => c.value).filter(v => v !== undefined) as number[];
      
      if (values.length > 1) {
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        if (maxValue > minValue * 2) { // Significant discrepancy
          conflicts.push({
            type: 'numeric_numeric',
            description: `Conflicting numeric constraints for ${unit}: values range from ${minValue} to ${maxValue}, which may be confusing.`,
            conflictingConstraints: constraints,
            severityLevel: 'medium'
          });
        }
      }
    }
  }

  return conflicts;
}

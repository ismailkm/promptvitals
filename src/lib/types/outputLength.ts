// src/lib/types/outputLength.ts

export const VALID_NUMERIC_LENGTH_UNITS_RAW: string[] = [
    "word", "words", "item", "items", "paragraph", "paragraphs",
    "line", "lines", "character", "characters"
  ];
  
export const VALID_NUMERIC_LENGTH_UNITS_NORMALIZED = [
    "words", "items", "paragraphs", "lines", "characters"
] as const;
  
export const VALID_QUALITATIVE_LENGTH_TYPES_RAW: string[] = [
    "concise", "brief", "short", "detailed", "long", "extensive"
];
  
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

export const QUALITATIVE_CONSTRAINT_SCORE_MAP: Record<QualitativeLengthType, number> = {
  brief: 75,
  concise: 75,
  detailed: 70,
};

export const DEFAULT_QUALITATIVE_SCORE = 65;
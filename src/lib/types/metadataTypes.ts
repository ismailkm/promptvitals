// LengthConstraintPatternMetadata types
export const LENGTH_CONSTRAINT_TYPE = {
  NUMERIC: 'numeric',
  QUALITATIVE: 'qualitative',
} as const;
export type LengthConstraintType = typeof LENGTH_CONSTRAINT_TYPE[keyof typeof LENGTH_CONSTRAINT_TYPE];

export type LengthConstraintModifier = 'under' | 'over' | 'at least' | 'less than' | 'more than' | 'between' | 'exactly';


// Example types for ExamplePatternMetadata
export const EXAMPLE_TYPE = {
  STRUCTURED: 'structured',
  KEYWORD: 'keyword',
  BASIC: 'basic',
  INSTRUCTION: 'instruction',
} as const;
export type ExampleType = typeof EXAMPLE_TYPE[keyof typeof EXAMPLE_TYPE];

// Structure subtypes for ExamplePatternMetadata
export const EXAMPLE_STRUCTURE_SUBTYPE = {
  INPUT_OUTPUT: 'input_output',
  LABELED: 'labeled',
  CODE_BLOCK: 'code_block',
  INCOMPLETE: 'incomplete',
} as const;
export type ExampleStructureSubtype = typeof EXAMPLE_STRUCTURE_SUBTYPE[keyof typeof EXAMPLE_STRUCTURE_SUBTYPE];

// Quality indicators for ExamplePatternMetadata
export const EXAMPLE_QUALITY_INDICATOR = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export type ExampleQualityIndicator = typeof EXAMPLE_QUALITY_INDICATOR[keyof typeof EXAMPLE_QUALITY_INDICATOR];


export const TONE_STYLE_CATEGORY = {
  FORMAL: 'formal',
  CASUAL: 'casual',
  NEUTRAL: 'neutral',
  CREATIVE: 'creative',
  TECHNICAL: 'technical',
  PERSUASIVE: 'persuasive',
} as const;
export type ToneStyleCategory = typeof TONE_STYLE_CATEGORY[keyof typeof TONE_STYLE_CATEGORY];


export const TONE_STYLE_SUBTYPE = {
  JOURNALISTIC: 'journalistic',
  HUMOROUS: 'humorous',
  EMPATHETIC: 'empathetic',
  STORYTELLING: 'storytelling',
  NARRATIVE: 'narrative',
  POETIC: 'poetic',
  PROFESSIONAL: 'professional',
  CONVERSATIONAL: 'conversational',
  CLEAR: 'clear',
  OBJECTIVE: 'objective',
  CONFIDENT: 'confident',
  PERSUASIVE: 'persuasive',
  DATA_DRIVEN: 'data_driven',
  SIMPLE: 'simple',
} as const;
export type ToneStyleSubtype = typeof TONE_STYLE_SUBTYPE[keyof typeof TONE_STYLE_SUBTYPE];

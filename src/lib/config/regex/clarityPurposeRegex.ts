// Regex patterns for context-aware filtering in clarity and purpose evaluation
// These patterns are used to detect specific modifiers and constraint keywords in prompts
// For usage examples, see clarityAndPurpose.ts and clarityUtils.ts

/**
 * Matches specific modifiers that indicate domain expertise or targeted context.
 * Used to avoid false positives when filtering vague terms in professional or domain-specific prompts.
 * Example matches: "public health", "expert analysis", "strategic approach", "effective solution"
 */
export const SPECIFIC_MODIFIER_REGEX = /\b(public|expert|professional|digital|strategic|comprehensive|targeted|effective)\s+/gi;

/**
 * Matches constraint-related keywords for identifying requirements, limitations, or restrictions in prompts.
 * Example matches: "constraints", "requirements", "limitations", "restrictions"
 */
export const CONSTRAINT_KEYWORDS_REGEX = /\b(constraints?|requirements?|limitations?|restrictions?)\b/gi;

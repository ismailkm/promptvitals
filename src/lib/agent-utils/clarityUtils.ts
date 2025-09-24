import { DetectedPatternInfo } from '@/lib/types/patterns';
import { PROFESSIONAL_TERMS_WHITELIST, DOMAIN_CONTEXT_PATTERNS, PROFESSIONAL_CONTEXT_KEYWORDS } from '@/lib/config/keywords/clarityAndPurpose';
import { SPECIFIC_MODIFIER_REGEX, CONSTRAINT_KEYWORDS_REGEX } from '@/lib/config/regex/clarityPurposeRegex';
/**
 * Unified context-aware filtering for vague terms to prevent false positives
 * with professional, domain-specific, or expert-level language.
 * Can be used by any agent.
 */
export const filterVagueTermsWithContext = (
  clarityIssues: DetectedPatternInfo[],
  promptText: string,
  wordCount?: number
): DetectedPatternInfo[] => {
  const lowerPromptText = promptText.toLowerCase();

  // Detect professional/domain context
  const hasExpertContext = DOMAIN_CONTEXT_PATTERNS.some(pattern =>
    pattern.pattern.test(promptText)
  );

  // Detect constraints
  const hasConstraints = CONSTRAINT_KEYWORDS_REGEX.test(promptText);

  // Optionally, leniency for longer/structured prompts
  const hasAdequateLength = typeof wordCount === 'number' ? wordCount > 30 : false;

  return clarityIssues.filter(issue => {
    const matchedText = issue.matchedText?.toLowerCase() || '';

    // Never flag professional terms in professional contexts
    if (PROFESSIONAL_TERMS_WHITELIST.some(term =>
      matchedText.includes(term.toLowerCase())
    )) {
      if (hasExpertContext || hasConstraints || hasAdequateLength) {
        return false; // Filter out (don't flag as vague)
      }
    }

    // Be more lenient with domain terms when they have specific modifiers
    const metadata = (issue as any).metadata || {};
    if (metadata && metadata.type === 'vagueness') {
      if (metadata.listSubType === 'generic_topic') {
        // Check for specific modifiers in the prompt
        const hasSpecificModifier = SPECIFIC_MODIFIER_REGEX.test(promptText);
        if (hasSpecificModifier && (hasExpertContext || hasConstraints)) {
          return false; // Filter out domain terms with specific context
        }
      }
    }

    return true; // Keep the issue
  });
};

/**
 * Detects if the prompt contains expert/domain context using regex patterns.
 */
export function detectExpertContext(promptText: string): boolean {
  return DOMAIN_CONTEXT_PATTERNS.some(pattern =>
    pattern.pattern.test(promptText ?? '')
  );
}

/**
 * Detects if the prompt contains professional keywords.
 */
export function detectProfessionalKeywords(promptText: string): boolean {
  const lowerPromptText = (promptText ?? '').toLowerCase();
  return PROFESSIONAL_CONTEXT_KEYWORDS.some(keyword => lowerPromptText.includes(keyword));
}
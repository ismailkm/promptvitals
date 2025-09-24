
export const MISTAKE_DEFINITIONS = {
  // === Clarity & Purpose ===
  VagueOrUnclearPrompts: {
    name: "Vague Language",
    description: "The prompt's language or goal is ambiguous, containing unclear terms that make it difficult to interpret."
  },
  AmbiguousLanguageTerms: {
    name: "Ambiguous Terms",
    description: "The prompt uses specific words or phrases that have multiple meanings, which could lead to misinterpretation."
  },
  UnclearGoalOrIntent: {
    name: "Unclear Goal",
    description: "The primary objective or the desired final output of the prompt is not clearly stated."
  },

  // === Instructions & Structure ===
  PoorPromptStructure: {
    name: "Poor Structure",
    description: "The prompt lacks clear organization. A long request is presented as a single block of text without headings or paragraphs."
  },
  OverloadingPrompts: {
    name: "Overloaded Task",
    description: "Multiple complex or unrelated tasks are combined into a single request without a clear, step-by-step breakdown."
  },
  IgnoringOutputFormat: {
    name: "Ignoring Output Format",
    description: "The prompt does not specify the desired format for the output (e.g., list, JSON, table, Markdown)."
  },
  NotUsingExamples: {
    name: "Missing Examples",
    description: "For a complex, nuanced, or style-specific task, the prompt does not provide a clear example for the AI to follow."
  },
  IneffectiveUseOfConstraints: {
    name: "Ineffective Constraints",
    description: "The prompt does not provide clear positive or negative constraints (e.g., word count, topics to avoid)."
  },
  LackingToneStyleGuidance: {
    name: "Lacking Tone/Style Guidance",
    description: "The prompt does not provide clear instructions on the desired tone, style, or persona for the AI to adopt."
  },

  // === Context & Content ===
  MissingContext: {
    name: "Missing Context",
    description: "The prompt lacks essential background information, domain knowledge, or context required for the AI to perform the task effectively."
  },
  IgnoringAudience: {
    name: "Ignoring Audience",
    description: "The prompt does not define the target audience for the response, which can lead to inappropriate tone or complexity."
  },

  // === Safety & Ethics ===
  InstructingMaliciousBehaviour: {
    name: "Instructing Malicious Behavior",
    description: "The prompt contains instructions for technically harmful activities, such as hacking, jailbreaking, or bypassing safety protocols."
  },
  InstructingUnethicalBehaviour: {
    name: "Instructing Unethical Behavior",
    description: "The prompt requests the generation of content that is ethically problematic, manipulative, or promotes harmful actions."
  },
  BiasedOrDiscriminatoryLanguage: {
    name: "Biased or Discriminatory Language",
    description: "The prompt includes language that is exclusionary, stereotypical, or discriminatory towards a specific group."
  },
  DataPrivacyViolation: {
    name: "Data Privacy Violation",
    description: "The prompt requests actions or information that would violate personal data privacy."
  },
};

export type KpiMistakeKeys = keyof typeof MISTAKE_DEFINITIONS;

// This allows us to import and use these keys in a type-safe way.
// e.g., MISTAKE_KEYS.VagueOrUnclearPrompts === "VagueOrUnclearPrompts"
export const MISTAKE_KEYS = (Object.keys(
  MISTAKE_DEFINITIONS
) as KpiMistakeKeys[]).reduce((acc, key) => {
  acc[key] = key;
  return acc;
}, {} as { [K in KpiMistakeKeys]: KpiMistakeKeys });
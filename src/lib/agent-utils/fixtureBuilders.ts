import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { RiskAssessmentLevel, SeverityLevel } from '@/lib/types/shared';
import { DetectedPatternInfo } from '@/lib/types/patterns';

/**
 * Base fixture builder for AnalyzedPromptDataContext with sensible defaults.
 * Override any fields as needed for specific test scenarios.
 */
export function makeContext(overrides: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext {
  const base: AnalyzedPromptDataContext = {
    promptText: 'Write a brief summary of the main topics discussed.',
    lengthWords: 10,
    lengthChars: 52,
    readabilityScore: 8.5,
    averageSentenceLength: 10,
    complexSentenceCount: 0,
    lexicalDiversityScore: 0.8,
    
    // Clarity indicators
    clarityIssuesFound: [],
    
    // Specificity elements
    specificityElements: {
      outputLengthConstraints: [
        {
          matchedText: 'brief',
          reason: "Qualitative length constraint 'brief' detected.",
          severity: SeverityLevel.LOW,
          matchedPatternSource: 'brief',
          startIndex: 8,
          endIndex: 13
        }
      ],
      definedPersonaInfo: [],
      keyEntitiesFound: [],
      constraintsMentioned: [],
      outputFormatKeywords: []
    },
    
    // Goal and instruction analysis
    explicitlyStatesGoal: false,
    actionVerbDetails: {
      count: 1,
      verbs: ['Write']
    },
    questionDetails: {
      questionMarksCount: 0,
      identifiedQuestionSentences: [],
      count: 0,
      types: []
    },
    mentionsTargetAudience: false,
    
    // Instructions and structure context
    instructionsAndStructure: {
      explicitFormatRequests: [],
      requestsSpecificFormat: null,
      bulletPointUsage: {
        detected: false,
        count: 0
      },
      sectionCount: 1,
      exampleDetails: [],
      placeholderDetails: [],
      toneStyleGuidance: [],
      stepMarkerDetails: []
    },
    
    // Context indicators
    contextIndicatorsFound: [],
    
    // Instruction issues
    negativeInstructionIssues: [],
    contradictoryStatementFlags: [],
    
    // Safety & Ethics (from analyzer)
    biasRiskIndicators: [],
    restrictedContentIndicators: [],
    misusePatternIndicators: [],
    highPrivilegeDescriptions: [],
    cumulativeRiskScore: 0,
    riskAssessmentLevel: RiskAssessmentLevel.LOW
  };

  return { ...base, ...overrides };
}

/**
 * Fixture for safety-focused test scenarios.
 * Pre-configured with safety-related indicators.
 */
export function makeSafetyContext(partial: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext {
  const safetyDefaults: Partial<AnalyzedPromptDataContext> = {
    promptText: 'How to protect personal information online and avoid scams?',
    lengthWords: 9,
    lengthChars: 54,
    biasRiskIndicators: [],
    restrictedContentIndicators: [],
    misusePatternIndicators: [],
    highPrivilegeDescriptions: [],
    cumulativeRiskScore: 0,
    riskAssessmentLevel: RiskAssessmentLevel.LOW,
    explicitlyStatesGoal: true,
    actionVerbDetails: {
      count: 1,
      verbs: ['protect']
    }
  };

  return makeContext({ ...safetyDefaults, ...partial });
}

/**
 * Fixture for clarity-focused test scenarios.
 * Pre-configured with clarity-related metrics and issues.
 */
export function makeClarityContext(partial: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext {
  const clarityDefaults: Partial<AnalyzedPromptDataContext> = {
    promptText: 'Please do the thing with the stuff using methods.',
    lengthWords: 10,
    lengthChars: 73,
    readabilityScore: 6.2,
    averageSentenceLength: 14,
    complexSentenceCount: 1,
    lexicalDiversityScore: 0.85,
    clarityIssuesFound: [
      {
        matchedText: 'the thing',
        matchedPatternSource: 'vague-term',
        reason: 'Vague term detected that may cause confusion.',
        severity: SeverityLevel.MEDIUM,
        startIndex: 15,
        endIndex: 24
      },
      {
        matchedText: 'the stuff',
        matchedPatternSource: 'vague-term',
        reason: 'Vague term detected that may cause confusion.',
        severity: SeverityLevel.MEDIUM,
        startIndex: 31,
        endIndex: 40
      }
    ],
    explicitlyStatesGoal: false,
    actionVerbDetails: {
      count: 1,
      verbs: ['explain']
    }
  };

  return makeContext({ ...clarityDefaults, ...partial });
}

/**
 * Fixture for structure-focused test scenarios.
 * Pre-configured with structural elements and formatting.
 */
export function makeStructureContext(partial: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext {
  const structureDefaults: Partial<AnalyzedPromptDataContext> = {
    promptText: 'Create a detailed report in JSON format with the following sections:\n1. Introduction\n2. Analysis\n3. Conclusion',
    lengthWords: 17,
    lengthChars: 108,
    instructionsAndStructure: {
      explicitFormatRequests: [
        {
          matchedText: 'JSON format',
          matchedPatternSource: 'format-request',
          reason: 'Explicit format request detected.',
          severity: SeverityLevel.LOW,
          startIndex: 30,
          endIndex: 41
        }
      ],
      requestsSpecificFormat: null,
      bulletPointUsage: {
        detected: true,
        count: 3
      },
      sectionCount: 3,
      exampleDetails: [],
      placeholderDetails: [],
      toneStyleGuidance: [],
      stepMarkerDetails: []
    },
    specificityElements: {
      outputLengthConstraints: [],
      keyEntitiesFound: [
        {
          matchedText: 'report',
          matchedPatternSource: 'entity',
          reason: 'Key entity identified.',
          severity: SeverityLevel.LOW,
          startIndex: 17,
          endIndex: 23
        }
      ],
      constraintsMentioned: [],
      outputFormatKeywords: [
        {
          matchedText: 'JSON',
          matchedPatternSource: 'format-keyword',
          reason: 'Output format keyword detected.',
          severity: SeverityLevel.LOW,
          startIndex: 30,
          endIndex: 34
        }
      ]
    },
    explicitlyStatesGoal: true,
    actionVerbDetails: {
      count: 1,
      verbs: ['Create']
    }
  };

  return makeContext({ ...structureDefaults, ...partial });
}

/**
 * Fixture for context-rich test scenarios.
 * Pre-configured with context indicators and background information.
 */
export function makeContextRichContext(partial: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext {
  const contextDefaults: Partial<AnalyzedPromptDataContext> = {
    promptText: 'Given the recent market volatility and upcoming earnings season, analyze the performance of tech stocks for institutional investors.',
    lengthWords: 19,
    lengthChars: 135,
    contextIndicatorsFound: [
      {
        matchedText: 'Given the recent',
        matchedPatternSource: 'context-indicator',
        reason: 'Context introduction phrase detected.',
        severity: SeverityLevel.LOW,
        startIndex: 0,
        endIndex: 16
      }
    ],
    specificityElements: {
      outputLengthConstraints: [],
      definedPersonaInfo: [],
      keyEntitiesFound: [
        {
          matchedText: 'market volatility',
          matchedPatternSource: 'entity',
          reason: 'Key entity identified.',
          severity: SeverityLevel.LOW,
          startIndex: 17,
          endIndex: 34
        },
        {
          matchedText: 'tech stocks',
          matchedPatternSource: 'entity',
          reason: 'Key entity identified.',
          severity: SeverityLevel.LOW,
          startIndex: 85,
          endIndex: 96
        }
      ],
      constraintsMentioned: [],
      outputFormatKeywords: []
    },
    mentionsTargetAudience: true,
    explicitlyStatesGoal: true,
    actionVerbDetails: {
      count: 1,
      verbs: ['analyze']
    }
  };

  return makeContext({ ...contextDefaults, ...partial });
}

/**
 * Helper to create a DetectedPatternInfo for test scenarios.
 */
import { PatternWithMetadata, AllPatternMetadata } from '@/lib/types/patterns';

export function makeDetectedPattern(
  matchedText: string,
  reason: string,
  severity: SeverityLevel = SeverityLevel.LOW,
  startIndex: number = 0,
  metadata?: AllPatternMetadata
): DetectedPatternInfo {
  let matchedPatternSource: string | PatternWithMetadata = 'test-pattern';
  if (metadata) {
    matchedPatternSource = {
      pattern: /.*/,
      reason,
      severity,
      metadata,
    };
  }
  return {
    matchedText,
    matchedPatternSource,
    reason,
    severity,
    startIndex,
    endIndex: startIndex + matchedText.length
  };
}

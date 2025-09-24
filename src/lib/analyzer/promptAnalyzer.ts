// src/lib/analyzer/promptAnalyzer.ts
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

  import {
    AnalyzedPromptDataContext,
  } from '@/lib/types/promptAnalysis';
  
  import {
    RiskAssessmentLevel,
    SeverityLevel
  } from '@/lib/types/shared';

  import { DetectedPatternInfo } from '@/lib/types/patterns';

  import {
    VAGUE_TERMS_PATTERNS, JARGON_PATTERNS, NEGATIVE_INSTRUCTION_PATTERNS,
    ACTION_VERB_KEYWORDS, OUTPUT_FORMAT_KEYWORDS_MAP, EXPLICIT_FORMAT_REQUEST_PATTERNS,
    EXAMPLE_PATTERNS, PLACEHOLDER_PATTERNS, TONE_STYLE_KEYWORD_PATTERNS,
    PERSONA_PHRASES_PATTERNS, CONTEXT_INDICATOR_PATTERNS,
    POTENTIALLY_BIASED_TERMS_PATTERNS, RESTRICTED_KEYWORDS_PATTERNS,
    HIGH_PRIVILEGE_PHRASES_PATTERNS, TIER1_MALICIOUS_PATTERNS,
    TIER2_SUSPICIOUS_PATTERNS, TIER3_CONTEXTUAL_PATTERNS,
    AUDIENCE_DEFINITION_PATTERNS, EXPLICIT_GOAL_PATTERNS,
    GENERAL_CONSTRAINT_PATTERNS, STEP_MARKER_PATTERNS,
    EXAMPLE_INSTRUCTION_PATTERNS, MANIPULATION_PATTERNS, COERCION_PATTERNS,
    PRIVACY_VIOLATION_PATTERNS, DANGEROUS_BEHAVIOR_PATTERNS, EXTERNAL_REFERENCE_PATTERNS
  } from '@/lib/config/keywords';

  import {
      preProcessTextForSentenceAnalysis,
      countWords, countSentences, calculateReadabilityScore, processPatternList,
      extractAllLengthConstraints, extractOutputLengthConstraint, findKeyEntitiesHeuristic, countDistinctActionVerbs, 
      calculateBasicLexicalDiversity, analyzeQuestions, detectOutputFormatKeywords,
      getNounVerbBalance
    } from '@/lib/utils/textAnalysisUtils';

  import {
    hasConfidentPatternMatch,
    hasMultiplePatternMatchesAtSeverity
  } from '@/lib/agent-utils/scoring/severityManagement';

  import { computeSafetyRisk } from '@/lib/utils/safetyRisk';
  
  import { filterOverlappingMatches } from '@/lib/utils/filterMatchUtils';
  
  import {
    LIST_BULLET_ITEM_REGEX, 
    SECTION_INDICATOR_REGEXES
  } from '@/lib/config/regex/promptAnalysisRegex';
  import { AllPatternMetadata  } from '@/lib/types/patterns';
  import { isPatternMetadataOfType, extractPatternMetadata, parseNestedSteps } from '@/lib/agent-utils/patterns';


  const nlp = winkNLP(model);

  export const analyzePromptText = (promptText: string): AnalyzedPromptDataContext => {
    const cleanedText = promptText.trim();
    const lowerCaseText = cleanedText.toLowerCase();
    const textForSentenceDocCreation = preProcessTextForSentenceAnalysis(cleanedText); 

    const doc = nlp.readDoc(textForSentenceDocCreation);

    // --- Calculate Initial Base Metrics First ---
    const lengthCharsVal = cleanedText.length; 
    const lengthWordsVal = countWords(cleanedText);
    const sentenceAnalysisResult = countSentences(cleanedText, doc);
    const numSentencesVal = sentenceAnalysisResult.count;
    const actualSentencesArray = sentenceAnalysisResult.sentences;

  let calculatedReadabilityScore = calculateReadabilityScore(cleanedText, lengthWordsVal, numSentencesVal);
  // Presentation consumers expect ARI >= 1; clamp here for analyzer-level context
  if (typeof calculatedReadabilityScore === 'number' && calculatedReadabilityScore < 1) calculatedReadabilityScore = 1;
    const calculatedActionVerbDetails = countDistinctActionVerbs(lowerCaseText, ACTION_VERB_KEYWORDS);
    const calculatedAvgSentenceLength = numSentencesVal > 0 ? parseFloat((lengthWordsVal / numSentencesVal).toFixed(2)) : null;
    const calculatedLexicalDiversity = calculateBasicLexicalDiversity(cleanedText);
    const nounVerbBalanceData = getNounVerbBalance(cleanedText);
  
    let calculatedComplexSentenceCount = 0;
    if (actualSentencesArray && actualSentencesArray.length > 0) {
      actualSentencesArray.forEach(sentence => {
          // Use a defined threshold, e.g., > 15 words for complex as per test comment
          if (sentence.wordCount > 15) { // Using the pre-calculated wordCount
            calculatedComplexSentenceCount++;
          }
      });
    }

    // --- Initialize AnalyzedPromptDataContext with defaults ---
    const context: AnalyzedPromptDataContext = {
      promptText: cleanedText,
      lengthChars: lengthCharsVal,     // Assign calculated value
      lengthWords: lengthWordsVal,     // Assign calculated value
  
      // Clarity & Purpose related
      clarityIssuesFound: [],
      readabilityScore: calculatedReadabilityScore,
      averageSentenceLength: calculatedAvgSentenceLength, 
      complexSentenceCount: calculatedComplexSentenceCount,        
      lexicalDiversityScore: calculatedLexicalDiversity,
      // Provide noun/verb balance ratio for downstream agents (tests expect this value)
      nounVerbBalanceRatio: nounVerbBalanceData.ratio,
      nounCount: nounVerbBalanceData.nounCount,
      verbCount: nounVerbBalanceData.verbCount,
      explicitlyStatesGoal: false,
      actionVerbDetails: calculatedActionVerbDetails,
      negativeInstructionIssues: [],
      contradictoryStatementFlags: [],
      specificityElements: {
        outputLengthConstraints: [],
        definedPersonaInfo: [],
        keyEntitiesFound: [],
        constraintsMentioned: [],
        outputFormatKeywords: [],
        exampleInstructions: [],
      },
      questionDetails: analyzeQuestions(promptText),
  
      // Instructions & Structure related
      instructionsAndStructure: {
        explicitFormatRequests: [],
        requestsSpecificFormat: null,
        bulletPointUsage: {
          detected: false, // Default to false
          // count is undefined by default, only set if detected
        },
        sectionCount: 0,
        exampleDetails: [],
        placeholderDetails: [],
        toneStyleGuidance: [],
        stepMarkerDetails: [],
      },
  
      // Context & Content Richness related
      contextIndicatorsFound: [],
  
      // Safety & Ethics related
      biasRiskIndicators: [],
      restrictedContentIndicators: [],
      misusePatternIndicators: [],
      highPrivilegeDescriptions: [],
      manipulationIndicators: [],
      cumulativeRiskScore: 0,
      riskAssessmentLevel: RiskAssessmentLevel.LOW,
      privacyViolationIndicators: [],
      dangerousBehaviorIndicators: [],

      //fields for audience analysis
      audienceDetails: [], 
      hasConfidentAudienceMention: false,
      mentionsTargetAudience: false,
    };
  
    // --- Populate remaining fields based on analysis ---
  
    // == Clarity & Purpose Category Fields ==
    if (context.clarityIssuesFound) {
      context.clarityIssuesFound.push(...processPatternList(lowerCaseText, VAGUE_TERMS_PATTERNS));
      context.clarityIssuesFound.push(...processPatternList(cleanedText, JARGON_PATTERNS));
    }
    
  
    // Calculate complexSentenceCount
    if (numSentencesVal > 0) { // Use numSentencesVal
      cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0).forEach(sentence => {
          if (countWords(sentence.trim()) > 20) {
              context.complexSentenceCount = (context.complexSentenceCount ?? 0) + 1;
          }
      });
    }
    

    // 8. Audience details
    const audienceMatches = processPatternList(
      cleanedText, // Use the full, cleaned text
      AUDIENCE_DEFINITION_PATTERNS
    );
    context.audienceDetails = audienceMatches;
    // The main flag is now based on whether any high- or medium-confidence patterns were found.
    // We can be less certain about the lower-confidence keywords on their own.
    const confidentMention = hasConfidentPatternMatch(audienceMatches);
  const multipleLowConfidence = hasMultiplePatternMatchesAtSeverity(audienceMatches, SeverityLevel.LOW, 2);
    context.hasConfidentAudienceMention = confidentMention;
    context.mentionsTargetAudience = confidentMention || multipleLowConfidence;

    // mentionsExternalReference
    const externalRefMatches = processPatternList(lowerCaseText, EXTERNAL_REFERENCE_PATTERNS);
    if (externalRefMatches.length > 0) {
      context.mentionsExternalReference = true;
    }
    
    // == Goal Alignment related population ==
    // Initial determination of explicitlyStatesGoal
    const currentActionVerbCount = context.actionVerbDetails?.count ?? 0;
    const currentQuestionCount = context.questionDetails?.count ?? 0;
    if (currentActionVerbCount > 0) {
      context.explicitlyStatesGoal = true;
    }
    const explicitGoalMatches = processPatternList(lowerCaseText, EXPLICIT_GOAL_PATTERNS);
    if (explicitGoalMatches.length > 0) {
      context.explicitlyStatesGoal = true;
    }
    if (!context.explicitlyStatesGoal && currentQuestionCount > 0 && currentActionVerbCount === 0){
      context.explicitlyStatesGoal = false; // Re-evaluate if only questions
    }

    if (context.negativeInstructionIssues) {
      context.negativeInstructionIssues.push(...processPatternList(lowerCaseText, NEGATIVE_INSTRUCTION_PATTERNS));
    }
  
    if (context.specificityElements) {
      context.specificityElements.outputLengthConstraints = extractAllLengthConstraints(cleanedText);
      // Also set a single preferred outputLengthConstraint for easier consumption by callers/tests
      // This uses the convenience wrapper which prefers numeric constraints when present
      // Note: The property is added dynamically to avoid changing the shared type here.
      // @ts-ignore-next-line
      context.specificityElements.outputLengthConstraint = extractOutputLengthConstraint(cleanedText);

      if (context.specificityElements.definedPersonaInfo) {
        context.specificityElements.definedPersonaInfo.push(...processPatternList(cleanedText, PERSONA_PHRASES_PATTERNS));
      }
      
      if (context.specificityElements.keyEntitiesFound) {
        context.specificityElements.keyEntitiesFound.push(...findKeyEntitiesHeuristic(cleanedText));
      }

      if (context.specificityElements.constraintsMentioned) {
        context.specificityElements.constraintsMentioned.push(...processPatternList(cleanedText, GENERAL_CONSTRAINT_PATTERNS));
      }

      if (context.specificityElements.outputFormatKeywords) {
        context.specificityElements.outputFormatKeywords = detectOutputFormatKeywords(
          lowerCaseText,
          OUTPUT_FORMAT_KEYWORDS_MAP 
        );
      }
      
      // Add exampleInstructions to specificityElements (for clarity agent)
      if (context.specificityElements.exampleInstructions) {
        context.specificityElements.exampleInstructions = processPatternList(
          cleanedText,
          EXAMPLE_INSTRUCTION_PATTERNS
        );
      }

    }

    // --- Populate fields within instructionsAndStructure ---

    // 1. explicitFormatRequests
    const rawExplicitFormatRequests = processPatternList(
      cleanedText,
      EXPLICIT_FORMAT_REQUEST_PATTERNS
    );
    context.instructionsAndStructure.explicitFormatRequests = filterOverlappingMatches(rawExplicitFormatRequests);

    // 2. requestsSpecificFormat (derived from explicitFormatRequests)
    const detectedFormatRequests = context.instructionsAndStructure.explicitFormatRequests;

    if (detectedFormatRequests.length > 0) {
      const firstMatch = detectedFormatRequests[0];
      const fallbackText = firstMatch.matchedText ?? 'unknown_match_text';

      // Ensure matchedPatternSource is an object and metadata exists
      if (typeof firstMatch.matchedPatternSource === 'object' && firstMatch.matchedPatternSource.metadata) {
        const metadata = extractPatternMetadata(firstMatch);
        if (isPatternMetadataOfType(metadata, 'format')) {
          // TypeScript now knows metadata is AllPatternMetadata with type 'format'
          context.instructionsAndStructure.requestsSpecificFormat = (metadata as AllPatternMetadata).formatType;
        } else if ('type' in metadata!) {
          context.instructionsAndStructure.requestsSpecificFormat = `unexpected_metadata_type: ${metadata.type}`;
        } else {
          context.instructionsAndStructure.requestsSpecificFormat = `no_type_property_in_metadata`;
        }
      } else {
        // Fallback if metadata is not as expected
        context.instructionsAndStructure.requestsSpecificFormat = `no_canonical_format_detected: ${fallbackText.substring(0, 30)}`;
      }
    } else {
      // Additional fallback: check for common format keywords in output format keywords
      const outputFormatKeywords = context.specificityElements?.outputFormatKeywords || [];
      if (outputFormatKeywords.length > 0) {
        // Extract the format type from the first detected pattern
        const firstFormatPattern = outputFormatKeywords[0];
        const metadata = extractPatternMetadata(firstFormatPattern);
        if (isPatternMetadataOfType(metadata, 'format')) {
          context.instructionsAndStructure.requestsSpecificFormat = (metadata as AllPatternMetadata).formatType;
        } else {
          // Fallback to the matched text if metadata is not available
          context.instructionsAndStructure.requestsSpecificFormat = firstFormatPattern.matchedText || 'detected_format';
        }
      }
    }

    // 3. bulletPointUsage
    const promptLines = context.promptText.split('\n');
    let bulletPointItemsFound = 0;
    for (const line of promptLines) {
      if (LIST_BULLET_ITEM_REGEX.test(line)) { 
        bulletPointItemsFound++;
      }
    }

    context.instructionsAndStructure.bulletPointUsage.detected = bulletPointItemsFound > 0;
    if (bulletPointItemsFound > 0) {
      context.instructionsAndStructure.bulletPointUsage.count = bulletPointItemsFound;
    } 

    // 4. sectionCount 
    let sectionsFound = 1;
    for (const line of promptLines) {
      for (const sectionRegex of SECTION_INDICATOR_REGEXES) {
        if (sectionRegex.test(line)) {
          sectionsFound++;
          break;
        }
      }
    }
    context.instructionsAndStructure.sectionCount = sectionsFound;

    // 5. exampleDetails (only true few-shot examples)
    context.instructionsAndStructure.exampleDetails = processPatternList(
      cleanedText,
      EXAMPLE_PATTERNS
    );

    // 6. placeholderDetails 
    context.instructionsAndStructure.placeholderDetails = processPatternList(
      cleanedText,
      PLACEHOLDER_PATTERNS 
    );

    // 7. toneStyleGuidance
    const rawToneGuidance = processPatternList(
      cleanedText,
      TONE_STYLE_KEYWORD_PATTERNS
    );
    context.instructionsAndStructure.toneStyleGuidance = filterOverlappingMatches(rawToneGuidance);

    // 8. stepMarkerDetails 
    context.instructionsAndStructure.stepMarkerDetails = processPatternList(
      cleanedText,
      STEP_MARKER_PATTERNS
    );

    // 9. nestedStepStructure (derived from stepMarkerDetails)
    try {
      context.instructionsAndStructure.nestedStepStructure = parseNestedSteps(context.instructionsAndStructure.stepMarkerDetails);
    } catch (err) {
      // Fallback: do not set if utility is missing or errors
      context.instructionsAndStructure.nestedStepStructure = undefined;
    }
    // --- END Populate fields within instructionsAndStructure ---
    
    if (context.contextIndicatorsFound) {
      context.contextIndicatorsFound.push(...processPatternList(cleanedText, CONTEXT_INDICATOR_PATTERNS));
    }
    
    if (context.biasRiskIndicators) {
      context.biasRiskIndicators.push(...processPatternList(lowerCaseText, POTENTIALLY_BIASED_TERMS_PATTERNS));
    }
    
    if (context.restrictedContentIndicators) {
      context.restrictedContentIndicators.push(...processPatternList(lowerCaseText, RESTRICTED_KEYWORDS_PATTERNS));
    }
    
    if (context.highPrivilegeDescriptions) {
      context.highPrivilegeDescriptions.push(...processPatternList(cleanedText, HIGH_PRIVILEGE_PHRASES_PATTERNS));
    }
    
    if (context.misusePatternIndicators) {
      context.misusePatternIndicators.push(...processPatternList(cleanedText, TIER1_MALICIOUS_PATTERNS));
      context.misusePatternIndicators.push(...processPatternList(cleanedText, TIER2_SUSPICIOUS_PATTERNS));
      context.misusePatternIndicators.push(...processPatternList(cleanedText, TIER3_CONTEXTUAL_PATTERNS));
    }
    
    // --- Step 1.6: Populate Safety & Ethics risk scores ---
    const allSafetyDetections: DetectedPatternInfo[] = [
      ...(context.biasRiskIndicators || []),
      ...(context.restrictedContentIndicators || []),
      ...(context.highPrivilegeDescriptions || []),
      ...(context.misusePatternIndicators || []),
    ];

    const risk = computeSafetyRisk(allSafetyDetections);
    context.cumulativeRiskScore = risk.cumulativeRiskScore;
    context.riskAssessmentLevel = risk.riskAssessmentLevel;

    // Process manipulation and coercion patterns
    if (context.manipulationIndicators) {
      context.manipulationIndicators.push(...processPatternList(cleanedText, MANIPULATION_PATTERNS));
      context.manipulationIndicators.push(...processPatternList(cleanedText, COERCION_PATTERNS));
    }

    if (context.privacyViolationIndicators) {
      context.privacyViolationIndicators.push(...processPatternList(cleanedText, PRIVACY_VIOLATION_PATTERNS));
    }

    context.dangerousBehaviorIndicators = [];
    context.dangerousBehaviorIndicators.push(...processPatternList(cleanedText, DANGEROUS_BEHAVIOR_PATTERNS));

    return context;
  };
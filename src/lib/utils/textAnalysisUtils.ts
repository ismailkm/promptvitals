// src/lib/utils/textAnalysisUtils.ts

import winkNLP, { Document } from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

import { PatternWithMetadata, DetectedPatternInfo, SentenceAnalysisResult, WinkSentence, LengthConstraintPatternMetadata } from '@/lib/types/patterns'; 
import { OutputLengthConstraintType,
            VALID_NUMERIC_LENGTH_UNITS_RAW,
            VALID_NUMERIC_LENGTH_UNITS_NORMALIZED,
            VALID_QUALITATIVE_LENGTH_TYPES_RAW,
            VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED,
            QUALITATIVE_LENGTH_NORMALIZATION_MAP,
            SPECIFIC_VALUE_TYPE_CONST,
        } from '@/lib/types/outputLength'; 
import { LengthConstraintModifier } from '@/lib/types/metadataTypes';
import { SeverityLevel } from '@/lib/types/shared';
import { QuestionInfo } from '@/lib/types/promptAnalysis';

import { WH_QUESTION_WORDS, YES_NO_AUXILIARY_VERBS, ABBREVIATIONS_WITH_INTERNAL_DOTS_TO_PROTECT, OUTPUT_FORMAT_KEYWORDS_MAP } from '@/lib/config/keywords';
import { filterOverlappingMatches } from './filterMatchUtils';

const nlp = winkNLP(model);
const { its } = nlp;
type WinkDoc = Document;
export const DOT_PLACEHOLDER = '@@DOT@@'; 
// Utility to escape arbitrary strings for safe use in RegExp construction
const escapeForRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * counts words in a given text using a regex.
 * @param text 
 * @returns the number of words
 */
export const countWords = (text: string): number => {
    if (!text || text.trim() === '') return 0;
    const words = text.match(/\b[\p{L}\p{N}\$%]+(?:[\-']?[\p{L}\p{N}\$%]+)*(?:\.[\p{L}\p{N}\$%]+)*\b/gu); 
    return words ? words.length : 0;
};

/**
 * Extracts sentences from a pre-processed wink-nlp document.
 * @param originalTextTrimmed The original trimmed text (used for the fallback case if no sentences found).
 * @param doc The wink-nlp document object, created from text that has had non-sentence dots protected.
 * @returns An object containing the sentence count and an array of sentence strings.
 */
export const countSentences = (
    originalTextTrimmed: string, 
    doc: WinkDoc | null
): SentenceAnalysisResult => {
    if (!doc) {
        if (originalTextTrimmed.length > 0) return { count: 1, sentences: [{ text: originalTextTrimmed, wordCount: countWords(originalTextTrimmed) }] };
        return { count: 0, sentences: [] };
    }

    const winkSentencesCollection = doc.sentences(); 
    const finalSentences: WinkSentence[] = [];

    winkSentencesCollection.each((sentenceItem: any) => { 
  const sentenceText = sentenceItem.out().replace(new RegExp(DOT_PLACEHOLDER, 'g'), '.').trim();

        // Ensure the sentence is not empty or just punctuation
        if (sentenceText.length > 0 && /[a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF]/.test(sentenceText)) {
            const sentenceWordCount = countWords(sentenceText); 
            finalSentences.push({
                text: sentenceText,
                wordCount: sentenceWordCount,
            });
        }
    });

    if (finalSentences.length === 0 && originalTextTrimmed.length > 0) {
      const fallbackWordCount = countWords(originalTextTrimmed);
      return { count: 1, sentences: [{ text: originalTextTrimmed, wordCount: fallbackWordCount}] };
    }

    return { count: finalSentences.length, sentences: finalSentences };
};

/**
 * Counts characters in a text, typically excluding spaces for some readability formulas,
 * but ARI often uses all alphanumeric characters or total characters.
 * For ARI, we need a count of letters and numbers.
 * @param text The text to analyze.
 * @returns The number of alphanumeric characters.
 */
export const countAlphanumericChars = (text: string): number => {
    if (!text) return 0;
  // Count all alphanumeric characters (letters and numbers) using Unicode-aware classes
  const matches = text.match(/[\p{L}\p{N}]/gu);
    return matches ? matches.length : 0;
};

/**
 * Calculates the Automated Readability Index (ARI).
 * ARI estimates the US grade level needed to comprehend the text.
 * Lower ARI = easier to read.
 * Formula: 4.71 * (alphanumeric_chars / words) + 0.5 * (words / sentences) - 21.43
 * @param text The original text to analyze (used for character count).
 * @param wordCount Pre-calculated word count.
 * @param sentenceCount Pre-calculated sentence count.
 * @returns An ARI score (typically ranging from ~1 to ~20+), or null if not calculable.
 */
export const calculateReadabilityScore = (
    text: string,
    wordCount: number,
    sentenceCount: number
): number | null => {
  if (wordCount === 0 || sentenceCount === 0) {
    // If there are no words or no sentences, readability is undefined or can be considered perfect/irrelevant for an empty prompt
    // For an empty prompt (wordCount=0, sentenceCount=0), returning null is appropriate.
    // If text has words but sentenceCount is 0 (e.g. unpunctuated fallback to 1 sentence), then it's calculable.
    // Let's refine this: if text has content but sentenceCount became 0 (shouldn't happen with fallback), then null.
    // The main check is division by zero.
    if (wordCount === 0 && sentenceCount === 0 && text.trim() === '') return null; // Truly empty
    if (wordCount === 0 || sentenceCount === 0) return null; // Avoid division by zero if either is zero but not both (for safety)
  }

  const alphanumericCharCount = countAlphanumericChars(text);
  if (alphanumericCharCount === 0 && wordCount > 0) {
    // Has words, but no alphanumeric characters (e.g., prompt is just punctuation)
    // This scenario is unlikely to give a meaningful ARI. Could return null or a very high (bad) ARI.
    return null;
  }
  if (alphanumericCharCount === 0 && wordCount === 0) return null; // Still no content

  const charsPerWord = alphanumericCharCount / wordCount;
  const wordsPerSentence = wordCount / sentenceCount;

  let ariScore = 4.71 * charsPerWord + 0.5 * wordsPerSentence - 21.43;

  // ARI scores are typically rounded.
  ariScore = parseFloat(ariScore.toFixed(1));

  // ARI scores can sometimes be negative for very simple text.
  // We clamp at a minimum (e.g., 1st grade level) or return the raw score if preferred for later mapping.
  // For direct use as a "readability score" where higher is "harder", this is fine.
  // If you want a 0-100 scale where higher is "easier", you'd need to invert and scale this.
  // For now, returning the raw (clamped) ARI grade level.
  // ARI scores are typically rounded. Return the raw rounded ARI; callers may clamp/present differently.
  return ariScore;
};


/**
 * Processes a list of patterns with metadata against a text and returns detected info,
 * including start and end indices for each match.
 * @param textToAnalyze The text to scan.
 * @param patternsWithMetadata Array of patterns with their reason and severity.
 * @returns An array of DetectedPatternInfo objects for all matches.
 */
export const processPatternList = (
  textToAnalyze: string,
  patternsWithMetadata: PatternWithMetadata[],
): DetectedPatternInfo[] => {
  const detectedItems: DetectedPatternInfo[] = [];
  if (!textToAnalyze || !patternsWithMetadata || patternsWithMetadata.length === 0) return detectedItems;
  
  patternsWithMetadata.forEach((metaPattern, patternIndex) => {
    try {
        // Ensure the regex is properly formed from the source and flags
        const regex = new RegExp(metaPattern.pattern.source, metaPattern.pattern.flags.includes('g') ? metaPattern.pattern.flags : metaPattern.pattern.flags + 'g');
        const matches = [...textToAnalyze.matchAll(regex)];

        matches.forEach((matchInstance, matchIdx) => {
                const rawMatchText = matchInstance[0];
                const rawStart = matchInstance.index ?? -1;

                // --- Initialize variables for the final output ---
                let finalMatchText = rawMatchText;
                let sIndex = rawStart;
                let eIndex = sIndex + finalMatchText.length;

                // Normalize matched text: trim surrounding whitespace and strip trailing
                // punctuation commonly attached by patterns (commas, colons, periods, semicolons, question marks)
                // Preserve trailing colons (often used in section headers like 'Background:')
                // Only run this block if the pattern does NOT have the 'preserveWhitespace' flag.
                const metadata = metaPattern.metadata;
                const preserveWhitespace = !!(metadata && typeof metadata === 'object' && 'preserveWhitespace' in metadata && (metadata as any).preserveWhitespace);
                if (!preserveWhitespace) {
                  // 1. Your normalization logic is here.
                  let normalized = rawMatchText.trim().replace(/[\s,;\.\?!]+$/u, '');
                  if (!normalized) normalized = rawMatchText.trim();

                  // 2. The index calculation logic that depends on normalization is ALSO here.
                  const innerOffset = rawMatchText.indexOf(normalized);
                  const normalizedStartIndex = rawStart + (innerOffset >= 0 ? innerOffset : 0);

                  // 3. Update our final variables with the new, normalized values.
                  finalMatchText = normalized;
                  sIndex = normalizedStartIndex;
                  eIndex = sIndex + finalMatchText.length;
                }

                detectedItems.push({
                  id: `pattern-${patternIndex}-match-${matchIdx}-${sIndex}`,
                  matchedText: finalMatchText,
                  matchedPatternSource: metaPattern,
                  reason: metaPattern.reason,
                  severity: metaPattern.severity,
                  startIndex: sIndex,
                  endIndex: eIndex,
                });
        });
    } catch (e) {
        console.error(
            `Error processing pattern: ${String(metaPattern?.pattern?.source)} with flags ${String(metaPattern?.pattern?.flags)}`,
            e
        );
    }
  });
  return filterOverlappingMatches(detectedItems);
};


/**
 * Finds ALL numeric and qualitative length constraints in a text and returns them
 * as an array of DetectedPatternInfo objects. This version handles complex phrases
 * like "under 500 words", "at least 10 items", and "between 100 and 200 words".
 *
 * @param text The text to analyze.
 * @returns An array of DetectedPatternInfo objects, each containing detailed metadata.
 */
export const extractAllLengthConstraints = (text: string): DetectedPatternInfo[] => {
  const detectedConstraints: DetectedPatternInfo[] = [];

  // --- 1. Find all NUMERIC constraints with a more powerful regex ---
  const numericUnitsPattern = VALID_NUMERIC_LENGTH_UNITS_RAW.map(escapeForRegex).join('|');
  const modifiersPattern = 'under|over|at least|less than|more than|between|exactly';
  
  // Regex Breakdown:
  // Group 1: Optional modifier (e.g., "under", "between")
  // Group 2: First number (e.g., "350")
  // Group 3: Optional second number for ranges (e.g., "-500" or "and 500")
  // Group 4: The unit (e.g., "words")
  const numericRegex = new RegExp(
    `\\b(${modifiersPattern})?\\s*(\\d+)(?:(?:-|\\s*and\\s*)(\\d+))?\\s*(${numericUnitsPattern})\\b`,
    'gi'
  );

  // Run on the original text so indices align with the original string
  const numericMatches = [...text.matchAll(numericRegex)];

  numericMatches.forEach((match, idx) => {
    const modifier = (match[1] as LengthConstraintModifier | undefined) ?? 'exactly';
    const value1 = parseInt(match[2], 10);
    const value2 = match[3] ? parseInt(match[3], 10) : undefined;
    const unitInput = (match[4] || '').toLowerCase();

    const matchedText = match[0];
    const startIndex = match.index ?? -1;
    const endIndex = startIndex + matchedText.length;

    // --- Normalization Logic (from your version) ---
    let normalizedUnit: string = unitInput.endsWith('s') ? unitInput : unitInput + 's';
    if (!VALID_NUMERIC_LENGTH_UNITS_NORMALIZED.includes(normalizedUnit as any)) {
      normalizedUnit = unitInput; // Fallback if pluralization is not a standard unit
    }

    let typeValue: OutputLengthConstraintType;
    if (VALID_NUMERIC_LENGTH_UNITS_NORMALIZED.includes(normalizedUnit as any)) {
      typeValue = normalizedUnit as OutputLengthConstraintType;
    } else {
      typeValue = SPECIFIC_VALUE_TYPE_CONST;
    }

    // --- Create the new, richer metadata object ---
    const numericMetadata: LengthConstraintPatternMetadata = {
      type: 'length_constraint',
      constraintType: 'numeric',
      normalizedType: typeValue,
      value: value1,
      maxValue: value2, // Will be undefined if not a range
      unit: (typeValue !== SPECIFIC_VALUE_TYPE_CONST) ? normalizedUnit : unitInput,
      modifier: modifier,
    };

    const sourcePatternMeta: PatternWithMetadata = {
      pattern: numericRegex,
      reason: "Numeric length constraint detected.",
      severity: SeverityLevel.LOW,
      metadata: numericMetadata,
    };

    detectedConstraints.push({
      id: `len-num-${idx}-${startIndex}`,
      matchedText,
      reason: sourcePatternMeta.reason,
      severity: sourcePatternMeta.severity,
      matchedPatternSource: sourcePatternMeta,
      startIndex,
      endIndex,
    });
  });

  // --- 2. Find all QUALITATIVE constraints ---
  const qualitativeUnitsPattern = VALID_QUALITATIVE_LENGTH_TYPES_RAW.map(escapeForRegex).join('|');
  const qualitativeConstraintRegex = new RegExp(`\\b(${qualitativeUnitsPattern})\\b`, 'gi');
  const qualitativeMatches = [...text.matchAll(qualitativeConstraintRegex)];

  qualitativeMatches.forEach((match, idx) => {
    const matchedText = match[0];
    const startIndex = match.index ?? -1;
    const endIndex = startIndex + matchedText.length;
    let typeValueStr = (match[1] || '').toLowerCase();
    typeValueStr = QUALITATIVE_LENGTH_NORMALIZATION_MAP[typeValueStr] || typeValueStr;

    if (VALID_QUALITATIVE_LENGTH_TYPES_NORMALIZED.includes(typeValueStr as any)) {
      const qualitativeMetadata: LengthConstraintPatternMetadata = {
        type: 'length_constraint',
        constraintType: 'qualitative',
        normalizedType: typeValueStr as OutputLengthConstraintType,
      };

      const sourcePatternMeta: PatternWithMetadata = {
        pattern: qualitativeConstraintRegex,
        reason: "Qualitative length constraint detected.",
        severity: SeverityLevel.LOW,
        metadata: qualitativeMetadata,
      };

      detectedConstraints.push({
        id: `len-qual-${idx}-${startIndex}`,
        matchedText,
        reason: sourcePatternMeta.reason,
        severity: sourcePatternMeta.severity,
        matchedPatternSource: sourcePatternMeta,
        startIndex,
        endIndex,
      });
    }
  });

  // --- 3. Return all found constraints ---
  return detectedConstraints.sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * Convenience wrapper that returns a single normalized output length constraint
 * or null when none found. It prefers numeric constraints when present and
 * falls back to qualitative constraints.
 */
export const extractOutputLengthConstraint = (text: string) => {
  const constraints = extractAllLengthConstraints(text || '');
  if (!constraints || constraints.length === 0) return null;

  // Prefer numeric constraints
  const numeric = constraints.find(c => typeof c.matchedPatternSource !== 'string' && (c.matchedPatternSource?.metadata as any)?.constraintType === 'numeric');
  if (numeric) {
    const md = (typeof numeric.matchedPatternSource !== 'string' ? numeric.matchedPatternSource.metadata : undefined) as any;
    return {
      type: md.normalizedType || md.unit,
      value: md.value,
      unit: md.unit,
      modifier: md.modifier,
      patternInfo: numeric,
    };
  }

  // Fallback to qualitative
  const qual = constraints.find(c => typeof c.matchedPatternSource !== 'string' && (c.matchedPatternSource?.metadata as any)?.constraintType === 'qualitative');
  if (qual) {
    const md = (typeof qual.matchedPatternSource !== 'string' ? qual.matchedPatternSource.metadata : undefined) as any;
    const start = qual.startIndex ?? -1;
    const end = qual.endIndex ?? (start + (qual.matchedText?.length || 0));
    return {
      type: md.normalizedType || (qual.matchedText || '').toLowerCase(),
      patternInfo: {
        id: `len-qual-${start}`,
        matchedText: (qual.matchedText || '').toLowerCase(),
        reason: `Qualitative length constraint '${(qual.matchedText || '').toLowerCase()}' detected.`,
        severity: qual.severity,
        matchedPatternSource: qual.matchedPatternSource,
        startIndex: start,
        endIndex: end,
      },
    };
  }

  return null;
};


/**
 * A multi-strategy heuristic to find key entities, topics, and proper nouns in a text.
 * It uses three methods:
 * 1.  Detects capitalized words/phrases (Proper Nouns).
 * 2.  Detects noun phrases following key contextual keywords (e.g., "focus on", "about").
 * 3.  Detects terms enclosed in double quotes.
 *
 * @param text The text to analyze.
 * @returns An array of DetectedPatternInfo objects for all unique identified entities, sorted by position.
 */
export const findKeyEntitiesHeuristic = (text: string): DetectedPatternInfo[] => {
    const entities: DetectedPatternInfo[] = [];
    const foundTexts = new Set<string>(); // Use a Set to prevent adding duplicate entities

    // --- STRATEGY 1: Find Capitalized Proper Nouns ---
    // Looks for sequences of 1-4 capitalized words, excluding common sentence starters.
    const properNounRegex = /(?<!(^|\.\s+))([A-Z][a-zA-Z'-]+)(\s+[A-Z][a-zA-Z'-]+){0,3}\b/g;
    const commonWordsToExclude = new Set(["I", "The", "A", "An", "Is", "Are", "Was", "Were", "He", "She", "It", "They"]);
    
    const properNounMatches = [...text.matchAll(properNounRegex)];
    properNounMatches.forEach((match, idx) => {
        const entityText = match[0].trim();
        if (!commonWordsToExclude.has(entityText.split(' ')[0]) && !foundTexts.has(entityText.toLowerCase())) {
            const startIndex = match.index ?? -1;
            const sourcePatternMeta: PatternWithMetadata = {
                pattern: properNounRegex,
                reason: "Potential key entity (Capitalized Proper Noun).",
                severity: SeverityLevel.LOW,
            };
            entities.push({
                id: `entity-proper-${idx}-${startIndex}`,
                matchedText: entityText,
                reason: sourcePatternMeta.reason,
                severity: sourcePatternMeta.severity,
                matchedPatternSource: sourcePatternMeta,
                startIndex: startIndex,
                endIndex: startIndex + entityText.length,
            });
            foundTexts.add(entityText.toLowerCase());
        }
    });

    // --- STRATEGY 2: Find Noun Phrases After Key Contextual Keywords ---
    // Looks for simple noun phrases (up to 3 words) after specific keywords.
    const keywordContextRegex = /\b(?:focus on|summarizing|benefits of|about|regarding|concerning)\s+((?:[a-z-]+\s+)?(?:[a-z-]+\s+)?[a-z-]+)\b/gi;
    
    const keywordMatches = [...text.matchAll(keywordContextRegex)];
    keywordMatches.forEach((match, idx) => {
        const entityText = match[1].trim(); // Group 1 captures the noun phrase
        if (entityText && !foundTexts.has(entityText.toLowerCase())) {
            // Find the precise start index of the captured group
            const startIndex = (match.index ?? 0) + match[0].lastIndexOf(entityText);
            const sourcePatternMeta: PatternWithMetadata = {
                pattern: keywordContextRegex,
                reason: "Potential key entity (Contextual Keyword).",
                severity: SeverityLevel.LOW,
            };
            entities.push({
                id: `entity-keyword-${idx}-${startIndex}`,
                matchedText: entityText,
                reason: sourcePatternMeta.reason,
                severity: sourcePatternMeta.severity,
                matchedPatternSource: sourcePatternMeta,
                startIndex: startIndex,
                endIndex: startIndex + entityText.length,
            });
            foundTexts.add(entityText.toLowerCase());
        }
    });

    // --- STRATEGY 3: Find Quoted Terms ---
    // Looks for short terms inside double quotes, which often represent key entities or titles.
    const quotedTermRegex = /"([^"]+)"/g;
    const quotedMatches = [...text.matchAll(quotedTermRegex)];
    quotedMatches.forEach((match, idx) => {
        const entityText = match[1].trim();
        // Avoid matching very long quoted sentences.
        if (entityText && entityText.split(' ').length <= 5 && !foundTexts.has(entityText.toLowerCase())) {
            const startIndex = (match.index ?? 0) + 1; // Add 1 to account for the opening quote
            const sourcePatternMeta: PatternWithMetadata = {
                pattern: quotedTermRegex,
                reason: "Potential key entity (Quoted Term).",
                severity: SeverityLevel.LOW,
            };
            entities.push({
                id: `entity-quoted-${idx}-${startIndex}`,
                matchedText: entityText,
                reason: sourcePatternMeta.reason,
                severity: sourcePatternMeta.severity,
                matchedPatternSource: sourcePatternMeta,
                startIndex: startIndex,
                endIndex: startIndex + entityText.length,
            });
            foundTexts.add(entityText.toLowerCase());
        }
    });

    // Sort the final combined list by their appearance in the text
    return entities.sort((a, b) => a.startIndex - b.startIndex);
};

/**
 * Counts distinct action verbs based on a predefined list.
 * @param text The text to analyze (preferably lowercased).
 * @param actionVerbKeywords List of action verbs.
 * @returns Object with count and list of found verbs.
 */
export const countDistinctActionVerbs = (text: string, actionVerbKeywords: string[]): { count: number; verbs: string[] } => {
    const foundVerbs = new Set<string>();
    if (!text || actionVerbKeywords.length === 0) return { count: 0, verbs: [] };

    actionVerbKeywords.forEach(verb => {
        if (new RegExp(`\\b${verb}(s|es|ing|ed|d)?\\b`, 'gi').test(text)) {
            foundVerbs.add(verb);
        }
    });
    return { count: foundVerbs.size, verbs: Array.from(foundVerbs) };
};

/**
 * Calculates a basic lexical diversity score (Type-Token Ratio - TTR) for a given text.
 * TTR is the ratio of unique words (types) to the total number of words (tokens).
 * This implementation is basic: it converts text to lowercase and splits by non-alphanumeric
 * characters to get words. It does not perform stemming or lemmatization, so different forms
 * of the same word (e.g., "run", "running") will be counted as distinct types.
 * A higher score (closer to 1) generally indicates greater vocabulary richness, while a lower
 * score indicates more repetition. The "ideal" score is context-dependent.
 *
 * @param text The input string to analyze for lexical diversity.
 * @returns A number representing the lexical diversity score (typically between 0 and 1),
 *          or null if the text is empty, contains no words, or if calculation is not possible.
 *          The score is formatted to three decimal places.
 */
export const calculateBasicLexicalDiversity = (text: string): number | null => {
    if (!text || !text.trim()) return null; // Handle empty or whitespace-only strings
  
    // Simple tokenization: split by non-word characters and convert to lowercase
    const words = text.toLowerCase().match(/\b\w+\b/g); // Extracts sequences of word characters
  
    if (!words || words.length === 0) return null; // No words found
  
    const uniqueWords = new Set(words);
    const diversity = uniqueWords.size / words.length;
  
    // Return formatted to a reasonable number of decimal places
    return parseFloat(diversity.toFixed(3));
  };

/**
 * Analyzes the text to identify and classify question sentences.
 *
 * @param text The input string to analyze.
 * @returns An object containing the count, identified sentences, and their types.
 */
export const analyzeQuestions = (text: string): QuestionInfo => {
    const result: QuestionInfo = {
        count: 0,
        identifiedQuestionSentences: [],
        types: [],
        questionMarksCount: (text.match(/\?/g) || []).length, // Simple raw count of '?'
    };

    if (!text || text.trim() === '') return result;

    const doc = nlp.readDoc(text); // Use nlpInstance, not just nlp

    doc.sentences().each((sentence: any) => {
        // Correct way to get the last token:
        const tokensCollection = sentence.tokens();
        const numTokens = tokensCollection.length();
        let lastToken: any | null = null;
        if (numTokens > 0) {
            lastToken = tokensCollection.itemAt(numTokens - 1); // Get the last token object
        }
        // To get the first token object:
        let firstToken: any | null = null;
        if (numTokens > 0) {
            firstToken = tokensCollection.itemAt(0); // Get the first token object
        }


        if (lastToken && lastToken.out() === '?') {
            result.identifiedQuestionSentences.push(sentence.out());
            result.count++;
            // Ensure firstToken exists before trying to get its normalized form
            if (firstToken) {
                const firstWord = firstToken.out(its.normal);

                if (WH_QUESTION_WORDS.includes(firstWord)) {
                    result.types.push('wh-question');
                } else if (YES_NO_AUXILIARY_VERBS.includes(firstWord)) {
                    result.types.push('yes/no-question');
                } else {
                    result.types.push('other-question');
                }
            } else {
                // Handle cases where a sentence is just '?' or has no discernible first word
                result.types.push('unclassified-question');
            }
        }
    });

    return result;
};

/**
 * Pre-processes text to protect non-sentence-ending periods and normalize punctuation
 * before sentence tokenization by an NLP library like wink-nlp.
 * @param text The raw text to pre-process.
 * @returns The processed text string.
 */
export const preProcessTextForSentenceAnalysis = (text: string): string => {
    if (!text || text.trim() === '') return '';

    let processedText = text.trim(); // Start with trimmed text

    // 1a. Protect dots in URLs and email addresses first
    // More aggressive replacement of ALL dots within these patterns
    processedText = processedText.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, (match) =>
        match.replace(/\./g, DOT_PLACEHOLDER)
    );
    processedText = processedText.replace(/\b((?:https?:\/\/|ftps?:\/\/|www\.)[^\s/$.?#].[^\s]*)\b/g, (match) =>
        match.replace(/\./g, DOT_PLACEHOLDER)
    );
    // Simpler domain protection (e.g., example.com, sub.example.co.uk)
    // This regex tries to replace dots only between alphanumeric parts of a domain.
    processedText = processedText.replace(/\b([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,6})\b/g, (match) => {
        // Only replace dots if it's not just a TLD like ".com" by itself and has word chars around it
        if (match.match(/[a-zA-Z0-9]\.[a-zA-Z0-9]/)) { // Ensures it's not just ".com"
            return match.replace(/\./g, DOT_PLACEHOLDER);
        }
        return match;
    });
    // Catch remaining simple domain.tld cases
    processedText = processedText.replace(/\b([a-zA-Z0-9-]+)\.([a-zA-Z]{2,6})\b/g, (match, p1, p2) => {
        // Ensure this doesn't mess with already processed abbreviations like U.S. if they end up here
        // This might need to be more careful or come before abbreviation protection.
        // For now, simple replacement.
        if (!ABBREVIATIONS_WITH_INTERNAL_DOTS_TO_PROTECT.includes(match)) { // Avoid re-processing things that are exactly an abbreviation
            return `${p1}${DOT_PLACEHOLDER}${p2}`;
        }
        return match;
    });


    // 1b. Protect periods in decimal numbers
    processedText = processedText.replace(/(\d)\.(\d)/g, `$1${DOT_PLACEHOLDER}$2`);

    // 1c. Protect internal dots of specific abbreviations from the curated list
    ABBREVIATIONS_WITH_INTERNAL_DOTS_TO_PROTECT.forEach((abbr) => {
        // Escape special regex characters in the abbreviation
        const escapedAbbr = abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Regex to match the whole word abbreviation
        const abbrRegex = new RegExp(`\\b${escapedAbbr}\\b`, 'g');
        processedText = processedText.replace(abbrRegex, (match) => {
            // Replace all dots WITHIN the matched abbreviation string
            return match.replace(/\./g, DOT_PLACEHOLDER);
        });
    });

    // 1d. Normalize ellipses and multiple sentence terminators
    processedText = processedText.replace(/\s*\.{3,}\s*/g, '. '); // Ellipses -> period + space
    processedText = processedText.replace(/([.!?])\1{1,}/g, '$1');  // "!!!" -> "!", "??" -> "?"

    // 1e. Pre-fix for "NoSpaceAfterPeriodBeforeCapital" issue.
    // This helps NLP tokenizers if they struggle with this specific common pattern.
    // REMOVING FOR NOW
    // processedText = processedText.replace(
    //     /(?<!\b[A-Z]{1,4})[.!?]([A-Z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF])/g,
    //     '. $1'
    //   );

    return processedText;
};


/**
 * Detects output format keywords in the text based on a provided map.
 * Returns a de-duplicated list of DetectedPatternInfo objects, where de-duplication
 * prioritizes longer matches if keywords overlap, and by default includes only the
 * first occurrence of a keyword mapping to a specific normalized format type.
 *
 * @param textToAnalyze The text to search (e.g., lowercased prompt text).
 * @param formatKeywordsMap A map where keys are keywords to search for and
 *                          values are the normalized format types.
 * @param baseIdPrefix Optional prefix for generating unique IDs for detected patterns.
 * @returns An array of DetectedPatternInfo objects for detected format keywords.
 */
export const detectOutputFormatKeywords = (
    textToAnalyze: string,
    formatKeywordsMap: Record<string, string> = OUTPUT_FORMAT_KEYWORDS_MAP 
  ): DetectedPatternInfo[] => {
    const detectedKeywords: DetectedPatternInfo[] = [];
    if (!textToAnalyze) return [];
  
    // To keep track of normalized format types already added, to mimic original logic
    // if you only want one entry per detected *normalized format type*.
    // If you want every keyword instance, remove this Set and the check.
    const processedNormalizedFormatTypes = new Set<string>();
  
    Object.keys(OUTPUT_FORMAT_KEYWORDS_MAP).forEach((keywordKey) => {
      const normalizedFormatType = formatKeywordsMap[keywordKey];
      const regexToFindKeyword = new RegExp(`\\b${keywordKey}\\b`, 'gi'); // Case-insensitive and global
  
      const matches = [...textToAnalyze.matchAll(regexToFindKeyword)];
  
      matches.forEach((matchInstance, matchIdx) => {
        const actualMatchedKeywordText = matchInstance[0];
        const sIndex = matchInstance.index ?? -1;
        const eIndex = sIndex + actualMatchedKeywordText.length;
  
        // This flag determines if we add this specific match based on the de-duplication strategy
        let shouldAddThisMatch = true;
  
        // Strategy: Add only the first time a specific *normalizedFormatType* is encountered via any keyword.
        // If you want all keyword instances, comment out or remove this block.
        if (processedNormalizedFormatTypes.has(normalizedFormatType)) {
          shouldAddThisMatch = false;
        }
  
        if (shouldAddThisMatch) {
          const sourcePatternMeta: PatternWithMetadata = {
            pattern: regexToFindKeyword,
            reason: `Keyword suggesting '${normalizedFormatType}' output type.`,
            severity: SeverityLevel.LOW,
            metadata: { type: 'format', formatType: normalizedFormatType },
          };
  
          detectedKeywords.push({
            id: `fmt-kw-${keywordKey.replace(/\s+/g, '_')}-${sIndex}`, // Sanitize keywordKey for ID
            matchedText: actualMatchedKeywordText,
            matchedPatternSource: sourcePatternMeta,
            reason: sourcePatternMeta.reason,
            severity: sourcePatternMeta.severity,
            startIndex: sIndex,
            endIndex: eIndex,
          });
  
          if (!processedNormalizedFormatTypes.has(normalizedFormatType)) {
            processedNormalizedFormatTypes.add(normalizedFormatType);
          }
        }
      });
    });
  
    // Filter for overlaps among the detected keywords themselves
    // (e.g., if map had "JSON" and "JSON Data" as keys)
    return filterOverlappingMatches(detectedKeywords);
};

/**
 * Computes the noun/verb balance ratio for a given text using wink-nlp POS tagging.
 * Returns null if no nouns or verbs are found.
 * @param text The prompt text to analyze.
 * @returns ratio (nouns/verbs), plus counts for both.
 */
export function getNounVerbBalance(text: string): { ratio: number|null, nounCount: number, verbCount: number } {
  if (!text || text.trim() === '') return { ratio: null, nounCount: 0, verbCount: 0 };
  const doc = nlp.readDoc(text);
  let nounCount = 0;
  let verbCount = 0;
  doc.tokens().each((token: any) => {
    const pos = token.out(its.pos);
    if (pos === 'NOUN' || pos === 'PROPN') nounCount++;
    if (pos === 'VERB') verbCount++;
  });
  if (verbCount === 0) return { ratio: null, nounCount, verbCount };
  return { ratio: nounCount / verbCount, nounCount, verbCount };
}

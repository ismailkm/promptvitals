// src/lib/agent-utils/patterns/toneStyleUtils.ts

/**
 * Normalize text and find all tone/style keywords present.
 * @param text The input text to search
 * @param keywords Array of keywords to match
 * @returns Array of found keywords (no duplicates)
 */
export function findToneKeywordsInText(text: string, keywords: string[]): string[] {
  const normalized = text.replace(/[.,;:]/g, '').toLowerCase();
  // Only return unique matches
  return Array.from(new Set(keywords.filter(kw => normalized.includes(kw))));
}

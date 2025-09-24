import {
  extractOutputLengthConstraint,
  processPatternList,
  findKeyEntitiesHeuristic,
  detectOutputFormatKeywords,
} from '@/lib/utils/textAnalysisUtils';

import {
  PERSONA_PHRASES_PATTERNS,
  GENERAL_CONSTRAINT_PATTERNS,
} from '@/lib/config/keywords';

/**
 * Unit tests for textAnalysisUtils
 * Verifies:
 * - extractOutputLengthConstraint
 * - processPatternList
 * - findKeyEntitiesHeuristic
 * - detectOutputFormatKeywords
 */

describe('textAnalysisUtils - Specificity (Step 1.3)', () => {
    // --- extractOutputLengthConstraint ---
    describe('1-extractOutputLengthConstraint', () => {

        it('1.1 detects numeric length constraints (plural)', () => {
            const text = 'Write a 100 words summary.';
            const result = extractOutputLengthConstraint(text);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('words');
            expect(result?.value).toBe(100);
            expect(result?.unit?.toLowerCase()).toBe('words');
            expect(result?.patternInfo?.matchedText?.toLowerCase()).toContain('100');
        });

        it('1.2 normalizes singular unit to plural', () => {
            const text = 'Limit the response to 1 word.';
            const result = extractOutputLengthConstraint(text);
            expect(result).not.toBeNull();
            expect(result?.type).toBe('words');
            expect(result?.value).toBe(1);
            expect(result?.unit?.toLowerCase()).toBe('words');
        });

        it('1.3 detects qualitative constraints (brief, detailed)', () => {
            const brief = extractOutputLengthConstraint('Provide a brief overview.');
            const detailed = extractOutputLengthConstraint('Provide a detailed explanation.');
            expect(brief).not.toBeNull();
            expect(detailed).not.toBeNull();
            expect(['brief', 'detailed']).toContain(brief?.type as string);
            expect(['brief', 'detailed']).toContain(detailed?.type as string);
        });

        it('1.4 returns null when no constraint present', () => {
            const result = extractOutputLengthConstraint('Write a summary.');
            expect(result).toBeNull();
        });
    });

    // --- processPatternList: PERSONA & GENERAL CONSTRAINTS ---
    describe('2- processPatternList with PERSONA_PHRASES_PATTERNS and GENERAL_CONSTRAINT_PATTERNS', () => {
        it('2.1 detects persona phrases', () => {
            const text = 'Act as a security analyst. You are an expert in forensics.';
            const matches = processPatternList(text, PERSONA_PHRASES_PATTERNS);
            expect(matches.length).toBeGreaterThan(0);
            const texts = matches.map(m => m.matchedText?.toLowerCase() || '');
            expect(texts.some(t => t.includes('act as'))).toBe(true);
            expect(texts.some(t => t.includes('you are'))).toBe(true);
        });

        it('2.2 detects general constraints', () => {
            const text = 'Must not include PII. Ensure it is concise. Limited to 3 items. At least 2 points.';
            const matches = processPatternList(text, GENERAL_CONSTRAINT_PATTERNS);
            expect(matches.length).toBeGreaterThanOrEqual(3);
            const texts = matches.map(m => m.matchedText?.toLowerCase() || '');
            expect(texts.some(t => t.includes('must'))).toBe(true);
            expect(texts.some(t => t.includes('ensure'))).toBe(true);
            expect(texts.some(t => t.includes('limited to') || t.includes('at least'))).toBe(true);
        });
    });

    // --- findKeyEntitiesHeuristic ---
    describe('3- findKeyEntitiesHeuristic', () => {
        it('3.1 detects proper noun multi-token entities inside sentences', () => {
            const text = 'We met Alice Johnson today at the office.';
            const entities = findKeyEntitiesHeuristic(text);
            expect(entities.length).toBeGreaterThan(0);
            const texts = entities.map(e => e.matchedText);
            expect(texts.some(t => /Alice Johnson/i.test(t || ''))).toBe(true);
        });

        it('3.2 does not flag sentence-start generic capitalized words', () => {
            const text = 'This is a sample. However, we visited Berlin.';
            const entities = findKeyEntitiesHeuristic(text);
            // Should allow Berlin (proper noun inside sentence) but avoid matching sentence-start fillers like "This" or "However"
            const texts = entities.map(e => e.matchedText);
            expect(texts.some(t => /^This$|^However$/i.test(t || ''))).toBe(false);
        });
    });

    // --- detectOutputFormatKeywords ---
    describe('4- detectOutputFormatKeywords', () => {
        it('4.1 detects multiple format keywords and de-dupes per normalized type', () => {
            const text = 'Return JSON and CSV, also present it as a table.';
            const matches = detectOutputFormatKeywords(text.toLowerCase());
            // Expect JSON, CSV, Table (3 unique normalized types)
            expect(matches.length).toBeGreaterThanOrEqual(3);
            const formats = matches
            .map(m => (m.matchedPatternSource as any)?.metadata?.formatType)
            .filter(Boolean);
            expect(formats).toEqual(expect.arrayContaining(['JSON', 'CSV', 'Table']));
        });

        it('4.2 is case-insensitive and includes format metadata', () => {
            const text = 'Output in json format and as CSV.';
            const matches = detectOutputFormatKeywords(text.toLowerCase());
            expect(matches.length).toBeGreaterThanOrEqual(2);
            matches.forEach(m => {
            const meta = (m.matchedPatternSource as any)?.metadata;
            expect(meta?.type).toBe('format');
            expect(['JSON', 'CSV', 'Table', 'Markdown', 'XML', 'YAML', 'HTML', 'PlainText']).toContain(meta?.formatType);
            });
        });
    });
});

import { processPatternList } from '@/lib/utils/textAnalysisUtils';
import {
  EXPLICIT_FORMAT_REQUEST_PATTERNS,
  EXAMPLE_PATTERNS,
  PLACEHOLDER_PATTERNS,
  TONE_STYLE_KEYWORD_PATTERNS,
} from '@/lib/config/keywords';

/**
 * Unit tests for Step 1.4: Instructions & Structure (utils level)
 * Verifies processPatternList detects:
 * - explicit format requests (with metadata.formatType)
 * - example indicators
 * - placeholders
 * - tone/style guidance
 */

describe('textAnalysisUtils - Instructions & Structure (Step 1.4)', () => {
    describe('1- processPatternList with EXPLICIT_FORMAT_REQUEST_PATTERNS', () => {
        it('1.1 detects JSON format requests with correct metadata', () => {
            const text = 'Please provide the output in JSON format.';
            const matches = processPatternList(text, EXPLICIT_FORMAT_REQUEST_PATTERNS);
            expect(matches.length).toBeGreaterThan(0);
            const fmtTypes = matches
            .map(m => ((m.matchedPatternSource as any)?.metadata?.formatType) as string | undefined)
            .filter(Boolean);
            expect(fmtTypes).toEqual(expect.arrayContaining(['JSON']));
        });

        it('1.2 detects multiple explicit format requests (CSV, XML, Table)', () => {
            const text = 'Output as CSV or XML, then make it a table.';
            const matches = processPatternList(text, EXPLICIT_FORMAT_REQUEST_PATTERNS);
            const fmtTypes = matches
            .map(m => ((m.matchedPatternSource as any)?.metadata?.formatType) as string | undefined)
            .filter(Boolean);
            expect(fmtTypes).toEqual(expect.arrayContaining(['CSV', 'XML', 'Table']));
        });

        it('1.3 returns empty when no explicit format is requested', () => {
            const text = 'Tell me a story about a brave knight.';
            const matches = processPatternList(text, EXPLICIT_FORMAT_REQUEST_PATTERNS);
            expect(matches.length).toBe(0);
        });
    });

    describe('2- processPatternList with EXAMPLE_PATTERNS', () => {
        it('2.1 detects common example indicators', () => {
            const text = `Provide a summary. For example: a quick overview. Also, e.g., A becomes B.\nInput: Key\nOutput: Value`;
            const matches = processPatternList(text, EXAMPLE_PATTERNS);
            expect(matches.length).toBeGreaterThanOrEqual(2);
            const texts = matches.map(m => (m.matchedText ?? '').toLowerCase());
            expect(texts.some(t => t.includes('for example'))).toBe(true);
            expect(texts.some(t => t.includes('e.g.')) || texts.some(t => t.includes('input'))).toBe(true);
        });

        it('2.2 returns empty when no examples present', () => {
            const text = 'Write a detailed report about climate change.';
            const matches = processPatternList(text, EXAMPLE_PATTERNS);
            expect(matches.length).toBe(0);
        });
    });

    describe('3- processPatternList with PLACEHOLDER_PATTERNS', () => {
        it('3.1 detects different placeholder styles ([VAR], {var}, <slot>)', () => {
            const text = 'Replace [VARIABLE_NAME] with the actual value. Use {placeholder}. And also <YOUR_INPUT_HERE>.';
            const matches = processPatternList(text, PLACEHOLDER_PATTERNS);
            const texts = matches.map(m => (m.matchedText ?? '').toLowerCase());
            expect(texts.some(t => t.includes('[variable_name]'))).toBe(true);
            expect(texts.some(t => t.includes('{placeholder}'))).toBe(true);
            expect(texts.some(t => t.includes('<your_input_here>'))).toBe(true);
        });

        it('3.2 returns empty when no placeholders present', () => {
            const text = 'Analyze the document for key themes.';
            const matches = processPatternList(text, PLACEHOLDER_PATTERNS);
            expect(matches.length).toBe(0);
        });
    });

    describe('4- processPatternList with TONE_STYLE_KEYWORD_PATTERNS', () => {
        it('4.1 detects tone and style guidance keywords', () => {
            const text = 'Write in a formal tone. Be concise and professional. Use a friendly style.';
            const matches = processPatternList(text, TONE_STYLE_KEYWORD_PATTERNS);
            expect(matches.length).toBeGreaterThanOrEqual(3);
            const texts = matches.map(m => (m.matchedText ?? '').toLowerCase());
            expect(texts.some(t => t.includes('formal'))).toBe(true);
            expect(texts.some(t => t.includes('concise'))).toBe(true);
            expect(texts.some(t => t.includes('professional') || t.includes('friendly'))).toBe(true);
        });

        it('4.2 returns empty when no tone/style guidance present', () => {
            const text = 'Generate a detailed report on the topic.';
            const matches = processPatternList(text, TONE_STYLE_KEYWORD_PATTERNS);
            expect(matches.length).toBe(0);
        });
    });
});

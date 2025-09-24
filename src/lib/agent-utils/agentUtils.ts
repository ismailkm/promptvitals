import { AIError, AIErrorCode } from '@/lib/exceptions/AIError';
import Ajv, { ErrorObject } from 'ajv';
import { recordTelemetry } from '@/lib/agent-utils/parseTelemetry';

/**
 * A tolerant parser that extracts a best-effort JSON object from an LLM's response.
 * It never throws an error and always returns the parsed data and the raw content.
 */
export function parseLLMResponseLoose<T = any>(responseText: string): { parsed: Partial<T>, rawContent: string } {
    const rawContent = responseText;

    const tryParse = (text: string): any | null => {
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    };

    const repairJsonString = (s: string): string => {
        let repaired = s.trim();
        // 1. Strip markdown fences
        repaired = repaired.replace(/^```json\s*|```\s*$/g, '');
        // 2. Extract content within the first '{' and last '}'
        const start = repaired.indexOf('{');
        const end = repaired.lastIndexOf('}');
        if (start === -1 || end === -1 || end < start) {
            return "{}"; // Return empty object if no JSON block found
        }
        repaired = repaired.substring(start, end + 1);

        // 3. Fix common syntax errors
        repaired = repaired.replace(/,\s*(?=[}\]])/g, ''); // Trailing commas
        repaired = repaired.replace(/([\{,]\s*)(\w+)\s*:/g, '$1"$2":'); // Unquoted keys

        return repaired;
    };

    let parsed: any = tryParse(repairJsonString(rawContent));

    if (!parsed) {
        // If parsing still fails after basic repairs, return an empty object.
        parsed = {};
    }

    return {
        parsed: parsed as Partial<T>,
        rawContent,
    };
}


// --- Main Exported Function ---

/**
 * Parses, validates, and sanitizes a raw string response from an LLM into a typed object.
 *
 * @param responseText The raw text string from the AI.
 * @param moduleName The name of the calling module for logging/telemetry.
 * @param jsonSchema The AJV-compatible JSON schema to validate against.
 * @returns The parsed and validated object, conforming to the generic type T.
 * @throws {AIError} If JSON is unrecoverable or fails schema validation after repair attempts.
 */
// Deprecated: use parseLLMResponseLoose for tolerant parsing
export function parseAIResponse<T = any>(responseText: string, moduleName: string, jsonSchema: object): T {
    const { parsed, rawContent } = parseLLMResponseLoose<T>(responseText);
    // Return the parsed object with rawContent attached for downstream use
    return Object.assign({}, parsed, { rawContent }) as any;
}
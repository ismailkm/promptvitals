// src/lib/ai-modules/ClarityAnalysisModule.ts

import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { AIClarityAnalysisResult } from '@/lib/types/aiTypes';
import { getLLMClient } from '@/lib/llm-clients/getClient';
import { AIError, AIErrorCode } from '@/lib/exceptions/AIError';
import { parseAIResponse } from '@/lib/agent-utils/agentUtils';
import { sanitizeAIResult, ensureArrayFields } from '@/lib/agent-utils/hybridEnhancement';
import type { LLMConfig } from '@/lib/types/aiTypes';

/**
 * AI module for comprehensive clarity analysis of prompts
 * Makes a single structured AI call for multiple feature analysis
 */
export class ClarityAnalysisModule {
  
    private config: LLMConfig;

    // The module now ACCEPTS the configuration object.
    constructor(config: LLMConfig) {
        this.config = config;
    }

    private buildSystemPrompt(): string {
        return `You are a precision-focused AI analyst. Your mission is to evaluate a user's prompt on its **Clarity and Purpose**. You prioritize clear intent, unambiguous language, and specific, actionable goals. Vague or confusing prompts should be identified as low quality in your analysis.`;
    }


    /**
     * Builds a structured prompt for AI analysis based on eligible features
     */
    private buildUserPrompt(
        context: AnalyzedPromptDataContext,
        eligibleFeatures: string[]
    ): string {
        const prompt = context.promptText;
        const featuresDescription = this.getFeaturesDescription(eligibleFeatures);
        
        return `
    PROMPT TO ANALYZE:
    "${prompt}"

    CONTEXT DATA:
    - Word count: ${context.lengthWords}
    - Action verbs: ${context.actionVerbDetails?.verbs?.join(', ') || 'none'}
    - Explicit goal stated: ${context.explicitlyStatesGoal ? 'yes' : 'no'}
    - Clarity issues found: ${context.clarityIssuesFound?.length || 0}
    - Contradictions found: ${context.contradictoryStatementFlags?.length || 0}

    FEATURES TO ANALYZE: ${eligibleFeatures.join(', ')}

    ${featuresDescription}

    Respond with ONLY a valid JSON object in this exact format:
    {${this.buildResponseSchema(eligibleFeatures)}}

    Important:
    - Use the exact structure shown above, but provide your own specific analysis values
    - Populate arrays with your own findings - do not leave them empty unless no issues found
    - Confidence values must be between 0 and 1
    - Keep rationale under 100 characters
    - Be specific and actionable in your analysis
    - Only include fields for the requested features`;
    }

    /**
     * Generates feature descriptions for the prompt
     */
    private getFeaturesDescription(features: string[]): string {
        const descriptions: Record<string, string> = {
        goalAlignment: `
GOAL ALIGNMENT: Analyze if the prompt has a clear, inferable goal. If the goal is implicit, infer what the user likely wants to achieve.`,
        
        clarityContext: `
CLARITY CONTEXT: Identify contextual ambiguities and critical terms that need clarification for better understanding.`,
        
        specificityReview: `
SPECIFICITY REVIEW: Identify missing constraints, output format requirements, or other specificity elements that would improve the prompt.`,
        
        instructionCoherence: `
INSTRUCTION COHERENCE: Assess if instructions are coherent, detect contradictions, and estimate how likely the instructions are to be followed correctly.`
        };

        return features.map(f => descriptions[f]).filter(Boolean).join('\n');
    }

    /**
     * Builds the JSON response schema based on eligible features
     */
    private buildResponseSchema(features: string[]): string {
        const schemas: Record<string, string> = {
        goalAlignment: `
"goalAlignment": {
"inferredGoal": "string or null",
"primaryActionVerb": "string or null", 
"confidence": number,
"rationale": "string"
}`,
        
        clarityContext: `
"clarityContext": {
"contextualAmbiguity": [],
"criticalTerms": [],
"confidence": number,
"rationale": "string"
}`,
        
        specificityReview: `
"specificityReview": {
"missingConstraints": [],
"outputFormatClarity": "string",
"confidence": number,
"rationale": "string"
}`,
        
        instructionCoherence: `
"instructionCoherence": {
"contradictionsDetected": [],
"followingLikelihood": number,
"confidence": number,
"rationale": "string"
}`
        };

        return features.map(f => schemas[f]).filter(Boolean).join(',');
    }

    /**
     * Parses and validates AI response
     */
    private parseResponse(responseText: string, jsonSchema?: object): AIClarityAnalysisResult {
        // Use tolerant parser with module name and schema
        const parsed: any = parseAIResponse(responseText, 'ClarityAnalysisModule', jsonSchema as object);
        
        // Validate structure and normalize using utilities
        const result: AIClarityAnalysisResult = {};
        
        if (parsed.goalAlignment) {
            result.goalAlignment = sanitizeAIResult(parsed.goalAlignment);
        }
        
        if (parsed.clarityContext) {
            const sanitized = sanitizeAIResult(parsed.clarityContext);
            result.clarityContext = ensureArrayFields(sanitized, ['contextualAmbiguity', 'criticalTerms']);
        }
        
        if (parsed.specificityReview) {
            const sanitized = sanitizeAIResult(parsed.specificityReview);
            result.specificityReview = ensureArrayFields(sanitized, ['missingConstraints']);
        }
        
        if (parsed.instructionCoherence) {
            const sanitized = sanitizeAIResult(parsed.instructionCoherence);
            // Normalize followingLikelihood in addition to arrays
            result.instructionCoherence = {
                ...ensureArrayFields(sanitized, ['contradictionsDetected']),
                followingLikelihood: Math.max(0, Math.min(1, sanitized.followingLikelihood || 0.5))
            };
        }
        
        return result;
    }

    /**
     * Builds a JSON schema for OpenAI response validation
     */
    private buildJsonSchema(features: string[]): object {
        const schemas: Record<string, object> = {
        goalAlignment: {
            type: 'object',
            properties: {
            inferredGoal: { 
                anyOf: [
                { type: 'string' },
                { type: 'null' }
                ]
            },
            primaryActionVerb: { 
                anyOf: [
                { type: 'string' },
                { type: 'null' }
                ]
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            rationale: { type: 'string', maxLength: 100 }
            },
            required: ['confidence', 'inferredGoal'],
            additionalProperties: false
        },
        clarityContext: {
            type: 'object',
            properties: {
            contextualAmbiguity: { 
                type: 'array', 
                items: { type: 'string' },
                default: []
            },
            criticalTerms: { 
                type: 'array', 
                items: { type: 'string' },
                default: []
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            rationale: { type: 'string', maxLength: 100 }
            },
            required: ['confidence'],
            additionalProperties: false
        },
        specificityReview: {
            type: 'object',
            properties: {
            missingConstraints: { 
                type: 'array', 
                items: { type: 'string' },
                default: []
            },
            outputFormatClarity: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            rationale: { type: 'string', maxLength: 100 }
            },
            required: ['missingConstraints', 'outputFormatClarity', 'confidence', 'rationale'],
            additionalProperties: false
        },
        instructionCoherence: {
            type: 'object',
            properties: {
            contradictionsDetected: { 
                type: 'array', 
                items: { type: 'string' },
                default: []
            },
            followingLikelihood: { type: 'number', minimum: 0, maximum: 1 },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            rationale: { type: 'string', maxLength: 100 }
            },
            required: ['contradictionsDetected', 'followingLikelihood', 'confidence', 'rationale'],
            additionalProperties: false
        }
        };
        
        const properties: Record<string, object> = {};
        for (const f of features) {
        if (schemas[f]) properties[f] = schemas[f];
        }
        
        return {
        type: 'object',
        properties,
        additionalProperties: false,
        required: features.filter(f => schemas[f]) // Only require features that are being analyzed
        };
    }

    /**
     * Main analysis function - analyzes clarity features based on eligible features
     */
    async analyzeClarityFeatures(
        context: AnalyzedPromptDataContext,
        eligibleFeatures: string[]
    ): Promise<AIClarityAnalysisResult> {
        if (eligibleFeatures.length === 0) {
        throw new AIError('ClarityAnalysisModule requires at least one eligible feature', {
            code: AIErrorCode.VALIDATION_ERROR,
            module: 'ClarityAnalysisModule'
        });
        }
        
        try {
        const client = getLLMClient();
        const systemPrompt = this.buildSystemPrompt();
        const userPrompt = this.buildUserPrompt(context, eligibleFeatures);

        const isOllama = client.name === 'ollama';

        // Build JSON schema for OpenAI
        const jsonSchema = this.buildJsonSchema(eligibleFeatures);

        const response = await client.chatJSON({
            model: this.config.primaryModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            ...(isOllama
            ? {}
            : {
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'ClarityAnalysisResponse',
                        schema: jsonSchema
                    }
                }
              }
            ),
        });

        if (!response.content) {
            throw new AIError('ClarityAnalysisModule received empty response from LLM', {
                code: AIErrorCode.NO_RESPONSE,
                module: 'ClarityAnalysisModule',
                model: this.config.primaryModel
            });
        }

    const responseText = response.content;

    return this.parseResponse(responseText, jsonSchema);
        
        } catch (error) {
            if (error instanceof AIError) {
                // Re-throw AI errors with additional context
                throw error;
            }
            
            // Convert generic errors to AI errors
            throw new AIError(
                `ClarityAnalysisModule analysis error: ${error instanceof Error ? error.message : 'unknown'}`,
                {
                    code: AIErrorCode.MODEL_ERROR,
                    module: 'ClarityAnalysisModule',
                    model: this.config.primaryModel,
                    details: { originalError: error }
                }
            );
        }
    }

    /**
     * Factory method to create analysis function compatible with ClarityPurposeAgent
     */
    createAnalysisFunction() {
        return (context: AnalyzedPromptDataContext, eligibleFeatures: string[]) =>
        this.analyzeClarityFeatures(context, eligibleFeatures);
    }
}

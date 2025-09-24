// src/lib/ai-modules/SafetyAnalysisModule.ts

import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { AISafetyAnalysisResult, LLMChatCompletionParams } from '@/lib/types/aiTypes';
import { getLLMClient } from '@/lib/llm-clients/getClient';
import { AIError, AIErrorCode } from '@/lib/exceptions/AIError';
import { parseAIResponse } from '@/lib/agent-utils/agentUtils';
import { sanitizeAIResult, ensureArrayFields } from '@/lib/agent-utils/hybridEnhancement';
import type { LLMConfig } from '@/lib/types/aiTypes';

/**
 * AI module for comprehensive safety and ethics analysis of prompts
 * Makes a single structured AI call for nuanced safety feature analysis
 */
export class SafetyAnalysisModule {
  
    private config: LLMConfig;

    // The module now ACCEPTS the configuration object.
    constructor(config: LLMConfig) {
        this.config = config;
    }

    private buildSystemPrompt(): string {
        return `You are a "Digital Safety & Ethics Guardian" - an expert AI analyst specializing in identifying genuine safety and ethical concerns while avoiding false positives on legitimate professional content.

**CRITICAL: Professional marketing, communications, and business activities are NOT malicious.**

**LEGITIMATE PROFESSIONAL CONTEXTS (NEVER flag as malicious):**
- Marketing campaigns, advertising, public relations, brand communications
- Health communications, medical education, patient outreach, public health campaigns  
- Educational content, academic research, training materials, instructional design
- Business strategy, stakeholder communications, compliance discussions, security planning
- Creative writing, storytelling, character development, fictional scenarios
- Professional services (consulting, coaching, strategy development)

**STANDARD PROFESSIONAL TERMINOLOGY (NOT malicious indicators):**
- "Target audience," "campaign," "strategy," "messaging," "engagement"
- "Stakeholders," "outreach," "communications," "branding," "positioning"
- "Marketing," "advertising," "promotion," "awareness," "influence"
- Security, compliance, HIPAA, GDPR, privacy, data protection (in professional contexts)

**EXAMPLES OF CLEARLY SAFE PROFESSIONAL PROMPTS:**
- "Create a marketing campaign for healthy eating targeting college students"
- "Design a public health communication strategy about vaccination"  
- "Develop a business strategy for cybersecurity compliance"
- "Write educational content about data privacy regulations"
- "Create advertising copy for a mental health awareness campaign"

**ONLY FLAG AS MALICIOUS if there is clear evidence of:**
1. **Actual Malicious Intent**: Direct requests for illegal, harmful, or dangerous content
2. **Genuine Security Threats**: Attempts to bypass AI safety, hack systems, or exploit vulnerabilities
3. **Harmful Content Generation**: Requests for content that could cause real harm to individuals or groups

**CONFIDENCE GUIDELINES:**
- For professional/educational/marketing content: Use LOW risk levels and conservative confidence scores
- Only use HIGH risk levels for clear, unambiguous threats
- When in doubt about professional vs. malicious context, err on the side of "professional"

Focus on genuine safety concerns, not normal business activities.`;
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
- Explicit bias indicators found: ${context.biasRiskIndicators?.length || 0}
- Malicious patterns detected: ${(context.misusePatternIndicators?.length || 0) + (context.restrictedContentIndicators?.length || 0)}
- High privilege descriptions: ${context.highPrivilegeDescriptions?.length || 0}
- Target domain/context: ${context.specificityElements?.keyEntitiesFound?.map((e: any) => e.text).join(', ') || 'general'}

FEATURES TO ANALYZE: ${eligibleFeatures.join(', ')}

${featuresDescription}

Respond with ONLY a valid JSON object in this exact format:
{${this.buildResponseSchema(eligibleFeatures)}}

Important:
- Use the exact structure shown above, but provide your own specific analysis values
- Populate arrays with your own findings - do not leave them empty unless no issues found
- Confidence values must be between 0 and 1
- Keep rationale under 150 characters and be specific to the analyzed prompt
- Focus on subtle, context-dependent issues that keyword systems miss
- Provide specific, actionable insights based on the actual prompt content
- Only include fields for the requested features`;
    }

    /**
     * Generates feature descriptions for the prompt
     */
    private getFeaturesDescription(features: string[]): string {
        const descriptions: Record<string, string> = {
            implicitBiasAssessment: `
IMPLICIT BIAS ASSESSMENT: Analyze for subtle biases that aren't caught by keyword detection:
- Implicit assumptions about groups, professions, or demographics
- Language that could reinforce harmful stereotypes
- Subtle linguistic patterns that suggest prejudice
- Context-dependent bias that emerges from seemingly neutral language`,
            
            subtleMaliciousness: `
SUBTLE MALICIOUSNESS: Detect ONLY genuine malicious intent. Be extremely conservative with professional content.

**ONLY FLAG as malicious if the prompt contains:**
- Direct requests for illegal activities, violence, or dangerous instructions
- Clear attempts to bypass AI safety measures or generate harmful content
- Explicit manipulation to extract private/sensitive information for malicious purposes
- Content explicitly designed to spread hate, misinformation, or cause genuine harm

**NEVER FLAG as malicious (these are normal professional activities):**
- Marketing campaigns, advertising, or promotional content (regardless of "targeting" language)
- Health communications, public health campaigns, or medical education
- Business strategy, stakeholder management, or competitive analysis
- Educational content about security, compliance, or sensitive topics
- Creative writing, storytelling, or fictional scenarios
- Professional services like consulting, coaching, or training

**PROFESSIONAL LANGUAGE GUIDELINES:**
- "Target audience" = normal marketing terminology, NOT malicious targeting
- "Campaign" = normal business/marketing activity, NOT malicious operation  
- "Strategy" = normal business planning, NOT malicious scheme
- "Influence" = normal marketing goal, NOT malicious manipulation
- Security/compliance discussions = normal business requirements, NOT threats

**RISK ASSESSMENT:**
- Default to LOW risk for any content that could reasonably be professional
- Only use MEDIUM/HIGH risk for clear, unambiguous malicious intent
- Professional marketing/health/business content should score LOW risk regardless of topic`,
            
            culturalSensitivity: `
CULTURAL SENSITIVITY: Assess potential cultural insensitivity or harm:
- Language that could be offensive to specific cultural groups
- Misappropriation or stereotyping of cultural practices
- Requests that could generate culturally harmful content
- Insensitive treatment of religious, ethnic, or cultural topics`
        };

        return features.map(f => descriptions[f]).filter(Boolean).join('\n');
    }

    /**
     * Builds the JSON response schema based on eligible features
     */
    private buildResponseSchema(features: string[]): string {
        const schemas: Record<string, string> = {
            implicitBiasAssessment: `
"implicitBiasAssessment": {
    "biasTypes": [],
    "affectedGroups": [],
    "biasConfidence": 0.8,
    "riskLevel": "MEDIUM",
    "confidence": 0.9,
    "rationale": "Detected subtle language patterns suggesting implicit assumptions about group capabilities."
}`,
            
            subtleMaliciousness: `
"subtleMaliciousness": {
    "manipulationTactics": [],
    "harmfulIntent": "",
    "sophisticationLevel": "LOW",
    "riskLevel": "LOW",
    "confidence": 0.95,
    "rationale": "Professional marketing/health communications content poses no malicious threat."
}`,
            
            culturalSensitivity: `
"culturalSensitivity": {
    "culturalConcerns": [],
    "affectedCultures": [],
    "sensitivityLevel": "HIGH",
    "confidence": 0.75,
    "rationale": "Language may perpetuate harmful stereotypes or misrepresent cultural practices."
}`
        };

        return features.map(f => schemas[f]).filter(Boolean).join(',');
    }

    /**
     * Parses and validates AI response
     */
    private parseResponse(responseText: string, jsonSchema?: object): AISafetyAnalysisResult {
        // Use tolerant parser with module name and schema
        const parsed: any = parseAIResponse(responseText, 'SafetyAnalysisModule', jsonSchema || {});
        
        // Validate structure and normalize using utilities
        const result: AISafetyAnalysisResult = {};
        
        if (parsed.implicitBiasAssessment) {
            const sanitized = sanitizeAIResult(parsed.implicitBiasAssessment);
            result.implicitBiasAssessment = ensureArrayFields(sanitized, ['biasTypes', 'affectedGroups']);
        }
        
        if (parsed.subtleMaliciousness) {
            const sanitized = sanitizeAIResult(parsed.subtleMaliciousness);
            result.subtleMaliciousness = ensureArrayFields(sanitized, ['manipulationTactics']);
        }
        
        if (parsed.culturalSensitivity) {
            const sanitized = sanitizeAIResult(parsed.culturalSensitivity);
            result.culturalSensitivity = ensureArrayFields(sanitized, ['culturalConcerns', 'affectedCultures']);
        }
        
        return result;
    }

    /**
     * Builds a JSON schema for OpenAI response validation
     */
    private buildJsonSchema(features: string[]): object {
        const schemas: Record<string, object> = {
            implicitBiasAssessment: {
                type: 'object',
                properties: {
                    biasTypes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        default: []
                    },
                    affectedGroups: { 
                        type: 'array', 
                        items: { type: 'string' },
                        default: []
                    },
                    biasConfidence: { type: 'number', minimum: 0, maximum: 1 },
                    riskLevel: { 
                        type: 'string', 
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
                    },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    rationale: { type: 'string', maxLength: 150 }
                },
                required: ['confidence', 'riskLevel'],
                additionalProperties: false
            },
            
            subtleMaliciousness: {
                type: 'object',
                properties: {
                    manipulationTactics: { 
                        type: 'array', 
                        items: { type: 'string' },
                        default: []
                    },
                    harmfulIntent: { type: 'string' },
                    sophisticationLevel: { 
                        type: 'string', 
                        enum: ['LOW', 'MEDIUM', 'HIGH'] 
                    },
                    riskLevel: { 
                        type: 'string', 
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
                    },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    rationale: { type: 'string', maxLength: 150 }
                },
                required: ['confidence', 'riskLevel'],
                additionalProperties: false
            },
            
            culturalSensitivity: {
                type: 'object',
                properties: {
                    culturalConcerns: { 
                        type: 'array', 
                        items: { type: 'string' },
                        default: []
                    },
                    affectedCultures: { 
                        type: 'array', 
                        items: { type: 'string' },
                        default: []
                    },
                    sensitivityLevel: { 
                        type: 'string', 
                        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] 
                    },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                    rationale: { type: 'string', maxLength: 150 }
                },
                required: ['confidence', 'sensitivityLevel'],
                additionalProperties: false
            }
        };

        const properties: Record<string, object> = {};
        for (const feature of features) {
            if (schemas[feature]) {
                properties[feature] = schemas[feature];
            }
        }

        return {
            type: 'object',
            properties,
            additionalProperties: false
        };
    }

    /**
     * Main analysis method
     */
    async analyzeSafetyEthics(
        context: AnalyzedPromptDataContext,
        eligibleFeatures: string[]
    ): Promise<AISafetyAnalysisResult> {
        if (eligibleFeatures.length === 0) {
            throw new AIError('SafetyAnalysisModule requires at least one eligible feature', {
                code: AIErrorCode.VALIDATION_ERROR,
                module: 'SafetyAnalysisModule'
            });
        }

        try {
            const client = getLLMClient();
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(context, eligibleFeatures);
            const jsonSchema = this.buildJsonSchema(eligibleFeatures);
            
            // Check if using Ollama to handle schema differences
            const isOllama = client.name === 'ollama';

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
                                name: 'SafetyAnalysisResponse',
                                schema: jsonSchema
                            }
                        }
                    }
                ),
            });

            if (!response?.content) {
                throw new AIError('SafetyAnalysisModule received empty response from LLM', {
                    code: AIErrorCode.NO_RESPONSE,
                    module: 'SafetyAnalysisModule',
                    model: this.config.primaryModel
                });
            }

            return this.parseResponse(response.content, jsonSchema);

        } catch (error) {
            if (error instanceof AIError) {
                throw error;
            }
            
            throw new AIError(
                `SafetyAnalysisModule analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                {
                    code: AIErrorCode.MODEL_ERROR,
                    module: 'SafetyAnalysisModule',
                    model: this.config.primaryModel,
                    details: { originalError: error, eligibleFeatures }
                }
            );
        }
    }

    /**
     * Factory method for creating analysis function
     */
    createAnalysisFunction(): (
        context: AnalyzedPromptDataContext,
        eligibleFeatures: string[]
    ) => Promise<AISafetyAnalysisResult> {
        const module = new SafetyAnalysisModule(this.config);
        return (context, eligibleFeatures) => module.analyzeSafetyEthics(context, eligibleFeatures);
    }
}

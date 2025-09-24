// src/lib/ai-modules/InstructionsStructureModule.ts

import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { getLLMClient } from '@/lib/llm-clients/getClient';
import { AIError, AIErrorCode } from '@/lib/exceptions/AIError';
import { parseAIResponse } from '@/lib/agent-utils/agentUtils';
import { AIEligibleFeature, AIInstructionsStructureResult } from '@/lib/types/aiTypes';
import { sanitizeAIResult, ensureArrayFields } from '@/lib/agent-utils/hybridEnhancement';
import type { LLMConfig } from '@/lib/types/aiTypes';

/**
 * AI module for comprehensive instructions structure analysis
 * Makes a single structured AI call for multiple feature analysis based on eligibility
 */
export class InstructionsStructureModule {
  
  private config: LLMConfig;

  // The module now ACCEPTS the configuration object.
  constructor(config: LLMConfig) {
    this.config = config;
  }

  private buildSystemPrompt(eligibleFeatures: AIEligibleFeature[]): string {
    return `You are a "Prompt Structure Architect" - an expert AI analyst specializing in prompt organization, formatting, and instructional design. Your mission is to provide deep, contextual analysis of prompt structure elements that rule-based systems cannot adequately assess.

You will analyze a user's prompt and provide insights ONLY for the requested features: ${eligibleFeatures.join(', ')}.

Key principles:
- Focus on structural clarity, logical flow, and instructional effectiveness
- Identify subtle issues that basic pattern matching cannot detect
- Provide actionable, specific recommendations
- Be precise in your confidence scoring (0-100)
- Consider the prompt's intended use case and complexity

Respond with a valid JSON object containing only the requested feature analyses.`;
  }

  private buildUserPrompt(
    analyzedContext: AnalyzedPromptDataContext, 
    eligibleFeatures: AIEligibleFeature[]
  ): string {
    let prompt = `Analyze this prompt for the following structural aspects: ${eligibleFeatures.join(', ')}\n\n`;
    prompt += `**PROMPT TO ANALYZE:**\n${analyzedContext.promptText}\n\n`;
    
    // Add relevant context based on eligible features
    if (eligibleFeatures.includes('formatSuggestion')) {
      prompt += `**FORMATTING CONTEXT:**\n`;
      prompt += `- Word count: ${analyzedContext.lengthWords}\n`;
      prompt += `- Section count: ${analyzedContext.instructionsAndStructure.sectionCount ?? 0}\n`;
      prompt += `- Has bullet points: ${analyzedContext.instructionsAndStructure.bulletPointUsage?.detected ?? false}\n\n`;
    }

    if (eligibleFeatures.includes('exampleQualityReview')) {
      const examples = analyzedContext.instructionsAndStructure.exampleDetails;
      prompt += `**EXAMPLES CONTEXT:**\n`;
      prompt += `- Example count: ${examples?.length ?? 0}\n`;
      if (examples && examples.length > 0) {
        prompt += `- Example details: ${JSON.stringify(examples.map(e => ({ text: e.matchedText, startIndex: e.startIndex })))}\n`;
      }
      prompt += `\n`;
    }

    if (eligibleFeatures.includes('structureCoherence')) {
      prompt += `**COHERENCE CONTEXT:**\n`;
      const constraints = analyzedContext.specificityElements?.outputLengthConstraints;
      const toneStyle = analyzedContext.instructionsAndStructure.toneStyleGuidance;
      if (constraints && constraints.length > 0) {
        prompt += `- Length constraints detected: ${constraints.length}\n`;
      }
      if (toneStyle && toneStyle.length > 0) {
        prompt += `- Tone/style guidance detected: ${toneStyle.length}\n`;
      }
      prompt += `\n`;
    }

    if (eligibleFeatures.includes('decompositionSuggestion')) {
      prompt += `**DECOMPOSITION CONTEXT:**\n`;
      prompt += `- Action verbs count: ${analyzedContext.actionVerbDetails?.count ?? 0}\n`;
      prompt += `- Step markers count: ${analyzedContext.instructionsAndStructure.stepMarkerDetails?.length ?? 0}\n`;
      if (analyzedContext.actionVerbDetails?.verbs) {
        prompt += `- Action verbs: ${analyzedContext.actionVerbDetails.verbs.join(', ')}\n`;
      }
      prompt += `\n`;
    }

    prompt += `Provide your analysis as a JSON object with the following structure:\n`;
    prompt += `{\n`;
    prompt += this.buildResponseSchema(eligibleFeatures);
    prompt += `}\n\nImportant:
- Use the exact structure shown above, but provide your own specific analysis values
- Populate arrays with your own findings - do not leave them empty unless no issues found
- Remove any trailing commas and ensure valid JSON format.`;
    
    return prompt;
  }

  /**
   * Builds the JSON response schema based on eligible features
   */
  private buildResponseSchema(features: AIEligibleFeature[]): string {
    const schemas: Record<string, string> = {
      formatSuggestion: `
  "formatSuggestion": {
    "confidence": number (0-100),
    "suggestion": "string",
    "reasoning": "string",
    "structureImprovement": "minor|moderate|major"
  }`,
      
      exampleQualityReview: `
  "exampleQualityReview": {
    "confidence": number (0-100),
    "qualityAssessment": "poor|fair|good|excellent",
    "reasoning": "string",
    "suggestedImprovements": []
  }`,
      
      structureCoherence: `
  "structureCoherence": {
    "confidence": number (0-100),
    "coherenceIssues": [],
    "conflictSeverity": "minor|moderate|severe",
    "resolutionSuggestions": []
  }`,
      
      decompositionSuggestion: `
  "decompositionSuggestion": {
    "confidence": number (0-100),
    "decompositionQuality": "poor|fair|good|excellent",
    "suggestedBreakdown": [],
    "reasoning": "string"
  }`
    };

    return features.map(f => schemas[f]).filter(Boolean).join(',');
  }

  /**
   * Builds a JSON schema for response validation
   */
  private buildJsonSchema(features: AIEligibleFeature[]): object {
    const schemas: Record<string, object> = {
      formatSuggestion: {
        type: 'object',
        properties: {
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          suggestion: { type: 'string' },
          reasoning: { type: 'string' },
          structureImprovement: { 
            type: 'string', 
            enum: ['minor', 'moderate', 'major'] 
          }
        },
        required: ['confidence', 'suggestion'],
        additionalProperties: false
      },
      
      exampleQualityReview: {
        type: 'object',
        properties: {
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          qualityAssessment: { 
            type: 'string', 
            enum: ['poor', 'fair', 'good', 'excellent'] 
          },
          reasoning: { type: 'string' },
          suggestedImprovements: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          }
        },
        required: ['confidence', 'qualityAssessment', 'reasoning', 'suggestedImprovements'],
        additionalProperties: false
      },
      
      structureCoherence: {
        type: 'object',
        properties: {
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          coherenceIssues: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          conflictSeverity: { 
            type: 'string', 
            enum: ['minor', 'moderate', 'severe'] 
          },
          resolutionSuggestions: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          }
        },
        required: ['confidence', 'coherenceIssues', 'conflictSeverity', 'resolutionSuggestions'],
        additionalProperties: false
      },
      
      decompositionSuggestion: {
        type: 'object',
        properties: {
          confidence: { type: 'number', minimum: 0, maximum: 100 },
          decompositionQuality: { 
            type: 'string', 
            enum: ['poor', 'fair', 'good', 'excellent'] 
          },
          suggestedBreakdown: { 
            type: 'array', 
            items: { type: 'string' },
            default: []
          },
          reasoning: { type: 'string' }
        },
        required: ['confidence', 'decompositionQuality', 'suggestedBreakdown', 'reasoning'],
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
  * Parses and validates the AI response for instructions structure analysis
  */
  private parseResponse(
    responseText: string,
    eligibleFeatures: AIEligibleFeature[],
    jsonSchema?: object
  ): AIInstructionsStructureResult {
    const parsedResult: AIInstructionsStructureResult = parseAIResponse(responseText, 'InstructionsStructureAnalysisModule', jsonSchema as object);

    const validatedResult: any = {};
    
    for (const feature of eligibleFeatures) {
      if (feature in parsedResult) {
        const rawFeatureData = parsedResult[feature];
        
        // Apply normalization based on feature type
        if (feature === 'exampleQualityReview' || feature === 'structureCoherence' || feature === 'decompositionSuggestion') {
          // These features have array fields that need normalization
          const arrayFields = {
            'exampleQualityReview': ['suggestedImprovements'],
            'structureCoherence': ['coherenceIssues', 'resolutionSuggestions'],
            'decompositionSuggestion': ['suggestedBreakdown']
          };
          
          const sanitized = sanitizeAIResult(rawFeatureData);
          validatedResult[feature] = ensureArrayFields(sanitized, arrayFields[feature] || []);
        } else {
          // For other features (like formatSuggestion), just sanitize confidence
          validatedResult[feature] = sanitizeAIResult(rawFeatureData);
        }
      }
    }
    
    return validatedResult;
  }

  /**
   * Analyzes instructions structure for eligible features
   */
  async analyzeInstructionsStructure(
    analyzedContext: AnalyzedPromptDataContext,
    eligibleFeatures: AIEligibleFeature[]
  ): Promise<AIInstructionsStructureResult> {
    if (eligibleFeatures.length === 0) {
      throw new AIError('InstructionsStructureAnalysisModule requires at least one eligible feature', {
        code: AIErrorCode.VALIDATION_ERROR,
        module: 'InstructionsStructureAnalysisModule'
      });
    }

    try {
      const client = getLLMClient();
      
      const systemPrompt = this.buildSystemPrompt(eligibleFeatures);
      const userPrompt = this.buildUserPrompt(analyzedContext, eligibleFeatures);

      const isOllama = client.name === 'ollama';

      // Build JSON schema for OpenAI
      const jsonSchema = this.buildJsonSchema(eligibleFeatures);

      const response = await client.chatJSON({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: this.config.primaryModel,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        ...(isOllama
          ? {}
          : {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'InstructionsStructureAnalysisResponse',
                  schema: jsonSchema
                }
              }
            }
        ),
      });

      if (!response.content) {
        throw new AIError('InstructionsStructureAnalysisModule received empty response from LLM', {
          code: AIErrorCode.NO_RESPONSE,
          module: 'InstructionsStructureAnalysisModule',
          model: this.config.primaryModel
        });
      }
    // Parse and validate the JSON response robustly
    const parsedResult = this.parseResponse(response.content, eligibleFeatures, jsonSchema);
    return parsedResult;

    } catch (error) {
      if (error instanceof AIError) {
        throw error;
      }
      throw new AIError(
        `InstructionsStructureAnalysisModule analysis error: ${error}`,
        {
          code: AIErrorCode.MODEL_ERROR,
          module: 'InstructionsStructureAnalysisModule',
          model: this.config.primaryModel,
          details: { originalError: error }
        }
      );
    }
  }

  /**
   * Factory method to create analysis function compatible with InstructionsStructureAgent
   */
  createAnalysisFunction() {
    return (context: AnalyzedPromptDataContext, eligibleFeatures: AIEligibleFeature[] | string[]) => {
      // Convert string[] to AIEligibleFeature[] if needed
      const typedFeatures = Array.isArray(eligibleFeatures) && typeof eligibleFeatures[0] === 'string' 
        ? eligibleFeatures as AIEligibleFeature[]
        : eligibleFeatures as AIEligibleFeature[];
      return this.analyzeInstructionsStructure(context, typedFeatures);
    };
  }

}

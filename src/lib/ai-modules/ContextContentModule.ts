// src/lib/ai-modules/ContextContentModule.ts

import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { getLLMClient } from '@/lib/llm-clients/getClient';
import { AIError, AIErrorCode } from '@/lib/exceptions/AIError';
import { parseAIResponse } from '@/lib/agent-utils/agentUtils';
import { sanitizeAIResult, ensureArrayFields } from '@/lib/agent-utils/hybridEnhancement';
import type { LLMConfig } from '@/lib/types/aiTypes';



export class ContextContentAnalysisModule {
  private config: LLMConfig;
  
  // The module now ACCEPTS the configuration object.
  constructor(config: LLMConfig) {
     this.config = config;
  }
  

  private buildSystemPrompt(): string {
    return `You are a meticulous research analyst. Your job is to determine if a user has provided enough high-quality, relevant context for an AI to complete a task without needing to guess or search for external information.`;
  }

  private buildUserPrompt(context: AnalyzedPromptDataContext, eligibleFeatures: string[]): string {
    const prompt = context.promptText ?? '';
    const entities = (context.specificityElements?.keyEntitiesFound || []).map(e => e.matchedText).join(', ') || 'none';
    const verbs = context.actionVerbDetails?.verbs?.join(', ') || 'none';
    const extRef = context.mentionsExternalReference ? 'yes' : 'no';

    return `
PROMPT_TO_ANALYZE:
"""
${prompt}
"""

CONTEXT DATA:
- Key entities: ${entities}
- Action verbs: ${verbs}
- Mentions external reference: ${extRef}

FEATURES TO ANALYZE: ${eligibleFeatures.join(', ')}

TASK:
Assess the sufficiency and relevance of the provided context for the user's apparent goal. Does the AI have everything it needs? Are there obvious gaps? Identify missing info as direct questions, and list any irrelevant parts.

RESPONSE FORMAT:
Return ONLY a valid JSON object in this exact shape:
{
  "contextSufficiency": { "confidence": number, "assessment": "insufficient|sufficient|excellent", "missingInfo": [], "relevanceIssues": [], "rationale": "string" },
  "contextRelevance": { "confidence": number, "assessment": "irrelevant|partially_relevant|relevant|highly_relevant", "irrelevantSections": [], "rationale": "string" }
}

Important: 
- Use the exact structure shown above, but provide your own specific analysis values
- Populate arrays with your own findings - do not leave them empty unless no issues found
- Confidence should be a number between 0 and 1
- Do not include extra text outside the JSON.`;
  }

  private buildJsonSchema(): object {
    return {
      type: 'object',
      properties: {
        contextSufficiency: {
          type: 'object',
          properties: {
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            assessment: { type: 'string', enum: ['insufficient', 'sufficient', 'excellent'] },
            missingInfo: { type: 'array', items: { type: 'string' } },
            relevanceIssues: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          },
          required: ['confidence', 'assessment', 'missingInfo', 'relevanceIssues', 'rationale'],
          additionalProperties: false
        },
        contextRelevance: {
          type: 'object',
          properties: {
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            assessment: { type: 'string', enum: ['irrelevant', 'partially_relevant', 'relevant', 'highly_relevant'] },
            irrelevantSections: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          },
          required: ['confidence', 'assessment', 'irrelevantSections', 'rationale'],
          additionalProperties: false
        }
      },
      required: ['contextSufficiency', 'contextRelevance'],
      additionalProperties: false
    };
  }

  private parseResponse(responseText: string): any {
    const parsed: any = parseAIResponse(responseText, 'ContextContentAnalysisModule', this.buildJsonSchema() as object);
    
    // Normalize using utilities
    const out: any = {};
    
    if (parsed?.contextSufficiency) {
      const sanitized = sanitizeAIResult(parsed.contextSufficiency);
      out.contextSufficiency = {
        ...ensureArrayFields(sanitized, ['missingInfo', 'relevanceIssues']),
        rationale: String(sanitized.rationale || '')
      };
    }
    
    if (parsed?.contextRelevance) {
      const sanitized = sanitizeAIResult(parsed.contextRelevance);
      out.contextRelevance = {
        ...ensureArrayFields(sanitized, ['irrelevantSections']),
        rationale: String(sanitized.rationale || '')
      };
    }
    
    return out;
  }

  async analyzeContextFeatures(context: AnalyzedPromptDataContext, eligibleFeatures: string[]) {
    if (eligibleFeatures.length === 0) {
      throw new AIError('ContextContentAnalysisModule requires at least one eligible feature', {
        code: AIErrorCode.VALIDATION_ERROR,
        module: 'ContextContentAnalysisModule'
      });
    }

    try {
      const client = getLLMClient();
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(context, eligibleFeatures);
      const isOllama = client.name === 'ollama';
      const jsonSchema = this.buildJsonSchema();

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
                  name: 'ContextContentAnalysisResponse',
                  schema: jsonSchema
                }
              }
            }
        ),
      });

      if (!response.content) {
        throw new AIError('ContextContentAnalysisModule received empty response from LLM', {
          code: AIErrorCode.NO_RESPONSE,
          module: 'ContextContentAnalysisModule',
          model: this.config.primaryModel
        });
      }

      return this.parseResponse(response.content);
    } catch (error) {
      if (error instanceof AIError) throw error;
      throw new AIError(`ContextContentAnalysisModule analysis error: ${error instanceof Error ? error.message : 'unknown'}`, {
        code: AIErrorCode.MODEL_ERROR,
        module: 'ContextContentAnalysisModule',
        model: this.config.primaryModel,
        details: { originalError: error }
      });
    }
  }

  createAnalysisFunction() {
    return (context: AnalyzedPromptDataContext, eligibleFeatures: string[]) =>
      this.analyzeContextFeatures(context, eligibleFeatures);
  }
}

// src/lib/exceptions/AIError.ts

export enum AIErrorCode {
  NO_RESPONSE = 'NO_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  PARSE_ERROR = 'PARSE_ERROR',
  MODEL_ERROR = 'MODEL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  INSUFFICIENT_CONTEXT = 'INSUFFICIENT_CONTEXT',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export class AIError extends Error {
  public readonly code: AIErrorCode;
  public readonly module?: string;
  public readonly agent?: string;
  public readonly model?: string;
  public readonly details?: any;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    options: {
      code: AIErrorCode;
      module?: string;
      agent?: string;
      model?: string;
      details?: any;
      isRetryable?: boolean;
    }
  ) {
    super(message);
    this.name = 'AIError';
    this.code = options.code;
    this.module = options.module;
    this.agent = options.agent;
    this.model = options.model;
    this.details = options.details;
    this.isRetryable = options.isRetryable ?? false;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AIError);
    }
  }

  /**
   * Check if this error should trigger a fallback to rule-based evaluation
   */
  shouldFallbackToRules(): boolean {
    return [
      AIErrorCode.NO_RESPONSE,
      AIErrorCode.INVALID_RESPONSE,
      AIErrorCode.PARSE_ERROR,
      AIErrorCode.MODEL_ERROR,
      AIErrorCode.TIMEOUT,
      AIErrorCode.RATE_LIMIT
    ].includes(this.code);
  }

  /**
   * Get a user-friendly error message
   */
  getUserMessage(): string {
    switch (this.code) {
      case AIErrorCode.NO_RESPONSE:
        return 'AI analysis unavailable, using rule-based evaluation';
      case AIErrorCode.INVALID_RESPONSE:
      case AIErrorCode.PARSE_ERROR:
        return 'AI response format error, using rule-based evaluation';
      case AIErrorCode.MODEL_ERROR:
        return 'AI model error, using rule-based evaluation';
      case AIErrorCode.NETWORK_ERROR:
      case AIErrorCode.TIMEOUT:
        return 'Network error during AI analysis, using rule-based evaluation';
      case AIErrorCode.RATE_LIMIT:
        return 'AI service rate limited, using rule-based evaluation';
      default:
        return 'AI analysis error, using rule-based evaluation';
    }
  }

  /**
   * Convert to a structured log object
   */
  toLogObject() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      module: this.module,
      agent: this.agent,
      model: this.model,
      details: this.details,
      isRetryable: this.isRetryable,
      stack: this.stack
    };
  }
}

/**
 * Utility to wrap AI operations with standardized error handling
 */
export async function withAIErrorHandling<T>(
  operation: () => Promise<T>,
  context: {
    module: string;
    agent?: string;
    model?: string;
  }
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AIError) {
      // Re-throw with additional context
      throw new AIError(error.message, {
        ...error,
        module: error.module || context.module,
        agent: error.agent || context.agent,
        model: error.model || context.model
      });
    }

    // Convert generic errors to AI errors
    let code = AIErrorCode.MODEL_ERROR;
    let isRetryable = false;

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('timeout')) {
        code = AIErrorCode.TIMEOUT;
        isRetryable = true;
      } else if (message.includes('network') || message.includes('fetch')) {
        code = AIErrorCode.NETWORK_ERROR;
        isRetryable = true;
      } else if (message.includes('rate limit')) {
        code = AIErrorCode.RATE_LIMIT;
        isRetryable = true;
      }
    }

    throw new AIError(
      error instanceof Error ? error.message : 'Unknown AI error',
      {
        code,
        module: context.module,
        agent: context.agent,
        model: context.model,
        details: { originalError: error },
        isRetryable
      }
    );
  }
}

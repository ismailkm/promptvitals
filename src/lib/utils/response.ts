import { NextResponse } from 'next/server';
import { ZodError, ZodIssue } from 'zod';

/**
 * Interface for a structured error payload.
 */
export interface ErrorPayload {
  message: string;
  code?: string; 
  issues?: ZodIssue[]; 
  details?: any; 
}

/**
 * Creates a standardized success JSON response.
 * @param data - The data payload for the success response.
 * @param status - The HTTP status code (default is 200).
 * @returns A NextResponse object.
 */
export const successResponse = <TData>(data: TData, status: number = 200): NextResponse => {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
};

/**
 * Creates a standardized error JSON response.
 * @param error - A string message or an ErrorPayload object.
 * @param status - The HTTP status code (default is 500).
 * @returns A NextResponse object.
 */
export const errorResponse = (
  error: string | ErrorPayload | ZodError,
  status: number = 500
): NextResponse => {
  let responseBody: { success: boolean; error: ErrorPayload };

  if (typeof error === 'string') {
    responseBody = {
      success: false,
      error: { message: error },
    };
  } else if (error instanceof ZodError) {
    responseBody = {
      success: false,
      error: {
        message: "Validation failed. Please check your input.",
        code: "VALIDATION_ERROR",
        issues: error.issues, 
      },
    };
    status = status === 500 ? 400 : status; 
  } else {
    responseBody = {
      success: false,
      error: error,
    };
  }

  return NextResponse.json(responseBody, { status });
};

/**
 * (Optional) Creates a success response that includes metadata,
 * useful for paginated lists or other scenarios requiring extra info.
 * @param data - The data payload.
 * @param meta - The metadata object.
 * @param status - The HTTP status code (default is 200).
 * @returns A NextResponse object.
 */
export const successResponseWithMeta = <TData, TMeta>(
  data: TData,
  meta: TMeta,
  status: number = 200
): NextResponse => {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status }
  );
};
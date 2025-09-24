import { errorResponse } from '@/lib/utils/response';

// This catch-all route will handle any API requests that don't match existing routes
// For example, if someone tries to access /api/summar instead of /api/summary

export const GET = async () => {
  return errorResponse('API endpoint not found', 404);
};

export const POST = async () => {
  return errorResponse('API endpoint not found', 404);
};

export const PUT = async () => {
  return errorResponse('API endpoint not found', 404);
};

export const DELETE = async () => {
  return errorResponse('API endpoint not found', 404);
};

export const PATCH = async () => {
  return errorResponse('API endpoint not found', 404);
};
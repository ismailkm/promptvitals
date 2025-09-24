import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/utils/response';

import { AgentManager } from '@/lib/agents/AgentManager';

const summarySchema = z.object({
  prompt: z.string(),
});

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const validation = summarySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse('Invalid request body', 400);
    }

    const agentManager = new AgentManager();
    const detailedReport = await agentManager.conductFullAnalysis(body.prompt);

    return successResponse(detailedReport);

  } catch (error: any) {
    return errorResponse({
        message: "An unexpected error occurred while analyzing the prompt.",
        code: "INTERNAL_SERVER_ERROR",
        details: error instanceof Error ? error.message : String(error) 
      },
      500
    );
  }
};

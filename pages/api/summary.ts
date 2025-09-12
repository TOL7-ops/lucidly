// pages/api/summary.ts
import type { NextApiResponse } from 'next';
import { withAuth, type AuthenticatedRequest, apiResponse } from '../../src/lib/auth';
import { summarizeDream } from '../../src/lib/local-ai';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return apiResponse(res, 405, null, 'Method not allowed');
  }

  const { dreamId, text } = (req.body || {}) as { dreamId?: string; text?: string };

  if (!dreamId || !text) {
    return apiResponse(res, 400, null, 'Dream ID and text are required');
  }

  try {
    // Use local transformers.js summarizer
    const generatedSummary = await summarizeDream(text.length > 2000 ? text.slice(0, 2000) : text);

    // Use authenticated Supabase client from middleware
    const { supabase, user } = req;
    if (!supabase || !user?.id) {
      return apiResponse(res, 401, null, 'Unauthorized');
    }

    // Update the dream summary for this user
    const { data: updatedDream, error: updateError } = await supabase
      .from('dreams')
      .update({ summary: generatedSummary })
      .eq('id', dreamId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return apiResponse(res, 500, null, 'Failed to save summary to database');
    }

    return apiResponse(res, 200, {
      success: true,
      summary: generatedSummary,
      dreamId,
      dream: updatedDream,
    });
  } catch (error) {
    return apiResponse(
      res,
      500,
      null,
      'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
    );
  }
}

export default withAuth(handler);
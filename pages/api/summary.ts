// pages/api/summary.ts
import type { NextApiResponse } from 'next';
import { withAuth, type AuthenticatedRequest, apiResponse } from '../../src/lib/auth';

const HF_API_BASE = 'https://api-inference.huggingface.co/models';
const modelsToTry = ['facebook/bart-large-cnn', 'sshleifer/distilbart-cnn-12-6'];

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return apiResponse(res, 405, null, 'Method not allowed');
  }

  const { dreamId, text } = (req.body || {}) as { dreamId?: string; text?: string };

  if (!dreamId || !text) {
    return apiResponse(res, 400, null, 'Dream ID and text are required');
  }

  if (!process.env.HF_API_KEY) {
    return apiResponse(res, 500, null, 'Hugging Face API key not configured');
  }

  try {
    let generatedSummary: string | null = null;

    for (const model of modelsToTry) {
      try {
        const response = await fetch(`${HF_API_BASE}/${model}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: text.length > 1000 ? text.substring(0, 1000) : text,
            parameters: {
              max_length: 150,
              min_length: 30,
              do_sample: false,
            },
          }),
        });

        if (!response.ok) {
          // Try next model on 5xx/503, otherwise continue
          continue;
        }

        const data: unknown = await response.json();
        const summary =
          Array.isArray(data) && data.length > 0 && (data as any)[0]?.summary_text
            ? (data as any)[0].summary_text
            : null;

        if (summary) {
          generatedSummary = summary;
          break;
        }
      } catch {
        // Try next model
        continue;
      }
    }

    if (!generatedSummary) {
      return apiResponse(res, 500, null, 'All summarization models failed. Try again later.');
    }

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
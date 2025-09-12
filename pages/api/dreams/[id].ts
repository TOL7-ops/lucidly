import { NextApiResponse } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { withAuth, AuthenticatedRequest, apiResponse } from '../../../src/lib/auth';
import { summarizeAndInterpretDream, splitSummaryInterpretation } from '../../../lib/ai';
import { analyzeSentiment } from '../../../src/lib/huggingface';
import type { Dream } from '../../../src/lib/supabaseClient';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method, query } = req;
  const { supabase, user } = req;
  const dreamId = query.id as string;

  if (!dreamId) {
    return apiResponse(res, 400, null, 'Dream ID is required');
  }

  switch (method) {
    case 'GET':
      return handleGetDream(req, res, supabase, user, dreamId);
    case 'PUT':
      return handlePutDream(req, res, supabase, user, dreamId);
    case 'PATCH':
      return handleUpdateDream(req, res, supabase, user, dreamId);
    case 'DELETE':
      return handleDeleteDream(req, res, supabase, user, dreamId);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
      return apiResponse(res, 405, null, `Method ${method} Not Allowed`);
  }
}

async function handleGetDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
  user: { id: string },
  dreamId: string,
) {
  try {
    const { data: dream, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('id', dreamId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Database error:', error);
      return apiResponse(res, 404, null, 'Dream not found');
    }

    return apiResponse(res, 200, dream);
  } catch (error) {
    console.error('Get dream error:', error);
    return apiResponse(res, 500, null, 'Internal server error');
  }
}

async function handlePutDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
  user: { id: string },
  dreamId: string,
) {
  try {
    const { summary } = req.body;

    if (!summary) {
      return apiResponse(res, 400, null, 'Summary is required');
    }

    // Update the dream with the new summary
    const { data: updatedDream, error: updateError } = await supabase
      .from('dreams')
      .update({ summary })
      .eq('id', dreamId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return apiResponse(res, 500, null, 'Failed to update dream');
    }

    return apiResponse(res, 200, updatedDream);
  } catch (error) {
    console.error('Put dream error:', error);
    return apiResponse(res, 500, null, 'Internal server error');
  }
}

async function handleUpdateDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
  user: { id: string },
  dreamId: string,
) {
  try {
    const { generateSummary, generateSentiment, generateInterpretation } = req.body;

    // First, get the current dream
    const { data: currentDream, error: fetchError } = await supabase
      .from('dreams')
      .select('*')
      .eq('id', dreamId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Database error:', fetchError);
      return apiResponse(res, 404, null, 'Dream not found');
    }

    const updates: Partial<Pick<Dream, 'summary' | 'sentiment' | 'interpretation'>> = {};
    const dreamText = currentDream.content || currentDream.transcript || '';

    if (!dreamText) {
      return apiResponse(res, 400, null, 'No content available for processing');
    }

    // Combined local generation when either summary or interpretation is requested
    if (generateSummary || generateInterpretation) {
      try {
        const combined = await summarizeAndInterpretDream(dreamText);
        const parsed = splitSummaryInterpretation(combined || '');
        if (generateSummary) {
          updates.summary = parsed.summary ?? null;
        }
        if (generateInterpretation) {
          updates.interpretation = parsed.interpretation ?? null;
        }
        // Attempt to store combined field if column exists
        (updates as any).summary_interpretation = combined || null;
      } catch (error) {
        console.error('AI generation failed:', error);
      }
    }
 
    // Generate sentiment analysis if requested (always regenerate when requested)
    if (generateSentiment) {
      try {
        updates.sentiment = await analyzeSentiment(dreamText);
      } catch (error) {
        console.error('Sentiment analysis failed:', error);
      }
    }

    // Update the dream if we have any updates
    if (Object.keys(updates).length > 0) {
      // Try updating with summary_interpretation if present; fallback if column doesn't exist
      let updatedDream: any = null;
      try {
        const { data, error } = await supabase
          .from('dreams')
          .update(updates as any)
          .eq('id', dreamId)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        updatedDream = data;
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (msg.toLowerCase().includes('summary_interpretation') || msg.toLowerCase().includes('column')) {
          // Retry without the combined field
          const retryPayload = { ...updates } as any;
          delete (retryPayload as any).summary_interpretation;
          const { data, error } = await supabase
            .from('dreams')
            .update(retryPayload)
            .eq('id', dreamId)
            .eq('user_id', user.id)
            .select()
            .single();
          if (error) {
            console.error('Update error:', error);
            return apiResponse(res, 500, null, 'Failed to update dream');
          }
          updatedDream = data;
        } else {
          console.error('Update error:', err);
          return apiResponse(res, 500, null, 'Failed to update dream');
        }
      }
 
      return apiResponse(res, 200, updatedDream);
    }

    return apiResponse(res, 200, currentDream);
  } catch (error) {
    console.error('Update dream error:', error);
    return apiResponse(res, 500, null, 'Internal server error');
  }
}

async function handleDeleteDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
  user: { id: string },
  dreamId: string,
) {
  try {
    const { error } = await supabase
      .from('dreams')
      .delete()
      .eq('id', dreamId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return apiResponse(res, 500, null, 'Failed to delete dream');
    }

    return apiResponse(res, 200, { message: 'Dream deleted successfully' });
  } catch (error) {
    console.error('Delete dream error:', error);
    return apiResponse(res, 500, null, 'Internal server error');
  }
}

export default withAuth(handler); 
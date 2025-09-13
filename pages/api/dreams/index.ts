import type { NextApiResponse } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { withAuth, type AuthenticatedRequest, apiResponse } from '../../../src/lib/auth';
import { summarizeDream, interpretDream } from '../../../lib/ai';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req;
  const { supabase, user } = req;

  if (!supabase || !user?.id) {
    return apiResponse(res, 401, null, 'Unauthorized');
  }

  switch (method) {
    case 'GET':
      return handleGetDreams(req, res, supabase, user.id);
    case 'POST':
      return handleCreateDream(req, res, supabase, user.id);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return apiResponse(res, 405, null, `Method ${method} Not Allowed`);
  }
}

/**
 * Ensure a public 'recordings' bucket exists (best-effort, non-blocking).
 * Uses service role if available; safely no-ops if env is missing or bucket exists.
 */
async function ensureRecordingsBucket() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
    if (!url || !serviceKey) return;

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if bucket exists
    const { data: existing } = await admin.storage.getBucket('recordings');
    if (existing) return;

    // Create bucket if missing
    const { error: createErr } = await admin.storage.createBucket('recordings', {
      public: true,
    });
    if (createErr) {
      console.warn('[dreams][POST] createBucket recordings failed (non-fatal):', createErr);
    }
  } catch (e) {
    console.warn('[dreams][POST] ensureRecordingsBucket unexpected error (non-fatal):', e);
  }
}

async function handleGetDreams(
  _req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[dreams][GET] Database error:', error);
      return apiResponse(res, 500, null, 'Failed to fetch dreams');
    }

    return apiResponse(res, 200, dreams || []);
  } catch (error) {
    console.error('[dreams][GET] Unexpected error:', error);
    return apiResponse(res, 500, null, 'Internal server error');
  }
}

async function handleCreateDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: SupabaseClient,
  userId: string,
) {
  try {
    // Diagnostic: log incoming payload shape
    try {
      const bodyKeys = Object.keys((req as any)?.body || {});
      console.log('[dreams][POST] Incoming body keys:', bodyKeys);
    } catch {
      console.log('[dreams][POST] Incoming body not enumerable');
    }

    const {
      title,
      tags,
      content,
      transcript,
      audio_url,
      audio_path,
      audioUrl,
      audioPath,
    } = (req.body || {}) as {
      title?: string;
      tags?: string[] | null;
      content?: string;
      transcript?: string;
      audio_url?: string;
      audio_path?: string;
      audioUrl?: string;
      audioPath?: string;
    };

    // Accept both camelCase and snake_case from the client
    const finalAudioUrl = audio_url ?? audioUrl ?? null;
    const finalAudioPath = audio_path ?? audioPath ?? null;

    // Best-effort ensure 'recordings' bucket exists for future uploads
    await ensureRecordingsBucket();

    if (!content && !transcript && !finalAudioUrl && !finalAudioPath) {
      console.warn('[dreams][POST] Validation failed: empty content/transcript/audioUrl/audioPath');
      return apiResponse(res, 400, null, 'Either content, transcript, audioUrl, or audioPath is required');
    }

    console.log('[dreams][POST] Inserting dream with:', {
      hasTitle: !!title,
      hasTags: Array.isArray(tags) && tags.length > 0,
      hasContent: !!content,
      hasTranscript: !!transcript,
      hasAudioUrl: !!finalAudioUrl,
      hasAudioPath: !!finalAudioPath,
      userId,
    });

    // Generate HF summary + interpretation BEFORE inserting
    const dreamText = (content || transcript || '').trim();
    let generatedSummary: string | null = null;
    let generatedInterpretation: string | null = null;

    // Manual fallbacks per requirement
    const FALLBACK_SUMMARY_TEXT =
      'Summary unavailable. This dream may reflect hidden thoughts or unresolved emotions.';
    const FALLBACK_INTERPRETATION_TEXT =
      'This dream may symbolize transitions or hidden aspects of the self.\n' +
      '- Unfamiliar paths could reflect uncertainty about the future.\n' +
      '- Water often represents emotions, suggesting deep feelings beneath the surface.\n' +
      '- A guiding animal may represent intuition leading you forward.\n' +
      '- The glowing gate may symbolize an opportunity or transformation waiting to be embraced.';

    if (dreamText) {
      try {
        generatedSummary = await summarizeDream(dreamText);
      } catch (e) {
        console.warn('[dreams][POST] summarizeDream failed, using fallback:', e);
        generatedSummary = FALLBACK_SUMMARY_TEXT;
      }
      try {
        generatedInterpretation = await interpretDream(dreamText);
      } catch (e) {
        console.warn('[dreams][POST] interpretDream failed, using fallback:', e);
        generatedInterpretation = FALLBACK_INTERPRETATION_TEXT;
      }
      console.log('[dreams][POST] HF output lengths:', {
        summary: generatedSummary?.length || 0,
        interpretation: generatedInterpretation?.length || 0,
      });
    } else {
      console.log('[dreams][POST] No dream text available for AI generation');
    }

    // Prepare base insert (without summary/interpretation; added conditionally)
    const baseInsert = {
      title: title || null,
      tags: Array.isArray(tags) ? tags : null,
      content: content || '',
      transcript: transcript || null,
      audio_url: finalAudioUrl,
      audio_path: finalAudioPath,
      user_id: userId,
    } as any;

    // Try insert with description/summary/interpretation; gracefully fall back if columns are missing
    let createdDreamResult = null as any;
    let insertError: any = null;

    const fullPayload: any = {
      ...baseInsert,
      description: dreamText || null,
      summary: generatedSummary ?? null,
      interpretation: generatedInterpretation ?? null,
    };

    const attempts: any[] = [
      fullPayload, // with description + AI fields
      { ...baseInsert, summary: generatedSummary ?? null, interpretation: generatedInterpretation ?? null }, // without description
      { ...baseInsert, description: dreamText || null }, // without AI fields
      { ...baseInsert }, // minimal
    ];

    for (const payload of attempts) {
      try {
        const { data, error } = await supabase
          .from('dreams')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        createdDreamResult = data;
        insertError = null;
        break;
      } catch (err: any) {
        insertError = err;
        const msg = String(err?.message || '');
        console.warn('[dreams][POST] insert attempt failed:', msg);
        // Continue to next attempt
      }
    }

    if (insertError) {
      console.error('[dreams][POST] Insert error:', insertError);
      return apiResponse(
        res,
        500,
        null,
        insertError?.message || 'Failed to create dream'
      );
    }

    const createdDream = createdDreamResult;

    // (insertError already handled above)

    console.log('[dreams][POST] Dream created with id:', createdDream?.id);
    return apiResponse(res, 201, createdDream);
  } catch (error) {
    console.error('[dreams][POST] Unexpected error:', error);
    return apiResponse(
      res,
      500,
      null,
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}

export default withAuth(handler);

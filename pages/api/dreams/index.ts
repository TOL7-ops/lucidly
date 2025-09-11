import type { NextApiResponse } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { withAuth, type AuthenticatedRequest, apiResponse } from '../../../src/lib/auth';

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
    // Log the body keys to aid debugging when creation fails
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

    const { data: dream, error } = await supabase
      .from('dreams')
      .insert({
        title: title || null,
        tags: Array.isArray(tags) ? tags : null,
        content: content || '',
        transcript: transcript || null,
        audio_url: finalAudioUrl,
        audio_path: finalAudioPath,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('[dreams][POST] Insert error:', error);
      return apiResponse(
        res,
        500,
        null,
        error?.message || 'Failed to create dream'
      );
    }

    console.log('[dreams][POST] Dream created with id:', dream?.id);
    return apiResponse(res, 201, dream);
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

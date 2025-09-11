import { supabase } from './supabaseClient';

export interface UploadAudioOptions {
  userId: string;
  file: Blob;
  fileName?: string;
  overwrite?: boolean;
}

export interface UploadAudioResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

const PRIMARY_BUCKET = (process.env.NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET || 'recordings').trim();
const FALLBACK_BUCKETS = ['recordings', 'dream-audio'];
const AUDIO_BUCKETS = Array.from(new Set([PRIMARY_BUCKET, ...FALLBACK_BUCKETS]));

function normalizeAudioPath(p?: string | null): string {
  if (!p) return '';
  let s = String(p).trim().replace(/^\/+/, '');
  s = s.replace(/^(recordings|dream-audio)\//, '');
  return s;
}

function isBucketNotFoundMessage(msg?: string) {
  if (!msg) return false;
  const m = msg.toLowerCase();
  return m.includes('bucket') && m.includes('not') && m.includes('found');
}

/**
 * Upload an audio Blob to Supabase storage and return a public URL.
 * - Buckets tried (in order):
 *   1) NEXT_PUBLIC_SUPABASE_AUDIO_BUCKET or 'recordings'
 *   2) 'recordings'
 *   3) 'dream-audio'
 * - Path stored in DB should be relative to the bucket root (no bucket prefix).
 *   Example: <userId>/YYYY/MM/DD/<timestamp>.<ext>
 */
export async function uploadAudioToSupabase(
  options: UploadAudioOptions
): Promise<UploadAudioResult> {
  try {
    const { userId, file, overwrite } = options;
    if (!userId) {
      return { success: false, error: 'Missing userId for audio upload' };
    }
    if (!file || file.size === 0) {
      return { success: false, error: 'Missing or empty audio file' };
    }

    const type = (file.type || '').toLowerCase();
    const ext =
      type.includes('wav') ? 'wav' :
      type.includes('mpeg') || type.includes('mp3') ? 'mp3' :
      type.includes('webm') ? 'webm' :
      type.includes('mp4') || type.includes('m4a') ? 'm4a' :
      type.includes('ogg') ? 'ogg' :
      type.includes('opus') ? 'opus' :
      'wav';

    const now = new Date();
    const parts = [
      String(now.getFullYear()),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ];
    const baseName =
      (options.fileName?.replace(/\.[^.]+$/, '') || `recording-${now.getTime()}`) + `.${ext}`;

    // IMPORTANT: Do NOT include the bucket name in the stored path
    const filePath = `${userId}/${parts.join('/')}/${baseName}`;
    const contentType = type || `audio/${ext}`;

    let lastError: string | undefined;

    for (const bucket of AUDIO_BUCKETS) {
      try {
        const { data: uploadRes, error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: !!overwrite,
            contentType,
          });

        if (uploadErr) {
          // If this is specifically a bucket-not-found error, try next bucket
          if (isBucketNotFoundMessage(uploadErr.message)) {
            lastError = uploadErr.message;
            continue;
          }
          // Other errors should abort
          return { success: false, error: uploadErr.message || 'Upload failed' };
        }

        // Get public URL (assuming bucket is public)
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(uploadRes?.path || filePath);
        const publicUrl = pub?.publicUrl;

        if (publicUrl) {
          return { success: true, publicUrl, filePath: uploadRes?.path || filePath };
        }

        // If bucket is private, return path so server can sign later
        return { success: true, filePath: uploadRes?.path || filePath };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (isBucketNotFoundMessage(msg)) {
          lastError = msg;
          continue;
        }
        return { success: false, error: msg || 'Unknown upload error' };
      }
    }

    return { success: false, error: lastError || 'Upload failed: No suitable bucket found' };
  } catch (e) {
    console.error('uploadAudioToSupabase: unexpected error', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown upload error' };
  }
}

/**
 * Resolve a public URL for a given audio path by trying known buckets.
 * Accepts paths with or without leading bucket names and normalizes them.
 */
export async function resolvePublicUrlForAudioPath(audioPath?: string | null): Promise<string | null> {
  const path = normalizeAudioPath(audioPath);
  if (!path) return null;

  for (const bucket of AUDIO_BUCKETS) {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      const url = (data as any)?.publicUrl || (data as any)?.publicURL || null;
      if (url) return url;
    } catch {
      // try next bucket
    }
  }
  return null;
}
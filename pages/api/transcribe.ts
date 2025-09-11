import type { NextApiResponse } from 'next';
import formidable, { type File as FormidableFile } from 'formidable';
import fs from 'fs';
import { withAuth, type AuthenticatedRequest, apiResponse } from '../../src/lib/auth';
import { transcribeAudio } from '../../src/lib/huggingface';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Validate audio MIME type against supported formats
function validateAudioFormat(mimetype: string, filename: string): { isValid: boolean; error?: string } {
  const supportedTypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/webm',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/opus',
  ];

  if (!mimetype) {
    return {
      isValid: false,
      error: 'No MIME type detected. Please ensure your audio file is properly formatted.',
    };
  }

  const isSupported = supportedTypes.some((type) => mimetype.toLowerCase().includes(type.split('/')[1]));
  if (!isSupported) {
    const name = filename || 'file';
    return {
      isValid: false,
      error: `Unsupported audio format for "${name}" (${mimetype}). Supported formats: WAV, WebM, MP3, MP4, M4A, OGG, OPUS`,
    };
  }

  return { isValid: true };
}

// Normalize commonly seen alias MIME types
function normalizeMimeType(mimetype: string): string {
  const typeMap: Record<string, string> = {
    'audio/wave': 'audio/wav',
    'audio/x-wav': 'audio/wav',
    'audio/mp3': 'audio/mpeg',
    'audio/m4a': 'audio/mp4',
  };
  return typeMap[mimetype.toLowerCase()] || mimetype;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const requestId = Math.random().toString(36).slice(2);
  console.log(`[transcribe] (${requestId}) request received: method=${req.method}`);

  if (req.method !== 'POST') {
    console.log(`[transcribe] (${requestId}) Method not allowed: ${req.method}`);
    return apiResponse(res, 405, undefined, 'Method not allowed');
  }

  try {
    if (!process.env.HF_API_KEY) {
      console.error(`[transcribe] (${requestId}) HF_API_KEY environment variable is not set`);
      return apiResponse(res, 500, undefined, 'Hugging Face API key not configured');
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    console.log(`[transcribe] (${requestId}) Parsing form data...`);
    const [fields, files] = await form.parse(req);
    const incoming = (files as Record<string, FormidableFile | FormidableFile[] | undefined>).file;
    const audioFile = Array.isArray(incoming) ? incoming[0] : incoming;

    if (!audioFile) {
      console.error(`[transcribe] (${requestId}) No audio file provided in request`);
      return apiResponse(res, 400, undefined, 'No audio file provided');
    }

    const fileInfo = {
      originalFilename: audioFile.originalFilename,
      mimetype: audioFile.mimetype,
      size: audioFile.size,
      filepath: audioFile.filepath,
    };
    console.log(`[transcribe] (${requestId}) File details:`, fileInfo);

    // Size validation
    if (audioFile.size < 1024) {
      console.error(`[transcribe] (${requestId}) Audio file too small: ${audioFile.size} bytes`);
      return apiResponse(res, 400, undefined, 'Audio file is too small. Please record for at least 1 second.');
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      console.error(`[transcribe] (${requestId}) Audio file too large: ${audioFile.size} bytes`);
      return apiResponse(res, 413, undefined, 'Audio file is too large. Maximum size is 10MB.');
    }

    // Format validation
    const formatValidation = validateAudioFormat(audioFile.mimetype || '', audioFile.originalFilename || '');
    if (!formatValidation.isValid) {
      console.error(`[transcribe] (${requestId}) Invalid format: ${formatValidation.error}`);
      return apiResponse(res, 415, undefined, formatValidation.error);
    }

    // Read file buffer
    console.log(`[transcribe] (${requestId}) Reading audio file from disk...`);
    const audioData = await fs.promises.readFile(audioFile.filepath);
    console.log(`[transcribe] (${requestId}) Audio data read successfully, size: ${audioData.byteLength} bytes`);

    const normalizedMimeType = normalizeMimeType(audioFile.mimetype || 'audio/wav');
    console.log(`[transcribe] (${requestId}) Normalized MIME type: ${normalizedMimeType}`);

    // Call transcription with timeout
    console.log(`[transcribe] (${requestId}) Invoking transcription service...`);
    const startTime = Date.now();

    try {
      const transcriptPromise = transcribeAudio(audioData, normalizedMimeType);
      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Transcription timeout after 30 seconds')), 30_000),
      );

      const transcript = await Promise.race([transcriptPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      console.log(`[transcribe] (${requestId}) Transcription completed in ${duration}ms`);
      console.log(
        `[transcribe] (${requestId}) Transcript preview:`,
        transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
      );

      // Cleanup temp file
      try {
        await fs.promises.unlink(audioFile.filepath);
        console.log(`[transcribe] (${requestId}) Temporary file cleaned up`);
      } catch (cleanupError) {
        console.warn(`[transcribe] (${requestId}) Failed to cleanup temp file:`, cleanupError);
      }

      if (transcript.startsWith('[Transcription failed:')) {
        console.error(`[transcribe] (${requestId}) Service error: ${transcript}`);
        return apiResponse(res, 500, undefined, transcript);
      }

      return apiResponse(res, 200, { transcript });
    } catch (transcriptionError) {
      const duration = Date.now() - startTime;
      console.error(`[transcribe] (${requestId}) Transcription failed after ${duration}ms:`, transcriptionError);

      if (transcriptionError instanceof Error) {
        if (transcriptionError.message === 'Transcription timeout after 30 seconds') {
          return apiResponse(
            res,
            408,
            undefined,
            'Transcription took too long. Please try again with a shorter recording.',
          );
        }
        if (transcriptionError.message.includes('Missing Hugging Face API key')) {
          return apiResponse(res, 500, undefined, 'Transcription service configuration error: Missing API key');
        }
        if (transcriptionError.message.includes('HF transcription failed')) {
          return apiResponse(res, 502, undefined, `Hugging Face API error: ${transcriptionError.message}`);
        }
        if (transcriptionError.message.includes('All Hugging Face transcription models failed')) {
          return apiResponse(res, 503, undefined, 'All transcription models are currently unavailable. Please try again later.');
        }
      }

      return apiResponse(
        res,
        500,
        undefined,
        `Transcription failed: ${transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'}`,
      );
    }
  } catch (error) {
    console.error(`[transcribe] (${requestId}) Endpoint error:`, error);

    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('timeout')) {
        return apiResponse(res, 408, undefined, 'Request timeout. Please try again with a shorter recording.');
      }
      if (error.message.toLowerCase().includes('file too large')) {
        return apiResponse(res, 413, undefined, 'Audio file is too large. Maximum size is 10MB.');
      }
      if (error.message.toLowerCase().includes('formidable')) {
        return apiResponse(res, 400, undefined, 'Invalid file upload. Please ensure you are sending a valid audio file.');
      }
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : 'No stack trace available';
    console.error(`[transcribe] (${requestId}) Full error details:`, { message, stack });

    return apiResponse(res, 500, undefined, `Internal server error: ${message}`);
  }
}

export default withAuth(handler);

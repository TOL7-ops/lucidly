import { NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest, apiResponse } from '../../src/lib/auth'
import { transcribeAudio } from '../../src/lib/huggingface'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return apiResponse(res, 405, undefined, 'Method not allowed')
  }

  try {
    console.log('Transcription request received')
    
    // Check if HF_API_KEY is available
    if (!process.env.HF_API_KEY) {
      console.error('HF_API_KEY environment variable is not set')
      return apiResponse(res, 500, undefined, 'Hugging Face API key not configured')
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)
    console.log('Form parsed, files:', Object.keys(files))

    const audioFile = Array.isArray(files.file) ? files.file[0] : files.file
    
    if (!audioFile) {
      console.error('No audio file provided')
      return apiResponse(res, 400, undefined, 'No audio file provided')
    }

    console.log('Audio file details:', {
      originalFilename: audioFile.originalFilename,
      mimetype: audioFile.mimetype,
      size: audioFile.size,
      filepath: audioFile.filepath
    })

    // Read the file into a Blob
    const audioData = await fs.promises.readFile(audioFile.filepath)
    console.log('Audio data read, size:', audioData.length)
    
    // Create blob with proper MIME type for faster processing
    const mimeType = audioFile.mimetype || 'audio/wav'
    const audioBlob = new Blob([audioData], { type: mimeType })
    console.log('Audio blob created, size:', audioBlob.size, 'type:', mimeType)

    // Call the transcription service with timeout for better UX
    console.log('Calling transcription service...')
    const startTime = Date.now()
    
    // Add timeout to prevent hanging requests
    const transcriptPromise = transcribeAudio(audioBlob)
    const timeoutPromise = new Promise<string>((_, reject) => 
      setTimeout(() => reject(new Error('Transcription timeout')), 30000) // 30 second timeout
    )
    
    const transcript = await Promise.race([transcriptPromise, timeoutPromise])
    const duration = Date.now() - startTime
    console.log(`Transcription completed in ${duration}ms`)
    console.log('Transcription result:', transcript)

    // Clean up the uploaded file
    try {
      await fs.promises.unlink(audioFile.filepath)
      console.log('Temporary file cleaned up')
    } catch (cleanupError) {
      console.warn('Failed to clean up temporary file:', cleanupError)
    }

    // Check if transcription failed
    if (transcript.startsWith('[Transcription failed:')) {
      return apiResponse(res, 500, undefined, transcript)
    }

    return apiResponse(res, 200, { transcript })

  } catch (error) {
    console.error('Transcription endpoint error:', error)
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'Transcription timeout') {
      return apiResponse(res, 408, undefined, 'Transcription took too long. Please try again with a shorter recording.')
    }
    
    return apiResponse(res, 500, undefined, `Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export default withAuth(handler) 
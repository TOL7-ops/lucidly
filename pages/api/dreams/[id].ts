import { NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest, apiResponse } from '../../../src/lib/auth'
import { summarizeText, analyzeSentiment, interpretDream } from '../../../src/lib/huggingface'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method, query } = req
  const { supabase, user } = req
  const dreamId = query.id as string

  if (!dreamId) {
    return apiResponse(res, 400, null, 'Dream ID is required')
  }

  switch (method) {
    case 'GET':
      return handleGetDream(req, res, supabase, user, dreamId)
    case 'PUT':
      return handlePutDream(req, res, supabase, user, dreamId)
    case 'PATCH':
      return handleUpdateDream(req, res, supabase, user, dreamId)
    case 'DELETE':
      return handleDeleteDream(req, res, supabase, user, dreamId)
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE'])
      return apiResponse(res, 405, null, `Method ${method} Not Allowed`)
  }
}

async function handleGetDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: any,
  user: { id: string },
  dreamId: string
) {
  try {
    const { data: dream, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('id', dreamId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return apiResponse(res, 404, null, 'Dream not found')
    }

    return apiResponse(res, 200, dream)
  } catch (error) {
    console.error('Get dream error:', error)
    return apiResponse(res, 500, null, 'Internal server error')
  }
}

async function handlePutDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: any,
  user: { id: string },
  dreamId: string
) {
  try {
    const { summary } = req.body

    if (!summary) {
      return apiResponse(res, 400, null, 'Summary is required')
    }

    // Update the dream with the new summary
    const { data: updatedDream, error: updateError } = await supabase
      .from('dreams')
      .update({ summary })
      .eq('id', dreamId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return apiResponse(res, 500, null, 'Failed to update dream')
    }

    return apiResponse(res, 200, updatedDream)
  } catch (error) {
    console.error('Put dream error:', error)
    return apiResponse(res, 500, null, 'Internal server error')
  }
}

async function handleUpdateDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: any,
  user: { id: string },
  dreamId: string
) {
  try {
    const { generateSummary, generateSentiment, generateInterpretation } = req.body

    // First, get the current dream
    const { data: currentDream, error: fetchError } = await supabase
      .from('dreams')
      .select('*')
      .eq('id', dreamId)
      .single()

    if (fetchError) {
      console.error('Database error:', fetchError)
      return apiResponse(res, 404, null, 'Dream not found')
    }

    const updates: any = {}
    const dreamText = currentDream.content || currentDream.transcript || ''

    if (!dreamText) {
      return apiResponse(res, 400, null, 'No content available for processing')
    }

    // Generate summary if requested
    if (generateSummary && !currentDream.summary) {
      try {
        updates.summary = await summarizeText(dreamText)
      } catch (error) {
        console.error('Summary generation failed:', error)
      }
    }

    // Generate sentiment analysis if requested
    if (generateSentiment && !currentDream.sentiment) {
      try {
        updates.sentiment = await analyzeSentiment(dreamText)
      } catch (error) {
        console.error('Sentiment analysis failed:', error)
      }
    }

    // Generate interpretation if requested
    if (generateInterpretation && !currentDream.interpretation) {
      try {
        updates.interpretation = await interpretDream(dreamText)
      } catch (error) {
        console.error('Dream interpretation failed:', error)
      }
    }

    // Update the dream if we have any updates
    if (Object.keys(updates).length > 0) {
      const { data: updatedDream, error: updateError } = await supabase
        .from('dreams')
        .update(updates)
        .eq('id', dreamId)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return apiResponse(res, 500, null, 'Failed to update dream')
      }

      return apiResponse(res, 200, updatedDream)
    }

    return apiResponse(res, 200, currentDream)
  } catch (error) {
    console.error('Update dream error:', error)
    return apiResponse(res, 500, null, 'Internal server error')
  }
}

async function handleDeleteDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: any,
  user: { id: string },
  dreamId: string
) {
  try {
    const { error } = await supabase
      .from('dreams')
      .delete()
      .eq('id', dreamId)

    if (error) {
      console.error('Database error:', error)
      return apiResponse(res, 500, null, 'Failed to delete dream')
    }

    return apiResponse(res, 200, { message: 'Dream deleted successfully' })
  } catch (error) {
    console.error('Delete dream error:', error)
    return apiResponse(res, 500, null, 'Internal server error')
  }
}

export default withAuth(handler) 
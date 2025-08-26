import { NextApiResponse } from 'next'
import { withAuth, AuthenticatedRequest, apiResponse } from '../../../src/lib/auth'
import { Dream } from '../../../src/lib/supabase'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { method } = req
  const { supabase, user } = req

  switch (method) {
    case 'POST':
      return handleCreateDream(req, res, supabase, user)
    case 'GET':
      return handleGetDreams(req, res, supabase, user)
    default:
      res.setHeader('Allow', ['POST', 'GET'])
      return apiResponse(res, 405, null, `Method ${method} Not Allowed`)
  }
}

async function handleCreateDream(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: any,
  user: { id: string }
) {
  try {
    const { content, transcript } = req.body

    if (!content && !transcript) {
      return apiResponse(res, 400, null, 'Either content or transcript is required')
    }

    // Insert dream into database
    const { data: dream, error } = await supabase
      .from('dreams')
      .insert({
        content: content || '',
        transcript: transcript || null,
        user_id: user.id, // Explicitly set user_id for security
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return apiResponse(res, 500, null, 'Failed to create dream')
    }

    return apiResponse(res, 201, dream)
  } catch (error) {
    console.error('Create dream error:', error)
    return apiResponse(res, 500, null, 'Internal server error')
  }
}

async function handleGetDreams(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  supabase: any,
  user: { id: string }
) {
  try {
    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('user_id', user.id) // Only return dreams for current user
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return apiResponse(res, 500, null, 'Failed to fetch dreams')
    }

    return apiResponse(res, 200, dreams)
  } catch (error) {
    console.error('Get dreams error:', error)
    return apiResponse(res, 500, null, 'Internal server error')
  }
}

export default withAuth(handler) 
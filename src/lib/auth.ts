import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from './supabase'

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string
    email?: string
  }
  supabase: ReturnType<typeof createServerSupabaseClient>
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Missing or invalid authorization header'
        })
      }

      const token = authHeader.split(' ')[1]
      
      // Create Supabase client with the token
      const supabase = createServerSupabaseClient(token)
      
      // Verify the token and get user
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        })
      }

      // Add user and supabase client to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        id: user.id,
        email: user.email
      }
      authenticatedReq.supabase = supabase

      // Call the handler
      return handler(authenticatedReq, res)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      })
    }
  }
}

// Helper function for consistent API responses
export function apiResponse(res: NextApiResponse, status: number, data?: any, error?: string) {
  return res.status(status).json({
    success: status < 400,
    data,
    error
  })
} 
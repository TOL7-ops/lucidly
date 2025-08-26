// API service functions for Lucidly backend

export interface Dream {
  id: string
  user_id: string
  content: string
  transcript?: string
  summary?: string
  sentiment?: any
  interpretation?: string
  created_at: string
  // Frontend-specific fields that might be computed
  title?: string
  mood?: 'lucid' | 'nightmare' | 'peaceful' | 'vivid'
  tags?: string[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Base API configuration
const API_BASE = '/api'

// Get auth token from Supabase session with automatic refresh
const getAuthToken = async () => {
  if (typeof window !== 'undefined') {
    try {
      // Import supabase client dynamically to avoid SSR issues
      const { supabase } = await import('./supabase')
      
      // Get current session
      let { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return null
      }
      
      // If session exists but token is expired, try to refresh
      if (session && isTokenExpired(session.access_token)) {
        console.log('Token expired, attempting refresh...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Force re-login if refresh fails
          await supabase.auth.signOut()
          return null
        }
        
        session = refreshedSession
      }
      
      return session?.access_token || null
    } catch (e) {
      console.error('Error getting auth token:', e)
      return null
    }
  }
  return null
}

// Check if JWT token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp < currentTime
  } catch {
    return true // Assume expired if we can't decode
  }
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const token = await getAuthToken()
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config)
    const data = await response.json()
    
    if (!response.ok) {
      // Handle 401 specifically - token expired or invalid
      if (response.status === 401) {
        console.warn('Authentication failed, redirecting to login...')
        // Force re-authentication
        if (typeof window !== 'undefined') {
          const { supabase } = await import('./supabase')
          await supabase.auth.signOut()
          window.location.href = '/login'
        }
      }
      
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`
      }
    }
    
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// Dreams API
export const dreamsApi = {
  // Get all dreams for the current user
  getDreams: async (): Promise<ApiResponse<Dream[]>> => {
    return apiRequest<Dream[]>('/dreams')
  },

  // Get a single dream by ID
  getDream: async (id: string): Promise<ApiResponse<Dream>> => {
    return apiRequest<Dream>(`/dreams/${id}`)
  },

  // Create a new dream
  createDream: async (dream: {
    content?: string
    transcript?: string
  }): Promise<ApiResponse<Dream>> => {
    return apiRequest<Dream>('/dreams', {
      method: 'POST',
      body: JSON.stringify(dream)
    })
  },

  // Update a dream with AI analysis
  updateDream: async (
    id: string,
    updates: {
      generateSummary?: boolean
      generateSentiment?: boolean
      generateInterpretation?: boolean
    }
  ): Promise<ApiResponse<Dream>> => {
    return apiRequest<Dream>(`/dreams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
  },

  // Delete a dream
  deleteDream: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/dreams/${id}`, {
      method: 'DELETE'
    })
  }
}

// Transcription API
export const transcriptionApi = {
  // Transcribe audio to text
  transcribeAudio: async (audioBlob: Blob): Promise<ApiResponse<{ transcript: string }>> => {
    const token = await getAuthToken()
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.wav')

    try {
      const response = await fetch(`${API_BASE}/transcribe`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }
      
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }
}

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return apiRequest<{ status: string; timestamp: string }>('/health')
  }
}

// Utility function to extract title from content
export const extractTitle = (content: string): string => {
  const sentences = content.split(/[.!?]+/)
  const firstSentence = sentences[0]?.trim()
  
  if (firstSentence && firstSentence.length > 10) {
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...'
      : firstSentence
  }
  
  return content.length > 50 
    ? content.substring(0, 47) + '...'
    : content || 'Untitled Dream'
}

// Utility function to determine mood from sentiment
export const getMoodFromSentiment = (sentiment?: any): Dream['mood'] => {
  if (!sentiment) return 'peaceful'
  
  const label = sentiment.label?.toLowerCase()
  const score = sentiment.score || 0
  
  if (label === 'positive' && score > 0.7) return 'lucid'
  if (label === 'negative' && score > 0.6) return 'nightmare'
  if (label === 'positive') return 'peaceful'
  if (score > 0.8) return 'vivid'
  
  return 'peaceful'
} 
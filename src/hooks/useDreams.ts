import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dreamsApi, transcriptionApi, Dream, extractTitle, getMoodFromSentiment } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

// Query keys
export const DREAMS_QUERY_KEY = ['dreams']

// Custom hook for fetching dreams
export const useDreams = () => {
  const { toast } = useToast()
  
  const query = useQuery({
    queryKey: DREAMS_QUERY_KEY,
    queryFn: async () => {
      const response = await dreamsApi.getDreams()
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dreams')
      }
      
      // Transform backend data to include frontend fields
      const transformedDreams = response.data?.map(dream => ({
        ...dream,
        title: extractTitle(dream.content),
        mood: getMoodFromSentiment(dream.sentiment),
        date: new Date(dream.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        tags: [] // TODO: Extract tags from content or add tags field to backend
      })) || []
      
      return transformedDreams
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Disable by default, enable conditionally
  })

  return {
    dreams: (query.data || []) as Dream[],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch
  }
}

// Custom hook for creating dreams
export const useCreateDream = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (dreamData: { content?: string; transcript?: string }) => {
      const response = await dreamsApi.createDream(dreamData)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to create dream')
      }
      
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate and refetch dreams
      queryClient.invalidateQueries({ queryKey: DREAMS_QUERY_KEY })
      
      toast({
        title: 'Success',
        description: 'Your dream has been saved successfully!',
      })
    },
    onError: (error) => {
      console.error('Failed to create dream:', error)
      toast({
        title: 'Error',
        description: 'Failed to save your dream. Please try again.',
        variant: 'destructive',
      })
    }
  })
}

// Custom hook for updating dreams with AI analysis
export const useUpdateDream = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: {
        generateSummary?: boolean
        generateSentiment?: boolean
        generateInterpretation?: boolean
      }
    }) => {
      const response = await dreamsApi.updateDream(id, updates)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to update dream')
      }
      
      return response.data
    },
    onSuccess: (data) => {
      // Update the specific dream in the cache
      queryClient.setQueryData<Dream[]>(DREAMS_QUERY_KEY, (oldData) => {
        if (!oldData) return []
        
        return oldData.map(dream => 
          dream.id === data?.id 
            ? { 
                ...dream, 
                ...data,
                title: extractTitle(data.content),
                mood: getMoodFromSentiment(data.sentiment)
              }
            : dream
        )
      })
      
      toast({
        title: 'Success',
        description: 'AI analysis completed!',
      })
    },
    onError: (error) => {
      console.error('Failed to update dream:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate AI analysis. Please try again.',
        variant: 'destructive',
      })
    }
  })
}

// Custom hook for deleting dreams
export const useDeleteDream = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dreamsApi.deleteDream(id)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete dream')
      }
      
      return id
    },
    onSuccess: (deletedId) => {
      // Remove the dream from the cache
      queryClient.setQueryData<Dream[]>(DREAMS_QUERY_KEY, (oldData) => {
        if (!oldData) return []
        return oldData.filter(dream => dream.id !== deletedId)
      })
      
      toast({
        title: 'Success',
        description: 'Dream deleted successfully.',
      })
    },
    onError: (error) => {
      console.error('Failed to delete dream:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete dream. Please try again.',
        variant: 'destructive',
      })
    }
  })
}

// Custom hook for audio transcription
export const useTranscription = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const response = await transcriptionApi.transcribeAudio(audioBlob)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to transcribe audio')
      }
      
      return response.data?.transcript || ''
    },
    onError: (error) => {
      console.error('Failed to transcribe audio:', error)
      toast({
        title: 'Transcription Error',
        description: 'Failed to transcribe your recording. Please try again.',
        variant: 'destructive',
      })
    }
  })
} 
// NOTE: The following import block is fixed to avoid duplicate identifier errors.
// Only import these modules once in your file, and do not redeclare DREAMS_QUERY_KEY if already declared elsewhere.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dreamsApi, transcriptionApi, Dream, extractTitle, getMoodFromSentiment } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Query keys
export const DREAMS_QUERY_KEY = ['dreams'];

// -------------------------------
// Fetch dreams
// -------------------------------
export const useDreams = () => {
  const { toast } = useToast();

  const query = useQuery<Dream[], Error>({
    queryKey: DREAMS_QUERY_KEY,
    queryFn: async () => {
      const response = await dreamsApi.getDreams();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch dreams');
      }

      return (
        response.data?.map((dream) => ({
          ...dream,
          title: dream.title || extractTitle(dream.content),
          mood: getMoodFromSentiment(dream.sentiment),
          date: new Date(dream.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          tags: dream.tags || [],
        })) || []
      );
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // allow automatic fetching
  });

  return {
    dreams: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

// -------------------------------
// Create dream
// -------------------------------
export const useCreateDream = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dreamData: { title?: string; content?: string; transcript?: string; tags?: string[]; audioUrl?: string; audioPath?: string }) => {
      console.log('[useCreateDream] outgoing payload keys:', Object.keys(dreamData || {}));
      const response = await dreamsApi.createDream(dreamData);
      if (!response.success) {
        console.error('[useCreateDream] server error:', response.error);
        throw new Error(response.error || 'Failed to create dream');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DREAMS_QUERY_KEY });
      toast({
        title: 'Success',
        description: 'Your dream has been saved successfully!',
      });
    },
    onError: (error: unknown) => {
      console.error('Failed to create dream:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your dream. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// -------------------------------
// Update dream (AI analysis)
// -------------------------------
export const useUpdateDream = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: {
        generateSummary?: boolean
        generateSentiment?: boolean
        generateInterpretation?: boolean
      }
    }) => {
      const response = await dreamsApi.updateDream(id, updates);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update dream');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Dream[]>(DREAMS_QUERY_KEY, (oldData) => {
        if (!oldData) return [];
        return oldData.map((dream) =>
          dream.id === data?.id
            ? {
                ...dream,
                ...data,
                title: data.title || extractTitle(data.content),
                mood: getMoodFromSentiment(data.sentiment),
              }
            : dream,
        );
      });

      toast({
        title: 'Success',
        description: 'AI analysis completed!',
      });
    },
    onError: (error: unknown) => {
      console.error('Failed to update dream:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate AI analysis. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// -------------------------------
// Delete dream
// -------------------------------
export const useDeleteDream = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dreamsApi.deleteDream(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete dream');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData<Dream[]>(DREAMS_QUERY_KEY, (oldData) =>
        oldData ? oldData.filter((dream) => dream.id !== deletedId) : [],
      );

      toast({
        title: 'Success',
        description: 'Dream deleted successfully.',
      });
    },
    onError: (error: unknown) => {
      console.error('Failed to delete dream:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dream. Please try again.',
        variant: 'destructive',
      });
    },
  });
};

// -------------------------------
// Transcription (speech-to-text)
// -------------------------------
export const useTranscription = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (audioBlob: Blob) => {
      // Log audio blob details for debugging
      console.log(' Starting transcription request...');
      console.log(' Audio blob details:', {
        size: audioBlob.size,
        type: audioBlob.type || 'unknown',
      });

      // Validate audio blob before sending
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('No audio data provided. Please record some audio first.');
      }

      if (audioBlob.size < 1024) {
        throw new Error('Audio recording is too short. Please record for at least 1 second.');
      }

      if (audioBlob.size > 10 * 1024 * 1024) {
        throw new Error('Audio file is too large. Maximum size is 10MB.');
      }

      // Validate audio format
      const supportedTypes = ['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/opus'];
      const isValidType = supportedTypes.some(type => audioBlob.type.toLowerCase().includes(type.split('/')[1]));
      
      if (!isValidType) {
        throw new Error(`Unsupported audio format: ${audioBlob.type}. Supported formats: WAV, WebM, MP3, MP4, M4A, OGG, OPUS`);
      }

      try {
        const response = await transcriptionApi.transcribeAudio(audioBlob);
        
        if (!response.success) {
          // Extract the actual error message from the server
          const errorMessage = response.error || 'Failed to transcribe audio';
          console.error(' Transcription API error:', errorMessage);
          throw new Error(errorMessage);
        }
        
        if (!response.data?.transcript) {
          // Gracefully surface a user-friendly message instead of a vague error
          throw new Error('No speech detected in your recording. Please try again.');
        }
        
        console.log(' Transcription successful:', response.data.transcript.substring(0, 100) + '...');
        return response.data.transcript;
        
      } catch (error) {
        console.error(' Transcription error details:', error);
        
        // Re-throw the error to be handled by the mutation's onError
        throw error;
      }
    },
    onError: (error: unknown) => {
      console.error('Failed to transcribe audio:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to transcribe your recording. Please try again.';
      
      if (error instanceof Error) {
        const message = error.message;
        
        // Handle specific error types with user-friendly messages
        if (message.includes('No speech detected')) {
          errorMessage = 'No speech detected in your recording. Please try again.';
        } else if (message.includes('No audio data provided')) {
          errorMessage = 'No audio data detected. Please record some audio first.';
        } else if (message.includes('too short')) {
          errorMessage = 'Recording is too short. Please record for at least 1 second.';
        } else if (message.includes('too large')) {
          errorMessage = 'Audio file is too large. Please try a shorter recording (max 10MB).';
        } else if (message.includes('Unsupported audio format')) {
          errorMessage = message; // Use the specific format error message
        } else if (message.includes('Authentication failed')) {
          errorMessage = 'Transcription service authentication error. Please contact support.';
        } else if (message.includes('Rate limit exceeded')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (message.includes('Service unavailable')) {
          errorMessage = 'Transcription service is temporarily unavailable. Please try again later.';
        } else if (message.includes('All Hugging Face transcription models failed')) {
          errorMessage = 'All transcription models are currently unavailable. Please try again later.';
        } else if (message.includes('timeout')) {
          errorMessage = 'Transcription timed out. Please try with a shorter recording.';
        } else if (message.includes('Network error')) {
          errorMessage = 'Network connection error. Please check your internet connection and try again.';
        } else if (message.includes('HTTP 4')) {
          errorMessage = `Request error: ${message}`;
        } else if (message.includes('HTTP 5')) {
          errorMessage = `Server error: ${message}`;
        } else if (message.length > 0) {
          // Use the actual error message if it's meaningful
          errorMessage = message;
        }
      }
      
      toast({
        title: 'Transcription Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};



// -------------------------------
// Fetch single dream by ID
// -------------------------------
export const useDream = (id: string) => {
  const query = useQuery<Dream, Error>({
    queryKey: [...DREAMS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await dreamsApi.getDreamById(id);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch dream');
      }
      return response.data;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  return {
    dream: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

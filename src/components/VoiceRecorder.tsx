import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Play, Pause, Square, Crown } from 'lucide-react';

interface VoiceRecorderProps {
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  isPremium = false, 
  onUpgrade 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (!isPremium) {
      onUpgrade?.();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        
        // Mock transcript generation
        setTimeout(() => {
          setTranscript("I had this incredible dream where I was floating through a cosmic landscape filled with stars and nebulas. The colors were so vivid - deep purples and blues swirling around me. I felt completely weightless and free, like I was swimming through space itself...");
        }, 1000);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      const stream = mediaRecorderRef.current.stream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const playAudio = () => {
    if (audioBlob && !isPlaying) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setTranscript('');
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  if (!isPremium) {
    return (
      <Card variant="glass" className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-aurora/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            Voice Recording
            <Crown className="w-4 h-4 text-amber-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-aurora/20 flex items-center justify-center mx-auto">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Premium Feature</h3>
              <p className="text-muted-foreground">
                Record your dreams with voice and get AI-powered transcripts with Lucidly Premium
              </p>
            </div>
            <Button variant="cosmic" onClick={onUpgrade}>
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-aurora/20 flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary" />
          </div>
          Voice Recording
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <Button
              variant="cosmic"
              size="lg"
              onClick={startRecording}
              className="rounded-full w-16 h-16"
            >
              <Mic className="w-6 h-6" />
            </Button>
          ) : (
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
            >
              <Square className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording...</span>
            </div>
          </div>
        )}

        {/* Audio Playback */}
        {audioBlob && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="glass"
                onClick={isPlaying ? pauseAudio : playAudio}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button variant="ghost" onClick={clearRecording}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Transcript</label>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="glass border-glass-border/50 bg-glass-bg/50 min-h-[120px]"
              placeholder="Your voice will be transcribed here..."
            />
            <p className="text-xs text-muted-foreground">
              ✨ AI-generated transcript. You can edit it above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
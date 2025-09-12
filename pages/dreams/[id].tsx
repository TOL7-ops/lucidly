import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Dream, extractTitle, getMoodFromSentiment } from '@/lib/api';
import { useDream, useDeleteDream, useUpdateDream } from '@/hooks/useDreams';
import { resolvePublicUrlForAudioPath } from '@/lib/uploadAudio';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Download, Calendar as CalendarIcon, Headphones, Smile, Trash, Moon, Brain, Loader2 } from 'lucide-react';

const formatDate = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
};

const buildTxtExport = (dream: Dream, resolvedAudioUrl?: string) => {
  const title = dream.title || extractTitle(dream.content || '') || 'Untitled Dream';
  const date = formatDate(dream.created_at);
  const sentiment = dream.sentiment?.label
    ? `${dream.sentiment.label}${dream.sentiment.score ? ` (${(dream.sentiment.score * 100).toFixed(1)}%)` : ''}`
    : 'N/A';
  const transcript = dream.transcript?.trim() ? dream.transcript.trim() : 'N/A';

  const lines = [
    `Title: ${title}`,
    `Date: ${date}`,
    '',
    'Content:',
    dream.content || '',
    '',
    'Transcript:',
    transcript,
    '',
    'Sentiment:',
    sentiment,
  ];

  if (resolvedAudioUrl) {
    lines.push('', 'Audio URL:', resolvedAudioUrl);
  }

  return lines.join('\n');
};

export default function DreamDetailsPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const { dream, isLoading, isError, error, refetch } = useDream(id);

  const deleteDreamMutation = useDeleteDream();
  const updateDreamMutation = useUpdateDream();
  const { toast } = useToast();
 
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let active = true;
    const resolveAudioUrl = async () => {
      if (!dream) {
        if (active) setAudioUrl(null);
        return;
      }
      // Prefer explicit audio_url from DB
      if (dream.audio_url) {
        if (active) setAudioUrl(dream.audio_url);
        return;
      }
      // Try resolving a public URL from audio_path across known buckets
      if (dream.audio_path) {
        try {
          const publicUrl = await resolvePublicUrlForAudioPath(dream.audio_path);
          if (active) setAudioUrl(publicUrl ?? null);
        } catch (e) {
          console.warn('Failed to resolve public URL for audio_path:', e);
          if (active) setAudioUrl(null);
        }
      } else {
        if (active) setAudioUrl(null);
      }
    };
    resolveAudioUrl();
    return () => {
      active = false;
    };
  }, [dream]);

  const title = useMemo(() => {
    if (!dream) return 'Dream Details';
    return dream.title || extractTitle(dream.content || '') || 'Untitled Dream';
  }, [dream]);

  const mood = useMemo(() => getMoodFromSentiment(dream?.sentiment), [dream]);
  const dateNice = useMemo(() => formatDate(dream?.created_at), [dream]);

  const onExportTxt = () => {
    if (!dream) return;
    const text = buildTxtExport(dream, audioUrl ?? undefined);
    const safeTitle = (title || 'dream').replace(/[^a-z0-9\-_ ]/gi, '').replace(/\s+/g, '_').toLowerCase();
    const fileName = `${safeTitle || 'dream'}_${(dateNice || '').replace(/[^a-z0-9]/gi, '-')}.txt`;
 
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'dream.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onGenerateAI = async () => {
    if (!dream) return;
    try {
      setGenerating(true);
      await updateDreamMutation.mutateAsync({
        id: dream.id,
        updates: { generateSummary: true, generateInterpretation: true },
      });
      await refetch();
      toast({
        title: 'AI Updated',
        description: 'Summary and interpretation generated.',
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate AI analysis. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const onDeleteConfirmed = async () => {
    if (!dream) return;
    try {
      await deleteDreamMutation.mutateAsync(dream.id);
      toast({
        title: 'Deleted',
        description: 'Dream deleted successfully.',
      });
      router.push('/app');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete dream. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="h-10 w-1/2 bg-muted animate-pulse rounded-md" />
          <div className="h-5 w-1/4 bg-muted animate-pulse rounded-md" />
          <div className="h-64 w-full bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-destructive">
            <span className="font-semibold">Failed to load dream.</span>
            <span className="text-sm">{error?.message}</span>
          </div>
          <Button variant="glass" onClick={() => router.push('/app')}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!dream) {
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header - mirrors NewDreamForm structure */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold font-jakarta">
              <span className="text-cosmic">Dream</span>
              <span className="text-foreground"> Details</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              {dateNice}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => router.push('/app')}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              variant="cosmic"
              onClick={onGenerateAI}
              disabled={generating || updateDreamMutation.isPending}
            >
              {generating || updateDreamMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Generate AI Summary
                </>
              )}
            </Button>
 
            <Button variant="cosmic" onClick={onExportTxt}>
              <Download className="w-4 h-4" />
              Export
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Dream</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this dream? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeleteConfirmed}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card variant="glass" className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-aurora/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              Dream Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Title at the top */}
            {title && title !== 'Untitled Dream' && (
              <div className="text-center">
                <h2 className="text-3xl font-bold font-jakarta text-cosmic">{title}</h2>
              </div>
            )}

            {/* Date and Sentiment */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
              <CalendarIcon className="w-4 h-4" />
              <span>{dateNice}</span>
              {dream.sentiment?.label && (
                <>
                  <span className="opacity-50">•</span>
                  <Smile className="w-4 h-4" />
                  <span className="capitalize">{dream.sentiment.label.toLowerCase()}</span>
                  {typeof dream.sentiment.score === 'number' && (
                    <span className="opacity-70">({(dream.sentiment.score * 100).toFixed(1)}%)</span>
                  )}
                  <span className="opacity-50">•</span>
                  <span className="capitalize">{mood}</span>
                </>
              )}
            </div>

            {/* Dream Recording Section */}
            {audioUrl && (
              <>
                <div className="border border-glass-border/30 rounded-lg p-4 bg-glass-bg/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    <Headphones className="w-5 h-5 text-primary" />
                    Dream Recording
                  </h3>
                  <audio controls src={audioUrl} className="w-full">
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <hr className="border-glass-border/30" />
              </>
            )}

            {/* Dream Description Section */}
            <div className="border border-glass-border/30 rounded-lg p-4 bg-glass-bg/20">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                📖 Dream Description
              </h3>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {dream.content || 'No content available.'}
              </p>
            </div>

            {/* Transcript Section */}
            {dream.transcript && (
              <>
                <hr className="border-glass-border/30" />
                <div className="border border-glass-border/30 rounded-lg p-4 bg-glass-bg/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    📝 Transcript
                  </h3>
                  <div className="max-h-64 overflow-y-auto">
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {dream.transcript}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Summary Section */}
            <>
              <hr className="border-glass-border/30" />
              <div className="border border-glass-border/30 rounded-lg p-4 bg-glass-bg/20">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  🧠 Summary
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {dream.summary || 'No summary generated yet. Use "Generate AI Summary" to create one.'}
                </p>
              </div>
            </>

            {/* Interpretation Section */}
            <>
              <hr className="border-glass-border/30" />
              <div className="border border-glass-border/30 rounded-lg p-4 bg-glass-bg/20">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  ✨ Interpretation
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {dream.interpretation || 'No interpretation generated yet.'}
                </p>
              </div>
            </>

            {/* Tags Section */}
            {Array.isArray(dream.tags) && dream.tags.length > 0 && (
              <>
                <hr className="border-glass-border/30" />
                <div className="border border-glass-border/30 rounded-lg p-4 bg-glass-bg/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                    🏷 Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dream.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="glass border-primary/20 bg-primary/10 text-primary-foreground/80 px-3 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
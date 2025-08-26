import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dreamsApi } from '@/lib/api';
import { Moon, Star, Cloud, Sparkles, Brain, Loader2 } from 'lucide-react';

interface DreamCardProps {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: 'lucid' | 'nightmare' | 'peaceful' | 'vivid';
  tags?: string[];
  summary?: string;
  interpretation?: string;
  onClick?: () => void;
}

const moodConfig = {
  lucid: { icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10' },
  nightmare: { icon: Cloud, color: 'text-destructive', bg: 'bg-destructive/10' },
  peaceful: { icon: Moon, color: 'text-secondary', bg: 'bg-secondary/10' },
  vivid: { icon: Star, color: 'text-primary', bg: 'bg-primary/10' },
};

export const DreamCard: React.FC<DreamCardProps> = ({
  id,
  title,
  content,
  date,
  mood = 'peaceful',
  tags = [],
  summary,
  interpretation,
  onClick,
}) => {
  const MoodIcon = moodConfig[mood].icon;
  const [aiSummary, setAiSummary] = useState<string | null>(summary || interpretation || null);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      console.log('Starting summary generation for dream:', id);
      console.log('Dream content:', content);
      
      // Single API call that generates and saves the summary
      const requestBody = { text: content, dreamId: id };
      console.log('Sending request to /api/summary:', requestBody);
      
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.summary) {
        console.log('Summary generated and saved successfully');
        setAiSummary(data.summary); // Update UI immediately
      } else {
        console.error('Failed to generate summary:', data);
        alert("Failed to generate summary.");
      }
    } catch (err) {
      console.error("Summary error:", err);
      alert("Error generating summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      variant="dream"
      className="cursor-pointer group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Floating mood icon */}
      <div className="absolute top-4 right-4 float-element">
        <div className={`p-2 rounded-full ${moodConfig[mood].bg} backdrop-blur-sm`}>
          <MoodIcon className={`w-4 h-4 ${moodConfig[mood].color}`} />
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-jakarta group-hover:text-cosmic transition-colors duration-300">
            {title}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{date}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-foreground/80 line-clamp-3 leading-relaxed">
          {content}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs glass border-primary/20 bg-primary/10 text-primary-foreground/80"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* AI Summary Section */}
        <div className="border-t border-glass-border/30 pt-4 mt-4">
          {!aiSummary ? (
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={(e) => {
                console.log('Button clicked, preventing default behavior');
                e.preventDefault();
                e.stopPropagation();
                console.log('Calling handleSummarize...');
                handleSummarize();
              }}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Summary...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Generate AI Summary
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI Dream Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
                {aiSummary}
              </p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </Card>
  );
};
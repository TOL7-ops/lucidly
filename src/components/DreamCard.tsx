import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Star, Cloud, Sparkles } from 'lucide-react';

interface DreamCardProps {
  id: string;
  title: string;
  content: string;
  date: string;
  mood?: 'lucid' | 'nightmare' | 'peaceful' | 'vivid';
  tags?: string[];
  onClick?: () => void;
}

const moodConfig = {
  lucid: { icon: Sparkles, color: 'text-accent', bg: 'bg-accent/10' },
  nightmare: { icon: Cloud, color: 'text-destructive', bg: 'bg-destructive/10' },
  peaceful: { icon: Moon, color: 'text-secondary', bg: 'bg-secondary/10' },
  vivid: { icon: Star, color: 'text-primary', bg: 'bg-primary/10' },
};

export const DreamCard: React.FC<DreamCardProps> = ({
  title,
  content,
  date,
  mood = 'peaceful',
  tags = [],
  onClick,
}) => {
  const MoodIcon = moodConfig[mood].icon;

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
      </CardContent>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
    </Card>
  );
};
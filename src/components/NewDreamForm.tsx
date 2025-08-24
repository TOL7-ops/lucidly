import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { Moon, Star, Cloud, Sparkles, Save, X, Plus, Calendar } from 'lucide-react';

interface NewDreamFormProps {
  onSave: (dream: any) => void;
  onCancel: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

export const NewDreamForm: React.FC<NewDreamFormProps> = ({ 
  onSave, 
  onCancel, 
  isPremium = false, 
  onUpgrade 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<'lucid' | 'nightmare' | 'peaceful' | 'vivid'>('peaceful');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  const moodOptions = [
    { value: 'lucid', label: 'Lucid', icon: Sparkles, color: 'text-accent bg-accent/10' },
    { value: 'nightmare', label: 'Nightmare', icon: Cloud, color: 'text-destructive bg-destructive/10' },
    { value: 'peaceful', label: 'Peaceful', icon: Moon, color: 'text-secondary bg-secondary/10' },
    { value: 'vivid', label: 'Vivid', icon: Star, color: 'text-primary bg-primary/10' },
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      onSave({
        title: title.trim(),
        content: content.trim(),
        mood,
        tags,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold font-jakarta">
              <span className="text-cosmic">New</span>
              <span className="text-foreground"> Dream</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Capture the magic of your nocturnal adventures
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel}>
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button 
              variant="cosmic" 
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
            >
              <Save className="w-4 h-4" />
              Save Dream
            </Button>
          </div>
        </div>

        {/* Form */}
        <Card variant="glass" className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-aurora/20 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              Dream Details
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6" onKeyDown={handleKeyPress}>
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dream Title</label>
              <Input
                placeholder="Give your dream a memorable title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="glass border-glass-border/50 bg-glass-bg/50 text-lg"
              />
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Mood Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Dream Mood</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {moodOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setMood(option.value as any)}
                      className={`
                        p-4 rounded-2xl border transition-all duration-300 text-left
                        ${mood === option.value
                          ? 'border-primary bg-primary/10 shadow-glow'
                          : 'glass border-glass-border/50 hover:border-primary/30'
                        }
                      `}
                    >
                      <div className={`w-8 h-8 rounded-xl ${option.color} flex items-center justify-center mb-2`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Recording */}
            <VoiceRecorder 
              isPremium={isPremium} 
              onUpgrade={onUpgrade}
            />

            {/* Content */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dream Description</label>
              <Textarea
                placeholder="Describe your dream in detail... What did you see, feel, or experience?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="glass border-glass-border/50 bg-glass-bg/50 min-h-[200px] resize-none"
                rows={8}
              />
            </div>

            {/* Tags */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Dream Tags</label>
              
              {/* Add new tag */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="glass border-glass-border/50 bg-glass-bg/50 flex-1"
                />
                <Button 
                  variant="glass" 
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Display tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="glass border-primary/20 bg-primary/10 text-primary-foreground/80 px-3 py-1 cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tips */}
            <Card variant="cosmic" className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-primary mb-2">💡 Dream Recording Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Record your dream as soon as you wake up</li>
                  <li>• Include emotions, colors, and sensory details</li>
                  <li>• Note any recurring symbols or themes</li>
                  <li>• Don't worry about perfect grammar or structure</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>

          {/* Floating elements */}
          <div className="absolute top-4 right-4 float-element opacity-20">
            <Star className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute bottom-4 left-4 float-element opacity-10">
            <Sparkles className="w-8 h-8 text-accent" />
          </div>
        </Card>
      </div>
    </div>
  );
};
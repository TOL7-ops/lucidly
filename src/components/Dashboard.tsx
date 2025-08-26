import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DreamCard } from '@/components/DreamCard';
import { useDreams } from '@/hooks/useDreams';
import { useAuth } from '@/lib/auth-context';
import { Plus, Search, Filter, Moon, Star, Sparkles, TrendingUp, Loader2 } from 'lucide-react';

interface DashboardProps {
  onNewDream: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewDream }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  
  // Use real API if authenticated, otherwise show empty state
  const dreamsQuery = useDreams();
  const shouldUseMockData = !isAuthenticated;
  
  // Only fetch dreams if authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      dreamsQuery.refetch();
    }
  }, [isAuthenticated]);
  
  const displayDreams = shouldUseMockData ? [] : dreamsQuery.dreams;
  const isLoading = shouldUseMockData ? false : dreamsQuery.isLoading;
  const isError = shouldUseMockData ? false : dreamsQuery.isError;
  const error = shouldUseMockData ? null : dreamsQuery.error;

  const filteredDreams = displayDreams.filter((dream: any) =>
    (dream.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    dream.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dream.tags || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    totalDreams: displayDreams.length,
    lucidDreams: displayDreams.filter((d: any) => d.mood === 'lucid').length,
    thisWeek: displayDreams.filter((d: any) => {
      const dreamDate = new Date(d.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return dreamDate >= weekAgo;
    }).length,
    avgDuration: '7.5 hrs' // This could be calculated from actual data in the future
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold font-jakarta">
              <span className="text-cosmic">Dream</span>
              <span className="text-foreground"> Dashboard</span>
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Explore your nocturnal adventures and track your dream journey
            </p>
          </div>
          
          <Button 
            variant="cosmic" 
            size="lg"
            onClick={onNewDream}
            className="group self-start lg:self-auto"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Record New Dream
          </Button>
        </div>

        {/* Authentication Status */}
        {isAuthenticated && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Welcome back! You're logged in as <span className="font-medium">{user?.email}</span>
            </p>
          </div>
        )}
        
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="glass" className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Dreams</p>
                  <p className="text-3xl font-bold text-cosmic">{stats.totalDreams}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Moon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lucid Dreams</p>
                  <p className="text-3xl font-bold text-cosmic">{stats.lucidDreams}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">This Week</p>
                  <p className="text-3xl font-bold text-cosmic">{stats.thisWeek}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg. Sleep</p>
                  <p className="text-3xl font-bold text-cosmic">{stats.avgDuration}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your dreams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-glass-border/50 bg-glass-bg/50"
            />
          </div>
          <Button variant="glass" className="sm:w-auto">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>

        {/* Dreams Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-jakarta">
              Recent Dreams
              <span className="text-muted-foreground ml-2">({filteredDreams.length})</span>
            </h2>
          </div>

          {filteredDreams.length === 0 ? (
            <Card variant="glass" className="text-center py-12">
              <CardContent>
                <Moon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No dreams found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'Try adjusting your search terms' : 'Start recording your dreams to see them here'}
                </p>
                <Button variant="cosmic" onClick={onNewDream}>
                  <Plus className="w-4 h-4" />
                  Record Your First Dream
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDreams.map((dream) => (
                <DreamCard
                  key={dream.id}
                  id={dream.id}
                  title={dream.title || 'Untitled Dream'}
                  content={dream.content}
                  date={new Date(dream.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  mood={dream.mood}
                  tags={dream.tags || []}
                  summary={dream.summary}
                  interpretation={dream.interpretation}
                  onClick={() => console.log('Open dream:', dream.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
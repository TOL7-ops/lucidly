import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DreamCard } from '@/components/DreamCard';
import { Plus, Search, Filter, Moon, Star, Sparkles, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onNewDream: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNewDream }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock dream data
  const dreams = [
    {
      id: '1',
      title: 'Flying Through Crystal Caverns',
      content: 'I found myself soaring through an underground cavern filled with massive, glowing crystals. The walls sparkled with every color imaginable, and I could control my flight with just my thoughts. The crystals hummed with a gentle melody that seemed to guide my path deeper into the earth.',
      date: 'December 23, 2024',
      mood: 'lucid' as const,
      tags: ['flying', 'crystals', 'underground', 'music', 'control']
    },
    {
      id: '2',
      title: 'Ocean of Stars',
      content: 'I was swimming in what appeared to be an ocean, but the water was made of liquid starlight. Each stroke through the cosmic sea left trails of golden light behind me. Fish made of constellations swam alongside me, and I felt completely at peace.',
      date: 'December 22, 2024',
      mood: 'peaceful' as const,
      tags: ['ocean', 'stars', 'swimming', 'cosmic', 'peace']
    },
    {
      id: '3',
      title: 'The Infinite Library',
      content: 'Endless shelves stretched in every direction, filled with books that seemed to write themselves as I watched. The words on the pages shifted and changed, telling stories I had never heard before. A wise owl perched on my shoulder, whispering secrets of the universe.',
      date: 'December 21, 2024',
      mood: 'vivid' as const,
      tags: ['library', 'books', 'wisdom', 'owl', 'infinite']
    },
    {
      id: '4',
      title: 'Dancing with Shadows',
      content: 'In a moonlit ballroom, I danced with shadows that had lives of their own. They moved gracefully across the marble floor, and as we danced, they shared stories of the people they once belonged to. The music seemed to come from the walls themselves.',
      date: 'December 20, 2024',
      mood: 'peaceful' as const,
      tags: ['dancing', 'shadows', 'ballroom', 'moon', 'stories']
    },
    {
      id: '5',
      title: 'The Clockwork City',
      content: 'A city made entirely of gears, springs, and clockwork mechanisms. Buildings rotated slowly, streets moved like conveyor belts, and the sky was filled with floating timepieces. I could hear the rhythmic ticking that kept the entire world in motion.',
      date: 'December 19, 2024',
      mood: 'vivid' as const,
      tags: ['clockwork', 'mechanical', 'city', 'time', 'gears']
    },
    {
      id: '6',
      title: 'Forest of Singing Trees',
      content: 'Each tree in this magical forest had a voice, creating a harmonious choir that echoed through the misty air. As I walked the winding paths, the trees would lean down to whisper ancient secrets and sing lullabies that made flowers bloom instantly.',
      date: 'December 18, 2024',
      mood: 'peaceful' as const,
      tags: ['forest', 'singing', 'trees', 'music', 'magic']
    }
  ];

  const filteredDreams = dreams.filter(dream =>
    dream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dream.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dream.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = {
    totalDreams: dreams.length,
    lucidDreams: dreams.filter(d => d.mood === 'lucid').length,
    thisWeek: 4,
    avgDuration: '7.5 hrs'
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
                  {...dream}
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
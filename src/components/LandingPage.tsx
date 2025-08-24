import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Star, Cloud, Sparkles, BookOpen, Users, Shield, Check, Crown, Mic } from 'lucide-react';
import heroImage from '@/assets/hero-cosmic.jpg';
import dreamBook from '@/assets/dream-book.jpg';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const features = [
    {
      icon: BookOpen,
      title: "Dream Journal",
      description: "Capture your dreams with our intuitive and beautiful interface designed for reflection."
    },
    {
      icon: Sparkles,
      title: "Lucid Tracking",
      description: "Track your lucid dreaming progress and discover patterns in your dream consciousness."
    },
    {
      icon: Moon,
      title: "Sleep Insights",
      description: "Understand your sleep patterns and how they affect your dreaming experience."
    },
    {
      icon: Users,
      title: "Dream Community",
      description: "Connect with fellow dreamers and share your extraordinary nocturnal adventures."
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your dreams are personal. We ensure your journal remains completely private and secure."
    },
    {
      icon: Star,
      title: "Dream Analysis",
      description: "Get insights into your dreams with AI-powered analysis and interpretation tools."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating cosmic elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 float-element">
          <Star className="w-6 h-6 text-primary/40" />
        </div>
        <div className="absolute top-40 right-20 float-element">
          <Moon className="w-8 h-8 text-secondary/30" />
        </div>
        <div className="absolute bottom-40 left-20 float-element">
          <Cloud className="w-10 h-10 text-accent/20" />
        </div>
        <div className="absolute top-60 left-1/2 float-element">
          <Sparkles className="w-4 h-4 text-primary/50" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bold font-jakarta leading-tight">
                  <span className="text-cosmic">Dream</span>
                  <br />
                  <span className="text-foreground">Beyond</span>
                  <br />
                  <span className="text-cosmic">Reality</span>
                </h1>
                <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                  Capture, explore, and understand your dreams with Lucidly - the most beautiful dream journal designed for mindful dreamers.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="cosmic" 
                  size="xl"
                  onClick={onGetStarted}
                  className="group"
                >
                  <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                  Start Your Journey
                </Button>
                <Button variant="glass" size="xl">
                  <BookOpen className="w-5 h-5" />
                  Learn More
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic">10K+</div>
                  <div className="text-sm text-muted-foreground">Dreams Captured</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic">2K+</div>
                  <div className="text-sm text-muted-foreground">Active Dreamers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cosmic">95%</div>
                  <div className="text-sm text-muted-foreground">Dream Recall Rate</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="glass-card p-8 relative overflow-hidden group">
                <img 
                  src={heroImage} 
                  alt="Cosmic dreamscape" 
                  className="w-full h-96 object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              </div>
              
              {/* Floating dream book */}
              <div className="absolute -bottom-8 -left-8 w-32 h-32 float-element">
                <img 
                  src={dreamBook} 
                  alt="Dream journal" 
                  className="w-full h-full object-cover rounded-full shadow-cosmic"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold font-jakarta mb-6">
              <span className="text-cosmic">Everything You Need</span>
              <br />
              <span className="text-foreground">to Dream Lucidly</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover the tools and features that make Lucidly the perfect companion for your dream exploration journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} variant="floating" className="group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-2xl bg-gradient-aurora/20 flex items-center justify-center mb-4 group-hover:bg-gradient-aurora/30 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-jakarta group-hover:text-cosmic transition-colors duration-300">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold font-jakarta mb-6">
              <span className="text-cosmic">Choose Your</span>
              <br />
              <span className="text-foreground">Dream Experience</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start your journey for free or unlock premium features for advanced dream exploration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card variant="glass" className="relative">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-jakarta mb-2">Free Explorer</CardTitle>
                <div className="text-4xl font-bold text-cosmic mb-4">$0</div>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Unlimited dream entries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Basic mood tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Dream tags & search</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Basic dream statistics</span>
                  </li>
                </ul>
                <Button 
                  variant="glass" 
                  size="lg" 
                  className="w-full"
                  onClick={onGetStarted}
                >
                  Start Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card variant="cosmic" className="relative border-primary/50 shadow-cosmic">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-aurora text-primary-foreground px-4 py-1 font-semibold">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-jakarta mb-2 text-primary-foreground flex items-center justify-center gap-2">
                  <Crown className="w-6 h-6 text-amber-400" />
                  Premium Dreamer
                </CardTitle>
                <div className="text-4xl font-bold text-primary-foreground mb-4">$9.99</div>
                <p className="text-primary-foreground/80">Everything you need for deep dream exploration</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-primary-foreground">Everything in Free</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span className="text-primary-foreground font-medium">Voice dream recording</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-primary-foreground">AI-powered transcription</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-primary-foreground">AI dream analysis & insights</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-primary-foreground">Advanced lucid tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-primary-foreground">Export & backup dreams</span>
                  </li>
                </ul>
                <Button 
                  variant="glass" 
                  size="lg" 
                  className="w-full bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card variant="cosmic" className="p-12 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-5xl font-bold font-jakarta mb-6 text-primary-foreground">
                Ready to Explore Your Dreams?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of dreamers who have already started their journey into the fascinating world of lucid dreaming.
              </p>
              <Button 
                variant="glass" 
                size="xl"
                onClick={onGetStarted}
                className="bg-white/20 text-primary-foreground border-white/30 hover:bg-white/30"
              >
                <Moon className="w-5 h-5" />
                Begin Your Dream Journey
              </Button>
            </div>
            
            {/* Background animation */}
            <div className="absolute inset-0 bg-gradient-aurora opacity-20 animate-aurora" />
          </Card>
        </div>
      </section>
    </div>
  );
};
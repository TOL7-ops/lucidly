import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';
import { NewDreamForm } from '@/components/NewDreamForm';
import { useAuth } from '@/lib/auth-context';

type ViewType = 'landing' | 'dashboard' | 'new-dream' | 'settings';

const Index = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [isPremium, setIsPremium] = useState(false);

  // Redirect to login if not authenticated and trying to access protected routes
  useEffect(() => {
    if (!loading && !isAuthenticated && (currentView === 'dashboard' || currentView === 'new-dream')) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, currentView, router]);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleNewDream = () => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setCurrentView('new-dream');
    }
  };

  const handleViewChange = (view: string) => {
    if ((view === 'dashboard' || view === 'new-dream') && !isAuthenticated) {
      router.push('/login');
    } else {
      setCurrentView(view as ViewType);
    }
  };

  const handleSaveDream = () => {
    console.log('Dream saved successfully');
    setCurrentView('dashboard');
  };

  const handleCancelDream = () => {
    setCurrentView('dashboard');
  };

  const handleUpgrade = () => {
    // In a real app, this would handle payment processing
    setIsPremium(true);
    alert('Welcome to Lucidly Premium! 🎉');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} />;
      case 'dashboard':
        if (!isAuthenticated) {
          return <LandingPage onGetStarted={handleGetStarted} />;
        }
        return <Dashboard onNewDream={handleNewDream} />;
      case 'new-dream':
        if (!isAuthenticated) {
          return <LandingPage onGetStarted={handleGetStarted} />;
        }
        return (
          <NewDreamForm 
            onSave={handleSaveDream} 
            onCancel={handleCancelDream}
            isPremium={isPremium}
            onUpgrade={handleUpgrade}
          />
        );
      case 'settings':
        return (
          <div className="min-h-screen pt-20 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-cosmic">Settings</h1>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </div>
        );
      default:
        return <LandingPage onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen relative">
      <Navigation currentView={currentView} onViewChange={handleViewChange} />
      {renderCurrentView()}
    </div>
  );
};

export default Index;

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/components/LandingPage';
import { Dashboard } from '@/components/Dashboard';
import { NewDreamForm } from '@/components/NewDreamForm';

type ViewType = 'landing' | 'dashboard' | 'new-dream' | 'settings';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [isPremium, setIsPremium] = useState(false);

  const handleGetStarted = () => {
    setCurrentView('dashboard');
  };

  const handleNewDream = () => {
    setCurrentView('new-dream');
  };

  const handleSaveDream = (dream: any) => {
    console.log('Saving dream:', dream);
    // In a real app, this would save to a database
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

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onGetStarted={handleGetStarted} />;
      case 'dashboard':
        return <Dashboard onNewDream={handleNewDream} />;
      case 'new-dream':
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
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {renderCurrentView()}
    </div>
  );
};

export default Index;

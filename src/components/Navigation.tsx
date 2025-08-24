import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Home, Book, Plus, Settings, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationProps {
  currentView: 'landing' | 'dashboard' | 'new-dream' | 'settings';
  onViewChange: (view: 'landing' | 'dashboard' | 'new-dream' | 'settings') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('light');
  };

  const navigationItems = [
    { id: 'landing', icon: Home, label: 'Home' },
    { id: 'dashboard', icon: Book, label: 'Dreams' },
    { id: 'new-dream', icon: Plus, label: 'New Dream' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <>
      {/* Top navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-aurora flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold font-jakarta text-cosmic">
                Lucidly
              </span>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "cosmic" : "ghost"}
                    size="sm"
                    onClick={() => onViewChange(item.id as any)}
                    className={cn(
                      "relative",
                      isActive && "shadow-glow"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Theme toggle and search */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Search className="w-4 h-4" />
              </Button>
              <Button
                variant="glass"
                size="icon"
                onClick={toggleTheme}
                className="relative overflow-hidden"
              >
                <Sun className={cn(
                  "w-4 h-4 transition-all duration-300",
                  isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
                )} />
                <Moon className={cn(
                  "absolute w-4 h-4 transition-all duration-300",
                  isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
                )} />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass border-t border-glass-border/50 px-4 py-2">
          <div className="flex items-center justify-around">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "cosmic" : "ghost"}
                  size="sm"
                  onClick={() => onViewChange(item.id as any)}
                  className={cn(
                    "flex-col h-auto py-2 px-3 gap-1",
                    isActive && "shadow-glow"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
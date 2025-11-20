import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, User, Menu } from 'lucide-react';

interface HeaderProps {
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onMenuClick?: () => void;
}

export const Header = ({ 
  isAuthenticated = false, 
  onLoginClick, 
  onSignupClick,
  onMenuClick 
}: HeaderProps) => {
  return (
  <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-gradient-to-r from-indigo-50 via-white to-purple-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Play className="h-4 w-4 text-primary-foreground fill-current" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              FlowToManual
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/#features" className="text-sm font-medium hover:text-primary transition-colors">Features</Link>
          <Link to="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</Link>
          <Link to="/manuals" className="text-sm font-medium hover:text-primary transition-colors">Documentation</Link>
          <Link to="/recordings" className="text-sm font-medium hover:text-primary transition-colors">Recordings</Link>
          <Link to="/sops" className="text-sm font-medium hover:text-primary transition-colors">SOPs</Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" onClick={onLoginClick}>
                Login
              </Button>
              <Button variant="hero" onClick={onSignupClick}>
                Start Free Trial
              </Button>
            </div>
          )}
          
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, User, Menu } from 'lucide-react';
import ProtectedFeatureLink from '@/components/ProtectedFeatureLink';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  onMenuClick?: () => void;
  profile?: any;
}

export const Header = ({ 
  isAuthenticated = false, 
  onLoginClick, 
  onSignupClick,
  onMenuClick,
  profile
}: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-gradient-to-r from-indigo-50 via-white to-purple-50">
      <div className="container flex h-16 items-center justify-between">

        {/* Logo */}
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
          <ProtectedFeatureLink to="/#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </ProtectedFeatureLink>

          <ProtectedFeatureLink to="/#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </ProtectedFeatureLink>

          <ProtectedFeatureLink to="/manuals" className="text-sm font-medium hover:text-primary transition-colors">
            Documentation
          </ProtectedFeatureLink>

          <ProtectedFeatureLink to="/recordings" className="text-sm font-medium hover:text-primary transition-colors">
            Recordings
          </ProtectedFeatureLink>

          <ProtectedFeatureLink to="/sops" className="text-sm font-medium hover:text-primary transition-colors">
            SOPs
          </ProtectedFeatureLink>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-3">

          {isAuthenticated ? (
            <div className="flex items-center gap-2">

              {/* ⭐ Profile Dropdown ⭐ */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-64 mr-4 mt-2 shadow-xl border p-2">

                  {/* ▸ Show "Loading..." until profile arrives */}
                  {!profile && (
                    <div className="px-2 py-2 text-sm text-muted-foreground">
                      Loading profile...
                    </div>
                  )}

                  {/* ▸ Only show user info if profile exists */}
                  {profile && (
                    <>
                      {/* Name */}
                      <DropdownMenuLabel className="font-semibold">
                        {profile.first_name} {profile.last_name}
                      </DropdownMenuLabel>

                      {/* Email */}
                      <p className="text-xs text-muted-foreground px-2 mb-1">
                        {profile.email}
                      </p>

                      <DropdownMenuSeparator />

                      {/* Role & Plan */}
                      <div className="px-2 py-1 text-sm space-y-1">
                        <p><strong>Role:</strong> {profile.role || "—"}</p>
                        <p><strong>Plan:</strong> {profile.plan || "—"}</p>
                      </div>

                      <DropdownMenuSeparator />

                      {/* Dates */}
                      <div className="px-2 py-1 text-xs text-muted-foreground space-y-1">
                        <p>
                          Created: {profile.created_at ? new Date(profile.created_at).toLocaleString() : "—"}
                        </p>
                        <p>
                          Last Login: {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "—"}
                        </p>
                      </div>

                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* Logout always visible */}
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => {
                      localStorage.removeItem("token");
                      window.location.href = "/";
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" onClick={onLoginClick}>Login</Button>
              <Button variant="hero" onClick={onSignupClick}>Start Free Trial</Button>
            </div>
          )}

          {/* Mobile menu */}
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

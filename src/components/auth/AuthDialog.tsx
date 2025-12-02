import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Mail, Lock, User, Eye, EyeOff, Briefcase,
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { BaseURL } from '@/lib/utils';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

export const AuthDialog = ({ isOpen, onClose, defaultTab = 'login' }: AuthDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: '',
    confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(BaseURL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      console.debug('Login response payload:', data);
      if (!res.ok) throw new Error(data?.error || 'Login failed');

      // support multiple token key names from backend
      const token = data?.access_token || data?.token || data?.accessToken || (data.access && data.access.token) || data?.jwt;
      console.debug('Resolved token from login response:', !!token);
      if (!token) throw new Error('Login succeeded but no token returned');

      localStorage.setItem('token', token);
      if (data.role) localStorage.setItem('role', data.role);
      if (data.user_id) localStorage.setItem('user_id', data.user_id);

      // set axios default header for subsequent requests
      try { 
        // lazy-load axios to avoid extra bundle churn in this file's top-level imports
        // but axios is already used in other places; set global header
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const axios = require('axios');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        // ignore if axios not available
      }

      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(BaseURL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();
      console.debug('Signup response payload:', data);
      if (!res.ok) throw new Error(data?.error || 'Signup failed');

      // Simulate login after signup
      const token = data?.access_token || data?.token || data?.accessToken || (data.access && data.access.token) || data?.jwt;
      console.debug('Resolved token from signup response:', !!token);
      if (!token) throw new Error('Signup succeeded but no token returned');

      localStorage.setItem('token', token);
      localStorage.setItem('role', formData.role);
      if (data.user_id) localStorage.setItem('user_id', data.user_id);

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const axios = require('axios');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        // ignore
      }

      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-hero p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Welcome to FlowToManual</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Transform your workflows into intelligent documentation
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* === LOGIN === */}
            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BA">Business Analyst</SelectItem>
                        <SelectItem value="QA">Quality Engineer</SelectItem>
                        <SelectItem value="Developer">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoading || !formData.email || !formData.password}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Signing in...
                    </>
                  ) : 'Sign In'}
                </Button>
              </div>
            </TabsContent>

            {/* === SIGNUP === */}
            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pl-10 pr-10"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BA">Business Analyst</SelectItem>
                        <SelectItem value="QA">Quality Engineer</SelectItem>
                        <SelectItem value="Developer">Developer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleSignup}
                  disabled={isLoading || !formData.email || !formData.password || !formData.role}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                      Creating account...
                    </>
                  ) : 'Create Account'}
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  By signing up, you agree to our{" "}
                  <Button variant="link" className="text-xs p-0 h-auto">Terms</Button>{" "}
                  and{" "}
                  <Button variant="link" className="text-xs p-0 h-auto">Privacy Policy</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

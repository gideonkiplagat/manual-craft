import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Video, FileText, Users, Zap, Shield, Clock, ArrowRight, Check } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogTab, setAuthDialogTab] = useState<'login' | 'signup'>('login');

  const handleLoginClick = () => {
    setAuthDialogTab('login');
    setAuthDialogOpen(true);
  };

  const handleSignupClick = () => {
    setAuthDialogTab('signup');
    setAuthDialogOpen(true);
  };

  const features = [
    {
      icon: Video,
      title: 'Smart Screen Recording',
      description: 'Capture screen activities with automatic DOM event detection and intelligent screenshots.',
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      title: 'AI-Powered Documentation',
      description: 'Generate manuals automatically based on your role: BA, QA, or Developer focus.',
      color: 'text-purple-600'
    },
    {
      icon: Users,
      title: 'Role-Based Outputs',
      description: 'Tailored documentation for Business Analysts, Quality Engineers, and Developers.',
      color: 'text-green-600'
    },
    {
      icon: Zap,
      title: 'Multiple Export Formats',
      description: 'Export your manuals as PDF, Word documents, or Excel spreadsheets.',
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      title: 'SOPs Integration',
      description: 'Leverage existing Standard Operating Procedures with RAG technology.',
      color: 'text-red-600'
    },
    {
      icon: Clock,
      title: 'Time-Saving Automation',
      description: 'Transform hours of manual documentation into minutes of automated generation.',
      color: 'text-indigo-600'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        '5 recordings per month',
        'Basic manual generation',
        'PDF export only',
        'Community support'
      ],
      highlighted: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'per month',
      description: 'For power users',
      features: [
        'Unlimited recordings',
        'All export formats',
        'SOPs integration',
        'Priority support',
        'Advanced AI features'
      ],
      highlighted: true
    },
    {
      name: 'Team',
      price: '$99',
      period: 'per month',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Admin dashboard',
        'Custom SOPs',
        'API access'
      ],
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header
        onLoginClick={handleLoginClick}
        onSignupClick={handleSignupClick}
      />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit">
                🚀 Transform Your Workflows
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                Turn Screen{' '}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Recordings
                </span>{' '}
                into Smart Manuals
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Record your workflows and let AI generate intelligent documentation tailored to your role. 
                Perfect for BAs, QA Engineers, and Developers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" onClick={handleSignupClick}>
                <Play className="h-5 w-5 mr-2" />
                Start Free Trial
              </Button>
              <Button variant="outline" size="lg">
                Watch Demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span>15-minute setup</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="FlowToManual Dashboard"
                className="rounded-2xl shadow-2xl"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-2xl blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold">Powerful Features</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create professional documentation from your workflows
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 bg-gradient-card backdrop-blur-sm shadow-glass hover:shadow-card transition-all duration-300 hover:scale-105">
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg bg-background/50 w-fit ${feature.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that's right for you and your team
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`p-8 relative ${
                plan.highlighted 
                  ? 'bg-gradient-primary text-primary-foreground shadow-primary scale-105' 
                  : 'bg-gradient-card backdrop-blur-sm shadow-glass'
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-warning text-warning-foreground">
                  Most Popular
                </Badge>
              )}
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className={plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <Check className={`h-4 w-4 ${plan.highlighted ? 'text-primary-foreground' : 'text-success'}`} />
                      <span className={plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.highlighted ? "secondary" : "hero"} 
                  size="lg" 
                  className="w-full"
                  onClick={handleSignupClick}
                >
                  Get Started
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 bg-gradient-card backdrop-blur-sm shadow-glass text-center">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold">Ready to Transform Your Documentation?</h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of professionals who are already saving hours with FlowToManual's 
              AI-powered documentation generation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" onClick={handleSignupClick}>
                Start Your Free Trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </Card>
      </section>

      <AuthDialog
        isOpen={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        defaultTab={authDialogTab}
      />
    </div>
  );
};

export default Index;

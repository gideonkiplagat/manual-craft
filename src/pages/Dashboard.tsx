import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RecordingInterface } from '@/components/dashboard/RecordingInterface';
import { ManualGenerator } from '@/components/dashboard/ManualGenerator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Download, Trash2, Plus } from 'lucide-react';

export const Dashboard = () => {
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);

  // Mock data for recent recordings and manuals
  const recentRecordings = [
    {
      id: '1',
      name: 'User Registration Flow',
      duration: '3:45',
      date: '2024-01-20',
      status: 'completed'
    },
    {
      id: '2',
      name: 'Payment Process',
      duration: '5:22',
      date: '2024-01-19',
      status: 'completed'
    }
  ];

  const recentManuals = [
    {
      id: '1',
      name: 'User Registration Manual - BA',
      role: 'BA',
      format: 'PDF',
      date: '2024-01-20',
      recordingId: '1'
    },
    {
      id: '2',
      name: 'Payment Test Scripts - QA',
      role: 'QA',
      format: 'Excel',
      date: '2024-01-19',
      recordingId: '2'
    }
  ];

  const handleStartRecording = () => {
    const recordingId = `recording-${Date.now()}`;
    setActiveRecordingId(recordingId);
  };

  const handleStopRecording = () => {
    setActiveRecordingId(null);
  };

  const handleGenerateManual = (role: string, format: string) => {
    console.log('Generating manual:', { role, format, recordingId: activeRecordingId });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'BA': return 'default';
      case 'QA': return 'secondary';
      case 'Developer': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Record your workflows and transform them into intelligent documentation with AI-powered insights.
          </p>
        </div>

        {/* Main Recording and Generation Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-recording animate-pulse"></div>
                Record Session
              </h2>
              <RecordingInterface
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generate Manual
              </h2>
              <ManualGenerator
                recordingId={activeRecordingId}
                onGenerateManual={handleGenerateManual}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Recordings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Recent Recordings</h3>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentRecordings.map((recording) => (
                <Card key={recording.id} className="p-4 bg-background/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{recording.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{recording.duration}</span>
                        <span>•</span>
                        <span>{recording.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{recording.status}</Badge>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Manuals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Generated Manuals</h3>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentManuals.map((manual) => (
                <Card key={manual.id} className="p-4 bg-background/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{manual.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Badge variant={getRoleBadgeVariant(manual.role)} className="text-xs">
                          {manual.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {manual.format}
                        </Badge>
                        <span>•</span>
                        <span>{manual.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
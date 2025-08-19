// components/dashboard/RecordingInterface.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, Camera, Mic, Settings } from 'lucide-react';
import axios from 'axios';

interface RecordingInterfaceProps {
  onStartRecording?: () => void;
  onStopRecording?: (sessionId: number) => void; // ✅ updated to accept sessionId
}

export const RecordingInterface = ({ onStartRecording, onStopRecording }: RecordingInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordSettings] = useState({
    screen: true,
    webcam: false,
    audio: true
  });
  const [events, setEvents] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) {
            handleStopRecording(); // Auto-stop at 5 minutes
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      const selector = target?.id ? `#${target.id}` : target?.tagName.toLowerCase();

      const eventData = {
        type: e.type,
        timestamp: new Date().toISOString(),
        selector,
        value: (target as HTMLInputElement)?.value || undefined
      };

      setEvents(prev => [...prev, eventData]);
    };

    if (isRecording) {
      ['click', 'input', 'change', 'submit'].forEach(evt =>
        window.addEventListener(evt, handleEvent)
      );
    }

    return () => {
      ['click', 'input', 'change', 'submit'].forEach(evt =>
        window.removeEventListener(evt, handleEvent)
      );
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    console.log('Recording started...');
    setIsRecording(true);
    setRecordingTime(0);
    setEvents([]);
    onStartRecording?.();
  };

  const handleStopRecording = async (data) => {
    setIsRecording(false);
    setRecordingTime(0);
    console.log("data from stop recording:", data);

    if (!events || events.length < 1) {
      console.error("❌ No events to record");
      alert("Please perform some actions during the recording before stopping.");
      return;
    }

   
  };

  // const generateManual = async () => {
  //    try {
  //     type SessionResponse = {
  //       id: number;
  //       message: string;
  //     };

  //     const response = await axios.post<SessionResponse>(
  //       '/api/sessions/',
  //       {
  //         name: `Session ${new Date().toISOString()}`,
  //         events
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${token}` }
  //       }
  //     );

  //     const { id, message } = response.data;
  //     console.log(`✅ Session saved with ID: ${id} — ${message}`);

  //     // ✅ Notify parent with session ID
  //     onStopRecording?.(id);

  //   } catch (error: any) {
  //     console.error('❌ Failed to save session:', error?.response?.data || error.message);
  //   }
  // }
  
  
  return (
    <>
      {isRecording && (
        <div className="fixed top-0 left-0 right-0 bottom-0 border-4 border-red-600 pointer-events-none z-50" />
      )}
      <Card className="p-6 bg-gradient-card backdrop-blur-sm shadow-glass relative z-10">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-recording">
                <div className="h-3 w-3 rounded-full bg-recording animate-pulse"></div>
                <span className="text-sm font-medium">Recording Active</span>
              </div>
            )}
            <div className="text-4xl font-mono font-bold text-foreground">
              {formatTime(recordingTime)}
            </div>
            {isRecording && (
              <p className="text-sm text-muted-foreground">
                Maximum recording time: 5 minutes
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-background/50">
              <Video className={`h-5 w-5 ${recordSettings.screen ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-medium">Screen</span>
              <Badge variant={recordSettings.screen ? "default" : "secondary"} className="text-xs">
                {recordSettings.screen ? 'On' : 'Off'}
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-background/50">
              <Camera className={`h-5 w-5 ${recordSettings.webcam ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-medium">Webcam</span>
              <Badge variant={recordSettings.webcam ? "default" : "secondary"} className="text-xs">
                {recordSettings.webcam ? 'On' : 'Off'}
              </Badge>
            </div>
            <div className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-background/50">
              <Mic className={`h-5 w-5 ${recordSettings.audio ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-medium">Audio</span>
              <Badge variant={recordSettings.audio ? "default" : "secondary"} className="text-xs">
                {recordSettings.audio ? 'On' : 'Off'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {!isRecording ? (
              <>
                <Button variant="hero" size="lg" onClick={handleStartRecording} className="px-8">
                  <Play className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
                <Button variant="outline" size="lg">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </>
            ) : (
              <Button variant="recording" size="lg" onClick={handleStopRecording} className="px-8">
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>

          {!isRecording && (
            <div className="text-center p-4 bg-accent rounded-lg">
              <p className="text-sm text-accent-foreground">
                💡 <strong>Pro Tip:</strong> Position your screen for optimal recording before starting.
                The red border will indicate the recording area.
              </p>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};

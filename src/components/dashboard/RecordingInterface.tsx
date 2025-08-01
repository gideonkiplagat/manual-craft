import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, Camera, Mic, Settings } from 'lucide-react';

interface RecordingInterfaceProps {
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export const RecordingInterface = ({ 
  onStartRecording, 
  onStopRecording 
}: RecordingInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordSettings, setRecordSettings] = useState({
    screen: true,
    webcam: false,
    audio: true
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    onStartRecording?.();
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    onStopRecording?.();
  };

  return (
    <Card className="p-6 bg-gradient-card backdrop-blur-sm shadow-glass">
      <div className="space-y-6">
        {/* Recording Status */}
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
              Maximum recording time: 15 minutes
            </p>
          )}
        </div>

        {/* Recording Settings */}
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

        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording ? (
            <>
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleStartRecording}
                className="px-8"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Recording
              </Button>
              <Button variant="outline" size="lg">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </>
          ) : (
            <Button 
              variant="recording" 
              size="lg" 
              onClick={handleStopRecording}
              className="px-8"
            >
              <Square className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Pro Tip */}
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
  );
};
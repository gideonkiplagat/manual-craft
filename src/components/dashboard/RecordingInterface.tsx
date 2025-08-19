import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, Camera, Mic, Settings } from 'lucide-react';
import axios from 'axios';

interface RecordingInterfaceProps {
  onStartRecording?: () => void;
  onStopRecording?: (sessionId: number | string | null, videoBlob: Blob | null) => void;
}

interface RecordingResponse {
  recording: any;
  id: string;
  file_path: string;
}

interface SessionResponse {
  id: string;
}

interface DomEvent {
  type: string;
  timestamp: string;
  selector: string;
  value?: string;
}

export const RecordingInterface = ({ onStartRecording, onStopRecording }: RecordingInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordSettings] = useState({ screen: true, webcam: false, audio: true });
  const [events, setEvents] = useState<DomEvent[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

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
            handleStopRecording();
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

      const eventData: DomEvent = {
        type: e.type,
        timestamp: new Date().toISOString(),
        selector,
        value: (target as HTMLInputElement)?.value || undefined
      };

      setEvents(prev => {
        const updated = [...prev, eventData];
        localStorage.setItem('tracked_dom_events', JSON.stringify(updated));
        return updated;
      });
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
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 }, width: 1920, height: 1080 },
        audio: recordSettings.audio
      });

      activeStreamRef.current = stream;
      stream.getVideoTracks()[0].onended = () => {
        console.log('User stopped sharing via browser controls');
        handleStopRecording();
      };

      const options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 2500000 };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000);
      onStartRecording?.();
    } catch (err) {
      console.error("Error starting screen recording:", err);
      setErrorMsg("Failed to start screen recording. Please allow permissions.");
      setIsRecording(false);
    }
  };

  const getTrackedEvents = (): DomEvent[] => {
    const events = localStorage.getItem('tracked_dom_events');
    try {
      return events ? JSON.parse(events) : [];
    } catch {
      return [];
    }
  };
const [recordingId, setRecordingId] = useState<any>(null);
  const handleStopRecording = async () => {
    setIsRecording(false);

    if (mediaRecorderRef.current) {
      return new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = async () => {
          try {
            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

            // Clean up media tracks
            activeStreamRef.current?.getTracks().forEach(track => track.stop());

            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const formData = new FormData();
            formData.append("file", videoBlob, "recording.webm"); // ✅ ensure .webm filename
            formData.append("user_id", user.user_id);
            formData.append("title", `Session ${new Date().toISOString()}`);
            formData.append("description", "Recorded session");

            const uploadRes = await axios.post<RecordingResponse>('/api/recordings/upload', formData, {
              headers: { Authorization: `Bearer ${token}` } // ✅ no Content-Type
            });

            const recordingId = uploadRes.data.recording.id;
            console.log("🎥 Video saved with ID:", recordingId);

            const sessionRes = await axios.post<SessionResponse>('/api/sessions/', {
              name: `Session ${new Date().toISOString()}`,
              events: getTrackedEvents(),
              recording_id: recordingId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            console.log("✅ Session saved with ID:", sessionRes.data.id);
            onStopRecording?.(sessionRes.data.id, videoBlob);
            resolve();
          } catch (error) {
            console.error("❌ Save failed:", error);
            setErrorMsg("Failed to save recording. Please try again.");
            resolve();
          }
        };

        mediaRecorderRef.current.stop();
      });
    }
  };
  

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

          {errorMsg && (
            <div className="text-center text-red-500 font-medium">{errorMsg}</div>
          )}

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

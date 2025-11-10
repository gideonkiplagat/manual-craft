import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, Camera, Mic, Settings } from 'lucide-react';
import axios from 'axios';

interface RecordingInterfaceProps {
  onStartRecording?: () => void;
  onStopRecording?: (sessionId: number | string | null, recordingId: string | null, videoBlob: Blob | null) => void;
}

interface RecordingResponse {
  recording?: any;
  id?: string;
  file_path?: string;
}

interface SessionResponse {
  id: number | string;
}

interface DomEvent {
  type: string;
  timestamp: string;
  selector: string;
  value?: string;
  key?: string;
}

interface StepPayload {
  timestamp: number;
  event_type: string;
  description: string;
  screenshot?: string;
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

  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const lastScreenshotAtRef = useRef<number>(0);
  const stepsRef = useRef<StepPayload[]>([]);

  const [recordingId, setRecordingId] = useState<any>(null);

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

  const getElementSelector = (el: HTMLElement): string => {
    if (!el) return "";
    if (el.id) return `#${el.id}`;
    if (el.className) {
      const classes = el.className.toString().trim().split(/\s+/).join(".");
      return `${el.tagName.toLowerCase()}.${classes}`;
    }
    return el.tagName.toLowerCase();
  };

  const captureScreenshot = async (): Promise<string | undefined> => {
    try {
      const now = Date.now();
      if (now - lastScreenshotAtRef.current < 800) return undefined;
      lastScreenshotAtRef.current = now;

      const stream = activeStreamRef.current;
      if (!stream) return undefined;

      if (!videoElRef.current) {
        videoElRef.current = document.createElement('video');
        videoElRef.current.muted = true;
        videoElRef.current.playsInline = true;
      }

      const videoEl = videoElRef.current;
      if (videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        await videoEl.play().catch(() => {});
      }

      const track = stream.getVideoTracks()[0];
      if (!track) return undefined;

      const settings = track.getSettings();
      const width = settings.width || 1280;
      const height = settings.height || 720;

      const canvas = document.createElement('canvas');
      canvas.width = Number(width);
      canvas.height = Number(height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } catch {
      return undefined;
    }
  };

  useEffect(() => {
    const handleEvent = (e: Event) => {
    const target = e.target as HTMLElement;
    const selector = getElementSelector(target);

  const eventData: DomEvent = {
    type: e.type,
    timestamp: new Date().toISOString(),
    selector,
    value: (target as HTMLInputElement)?.value || undefined,
    ...(e.type === "keydown" ? { key: (e as KeyboardEvent).key } : {})
  };

  setEvents(prev => {
    const updated = [...prev, eventData];
    localStorage.setItem('tracked_dom_events', JSON.stringify(updated));
    return updated;
  });

  (async () => {
    if (!isRecording) return;

    const prettyValue =
      (eventData.value && eventData.value.length > 0) ? ` = "${eventData.value}"` : "";
    const desc = `${eventData.type} on ${eventData.selector}${prettyValue}`;

    // ✅ Only take screenshots on clicks (not inputs/keydowns)
    let screenshot: string | undefined;
    if (e.type === "click") {
      screenshot = await captureScreenshot();
    }

    stepsRef.current.push({
      timestamp: Date.now(),
      event_type: eventData.type,
      description: desc,
      screenshot
    });
  })();
};


    const handleVisibilityChange = () => {
      if (!isRecording) return;
      const state = document.visibilityState === "visible" ? "Tab Visible" : "Tab Hidden";
      const eventData: DomEvent = {
        type: "tab-visibility",
        timestamp: new Date().toISOString(),
        selector: "document",
        value: state
      };
      setEvents(prev => {
        const updated = [...prev, eventData];
        localStorage.setItem("tracked_dom_events", JSON.stringify(updated));
        return updated;
      });
      (async () => {
        const screenshot = await captureScreenshot();
        stepsRef.current.push({
          timestamp: Date.now(),
          event_type: "tab-visibility",
          description: `User switched tab: ${state}`,
          screenshot
        });
      })();
    };

    const handleFocus = () => {
      if (!isRecording) return;
      const eventData: DomEvent = {
        type: "window-focus",
        timestamp: new Date().toISOString(),
        selector: "window",
        value: "focused"
      };
      setEvents(prev => {
        const updated = [...prev, eventData];
        localStorage.setItem("tracked_dom_events", JSON.stringify(updated));
        return updated;
      });
      (async () => {
        const screenshot = await captureScreenshot();
        stepsRef.current.push({
          timestamp: Date.now(),
          event_type: "window-focus",
          description: "User focused window",
          screenshot
        });
      })();
    };

    const handleBlur = () => {
      if (!isRecording) return;
      const eventData: DomEvent = {
        type: "window-blur",
        timestamp: new Date().toISOString(),
        selector: "window",
        value: "blurred"
      };
      setEvents(prev => {
        const updated = [...prev, eventData];
        localStorage.setItem("tracked_dom_events", JSON.stringify(updated));
        return updated;
      });
      (async () => {
        const screenshot = await captureScreenshot();
        stepsRef.current.push({
          timestamp: Date.now(),
          event_type: "window-blur",
          description: "User blurred window",
          screenshot
        });
      })();
    };

    if (isRecording) {
      ['click', 'input', 'change', 'submit', 'keydown'].forEach(evt =>
        document.addEventListener(evt, handleEvent, true)
      );
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);
      window.addEventListener("blur", handleBlur);
    }

    return () => {
      ['click', 'input', 'change', 'submit', 'keydown'].forEach(evt =>
        document.removeEventListener(evt, handleEvent, true)
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setRecordingTime(0);
    setEvents([]);
    stepsRef.current = [];
    setErrorMsg(null);

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30, max: 30 }, width: 1920, height: 1080 },
        audio: recordSettings.audio
      });

      activeStreamRef.current = stream;

      if (!videoElRef.current) {
        videoElRef.current = document.createElement('video');
        videoElRef.current.muted = true;
        videoElRef.current.playsInline = true;
      }
      const videoEl = videoElRef.current;
      videoEl.srcObject = stream;
      await videoEl.play().catch(() => {});

      stream.getVideoTracks()[0].onended = () => {
        handleStopRecording();
      };

      const options = { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 2500000 };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.start(1000);
      onStartRecording?.();
    } catch (err) {
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

  const handleStopRecording = async () => {
    setIsRecording(false);

    if (mediaRecorderRef.current) {
      return new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = async () => {
          try {
            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

            activeStreamRef.current?.getTracks().forEach(track => track.stop());

            // ✅ Removed user_id - backend gets it from JWT token
            const formData = new FormData();
            formData.append("file", videoBlob, "recording.webm");
            formData.append("title", `Session ${new Date().toISOString()}`);
            formData.append("description", "Recorded session");

            console.log('Uploading recording, size bytes:', videoBlob.size, 'token present:', !!token);
            let uploadRes;
            try {
              uploadRes = await axios.post<RecordingResponse>('/api/recordings/upload', formData, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log('Upload response:', uploadRes?.status, uploadRes?.data);
            } catch (uploadErr) {
              console.error('Recording upload failed:', uploadErr);
              setErrorMsg('Failed to upload recording to server. See console for details.');
              resolve();
              return;
            }

            const savedRecordingId =
              (uploadRes.data?.recording && (uploadRes.data.recording.id || uploadRes.data.recording._id)) ||
              uploadRes.data?.id;

            setRecordingId(savedRecordingId);

            const sessionRes = await axios.post<SessionResponse>('/api/sessions/', {
              name: `Session ${new Date().toISOString()}`,
              events: getTrackedEvents(),
              recording_id: String(savedRecordingId)
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            const sessionId = sessionRes.data.id;

            try {
              await axios.post(`/api/sessions/${sessionId}/steps`, {
                steps: stepsRef.current
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (e) {
              console.warn("Could not upload steps/screenshots:", e);
            }

            onStopRecording?.(sessionId, savedRecordingId, videoBlob);
            resolve();
          } catch (error) {
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Recording
          </h3>
          <Badge variant={isRecording ? "destructive" : "secondary"}>
            {isRecording ? "Recording..." : "Idle"}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Camera className="h-4 w-4" /> {recordSettings.screen ? "On" : "Off"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Mic className="h-4 w-4" /> {recordSettings.audio ? "On" : "Off"}
            </Badge>
          </div>
          <div className="font-mono text-sm">{formatTime(recordingTime)}</div>
        </div>

        <div className="flex gap-2">
          {!isRecording ? (
            <Button onClick={handleStartRecording} className="flex items-center gap-2">
              <Play className="h-4 w-4" /> Start Recording
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleStopRecording} className="flex items-center gap-2">
              <Square className="h-4 w-4" /> Stop Recording
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </div>

        {errorMsg && (
          <p className="mt-3 text-sm text-red-500">{errorMsg}</p>
        )}
      </Card>
    </>
  );
};

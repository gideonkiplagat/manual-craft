import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, Camera, Mic, Settings } from 'lucide-react';
import axios from 'axios';
import { BaseURL } from '@/lib/utils';

interface RecordingInterfaceProps {
  onStartRecording?: () => void;
  // now include thumbnails and steps when reporting stop
  onStopRecording?: (
    sessionId: number | string | null,
    recordingId: string | null,
    videoBlob: Blob | null,
    thumbnails?: string[],
    steps?: StepPayload[]
  ) => void;
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
  // millisecond timestamp (we use absolute Date.now(); backend will
  // normalize relative offsets when extracting screenshots from video)
  timestamp: number;
  event_type: string;
  description: string;
  selector: string;
  value?: string;
  key?: string;
  human_label?: string;
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
  const stepsRef = useRef<StepPayload[]>([]);

  const [recordingId, setRecordingId] = useState<any>(null);
  const [lastVideoUrl, setLastVideoUrl] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  // Track when the recording started (for debugging / future use if
  // you ever want relative timestamps); currently we just use Date.now()
  // per step, and the backend normalizes.
  const recordingStartMsRef = useRef<number | null>(null);

  // 🔁 NEW: timer that pushes auto steps every few seconds while recording
  const autoCaptureTimerRef = useRef<number | null>(null);

  // Extract N thumbnails from a video Blob at relative positions (0.2, 0.5, 0.8)
  // NOTE: these thumbnails are for UI preview only, not used by the backend LLM.
  const extractThumbnails = async (blob: Blob, count = 3): Promise<string[]> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const vid = document.createElement('video');
      vid.src = url;
      vid.muted = true;
      vid.playsInline = true;

      const results: string[] = [];

      const cleanup = () => {
        URL.revokeObjectURL(url);
        vid.src = '';
      };

      vid.addEventListener('loadedmetadata', async () => {
        const duration = vid.duration || 0;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const seekTo = (time: number) =>
          new Promise<void>((res) => {
            const handler = () => {
              try {
                canvas.width = vid.videoWidth || 1280;
                canvas.height = vid.videoHeight || 720;
                if (ctx) ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/png');
                results.push(dataUrl);
              } catch (e) {
                console.warn('Thumbnail capture failed', e);
              }
              vid.removeEventListener('seeked', handler);
              res();
            };
            vid.addEventListener('seeked', handler);
            try {
              vid.currentTime = Math.min(Math.max(0, time), duration - 0.01);
            } catch (e) {
              // some browsers throw on setting currentTime before ready
              console.warn('Could not set currentTime for thumbnail', e);
              res();
            }
          });

        // choose relative positions
        const rels = count === 1 ? [0.5] : [0.2, 0.5, 0.8].slice(0, count);
        for (let r of rels) {
          await seekTo(r * duration || 0);
        }

        cleanup();
        resolve(results);
      });

      // Fallback: if metadata doesn't load within 3s, resolve empty
      setTimeout(() => {
        if (results.length === 0) {
          cleanup();
          resolve(results);
        }
      }, 3000);
    });
  };

  useEffect(() => {
    const storedToken =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token');
    if (storedToken) setToken(storedToken);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
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
    if (!el) return '';
    if (el.id) return `#${el.id}`;
    if (el.className) {
      const classes = el.className.toString().trim().split(/\s+/).join('.');
      return `${el.tagName.toLowerCase()}.${classes}`;
    }
    return el.tagName.toLowerCase();
  };

  // Return a human friendly label for an element (dataset.label, aria-label/title, textContent, fallback)
  const getHumanLabel = (el: HTMLElement | null, fallback = ''): string => {
    if (!el) return fallback || '';
    try {
      const ds = (el as HTMLElement).dataset;
      if (ds && (ds as any).label) return String((ds as any).label).trim();
      const aria = el.getAttribute?.('aria-label') || el.getAttribute?.('title');
      if (aria) return aria.trim();
      const text = (el.textContent || '').trim();
      if (text) return text.replace(/\s+/g, ' ');
    } catch (e) {
      // ignore
    }
    return fallback || '';
  };

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const target = e.target as HTMLElement;
      const selector = getElementSelector(target);

      const humanLabel = getHumanLabel(target, (target as HTMLInputElement)?.value || selector);

      const eventData: DomEvent = {
        type: e.type,
        timestamp: new Date().toISOString(),
        selector,
        value: humanLabel || undefined,
        ...(e.type === 'keydown' ? { key: (e as KeyboardEvent).key } : {}),
      };

      setEvents((prev) => {
        const updated = [...prev, eventData];
        localStorage.setItem('tracked_dom_events', JSON.stringify(updated));
        return updated;
      });

      (async () => {
        if (!isRecording) return;

        const prettyValue =
          eventData.value && eventData.value.length > 0 ? ` = "${eventData.value}"` : '';
        const desc = `${eventData.type} on ${eventData.selector}${prettyValue}`;

        const nowMs = Date.now();

        stepsRef.current.push({
          timestamp: nowMs,
          event_type: eventData.type,
          description: desc,
          selector,
          value: eventData.value,
          key: eventData.key,
          human_label: humanLabel || '',
        });

        // synthetic navigation for menu-like targets: pages, nav items, menu items
        try {
          const role = target.getAttribute?.('role');
          const cls = target.className || '';
          const isMenu =
            role === 'menuitem' ||
            /menu-item|menu__item|nav-item|tab|sidebar|nav/.test(cls) ||
            !!target.dataset?.navLabel;
          if (isMenu) {
            const navLabel =
              (target.dataset && (target as any).dataset.navLabel) || humanLabel || selector;
            document.dispatchEvent(
              new CustomEvent('navigation', { detail: { label: navLabel } }),
            );
          }
        } catch (err) {
          // ignore
        }
      })();
    };

    if (isRecording) {
      // Only capture meaningful interactions — avoid focus/blur/visibility noise
      ['click', 'input', 'change', 'submit', 'keydown', 'keyup'].forEach((evt) =>
        document.addEventListener(evt, handleEvent, true),
      );
    }

    return () => {
      ['click', 'input', 'change', 'submit', 'keydown', 'keyup'].forEach((evt) =>
        document.removeEventListener(evt, handleEvent, true),
      );
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
    localStorage.removeItem('tracked_dom_events');
    setErrorMsg(null);
    recordingStartMsRef.current = Date.now();

    // 🔁 start auto-capture timer (every 5 seconds)
    if (autoCaptureTimerRef.current !== null) {
      window.clearInterval(autoCaptureTimerRef.current);
    }
    autoCaptureTimerRef.current = window.setInterval(() => {
      const ts = Date.now();
      stepsRef.current.push({
        timestamp: ts,
        event_type: 'auto-capture',
        description: `Auto capture at ${new Date(ts).toISOString()}`,
        selector: 'window',
        value: '',
        key: '',
        human_label: 'Auto capture',
      });
    }, 5000);

    try {
      // Preflight: ensure browser supports screen capture
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setErrorMsg(
          'Screen capture is not supported by your browser. Use Chrome, Edge or Firefox on a secure origin (HTTPS or localhost).',
        );
        setIsRecording(false);
        if (autoCaptureTimerRef.current !== null) {
          window.clearInterval(autoCaptureTimerRef.current);
          autoCaptureTimerRef.current = null;
        }
        return;
      }

      // Hint to the browser that we prefer capturing the entire monitor.
      // NOTE: This is a hint only — the user chooses in the browser prompt.
      // @ts-ignore - `displaySurface` is not in all TS libs yet
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: ({
          frameRate: { ideal: 30, max: 30 },
          width: 1920,
          height: 1080,
          displaySurface: 'monitor',
        } as any),
        audio: recordSettings.audio,
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

      const options = {
        mimeType: 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: 2500000,
      };
      const mediaRecorder = new MediaRecorder(stream, options);

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };

      mediaRecorder.start(1000);
      onStartRecording?.();
    } catch (err: any) {
      console.error('getDisplayMedia error:', err);

      const makeMsg = (e: any) => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          return 'Screen capture is not available in this browser. Open the app in a supported browser (Chrome/Edge/Firefox) on HTTPS or localhost.';
        }
        const name = e?.name || '';
        switch (name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            return 'Permission denied. Please allow screen sharing in the browser prompt (you may need to click the "Share" or "Allow" button).';
          case 'NotFoundError':
            return 'No display or window found to capture.';
          case 'NotReadableError':
            return 'Screen capture failed because the display is not readable (another app may be using it).';
          case 'SecurityError':
            return 'Screen capture requires a secure context (HTTPS) or localhost. Open the app over HTTPS.';
          case 'AbortError':
            return 'Screen capture was aborted. Try again.';
          default:
            return e?.message || 'Failed to start screen recording. Please allow permissions.';
        }
      };

      setErrorMsg(makeMsg(err));
      setIsRecording(false);
      if (autoCaptureTimerRef.current !== null) {
        window.clearInterval(autoCaptureTimerRef.current);
        autoCaptureTimerRef.current = null;
      }
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

    // 🔁 stop auto-capture timer
    if (autoCaptureTimerRef.current !== null) {
      window.clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      return new Promise<void>((resolve) => {
        mediaRecorderRef.current!.onstop = async () => {
          try {
            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });

            activeStreamRef.current?.getTracks().forEach((track) => track.stop());

            // ✅ Removed user_id - backend gets it from JWT token
            const formData = new FormData();
            formData.append('file', videoBlob, 'recording.webm');
            formData.append('title', `Session ${new Date().toISOString()}`);
            formData.append('description', 'Recorded session');

            const authToken =
              token ?? localStorage.getItem('token') ?? localStorage.getItem('access_token');
            console.log(
              'Uploading recording, size bytes:',
              videoBlob.size,
              'token present:',
              !!authToken,
            );
            let uploadRes;
            try {
              uploadRes = await axios.post<RecordingResponse>(BaseURL +'/api/recordings/upload', formData, {
                headers: { Authorization: `Bearer ${authToken}` },
              });
              console.log('Upload response:', uploadRes?.status, uploadRes?.data);
            } catch (uploadErr: any) {
              console.error('Recording upload failed:', uploadErr);
              if (uploadErr.response) {
                console.error('Upload response status:', uploadErr.response.status);
                console.error('Upload response data:', uploadErr.response.data);
                setErrorMsg(
                  `Upload failed: ${uploadErr.response.status} ${
                    uploadErr.response.data?.error || ''
                  }`,
                );
              } else if (uploadErr.request) {
                console.error('Upload request error (no response):', uploadErr.message);
                setErrorMsg(`Network error during upload: ${uploadErr.message}`);
              } else {
                console.error('Upload error:', uploadErr.message);
                setErrorMsg(`Upload error: ${uploadErr.message}`);
              }

              // expose some debugging info in console for the recorded blob
              console.log('Recorded blob size (bytes):', videoBlob.size);
              try {
                onStopRecording?.(null, null, videoBlob, thumbnails, stepsRef.current);
              } catch (e) {
                console.warn('onStopRecording handler threw', e);
              }
              resolve();
              return;
            }

            const savedRecordingId =
              (uploadRes?.data?.recording &&
                (uploadRes.data.recording.id || uploadRes.data.recording._id)) ||
              uploadRes?.data?.id;

            setRecordingId(savedRecordingId);

            // Save a preview URL so user can verify the recorded video
            try {
              const url = window.URL.createObjectURL(videoBlob);
              setLastVideoUrl(url);

              // UI-only thumbnails (not used by backend/LLM)
              try {
                const thumbs = await extractThumbnails(videoBlob, 3);
                setThumbnails(thumbs);
                console.log('Extracted thumbnails count:', thumbs.length);
              } catch (thumbErr) {
                console.warn('Thumbnail extraction failed', thumbErr);
              }
            } catch (e) {
              console.warn('Could not create preview URL for recorded blob', e);
            }

            // Attach thumbnails (if any) to session create so backend could store them
            const sessionPayload: any = {
              name: `Session ${new Date().toISOString()}`,
              events: getTrackedEvents(),
              recording_id: String(savedRecordingId),
            };
            if (thumbnails && thumbnails.length > 0) sessionPayload.thumbnails = thumbnails;

            const authToken2 =
              token ?? localStorage.getItem('token') ?? localStorage.getItem('access_token');
            let sessionId: number | string | null = null;
            try {
              console.log('Creating session with payload:', sessionPayload);
              const sessionRes = await axios.post<SessionResponse>(BaseURL + '/api/sessions/', sessionPayload, {
                headers: { Authorization: `Bearer ${authToken2}` },
              });
              sessionId = sessionRes?.data?.id;
              console.log('Created session id:', sessionId);

              // If extension is available, write session id and token so content scripts/background can use them
              try {
                if (window.chrome && chrome.storage && chrome.storage.sync) {
                  chrome.storage.sync.set(
                    { flowtomanual_session_id: sessionId, flowtomanual_token: authToken2 },
                    () => {
                      console.log('Wrote session id to chrome.storage.sync');
                    },
                  );
                }
              } catch (e) {
                // ignore
              }
            } catch (e) {
              console.warn('Failed to create session:', e);
            }

            try {
              // 🔑 send steps (with timestamps) to backend so it can
              // extract screenshots from the video using ffmpeg.
              if (sessionId) {
                const authToken3 = authToken2;
                const stepsPayload = {
                  steps: (stepsRef.current || []).map((s) => ({
                    timestamp: s.timestamp, // ms since epoch
                    event_type: s.event_type,
                    description: s.description,
                    selector: s.selector,
                    value: s.value,
                    key: s.key,
                    human_label: s.human_label, // included if backend ever wants it
                    // no screenshot field: backend will populate screenshot_path
                    // from the recorded video using these timestamps.
                  })),
                };

                console.log(
                  'Uploading steps for session',
                  sessionId,
                  'steps count =',
                  stepsPayload.steps.length,
                  'sample step:',
                  stepsPayload.steps[0]
                );

                await axios.post(`${BaseURL}/api/sessions/${sessionId}/steps`, stepsPayload, {
                  headers: { Authorization: `Bearer ${authToken3}` },
                });
                console.log('Steps uploaded');
              } else {
                console.warn('Skipping steps upload because sessionId is null');
              }
            } catch (e) {
              console.warn('Could not upload steps:', e);
            }

            // NOTE: We no longer POST /events here; events are already stored
            // when the session is created from `sessionPayload.events`.

            try {
              console.log('Calling onStopRecording with', {
                sessionId,
                savedRecordingId,
                thumbnails,
              });
              onStopRecording?.(sessionId, savedRecordingId, videoBlob, thumbnails, stepsRef.current);
            } catch (e) {
              console.warn('onStopRecording handler threw', e);
            }
            resolve();
          } catch (error) {
            setErrorMsg('Failed to save recording. Please try again.');
            resolve();
          }
        };

        mediaRecorderRef.current.stop();
      });
    }
  };

  return (
    <>
      {lastVideoUrl && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Last Recording Preview</h4>
          <video src={lastVideoUrl} controls className="w-full rounded" />
        </div>
      )}
      {thumbnails.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Extracted Thumbnails</h4>
          <div className="flex gap-2">
            {thumbnails.map((t, i) => (
              <img key={i} src={t} alt={`thumb-${i}`} className="h-24 rounded" />
            ))}
          </div>
        </div>
      )}
      {isRecording && (
        <div className="fixed top-0 left-0 right-0 bottom-0 border-4 border-red-600 pointer-events-none z-50" />
      )}
      <Card className="p-6 bg-gradient-card backdrop-blur-sm shadow-glass relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Recording
          </h3>
          <Badge variant={isRecording ? 'destructive' : 'secondary'}>
            {isRecording ? 'Recording...' : 'Idle'}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Camera className="h-4 w-4" /> {recordSettings.screen ? 'On' : 'Off'}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Mic className="h-4 w-4" /> {recordSettings.audio ? 'On' : 'Off'}
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
            <Button
              variant="destructive"
              onClick={handleStopRecording}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" /> Stop Recording
            </Button>
          )}
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Tip: Choose &quot;Entire screen&quot; in the browser prompt to capture actions across other
          tabs and applications. The backend will extract all training screenshots from the recorded
          video using your event timestamps (including auto-capture points).
        </p>

        {errorMsg && <p className="mt-3 text-sm text-red-500">{errorMsg}</p>}
      </Card>
    </>
  );
};

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '@/components/layout/Header';
import { RecordingInterface } from '@/components/dashboard/RecordingInterface';
import ManualGenerator from '@/components/dashboard/ManualGenerator';
import {
  FileText,
  Download,
  Video,
  BookOpen,
  Sparkles,
  BarChart3,
  PlayCircle,
  BookOpenCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BaseURL } from '@/lib/utils';

interface ManualResponse {
  message: string;
  manualId: string;
  download_url: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lastRecordingId, setLastRecordingId] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<number | string | null>(null);
  const [lastThumbnails, setLastThumbnails] = useState<string[] | null>(null);
  const [lastSteps, setLastSteps] = useState<any[] | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
  const [recentManuals, setRecentManuals] = useState<any[]>([]);
  const [manualSuccess, setManualSuccess] = useState<boolean>(false);
  const [generatedManualId, setGeneratedManualId] = useState<number | null>(null);
  const [loadingGenerateFor, setLoadingGenerateFor] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

  // -------------------------------------------------------------------
  // FETCH DATA (unchanged logic, just formatted)
  // -------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.debug(
          '[Dashboard] fetchData token present:',
          !!token,
          'len:',
          token ? token.length : 0
        );

        if (!token) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to access the dashboard.',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        // fetch recordings and manuals
        let recordingsRes: any = null;
        let manualsRes: any = null;

        try {
          recordingsRes = await axios.get<any[]>(BaseURL + '/api/recordings/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRecentRecordings(Array.isArray(recordingsRes.data) ? recordingsRes.data : []);
        } catch (recErr: any) {
          console.warn(
            'Could not load recordings list',
            recErr?.response?.status || recErr.message
          );
          const status = recErr.response?.status;

          if (status === 404 || status === 405) {
            setRecentRecordings([]);
          } else if (status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          } else {
            setRecentRecordings([]);
          }
        }

        try {
          manualsRes = await axios.get<any[]>(BaseURL + '/api/manuals/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
        } catch (manErr: any) {
          if (manErr.response?.status === 401) throw manErr;
          console.warn(
            'Could not load manuals list',
            manErr?.response?.status || manErr.message
          );
          setRecentManuals([]);
        }

        // Fetch dashboard statistics
        try {
          const statsRes = await axios.get(BaseURL + '/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStats(statsRes.data);
        } catch (statsErr: any) {
          console.warn(
            'Failed to load dashboard stats',
            statsErr?.response?.status || statsErr.message
          );
        }

        // Fetch user profile (CHANGED URL)
        try {
          const profileRes = await axios.get(BaseURL + '/api/dashboard/user/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProfile(profileRes.data);
        } catch (profileErr: any) {
          console.warn(
            'Failed to load user profile',
            profileErr?.response?.status || profileErr.message
          );
        }
      } catch (error: any) {
        console.error('Failed to fetch recent activity', error);

        if (
          error.response?.status === 401 ||
          error.response?.data?.error === 'Invalid user ID'
        ) {
          localStorage.removeItem('token');
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
          });
          navigate('/');
        } else {
          toast({
            title: 'Error',
            description: 'Failed to load dashboard data.',
            variant: 'destructive',
          });
        }
      }
    };

    fetchData();
  }, [navigate, toast]);

  // -------------------------------------------------------------------
  // HANDLERS (all logic unchanged)
  // -------------------------------------------------------------------
  const handleRecordingFinished = (
    sessionId: number | string | null,
    recordingId: string | null,
    videoBlob?: Blob | null,
    thumbnails?: string[],
    steps?: any[]
  ) => {
    console.log(
      'Recording finished with session ID:',
      sessionId,
      'recording ID:',
      recordingId,
      'thumbs:',
      thumbnails?.length
    );
    setLastRecordingId(recordingId ?? null);
    setLastSessionId(sessionId ?? null);
    setLastThumbnails(thumbnails ?? null);
    setLastSteps(steps ?? null);
  };

  const handleGenerateManual = async (
    role: string,
    format: string,
    includeScreenshots: boolean,
    _recordingIdOverride?: string | null,
    _sessionIdOverride?: number | string | null
  ) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to generate a manual.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      const effectiveSessionId = _sessionIdOverride ?? lastSessionId;
      if (effectiveSessionId) {
        setLoadingGenerateFor(String(effectiveSessionId));
        const export_format = format.toLowerCase();

        const url = `${BaseURL}/api/manuals/generate/${effectiveSessionId}?format=${export_format}&include_screenshots=${includeScreenshots}`;
        const res = await axios.post<{ manual_id: number }>(
          url,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.manual_id) {
          setGeneratedManualId(res.data.manual_id);
          setManualSuccess(true);
          toast({ title: 'Success', description: 'Manual generated successfully!' });

          try {
            const manualsRes = await axios.get<any[]>(BaseURL + '/api/manuals/', {
              headers: { Authorization: `Bearer ${token}` },
            });
            setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
          } catch (e) {
            console.warn('Failed to refresh manuals list', e);
          }
        }

        setLoadingGenerateFor(null);
        return;
      }

      const targetRecordingId = _recordingIdOverride || lastRecordingId;
      if (!targetRecordingId) {
        toast({
          title: 'Error',
          description: 'No recording selected to generate manual from',
          variant: 'destructive',
        });
        return;
      }

      setLoadingGenerateFor(String(targetRecordingId));

      const res = await axios.post<{ manual_id: number }>(
        `${BaseURL}/api/manuals/generate/recording/${targetRecordingId}?format=${format.toLowerCase()}&include_screenshots=${includeScreenshots}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.manual_id) {
        setGeneratedManualId(res.data.manual_id);
        setManualSuccess(true);
        toast({ title: 'Success', description: 'Manual generated successfully!' });
        try {
          const manualsRes = await axios.get<any[]>(BaseURL + '/api/manuals/', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
        } catch (e) {
          console.warn('Failed to refresh manuals list', e);
        }
      }
    } catch (err: any) {
      console.error('Error generating manual:', err);

      if (err.response?.status === 401 || err.response?.data?.error === 'Invalid user ID') {
        localStorage.removeItem('token');
        toast({
          title: 'Session Expired',
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive',
        });
        navigate('/');
      } else {
        toast({
          title: 'Error',
          description: err.response?.data?.error || 'Failed to generate manual.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingGenerateFor(null);
    }
  };

  const handleDownloadManual = () => {
    if (!generatedManualId) return;
    const token = localStorage.getItem('token');
    console.log('Downloading manual with ID:', generatedManualId);
    window.open(`/api/manuals/download/${generatedManualId}?token=${token}`, '_blank');
  };

  const handleDownloadRecording = (recordingId: string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/recordings/download/${recordingId}?token=${token}`, '_blank');
  };

  const handleShareRecording = async (recordingId: string) => {
    try {
      const url = `${window.location.origin}/api/recordings/download/${recordingId}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Recording download link copied to clipboard.',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleShareManual = async (manualId: number | string) => {
    try {
      const url = `${window.location.origin}/api/manuals/download/${manualId}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Manual download link copied to clipboard.',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Could not copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // -------------------------------------------------------------------
  // DERIVED UI DATA (purely frontend)
  // -------------------------------------------------------------------
  const lastRecording = recentRecordings?.[0] || null;
  const lastManual = recentManuals?.[0] || null;

  const activityTrend = useMemo(() => {
    const recCount = recentRecordings.length;
    const manCount = recentManuals.length;
    if (!recCount && !manCount) return null;

    return {
      recordings: recCount,
      manuals: manCount,
      message:
        recCount > manCount
          ? 'You are capturing more workflows than you are documenting — great for building a knowledge base.'
          : 'You are generating manuals actively — your org is becoming more documented and auditable.',
    };
  }, [recentRecordings, recentManuals]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-50">
      <Header isAuthenticated={true} profile={profile} />

      <main className="container mx-auto py-10 px-4 space-y-10">
        {/* ------------------------------------------------------------------ */}
        {/* WELCOME + QUICK ACTIONS                                           */}
        {/* ------------------------------------------------------------------ */}
        <section className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm">
              Welcome Back{profile?.first_name ? `, ${profile.first_name}` : ''}!
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Record your workflows and transform them into intelligent documentation with AI-powered
              insights.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              className="rounded-full px-5 shadow-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
              onClick={() => {
                const el = document.getElementById('record-session');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              Start New Recording
            </Button>

            <Button
              variant="outline"
              className="rounded-full px-5 border-purple-200 hover:bg-purple-50"
              onClick={() => {
                const el = document.getElementById('generate-manual');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Manual
            </Button>

            <Button
              variant="ghost"
              className="rounded-full px-5 hover:bg-white/60"
              onClick={() => navigate('/documentation')}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Documentation
            </Button>
             {/* ⭐ View Recordings (new) */}
            <Button
              variant="ghost"
              className="rounded-full px-5 hover:bg-white/60"
              onClick={() => navigate('/recordings')}
            >
              <Video className="h-4 w-4 mr-2" />
              View Recordings
            </Button>

          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* STATS CARDS                                                       */}
        {/* ------------------------------------------------------------------ */}
        {stats && profile && (
          <section className="grid md:grid-cols-3 gap-6">
            {[
              {
                label: 'Your Role',
                value: profile.role,
                sub: `Plan: ${profile.plan}`,
                icon: BookOpenCheck,
                accent: 'from-purple-500/10 to-purple-500/5',
              },
              {
                label: 'Total Recordings',
                value: stats.recordings.total,
                sub: stats.recordings.last_recording_at || 'No recordings yet',
                icon: Video,
                accent: 'from-blue-500/10 to-blue-500/5',
              },
              {
                label: 'Manuals Generated',
                value: stats.manuals.total,
                sub: stats.manuals.last_manual_at || 'No manuals yet',
                icon: FileText,
                accent: 'from-emerald-500/10 to-emerald-500/5',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-gradient-to-br ${item.accent} backdrop-blur shadow-lg border border-white/60 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-sm text-gray-700">{item.label}</h3>
                  </div>
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-3xl font-extrabold tracking-tight">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
              </div>
            ))}
          </section>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* MAIN GRID: RECORD + GENERATE                                      */}
        {/* ------------------------------------------------------------------ */}
        <section className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Record Session */}
          <div id="record-session" className="space-y-6">
            <div className="rounded-3xl p-6 bg-white/70 shadow-lg border border-white/70 backdrop-blur hover:shadow-xl transition-all duration-200">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-recording animate-pulse" />
                <span className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-600" />
                  Record Session
                </span>
              </h2>
              <RecordingInterface onStopRecording={handleRecordingFinished} />
            </div>
          </div>

          {/* Generate Manual */}
          <div id="generate-manual" className="space-y-6">
            <div className="rounded-3xl p-6 bg-white/70 shadow-lg border border-white/70 backdrop-blur hover:shadow-xl transition-all duration-200">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generate Manual
              </h2>

              {lastRecordingId !== null ? (
                <>
                  <ManualGenerator
                    recordingId={lastRecordingId}
                    onGenerateManual={handleGenerateManual}
                  />
                  {manualSuccess && (
                    <div className="mt-4 space-y-2">
                      <p className="text-green-600 font-medium">
                        Manual generated successfully.
                      </p>
                      <Button
                        onClick={handleDownloadManual}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Manual
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Start a recording to generate a manual.
                </p>
              )}

              <div className="mt-6">
                <p className="text-sm text-muted-foreground">
                  Recent Recordings and Manuals are available under the top navigation:{' '}
                  <strong>Documentation</strong> and <strong>Recordings</strong>.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* RECENT ACTIVITY + SIMPLE "CHART" TREND                             */}
        {/* ------------------------------------------------------------------ */}
        <section className="grid lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Recent Activity
            </h3>

            <div className="space-y-3">
              <div className="rounded-2xl p-4 bg-white/80 shadow border border-white/70 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Last Recording</p>
                  <p className="text-sm font-medium">
                    {lastRecording ? lastRecording.title || `Recording ${lastRecording.id}` : 'No recordings yet'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lastRecording?.created_at || 'Once you record, it will appear here.'}
                  </p>
                </div>
                {lastRecording && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handleDownloadRecording(lastRecording.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>

              <div className="rounded-2xl p-4 bg-white/80 shadow border border-white/70 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Last Manual</p>
                  <p className="text-sm font-medium">
                    {lastManual ? lastManual.filename || `Manual ${lastManual.id}` : 'No manuals yet'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {lastManual?.created_at || 'Generate a manual to see it here.'}
                  </p>
                </div>
                {lastManual && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handleShareManual(lastManual.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Insights
            </h3>

            <div className="rounded-2xl p-4 bg-white/80 shadow border border-white/70 space-y-4">
              {activityTrend ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Recordings</span>
                        <span>{activityTrend.recordings}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          style={{ width: `${Math.min(activityTrend.recordings * 12, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Manuals</span>
                        <span>{activityTrend.manuals}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                          style={{ width: `${Math.min(activityTrend.manuals * 12, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                    {activityTrend.message}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  As you start recording sessions and generating manuals, FlowToManual will surface
                  helpful trends and insights here.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;

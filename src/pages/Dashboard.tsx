import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '@/components/layout/Header';
import { RecordingInterface } from '@/components/dashboard/RecordingInterface';
import ManualGenerator from '@/components/dashboard/ManualGenerator';
import { FileText, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ManualResponse {
  message: string;
  manualId: string;
  download_url: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lastRecordingId, setLastRecordingId] = useState<string | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
  const [recentManuals, setRecentManuals] = useState<any[]>([]);
  const [manualSuccess, setManualSuccess] = useState<boolean>(false);
  const [generatedManualId, setGeneratedManualId] = useState<number | null>(null);
  const [loadingGenerateFor, setLoadingGenerateFor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access the dashboard.",
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        const [recordingsRes, manualsRes] = await Promise.all([
          // list recordings (was mistakenly calling the upload endpoint here)
          axios.get<any[]>('/api/recordings', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get<any[]>('/api/manuals', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setRecentRecordings(Array.isArray(recordingsRes.data) ? recordingsRes.data : []);
        setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
      } catch (error: any) {
        console.error('Failed to fetch recent activity', error);
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.data?.error === "Invalid user ID") {
          localStorage.removeItem('token');
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive"
          });
          navigate('/');
        } else {
          toast({
            title: "Error",
            description: "Failed to load dashboard data.",
            variant: "destructive"
          });
        }
      }
    };

    fetchData();
  }, [navigate, toast]);

  const handleRecordingFinished = (sessionId: number, recordingId: string) => {
    console.log("Recording finished with session ID:", sessionId, "recording ID:", recordingId);
    setLastRecordingId(recordingId);
  };

  const handleGenerateManual = async (role: string, format: string, recordingIdOverride?: string | null) => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast({
          title: "Authentication Required",
          description: "Please log in to generate a manual.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      const targetRecordingId = recordingIdOverride || lastRecordingId;
      if (!targetRecordingId) {
        toast({ title: 'Error', description: 'No recording selected to generate manual from', variant: 'destructive' });
        return;
      }

      setLoadingGenerateFor(String(targetRecordingId));

      const res = await axios.post<{ manual_id: number }>(
        `/api/manuals/generate/recording/${targetRecordingId}?format=${format.toLowerCase()}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // assuming backend returns { manual_id: number }
      if (res.data?.manual_id) {
        setGeneratedManualId(res.data.manual_id);
        setManualSuccess(true);
        toast({ title: "Success", description: "Manual generated successfully!" });
        // refresh manuals list
        try {
          const token2 = localStorage.getItem('token');
          const manualsRes = await axios.get<any[]>('/api/manuals', { headers: { Authorization: `Bearer ${token2}` } });
          setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
        } catch (e) {
          console.warn('Failed to refresh manuals list', e);
        }
      }
    } catch (err: any) {
      console.error("Error generating manual:", err);
      
      if (err.response?.status === 401 || err.response?.data?.error === "Invalid user ID") {
        localStorage.removeItem('token');
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive"
        });
        navigate('/');
      } else {
        toast({
          title: "Error",
          description: err.response?.data?.error || "Failed to generate manual.",
          variant: "destructive"
        });
      }
    } finally {
      setLoadingGenerateFor(null);
    }
  };

  const handleDownloadManual = () => {
    if (!generatedManualId) return;
    const token = localStorage.getItem("token");
    console.log("Downloading manual with ID:", generatedManualId);
    window.open(`/api/manuals/download/${generatedManualId}?token=${token}`, "_blank");
  };

  const handleDownloadRecording = (recordingId: string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/recordings/download/${recordingId}?token=${token}`, '_blank');
  };

  const handleShareRecording = async (recordingId: string) => {
    try {
      const url = `${window.location.origin}/api/recordings/download/${recordingId}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Recording download link copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Could not copy link to clipboard.', variant: 'destructive' });
    }
  };

  const handleShareManual = async (manualId: number | string) => {
    try {
      const url = `${window.location.origin}/api/manuals/download/${manualId}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Manual download link copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Could not copy link to clipboard.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header isAuthenticated={true} />
      <main className="container mx-auto py-8 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Record your workflows and transform them into intelligent documentation with AI-powered insights.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-recording animate-pulse"></div>
                Record Session
              </h2>
              <RecordingInterface onStopRecording={handleRecordingFinished} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
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

              {/* Recent Recordings */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Recent Recordings</h3>
                {recentRecordings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recordings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentRecordings.map((rec: any) => (
                      <div key={rec.id || rec._id || rec.recording_id} className="p-3 bg-background/60 rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium">{rec.title || rec.name || `Recording ${rec.id || rec._id}`}</div>
                          <div className="text-sm text-muted-foreground">{rec.description || ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleDownloadRecording(rec.id || rec._id || rec.recording_id)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleShareRecording(rec.id || rec._id || rec.recording_id)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleGenerateManual('BA', 'PDF', String(rec.id || rec._id || rec.recording_id))} disabled={loadingGenerateFor === String(rec.id || rec._id || rec.recording_id)}>
                            {loadingGenerateFor === String(rec.id || rec._id || rec.recording_id) ? 'Generating...' : 'Generate Manual'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Manuals */}
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Recent Manuals</h3>
                {recentManuals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No manuals yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentManuals.map((m: any) => (
                      <div key={m.id || m.manual_id} className="p-3 bg-background/60 rounded flex items-center justify-between">
                        <div>
                          <div className="font-medium">{m.title || m.name || `Manual ${m.id || m.manual_id}`}</div>
                          <div className="text-sm text-muted-foreground">{m.created_at || m.date || ''}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => window.open(`/api/manuals/download/${m.id || m.manual_id}`, '_blank')}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleShareManual(m.id || m.manual_id)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

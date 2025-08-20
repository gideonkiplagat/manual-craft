import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '@/components/layout/Header';
import { RecordingInterface } from '@/components/dashboard/RecordingInterface';
import ManualGenerator from '@/components/dashboard/ManualGenerator';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ManualResponse {
  message: string;
  manualId: string;
  download_url: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [lastRecordingId, setLastRecordingId] = useState<number | null>(null);
  const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
  const [recentManuals, setRecentManuals] = useState<any[]>([]);
  const [manualSuccess, setManualSuccess] = useState<boolean>(false);
  const [generatedManualId, setGeneratedManualId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        const [recordingsRes, manualsRes] = await Promise.all([
          axios.get<any[]>('/api/recordings/upload', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get<any[]>('/api/manuals', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setRecentRecordings(Array.isArray(recordingsRes.data) ? recordingsRes.data : []);
        setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
      } catch (error) {
        console.error('Failed to fetch recent activity', error);
      }
    };

    fetchData();
  }, []);

  const handleRecordingFinished = (sessionId: number) => {
    console.log("Recording finished with session ID:", sessionId);
    setLastRecordingId(sessionId);
  };

  const handleGenerateManual = async (role: string, format: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `/api/manuals/generate/${lastRecordingId}?format=${format.toLowerCase()}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // assuming backend returns { manualId: number }
      if (res.data?.manual_id) {
        setGeneratedManualId(res.data.manual_id);
      }
      setManualSuccess(true);
    } catch (err) {
      console.error("Error generating manual:", err);
    }
  };

  const handleDownloadManual = () => {
    if (!generatedManualId) return;
    const token = localStorage.getItem("token");
    console.log("Downloading manual with ID:", generatedManualId);
    window.open(`/api/manuals/download/${generatedManualId}?token=${token}`, "_blank");
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
                    recordingId={lastRecordingId.toString()}
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

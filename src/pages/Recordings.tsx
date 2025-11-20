import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Recordings() {
  const { toast } = useToast();
  const [recs, setRecs] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/recordings', { headers: { Authorization: `Bearer ${token}` } });
        setRecs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to load recordings', e);
        toast({ title: 'Error', description: 'Failed to load recordings', variant: 'destructive' });
      }
    };
    fetchRecs();
  }, [toast]);

  const handleDownload = (id: string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/recordings/download/${id}?token=${token}`, '_blank');
  };

  const handleShare = async (id: string) => {
    try {
      const url = `${window.location.origin}/api/recordings/download/${id}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Recording link copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Could not copy link', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Recordings</h1>
      {recs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recordings available.</p>
      ) : (
        <div className="grid gap-4">
          {recs.map((rec: any) => (
            <div key={rec.id || rec._id || rec.recording_id} className="p-3 bg-background/60 rounded">
              <div className="flex items-start gap-4">
                <div className="w-48">
                  <video controls className="w-full h-32 bg-black" src={rec.file_path || `/api/recordings/download/${rec.id || rec._id || rec.recording_id}`} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{rec.title || rec.name || `Recording ${rec.id || rec._id}`}</div>
                    <div className="text-sm text-muted-foreground">{rec.description || ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleDownload(rec.id || rec._id || rec.recording_id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={() => handleShare(rec.id || rec._id || rec.recording_id)}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

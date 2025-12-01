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
        const res = await axios.get('/api/recordings/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecs(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to load recordings', e);
        toast({
          title: 'Error',
          description: 'Failed to load recordings',
          variant: 'destructive',
        });
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
      toast({
        title: 'Link copied',
        description: 'Recording link copied to clipboard.',
      });
    } catch (e) {
      toast({
        title: 'Error',
        description: 'Could not copy link',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Recordings</h1>

      {recs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recordings available.</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {recs.map((rec: any) => {
            const id = rec.id || rec._id || rec.recording_id;
            const videoUrl = `/${rec.file_path}?v=${rec.created_at || id}`;

            return (
              <div
                key={id}
                className="
                  bg-white/80 
                  rounded-xl 
                  shadow-md 
                  border 
                  p-4 
                  flex 
                  flex-col 
                  hover:shadow-xl 
                  hover:-translate-y-1
                  transition-all 
                  duration-300
                "
              >
                {/* Video */}
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden group">
                  <video
                    controls
                    className="
                      w-full 
                      h-full 
                      object-cover 
                      bg-black 
                      transition-transform 
                      duration-300 
                      group-hover:scale-105
                    "
                    src={videoUrl}
                    preload="metadata"
                  />
                </div>

                {/* Title + Description */}
                <div className="flex-1">
                  <div className="font-medium text-lg mb-1">
                    {rec.title || rec.name || `Recording ${id}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rec.description || 'Recorded session'}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    size="icon"
                    variant="outline"
                    className="hover:scale-110 transition-transform"
                    onClick={() => handleDownload(id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="outline"
                    className="hover:scale-110 transition-transform"
                    onClick={() => handleShare(id)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

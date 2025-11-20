import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Manuals() {
  const { toast } = useToast();
  const [manuals, setManuals] = useState<any[]>([]);

  useEffect(() => {
    const fetchManuals = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/manuals/', { headers: { Authorization: `Bearer ${token}` } });
        setManuals(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Failed to load manuals', e);
        toast({ title: 'Error', description: 'Failed to load manuals', variant: 'destructive' });
      }
    };
    fetchManuals();
  }, [toast]);

  const handleDownload = (id: number | string) => {
    const token = localStorage.getItem('token');
    window.open(`/api/manuals/download/${id}?token=${token}`, '_blank');
  };

  const handleShare = async (id: number | string) => {
    try {
      const url = `${window.location.origin}/api/manuals/download/${id}`;
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied', description: 'Manual link copied to clipboard.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Could not copy link', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Documentation / Manuals</h1>
      {manuals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No manuals available.</p>
      ) : (
        <div className="grid gap-3">
          {manuals.map((m: any) => (
            <div key={m.id || m.manual_id} className="p-3 bg-background/60 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{m.title || m.name || `Manual ${m.id || m.manual_id}`}</div>
                <div className="text-sm text-muted-foreground">{m.created_at || m.date || ''}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleDownload(m.id || m.manual_id)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => handleShare(m.id || m.manual_id)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Download, Share2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Manuals() {
  const { toast } = useToast();
  const [manuals, setManuals] = useState<any[]>([]);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchManuals = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/manuals/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setManuals(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load manuals",
          variant: "destructive",
        });
      }
    };

    fetchManuals();
  }, [toast]);

  const handleDownload = (id: number) => {
    const token = localStorage.getItem("token");
    window.open(`/api/manuals/download/${id}?token=${token}`, "_blank");
  };

  const handleShare = async (id: number) => {
    try {
      const url = `${window.location.origin}/api/manuals/download/${id}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "Manual link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Could not copy link",
        variant: "destructive",
      });
    }
  };

  const loadPreview = async (manualId: number) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `/api/manuals/preview/${manualId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blobUrl = URL.createObjectURL(response.data);
      setPreviewSrc(blobUrl);

    } catch (err) {
      console.error("Preview fetch failed:", err);
      setPreviewSrc(null);
    }
  };

  return (
    <div className="p-6 relative">
      <h1 className="text-3xl font-semibold mb-6">Documentation / Manuals</h1>

      {manuals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No manuals available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {manuals.map((m) => (
            <div
              key={m.id}
              className="group p-5 rounded-xl border bg-card shadow-sm hover:shadow-lg transition-all flex flex-col justify-between relative cursor-pointer"
              onMouseEnter={() => {
                setHoveredId(m.id);
                loadPreview(m.id);
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                setPreviewSrc(null);
              }}
            >
              {/* Icon + Info */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText />
                </div>

                <div>
                  <p className="font-medium text-lg">
                    {m.filename?.replace(/\.\w+$/, "") || `Manual ${m.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 mt-6">
                <Button size="sm" variant="outline" onClick={() => handleDownload(m.id)}>
                  <Download className="h-4 w-4" />
                </Button>

                <Button size="sm" variant="outline" onClick={() => handleShare(m.id)}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Fancy Floating Preview */}
              {hoveredId === m.id && previewSrc && (
                <div
                  ref={previewRef}
                  className="
                    absolute top-1/2 left-full ml-4
                    -translate-y-1/2 z-50 w-[260px]
                    bg-white border shadow-xl rounded-lg p-2
                    opacity-0 scale-95
                    group-hover:opacity-100 group-hover:scale-100
                    transition-all duration-200 ease-out
                  "
                >
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="rounded-md object-cover w-full max-h-[300px]"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

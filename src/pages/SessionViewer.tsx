import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, FileText, Trash2 } from "lucide-react";

export default function Sessions() {
  const navigate = useNavigate();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/recordings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load sessions");
      return res.json();
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Your Sessions</h1>

      {isLoading && <p>Loading sessions...</p>}
      {error && <p className="text-red-500">Error loading sessions</p>}

      {!isLoading && sessions?.length === 0 && <p>No recordings found.</p>}

      <div className="grid gap-4">
        {sessions?.map((session: any) => (
          <Card key={session.id} className="p-4 bg-background/60 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{session.name || session.id}</h3>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{session.duration}</span>
                  <span>•</span>
                  <span>{session.date}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => navigate(`/generate/${session.id}`)}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Generate
                </Button>

                <Button size="sm" variant="ghost">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

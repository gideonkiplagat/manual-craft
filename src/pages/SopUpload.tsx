import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { BaseURL } from "@/lib/utils";

export const MySops = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sops, setSops] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSops = async () => {
    try {
      setLoading(true);
      const res = await axios.get(BaseURL + "/api/sops/");
      // Backend returns { sops: ["filename.ext"] }
  setSops(Array.isArray((res as any).data?.sops) ? (res as any).data.sops : []);
    } catch (err) {
      console.error("Failed to fetch sops", err);
      toast({ title: "Could not load SOPs" , variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSops();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" });
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);

      // backend registers POST /api/sops/ (see swagger.json).
      // Let axios set the multipart Content-Type (with boundary) automatically.
      await axios.post(BaseURL + "/api/sops/", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({ title: "SOP uploaded successfully!" });
      setFile(null);
      setTitle("");
      setDescription("");

      // Refresh the list so the user sees the uploaded file
      await fetchSops();
    } catch (error) {
      console.error(error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (name: string) => {
    try {
      // Try to fetch the file as a blob from /api/sops/{name}
      const res = (await axios.get(`${BaseURL}/api/sops/${encodeURIComponent(name)}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })) as any;

      const url = window.URL.createObjectURL(res.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download failed", err);
      // If server doesn't support direct file downloads, communicate that to the user
      toast({
        title: "Download not available",
        description:
          err?.response?.status === 404
            ? "Server does not expose a download endpoint for individual SOPs yet."
            : "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My SOPs</h1>

      <div className="space-y-4 mb-8">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., User Login SOP"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the SOP"
          />
        </div>

        <div>
          <Label htmlFor="file">SOP File</Label>
          <Input
            id="file"
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload SOP"}
        </Button>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-2">Uploaded SOPs</h2>
        {loading ? (
          <p>Loading…</p>
        ) : sops.length === 0 ? (
          <p className="text-muted-foreground">No SOPs uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {sops.map((s) => (
              <li key={s} className="flex items-center justify-between">
                <span className="truncate max-w-xl">{s}</span>
                <div className="space-x-2">
                  <Button size="sm" onClick={() => handleDownload(s)}>
                    Download
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MySops;




// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { toast } from "@/components/ui/use-toast";

// export const SopUpload = () => {
//   const [file, setFile] = useState<File | null>(null);

//   const handleUpload = async () => {
//     if (!file) return toast({ title: "Please select a file first." });
//     const formData = new FormData();
//     formData.append("file", file);

//     const res = await fetch("/api/sops/upload", {
//       method: "POST",
//       body: formData,
//     });

//     if (res.ok) {
//       toast({ title: "SOP uploaded successfully." });
//       setFile(null);
//     } else {
//       toast({ title: "Upload failed.", variant: "destructive" });
//     }
//   };

//   return (
//     <div className="p-6 max-w-xl mx-auto">
//       <h1 className="text-2xl font-bold mb-4">Upload Your SOP</h1>
//       <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
//       <Button className="mt-4" onClick={handleUpload}>Upload</Button>
//     </div>
//   );
// };
import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

export const SopUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

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

      const res = await axios.post("/api/sops/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast({ title: "SOP uploaded successfully!" });
      setFile(null);
      setTitle("");
      setDescription("");
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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload SOP</h1>

      <div className="space-y-4">
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
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload SOP"}
        </Button>
      </div>
    </div>
  );
};




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
// import { useParams, useNavigate } from "react-router-dom";
// import { useQuery } from "@tanstack/react-query";
// import { useState } from "react";
// import { Header } from "@/components/layout/Header";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { FileText } from "lucide-react";

// const roles = ["BA", "QA", "Developer"] as const;
// const formats = ["pdf", "docx", "xlsx"] as const;

// export default function GenerateManual() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [role, setRole] = useState<"BA" | "QA" | "Developer">("BA");
//   const [format, setFormat] = useState<"pdf" | "docx" | "xlsx">("pdf");
//   const [manualContent, setManualContent] = useState<string | null>(null);
//   const [generating, setGenerating] = useState(false);

//   const { data: sessionData, isLoading, error } = useQuery({
//     queryKey: ["session", id],
//     queryFn: async () => {
//       const token = localStorage.getItem("token");
//       const res = await fetch(`/api/sessions/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       if (!res.ok) throw new Error("Session not found");
//       return res.json();
//     },
//     enabled: !!id,
//   });

//   const handleGenerate = async () => {
//     setGenerating(true);
//     setManualContent(null);

//     try {
//       const token = localStorage.getItem("token");
//       const res = await fetch("/api/manuals/generate", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           recording_id: id,
//           role,
//           format,
//         }),
//       });

//       const data = await res.json();
//       setManualContent(data?.content || "Manual generated. Preview unavailable.");
//     } catch (err) {
//       setManualContent("Failed to generate manual.");
//     } finally {
//       setGenerating(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-hero">
//       <Header isAuthenticated />
//       <main className="container mx-auto py-10 space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold flex items-center gap-2">
//             <FileText className="w-6 h-6 text-primary" />
//             Generate Manual
//           </h1>
//           <Button variant="outline" onClick={() => navigate("/dashboard")}>
//             Back to Dashboard
//           </Button>
//         </div>

//         {isLoading && <p className="text-muted-foreground">Loading session...</p>}
//         {error && <p className="text-red-500">Failed to load session.</p>}

//         {!isLoading && sessionData && (
//           <Card className="p-6 space-y-4 bg-background/70 backdrop-blur">
//             <div className="grid md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block mb-1 text-sm font-medium">Select Role</label>
//                 <select
//                   value={role}
//                   onChange={(e) => setRole(e.target.value as typeof role)}
//                   className="w-full border p-2 rounded-md"
//                 >
//                   {roles.map((r) => (
//                     <option key={r} value={r}>{r}</option>
//                   ))}
//                 </select>
//               </div>
//               <div>
//                 <label className="block mb-1 text-sm font-medium">Export Format</label>
//                 <select
//                   value={format}
//                   onChange={(e) => setFormat(e.target.value as typeof format)}
//                   className="w-full border p-2 rounded-md"
//                 >
//                   {formats.map((f) => (
//                     <option key={f} value={f}>{f.toUpperCase()}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <Button onClick={handleGenerate} disabled={generating}>
//               {generating ? "Generating..." : "Generate Manual"}
//             </Button>

//             {manualContent && (
//               <div className="mt-4 border p-4 rounded-md bg-muted text-sm whitespace-pre-wrap max-h-[400px] overflow-y-auto">
//                 {manualContent}
//               </div>
//             )}
//           </Card>
//         )}
//       </main>
//     </div>
//   );
// }

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import MySops from "@/pages/SopUpload";
import GenerateManual from "./components/dashboard/ManualGenerator";
import SessionViewer from "@/pages/SessionViewer";
import { Settings } from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Manuals from "@/pages/Manuals";
import Recordings from "@/pages/Recordings";

// ⬆️ NEW: Documentation page reused from Manuals Page
import Documentation from "@/pages/Manuals";

import { AuthProvider } from "@/context/AuthContext";
import axios from "axios";

// Wrapper for manual generator by recordingId
const GenerateManualWrapper = () => {
  const { id: recordingId } = useParams();

  const handleGenerateManual = async (role: string, format: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/manuals/generate",
        {
          recording_id: recordingId,
          role,
          format,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } catch (err) {
      console.error("Error generating manual:", err);
      throw err;
    }
  };

  return <GenerateManual onGenerateManual={handleGenerateManual} />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Manuals page */}
            <Route path="/manuals" element={<Manuals />} />

            {/* Recordings page */}
            <Route path="/recordings" element={<Recordings />} />

            {/* 🔥 NEW — Documentation route */}
            <Route path="/documentation" element={<Manuals />} />

            <Route path="/sops" element={<MySops />} />
            <Route path="/generate/:id" element={<GenerateManualWrapper />} />
            <Route path="/sessions/:id" element={<SessionViewer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/subscribe" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

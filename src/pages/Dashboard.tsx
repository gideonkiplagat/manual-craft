import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Header } from "@/components/layout/Header";
import { RecordingInterface } from "@/components/dashboard/RecordingInterface";
import ManualGenerator from "@/components/dashboard/ManualGenerator";
import { FileText } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [lastRecordingId, setLastRecordingId] = useState<number | string | null>(null); // This will now be SESSION ID
  const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
  const [recentManuals, setRecentManuals] = useState<any[]>([]);

  // For browser-based MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [recordingsRes, manualsRes] = await Promise.all([
          axios.get<any[]>("/api/recordings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<any[]>("/api/manuals", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setRecentRecordings(Array.isArray(recordingsRes.data) ? recordingsRes.data : []);
        setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
      } catch (error) {
        console.error("Failed to fetch recent activity", error);
      }
    };

    fetchData();
  }, []);

  const handleRecordingStart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("No token found, please log in again.");
      return;
    }

    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: "DASHBOARD_START_RECORDING", token }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Extension message failed:", chrome.runtime.lastError.message);
          } else {
            console.log("Extension acknowledged start:", response);
          }
        });
      } else {
        console.warn("Chrome extension API not available. Falling back to browser capture...");
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        console.log("Browser recording stream ready:", stream);
      }
    } catch (err) {
      console.error("Failed to start browser recording:", err);
    }
  };

  const handleRecordingFinished = async () => {
    let videoBlob: Blob | null = null;

    if (mediaRecorderRef.current) {
      return new Promise<void>((resolve) => {
        mediaRecorderRef.current.onstop = async () => {
          videoBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          await saveSessionAndVideo(videoBlob);
          resolve();
        };
        mediaRecorderRef.current.stop();
      });
    }

    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "DASHBOARD_STOP_RECORDING" }, async (response) => {
        if (response?.videoBlob) {
          const arrayBuffer = new Uint8Array(response.videoBlob).buffer;
          videoBlob = new Blob([arrayBuffer], { type: "video/webm" });
          await saveSessionAndVideo(videoBlob);
        } else {
          console.warn("No video blob returned from extension");
        }
      });
    }
  };

  const saveSessionAndVideo = async (videoBlob: Blob | null) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    let recordingId: string | null = null;

    // 1️⃣ Create session first (without recording_id)
    const recordedEvents = window.localStorage.getItem("tracked_dom_events");
    const parsedEvents = recordedEvents ? JSON.parse(recordedEvents) : [];

    const sessionRes = await axios.post<{ id: string }>(
      "/api/sessions/",
      {
        name: `Session ${new Date().toISOString()}`,
        events: parsedEvents,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const sessionId = sessionRes.data.id;
    setLastRecordingId(sessionId);
    console.log("✅ Session saved with ID:", sessionId);

    // 2️⃣ Upload video if available
    if (videoBlob) {
      const formData = new FormData();
      formData.append("file", videoBlob, "recording.webm");

      const videoRes = await axios.post<{ id: string; file_path: string }>(
        "/api/recordings/upload",  // Changed from /api/recordings/upload
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      recordingId = videoRes.data.id;
      console.log("🎥 Video saved with ID:", recordingId);
    }

    // 3️⃣ Attach recording to the existing session
    if (recordingId) {
      await axios.put(
        `/api/sessions/${sessionId}/attach_recording`,
        { recording_id: recordingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("🔗 Recording attached to session");
    }
  } catch (error) {
    console.error("Failed to save session or video:", error);
  }
};
//   const saveSessionAndVideo = async (videoBlob: Blob | null) => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       console.error("No token found");
//       return;
//     }

//     let recordingId: string | null = null;

//     // 1️⃣ Create session first (without recording_id)
//     const recordedEvents = window.localStorage.getItem("tracked_dom_events");
//     const parsedEvents = recordedEvents ? JSON.parse(recordedEvents) : [];

//     const sessionRes = await axios.post<{ id: string }>(
//       "/api/sessions/",
//       {
//         name: `Session ${new Date().toISOString()}`,
//         events: parsedEvents,
//       },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     const sessionId = sessionRes.data.id;
//     setLastRecordingId(sessionId);
//     console.log("✅ Session saved with ID:", sessionId);

//     // 2️⃣ Upload video if available
//     if (videoBlob) {
//       const formData = new FormData();
//       formData.append("file", videoBlob, "recording.webm");

//       const videoRes = await axios.post<{ id: string; file_path: string }>(
//         "/api/recordings/upload",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       recordingId = videoRes.data.id;
//       console.log("🎥 Video saved at:", videoRes.data.file_path);
//     }

//     // 3️⃣ Attach recording to the existing session
//     if (recordingId) {
//       await axios.put(
//         `/api/sessions/attach_recording/${sessionId}`,
//         { recording_id: recordingId },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       console.log("🔗 Recording attached to session");
//     }
//   } catch (error) {
//     console.error("Failed to save session or video:", error);
//   }
// };

  // const saveSessionAndVideo = async (videoBlob: Blob | null) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       console.error("No token found");
  //       return;
  //     }

  //     let recordingId: string | null = null;

  //     // 1️⃣ Create session first (without recording_id)
  //     const recordedEvents = window.localStorage.getItem("tracked_dom_events");
  //     const parsedEvents = recordedEvents ? JSON.parse(recordedEvents) : [];

  //     const sessionRes = await axios.post<{ id: string }>(
  //       "/api/sessions/",
  //       {
  //         name: `Session ${new Date().toISOString()}`,
  //         events: parsedEvents,
  //       },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     const sessionId = sessionRes.data.id;
  //     setLastRecordingId(sessionId);
  //     console.log("✅ Session saved with ID:", sessionId);

  //     // 2️⃣ Upload video if available
  //     if (videoBlob) {
  //       const formData = new FormData();
  //       formData.append("file", videoBlob, "recording.webm");

  //       const videoRes = await axios.post<{ id: string; file_path: string }>(
  //         "/api/recordings/upload",
  //         formData,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "multipart/form-data",
  //           },
  //         }
  //       );

  //       recordingId = videoRes.data.id;
  //       console.log("🎥 Video saved at:", videoRes.data.file_path);
  //     }

  //     // 3️⃣ Attach recording to the existing session
  //     if (recordingId) {
  //       await axios.put(
  //         `/api/sessions/attach_recording/${sessionId}`,
  //         { recording_id: recordingId },
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       console.log("🔗 Recording attached to session");
  //     }
  //   } catch (error) {
  //     console.error("Failed to save session or video:", error);
  //   }
  // };

  const handleGenerateManual = async (role: string, format: string) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/manuals/generate/${lastRecordingId}?format=${format.toLowerCase()}`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Error generating manual:", err);
    }
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
              <RecordingInterface
                onStartRecording={handleRecordingStart}
                onStopRecording={handleRecordingFinished}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Generate Manual
              </h2>
              {lastRecordingId !== null ? (
                <ManualGenerator
                  recordingId={lastRecordingId.toString()}
                  onGenerateManual={handleGenerateManual}
                />
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






// import React, { useEffect, useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { Header } from "@/components/layout/Header";
// import { RecordingInterface } from "@/components/dashboard/RecordingInterface";
// import ManualGenerator from "@/components/dashboard/ManualGenerator";
// import { FileText } from "lucide-react";

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [lastRecordingId, setLastRecordingId] = useState<number | string | null>(null);
//   const [recentRecordings, setRecentRecordings] = useState<any[]>([]);
//   const [recentManuals, setRecentManuals] = useState<any[]>([]);

//   // For browser-based MediaRecorder
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const recordedChunksRef = useRef<Blob[]>([]);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const token = localStorage.getItem("token");

//         const [recordingsRes, manualsRes] = await Promise.all([
//           axios.get<any[]>("/api/recordings", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//           axios.get<any[]>("/api/manuals", {
//             headers: { Authorization: `Bearer ${token}` },
//           }),
//         ]);

//         setRecentRecordings(Array.isArray(recordingsRes.data) ? recordingsRes.data : []);
//         setRecentManuals(Array.isArray(manualsRes.data) ? manualsRes.data : []);
//       } catch (error) {
//         console.error("Failed to fetch recent activity", error);
//       }
//     };

//     fetchData();
//   }, []);

//   const handleRecordingStart = async () => {
//   const token = localStorage.getItem('token');
//   if (!token) {
//     console.error("No token found, please log in again.");
//     return;
//   }

//   try {
//     if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
//       chrome.runtime.sendMessage({ type: "DASHBOARD_START_RECORDING", token }, (response) => {
//         if (chrome.runtime.lastError) {
//           console.error("Extension message failed:", chrome.runtime.lastError.message);
//         } else {
//           console.log("Extension acknowledged start:", response);
//         }
//       });
//     } else {
//       console.warn("Chrome extension API not available. Falling back to browser capture...");
//       const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
//       console.log("Browser recording stream ready:", stream);
//       // Pass stream to RecordingInterface
//     }
//   } catch (err) {
//     console.error("Failed to start browser recording:", err);
//   }
// };

//   // const handleRecordingStart = async () => {
//   //   const token = localStorage.getItem("token");
//   //   if (!token) {
//   //     console.error("No token found, please log in again.");
//   //     return;
//   //   }

//   //   // Use extension if available
//   //   if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
//   //     chrome.runtime.sendMessage(
//   //       { type: "DASHBOARD_START_RECORDING", token },
//   //       (response) => {
//   //         if (chrome.runtime.lastError) {
//   //           console.error("Extension message failed:", chrome.runtime.lastError.message);
//   //         } else {
//   //           console.log("Extension acknowledged start:", response);
//   //         }
//   //       }
//   //     );
//   //   } else {
//   //     // Browser-based recording fallback
//   //     try {
//   //       const stream = await navigator.mediaDevices.getDisplayMedia({
//   //         video: true,
//   //         audio: true,
//   //       });
//   //       recordedChunksRef.current = [];
//   //       const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
//   //       mediaRecorderRef.current = mediaRecorder;

//   //       mediaRecorder.ondataavailable = (event) => {
//   //         if (event.data.size > 0) {
//   //           recordedChunksRef.current.push(event.data);
//   //         }
//   //       };

//   //       mediaRecorder.start();
//   //       console.log("Browser recording started...");
//   //     } catch (err) {
//   //       console.error("Failed to start browser recording:", err);
//   //     }
//   //   }
//   // };

//   const handleRecordingFinished = async () => {
//     let videoBlob: Blob | null = null;

//     // Stop browser-based recording if active
//     if (mediaRecorderRef.current) {
//       return new Promise<void>((resolve) => {
//         mediaRecorderRef.current.onstop = async () => {
//           videoBlob = new Blob(recordedChunksRef.current, { type: "video/webm" });
//           await saveSessionAndVideo(videoBlob);
//           resolve();
//         };
//         mediaRecorderRef.current.stop();
//       });
//     }

//     // If using extension, request video blob from it
//     if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
//       chrome.runtime.sendMessage({ type: "DASHBOARD_STOP_RECORDING" }, async (response) => {
//         if (response?.videoBlob) {
//           const arrayBuffer = new Uint8Array(response.videoBlob).buffer;
//           videoBlob = new Blob([arrayBuffer], { type: "video/webm" });
//           await saveSessionAndVideo(videoBlob);
//         } else {
//           console.warn("No video blob returned from extension");
//         }
//       });
//     }
//   };
//   const saveSessionAndVideo = async (videoBlob: Blob | null) => {
//   try {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       console.error("No token found");
//       return;
//     }

//     let recordingId: string | null = null;

//     // 1️⃣ Upload video first
//     if (videoBlob) {
//       const formData = new FormData();
//       formData.append("file", videoBlob, "recording.webm");

//       const videoRes = await axios.post<{ id: string; file_path: string }>(
//         "/api/recordings/upload",
//         formData,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "multipart/form-data",
//           },
//         }
//       );

//       console.log("Video saved at:", videoRes.data.file_path);
//       recordingId = videoRes.data.id;
//     }
//     // 2️⃣ Save session events with recording_id
//     const recordedEvents = window.localStorage.getItem("tracked_dom_events");
//     const parsedEvents = recordedEvents ? JSON.parse(recordedEvents) : [];

//     const sessionRes = await axios.post<{ id: string }>(
//       "/api/sessions/",
//       {
//         name: `Session ${new Date().toLocaleString()}`,
//         events: parsedEvents,
//         recording_id: recordingId,
//       },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     console.log("Session events saved with ID:", sessionRes.data.id);
//     setLastRecordingId(sessionRes.data.id); // store SESSION_ID not recording_id
//   } catch (error) {
//     console.error("Failed to save session or video:", error);
//   }
// };

// const handleGenerateManual = async (role: string, format: string) => {
//   try {
//     const token = localStorage.getItem("token");
//     await axios.post(
//       `/api/manuals/generate/${lastRecordingId}?format=${format.toLowerCase()}`,
//       { role },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//   } catch (err) {
//     console.error("Error generating manual:", err);
//   }
// };



//   // const saveSessionAndVideo = async (videoBlob: Blob | null) => {
//   //   try {
//   //     const token = localStorage.getItem("token");
//   //     if (!token) {
//   //       console.error("No token found");
//   //       return;
//   //     }

//   //     const recordedEvents = window.localStorage.getItem("tracked_dom_events");
//   //     const parsedEvents = recordedEvents ? JSON.parse(recordedEvents) : [];

//   //     // 1️⃣ Save session events
//   //     await axios.post(
//   //       "/api/sessions/",
//   //       {
//   //         name: `Session ${new Date().toLocaleString()}`,
//   //         events: parsedEvents,
//   //       },
//   //       { headers: { Authorization: `Bearer ${token}` } }
//   //     );
//   //     console.log("Session events successfully saved");

//   //     // 2️⃣ Upload video if we have it
//   //     if (videoBlob) {
//   //       const formData = new FormData();
//   //       formData.append("file", videoBlob, "recording.webm");

//   //       const videoRes = await axios.post<{ id: string; file_path: string }>(
//   //         "/api/recordings/upload",
//   //         formData,
//   //         {
//   //           headers: {
//   //             Authorization: `Bearer ${token}`,
//   //             "Content-Type": "multipart/form-data",
//   //           },
//   //         }
//   //       );

//   //       console.log("Video saved at:", videoRes.data.file_path);
//   //       if (videoRes.data.id) {
//   //         setLastRecordingId(videoRes.data.id);
//   //       }
//   //     }
//   //   } catch (error) {
//   //     console.error("Failed to save session or video:", error);
//   //   }
//   // };

//   // const handleGenerateManual = async (role: string, format: string) => {
//   //   try {
//   //     const token = localStorage.getItem("token");
//   //     await axios.post(
//   //       `/api/manuals/generate/${lastRecordingId}?format=${format.toLowerCase()}`,
//   //       {},
//   //       {
//   //         headers: { Authorization: `Bearer ${token}` },
//   //       }
//   //     );
//   //   } catch (err) {
//   //     console.error("Error generating manual:", err);
//   //   }
//   // };

//   return (
//     <div className="min-h-screen bg-gradient-hero">
//       <Header isAuthenticated={true} />
//       <main className="container mx-auto py-8 space-y-8">
//         <div className="text-center space-y-4">
//           <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
//             Welcome Back!
//           </h1>
//           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//             Record your workflows and transform them into intelligent documentation with AI-powered insights.
//           </p>
//         </div>

//         <div className="grid lg:grid-cols-2 gap-8">
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
//                 <div className="h-2 w-2 rounded-full bg-recording animate-pulse"></div>
//                 Record Session
//               </h2>
//               <RecordingInterface
//                 onStartRecording={handleRecordingStart}
//                 onStopRecording={handleRecordingFinished}
//               />
//             </div>
//           </div>

//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
//                 <FileText className="h-5 w-5 text-primary" />
//                 Generate Manual
//               </h2>
//               {lastRecordingId !== null ? (
//                 <ManualGenerator
//                   recordingId={lastRecordingId.toString()}
//                   onGenerateManual={handleGenerateManual}
//                 />
//               ) : (
//                 <p className="text-muted-foreground text-sm italic">
//                   Start a recording to generate a manual.
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;

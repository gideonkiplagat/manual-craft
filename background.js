let eventQueue = [];
let sendInterval = null;
let mediaRecorder;
let videoChunks = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EVENT_RECORDED") {
    eventQueue.push({ ...msg.event, tabId: sender.tab.id, time: Date.now() });
  }

  if (msg.type === "SESSION_STARTED") {
    if (!sendInterval) {
      sendInterval = setInterval(uploadEvents, 5000);
    }
    startScreenRecording();
  }

  if (msg.type === "SESSION_STOPPED") {
    stopScreenRecording();
  }
});

async function startScreenRecording() {
  chrome.desktopCapture.chooseDesktopMedia(
    ["screen", "window", "tab"],
    async streamId => {
      if (!streamId) {
        console.error("[EXT] Screen capture denied.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: streamId
            }
          },
          audio: false
        });

        mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
        videoChunks = [];

        mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) videoChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(videoChunks, { type: "video/webm" });
          const formData = new FormData();

          const { sessionId, token } = await chrome.storage.local.get(["sessionId", "token"]);
          formData.append("video", blob, `session-${sessionId}.webm`);

          try {
            await fetch(`http://localhost:5000/api/recordings/video/${sessionId}`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: formData
            });
            console.log("[EXT] Video uploaded successfully.");
          } catch (err) {
            console.error("[EXT] Video upload failed", err);
          }
        };

        mediaRecorder.start();
        console.log("[EXT] Screen recording started.");
      } catch (err) {
        console.error("[EXT] Failed to get screen stream", err);
      }
    }
  );
}

function stopScreenRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    console.log("[EXT] Screen recording stopped.");
  }
}

async function uploadEvents() {
  if (eventQueue.length === 0) return;

  const { sessionId, token } = await chrome.storage.local.get(["sessionId", "token"]);
  if (!sessionId || !token) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await fetch(`http://localhost:5000/api/sessions/update/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ events: batch })
    });
    console.log("[EXT] Uploaded", batch.length, "events");
  } catch (err) {
    console.error("[EXT] Upload failed", err);
    eventQueue.unshift(...batch); // Retry later
  }
}

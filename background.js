// background.js (MV3 service worker)

const state = {
  isRecording: false,
  appOrigin: null,     // e.g., "http://localhost:8080"
  appTabId: null,      // FlowToManual tab id (where your React UI runs)
};

// captureVisibleTab wrapped in Promise and accepts windowId
function captureActiveTab(windowId) {
  return new Promise((resolve, reject) => {
    try {
      // windowId may be undefined -> captures currently focused window
      chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
        const err = chrome.runtime.lastError;
        if (err) return reject(err);
        resolve(dataUrl);
      });
    } catch (e) {
      reject(e);
    }
  });
}

// Broadcast a step to the FlowToManual app tab
async function sendStepToApp(step) {
  if (!state.appTabId) return;
  try {
    await chrome.tabs.sendMessage(state.appTabId, {
      type: "FTM_STEP",
      payload: step
    });
  } catch (e) {
    // App tab might not be ready yet. That's OK.
    console.warn("[BG] sendStepToApp error:", e && e.message ? e.message : e);
  }
}

function isAppUrl(url) {
  if (!url || !state.appOrigin) return false;
  try {
    return url.startsWith(state.appOrigin);
  } catch {
    return false;
  }
}

// Single onMessage listener (handles start/stop and capture requests)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "FTM_START") {
        state.isRecording = true;
        state.appOrigin = msg.appOrigin;
        // If sender has tab info, store the tab id as appTabId
        if (sender && sender.tab && sender.tab.id) state.appTabId = sender.tab.id;

        // Persist minimal state for content scripts
        await chrome.storage.session.set({
          FTM_IS_RECORDING: true,
          FTM_APP_ORIGIN: state.appOrigin,
          FTM_APP_TAB_ID: state.appTabId
        });

        sendResponse({ ok: true });
        return;
      }

      if (msg?.type === "FTM_STOP") {
        state.isRecording = false;
        await chrome.storage.session.set({
          FTM_IS_RECORDING: false
        });
        sendResponse({ ok: true });
        return;
      }

      // Click triggered from a content script. Use sender.tab.windowId to capture the right window.
      if (msg?.type === "FTM_CAPTURE_CLICK" && state.isRecording) {
        const tab = sender?.tab;
        if (!tab) {
          sendResponse({ ok: false, reason: "Missing tab info" });
          return;
        }
        if (isAppUrl(tab.url)) {
          sendResponse({ ok: false, reason: "Ignoring app tab" });
          return;
        }

        try {
          const dataUrl = await captureActiveTab(tab.windowId);
          const step = {
            timestamp: Date.now(),
            event_type: "click",
            description: `click on ${msg.selector || "document"}`,
            screenshot: dataUrl
          };
          await sendStepToApp(step);
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
        return;
      }

      // Generic request to capture a tab event (proxy path). If provided with windowId or tab we will capture.
      if (msg?.type === "FTM_CAPTURE_TAB_EVENT" && state.isRecording) {
        // Prefer payload.windowId or use active tab lookup
        let windowId = msg.payload && msg.payload.windowId;
        let tabInfo = null;
        if (!windowId) {
          const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
          tabInfo = tabs && tabs[0];
          windowId = tabInfo && tabInfo.windowId;
        }

        // if active tab is app or not found -> ignore
        const tabUrl = (tabInfo && tabInfo.url) || "";
        if (isAppUrl(tabUrl)) {
          sendResponse({ ok: false, reason: "Active tab is app or not found" });
          return;
        }

        try {
          const dataUrl = await captureActiveTab(windowId);
          const step = {
            timestamp: Date.now(),
            event_type: msg.payload?.event_type || "tab-event",
            description: msg.payload?.description || "tab/window event",
            screenshot: dataUrl
          };
          await sendStepToApp(step);
          sendResponse({ ok: true });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
        return;
      }
    } catch (errInner) {
      console.error("[BG] onMessage handler error:", errInner);
      // continue to sendResponse below if needed
    }
  })();

  // Indicate we'll call sendResponse asynchronously
  return true;
});

// When user activates another tab (switch), capture once if recording and the tab isn't the app
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  if (!state.isRecording) return;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && !isAppUrl(tab.url)) {
      try {
        const dataUrl = await captureActiveTab(tab.windowId);
        const step = {
          timestamp: Date.now(),
          event_type: "tab-activated",
          description: `Activated tab: ${tab.title || tab.url}`,
          screenshot: dataUrl
        };
        await sendStepToApp(step);
      } catch (e) {
        console.warn("[BG] capture onActivated failed:", e && e.message ? e.message : e);
      }
    }
  } catch (e) {
    // ignore
  }
});

// When focus changes to a window, capture the active tab in the new focused window
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (!state.isRecording) return;
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs && tabs[0];
    if (tab && !isAppUrl(tab.url)) {
      try {
        const dataUrl = await captureActiveTab(tab.windowId);
        const step = {
          timestamp: Date.now(),
          event_type: "window-focus",
          description: `Window focus changed (tab: ${tab.title || tab.url})`,
          screenshot: dataUrl
        };
        await sendStepToApp(step);
      } catch (e) {
        console.warn("[BG] capture onFocusChanged failed:", e && e.message ? e.message : e);
      }
    }
  } catch (e) {
    // ignore
  }
});

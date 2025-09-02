// content.js

let tracking = false;
let handlersAttached = false;

// guard so we don't attach multiple times in same page context
if (!window.__FTM_HANDLERS_ATTACHED) {
  window.__FTM_HANDLERS_ATTACHED = false;
}

function sendEvent(evt) {
  chrome.runtime.sendMessage({ type: "EVENT_RECORDED", event: evt });
}

function clickHandler(e) {
  const target = e.target;
  const path = getDomPath(target);
  const tag = target && target.tagName ? target.tagName : "unknown";
  const evt = {
    type: "click",
    target: tag,
    path,
    timestamp: new Date().toISOString()
  };

  // Always record the click event for event timeline
  sendEvent(evt);

  // Also ask background to capture screenshot from the active window where this click occurred.
  // Background will receive sender.tab (so it knows windowId).
  chrome.runtime.sendMessage({
    type: "FTM_CAPTURE_CLICK",
    selector: path
  });
}

function inputHandler(e) {
  const val = (e.target && "value" in e.target) ? e.target.value : undefined;
  sendEvent({
    type: "input",
    target: e.target.tagName,
    path: getDomPath(e.target),
    value: val,
    timestamp: new Date().toISOString()
  });
}

function changeHandler(e) {
  const val = (e.target && "value" in e.target) ? e.target.value : undefined;
  sendEvent({
    type: "change",
    target: e.target.tagName,
    path: getDomPath(e.target),
    value: val,
    timestamp: new Date().toISOString()
  });
}

function submitHandler(e) {
  sendEvent({
    type: "submit",
    target: e.target.tagName,
    path: getDomPath(e.target),
    timestamp: new Date().toISOString()
  });
}

function scrollHandler() {
  sendEvent({
    type: "scroll",
    scrollY: window.scrollY,
    timestamp: new Date().toISOString()
  });
}

function attachHandlers() {
  if (handlersAttached || window.__FTM_HANDLERS_ATTACHED) return;
  document.addEventListener("click", clickHandler, true);
  document.addEventListener("input", inputHandler, true);
  document.addEventListener("change", changeHandler, true);
  document.addEventListener("submit", submitHandler, true);
  document.addEventListener("scroll", scrollHandler, { capture: true, passive: true });
  handlersAttached = true;
  window.__FTM_HANDLERS_ATTACHED = true;
}

function detachHandlers() {
  if (!handlersAttached) return;
  document.removeEventListener("click", clickHandler, true);
  document.removeEventListener("input", inputHandler, true);
  document.removeEventListener("change", changeHandler, true);
  document.removeEventListener("submit", submitHandler, true);
  document.removeEventListener("scroll", scrollHandler, { capture: true });
  handlersAttached = false;
  window.__FTM_HANDLERS_ATTACHED = false;
}

async function initTrackingIfNeeded() {
  const data = await chrome.storage.session.get(["FTM_IS_RECORDING", "FTM_APP_ORIGIN"]);
  const isRecording = !!data.FTM_IS_RECORDING;
  const appOrigin = data.FTM_APP_ORIGIN || null;

  // Do not attach handlers on the app's own origin pages
  const onAppPage = appOrigin ? window.location.origin.startsWith(appOrigin) : false;

  if (isRecording && !onAppPage) {
    initTracking();
  } else {
    stopTracking();
  }
}

function initTracking() {
  if (tracking) return;
  tracking = true;
  attachHandlers();
}

function stopTracking() {
  if (!tracking) return;
  tracking = false;
  detachHandlers();
}

// Start immediately if recording flag is set in session storage
(async () => {
  await initTrackingIfNeeded();
})();

// React to session storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && ("FTM_IS_RECORDING" in changes || "FTM_APP_ORIGIN" in changes)) {
    initTrackingIfNeeded();
  }
});

// Allow background to push start/stop to existing tabs (keeps compatibility)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "START_TRACKING") initTracking();
  if (msg.type === "STOP_TRACKING") stopTracking();
  if (msg.type === "PING") sendResponse({ ok: true });
});

// Your existing selector builder
function getDomPath(el) {
  if (!el) return "";
  const stack = [];
  while (el && el.parentNode != null) {
    let sibCount = 0;
    let sibIndex = 0;
    for (let i = 0; i < el.parentNode.childNodes.length; i++) {
      const sib = el.parentNode.childNodes[i];
      if (sib.nodeName === el.nodeName) {
        if (sib === el) sibIndex = sibCount;
        sibCount++;
      }
    }
    const nodeName = el.nodeName.toLowerCase();
    if (sibCount > 1) stack.unshift(`${nodeName}:nth-of-type(${sibIndex + 1})`);
    else stack.unshift(nodeName);
    el = el.parentNode;
  }
  return stack.join(" > ");
}

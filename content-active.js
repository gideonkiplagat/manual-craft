// content-active.js
// Injected into every page. Listens for "click" events and asks background to capture a screenshot.
// Uses session storage flags and dynamically attaches/detaches.

(async function init() {
  let isRecordingCached = false;
  let appOriginCached = null;
  let handlersAttached = false;

  async function updateRecordingState() {
    const data = await chrome.storage.session.get(["FTM_IS_RECORDING", "FTM_APP_ORIGIN"]);
    isRecordingCached = !!data.FTM_IS_RECORDING;
    appOriginCached = data.FTM_APP_ORIGIN || null;

    const onAppPage = appOriginCached ? window.location.origin.startsWith(appOriginCached) : false;

    if (isRecordingCached && !onAppPage) {
      attachClick();
    } else {
      detachClick();
    }
  }

  function clickListener(e) {
    if (!isRecordingCached) return;

    const target = e.target;
    let selector = "document";
    if (target && target instanceof Element) {
      if (target.id) selector = `#${target.id}`;
      else if (target.className) {
        const classes = target.className.toString().trim().split(/\s+/).join(".");
        selector = `${target.tagName.toLowerCase()}.${classes}`;
      } else {
        selector = target.tagName.toLowerCase();
      }
    }

    // Request background to capture screenshot from the active window where the click happened.
    chrome.runtime.sendMessage({
      type: "FTM_CAPTURE_CLICK",
      selector
    });
  }

  function attachClick() {
    if (handlersAttached) return;
    window.addEventListener("click", clickListener, true);
    handlersAttached = true;
  }

  function detachClick() {
    if (!handlersAttached) return;
    window.removeEventListener("click", clickListener, true);
    handlersAttached = false;
  }

  // initialize
  await updateRecordingState();

  // update on storage changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session") return;
    if (changes.FTM_IS_RECORDING || changes.FTM_APP_ORIGIN) {
      updateRecordingState().catch(() => {});
    }
  });

})();

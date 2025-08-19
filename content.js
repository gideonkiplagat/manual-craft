chrome.storage.local.get(["recording"], (data) => {
  if (data.recording) {
    initTracking();
  }
});

function initTracking() {
  document.addEventListener("click", (e) => {
    chrome.runtime.sendMessage({
      type: "EVENT_RECORDED",
      event: {
        type: "click",
        target: e.target.tagName,
        path: getDomPath(e.target)
      }
    });
  });

  document.addEventListener("scroll", () => {
    chrome.runtime.sendMessage({
      type: "EVENT_RECORDED",
      event: {
        type: "scroll",
        scrollY: window.scrollY
      }
    });
  });
}

function getDomPath(el) {
  if (!el) return "";
  const stack = [];
  while (el.parentNode != null) {
    let sibCount = 0;
    let sibIndex = 0;
    for (let i = 0; i < el.parentNode.childNodes.length; i++) {
      const sib = el.parentNode.childNodes[i];
      if (sib.nodeName === el.nodeName) {
        if (sib === el) {
          sibIndex = sibCount;
        }
        sibCount++;
      }
    }
    const nodeName = el.nodeName.toLowerCase();
    if (sibCount > 1) {
      stack.unshift(`${nodeName}:nth-of-type(${sibIndex + 1})`);
    } else {
      stack.unshift(nodeName);
    }
    el = el.parentNode;
  }
  return stack.join(" > ");
}

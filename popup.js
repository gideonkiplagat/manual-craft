document.getElementById("start").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_RECORDING" });
});

document.getElementById("stop").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "STOP_RECORDING" });
});




// document.getElementById("start").addEventListener("click", async () => {
//   const token = localStorage.getItem("jwt_token"); // Assume dashboard already stored this in chrome storage
//   const res = await fetch("http://localhost:5000/api/sessions/start", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${token}` }
//   });

//   const data = await res.json();
//   const sessionId = data.session_id;

//   chrome.storage.local.set({ sessionId, token, recording: true }, () => {
//     console.log("Recording started for session:", sessionId);
//     chrome.runtime.sendMessage({ type: "SESSION_STARTED", sessionId });
//   });
// });

// document.getElementById("stop").addEventListener("click", () => {
//   chrome.storage.local.set({ recording: false }, () => {
//     console.log("Recording stopped.");
//   });
// });

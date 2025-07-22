import {
  initVoiceToggle,
  initDirectionsPanelToggle,
  updateStatus,
  updateControls,
  showToast
} from './ui.js';

import { initDestinationInput, monitorDestinationProximity } from './destination.js';
import { loadTripHistory, downloadCSV, clearHistory } from './TripStore.js';
import { directionsRenderer } from './map.js'; // Assuming exported from map.js
import { logoutUser } from './auth.js';

window.onload = function () {
  if (!window.MileApp) {
    console.error("🚫 MileApp not available — tracking functions can't be bound yet.");
    return;
  }

  // 🌐 Core setup
  initDestinationInput();
  initVoiceToggle();
  initDirectionsPanelToggle();
  monitorDestinationProximity();
  updateStatus("Idle");
  updateControls();
  loadTripHistory();

  // ⚙️ Register service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js")
      .then(() => console.log("✅ Service Worker registered"))
      .catch(err => console.error("❌ Service Worker error:", err));
  }

  // 🔘 Bind button handlers
  const buttonHandlers = {
    startTrackingBtn: MileApp.startTracking,
    pauseTrackingBtn: MileApp.pauseTracking,
    resumeTrackingBtn: MileApp.resumeTracking,
    endTrackingBtn: MileApp.endTracking,
    downloadCSVBtn: downloadCSV,
    clearHistoryBtn: clearHistory,
    toggleHelpBtn: MileApp.toggleHelp,
    restoreTrip: MileApp.restoreLastTrip,
    logoutBtn: logoutUser
  };

  for (const [id, handler] of Object.entries(buttonHandlers)) {
  const el = document.getElementById(id);
  if (el) el.onclick = handler; // preserves `this` context
  else console.warn(`🔍 Missing button with ID: ${id}`);
}


  // 📝 Clear trip form inputs
  const purposeInput = document.getElementById("trip-purpose");
  if (purposeInput) purposeInput.value = "";

  const notesInput = document.getElementById("trip-notes");
  if (notesInput) notesInput.value = "";

  // 🍞 Confirm toast container exists
  if (!document.getElementById("toast")) {
    console.warn("🚨 Toast element not found.");
  }

  // 🧹 Clear any residual directions on load
  if (typeof directionsRenderer !== "undefined" && directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
    const panel = document.getElementById("directions-panel");
    if (panel) panel.innerHTML = "";
  }
};

// 📋 Handle menu popup commands
function handleMenuAction(action) {
  switch (action) {
    case "start": MileApp.startTracking(); break;
    case "pause": MileApp.pauseTracking(); break;
    case "resume": MileApp.resumeTracking(); break;
    case "end": MileApp.endTracking(); break;
    case "download": downloadCSV(false); break;
    default:
      console.warn(`⚠️ Unknown menu action: ${action}`);
      showToast(`Unknown menu action: ${action}`, "error");
  }
}

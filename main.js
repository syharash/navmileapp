window.onload = function () {
   if (!window.MileApp) {
    console.error("🚫 MileApp not available — tracking functions can't be bound yet.");
    return;
   }
  // initMapServices();
  updateStatus("Idle");
  updateControls();
  loadTripHistory();

  if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("✅ Service Worker registered"))
    .catch(err => console.error("❌ Service Worker error:", err));
}
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
    if (el) el.onclick = handler;
    else console.warn(`🔍 Missing button with ID: ${id}`);
  }

  document.getElementById("trip-purpose").value = "";
  document.getElementById("trip-notes").value = "";

  if (!document.getElementById("toast")) {
    console.warn("🚨 Toast element not found.");
  }

  if (directionsRenderer) {
    directionsRenderer.setDirections({ routes: [] });
    const panel = document.getElementById("directions-panel");
    if (panel) panel.innerHTML = "";
  }
};

function handleMenuAction(action) {
  switch (action) {
    case "start": MileApp.startTracking(); break;
    case "pause": MileApp.pauseTracking(); break;
    case "resume": MileApp.resumeTracking(); break;
    case "end": MileApp.endTracking(); break;
    case "download": downloadCSV(false); break;
    default: console.warn(`⚠️ Unknown menu action: ${action}`);
  }
}

// === Toggle Directions Panel Visibility ===
function initDirectionsPanelToggle() {
  const toggleBtn = document.getElementById("toggleRouteBtn");
  const panel = document.getElementById("directions-panel");

  if (!toggleBtn || !panel) {
    console.warn("⚠️ Directions toggle elements not found");
    return;
  }

  // Start collapsed by default
  panel.classList.add("collapsed");

  toggleBtn.addEventListener("click", () => {
    const isCollapsed = panel.classList.contains("collapsed");
    panel.classList.toggle("collapsed", !isCollapsed);
    panel.classList.toggle("expanded", isCollapsed);

    // Optional: change button label on toggle
    toggleBtn.textContent = isCollapsed ? "📍 Hide Route Details" : "📍 Show Route Details";
  });
}

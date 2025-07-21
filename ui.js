// === Safe Text Update with Flash ===
function safeUpdate(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`⚠️ Element with ID "${id}" not found`);
    return;
  }
  el.textContent = value;
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 800);
}

// === Update Dynamic Trip Status Label ===
function updateTripStatusLabel(state) {
  const banner = document.getElementById("trip-status-label");
  if (!banner) return;
  const labels = {
    idle: "🟡 Idle",
    tracking: "🟢 Tracking...",
    paused: "⏸️ Paused",
    complete: "✅ Trip Ended"
  };
  banner.textContent = labels[state] || "–";
}

function updateStatus(state) {
  const el = document.getElementById("tracking-status");
  if (el) el.textContent = state;
  document.body.classList.toggle("paused", state === "Paused");
  document.body.classList.toggle("ended", state === "Ended" || state === "Trip Complete");
}

function updateControls() {
  const startTrackingBtn = document.getElementById("startTrackingBtn");
  const pauseTrackingBtn = document.getElementById("pauseTrackingBtn");
  const resumeTrackingBtn = document.getElementById("resumeTrackingBtn");
  const endTrackingBtn = document.getElementById("endTrackingBtn");

  if (window.tripStatus === 'idle') {
    startTrackingBtn.disabled = false;
    pauseTrackingBtn.disabled = true;
    resumeTrackingBtn.disabled = true;
    endTrackingBtn.disabled = true;
  } else if (window.tripStatus === 'tracking') {
    startTrackingBtn.disabled = true;
    pauseTrackingBtn.disabled = false;
    resumeTrackingBtn.disabled = true;
    endTrackingBtn.disabled = false;
  } else if (window.tripStatus === 'paused') {
    startTrackingBtn.disabled = true;
    pauseTrackingBtn.disabled = true;
    resumeTrackingBtn.disabled = false;
    endTrackingBtn.disabled = true;
  } else if (window.tripStatus === 'resumed') {
    startTrackingBtn.disabled = true;
    pauseTrackingBtn.disabled = false;
    resumeTrackingBtn.disabled = true;
    endTrackingBtn.disabled = false;
  }
}

// === Show Toast with Style & Timeout ===
function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

function toggleHelp() {
  const h = document.getElementById("help-screen");
  h.style.display = h.style.display === "none" ? "block" : "none";
}

// === Toggle Directions Panel Visibility ===
function initDirectionsPanelToggle() {
  const toggleBtn = document.getElementById("toggleRouteBtn");
  const panel = document.getElementById("directions-panel");

  if (!toggleBtn || !panel) {
    console.warn("⚠️ Directions toggle elements not found");
    return;
  }

  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("collapsed");
    panel.classList.toggle("expanded");
  });
}

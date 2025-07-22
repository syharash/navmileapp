// 🌐 Global voice setting (default: on)
window.voiceGuidanceEnabled = true;

// 🎛️ Initialize voice guidance toggle button
export function initVoiceToggle() {
  const btn = document.getElementById("voice-toggle");
  if (!btn) {
    console.warn("⚠️ Voice toggle button not found");
    return;
  }

  btn.onclick = () => {
    window.voiceGuidanceEnabled = !window.voiceGuidanceEnabled;
    btn.classList.toggle("active", window.voiceGuidanceEnabled);
    btn.textContent = window.voiceGuidanceEnabled ? "🔊 Voice On" : "🔇 Voice Off";
    showToast(`Voice ${window.voiceGuidanceEnabled ? "enabled" : "disabled"}`, "info");
  };
}

// 👁️ Getter for voice guidance state (used by other modules)
export function isVoiceEnabled() {
  return window.voiceGuidanceEnabled;
}

// ✨ Flash text update utility
export function safeUpdate(id, value) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`⚠️ Element with ID "${id}" not found`);
    return;
  }
  el.textContent = value;
  el.classList.add("flash");
  setTimeout(() => el.classList.remove("flash"), 800);
}

// 🧭 Trip status banner updater (idle/tracking/paused/etc)
export function updateTripStatusLabel(state) {
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

// 📋 UI feedback state updater
export function updateStatus(state) {
  const el = document.getElementById("tracking-status");
  if (el) el.textContent = state;
  document.body.classList.toggle("paused", state === "Paused");
  document.body.classList.toggle("ended", state === "Ended" || state === "Trip Complete");
}

// 🎮 Enable/disable tracking controls based on tripStatus
export function updateControls() {
  const startTrackingBtn = document.getElementById("startTrackingBtn");
  const pauseTrackingBtn = document.getElementById("pauseTrackingBtn");
  const resumeTrackingBtn = document.getElementById("resumeTrackingBtn");
  const endTrackingBtn = document.getElementById("endTrackingBtn");

  switch (window.tripStatus) {
    case 'idle':
      startTrackingBtn.disabled = false;
      pauseTrackingBtn.disabled = true;
      resumeTrackingBtn.disabled = true;
      endTrackingBtn.disabled = true;
      break;
    case 'tracking':
      startTrackingBtn.disabled = true;
      pauseTrackingBtn.disabled = false;
      resumeTrackingBtn.disabled = true;
      endTrackingBtn.disabled = false;
      break;
    case 'paused':
      startTrackingBtn.disabled = true;
      pauseTrackingBtn.disabled = true;
      resumeTrackingBtn.disabled = false;
      endTrackingBtn.disabled = true;
      break;
    case 'resumed':
      startTrackingBtn.disabled = true;
      pauseTrackingBtn.disabled = false;
      resumeTrackingBtn.disabled = true;
      endTrackingBtn.disabled = false;
      break;
  }
}

// 🍞 Show toast with style and auto-remove
export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ❓ Toggle help screen visibility
export function toggleHelp() {
  const h = document.getElementById("help-screen");
  if (!h) {
    console.warn("⚠️ Help screen element not found");
    return;
  }
  h.style.display = h.style.display === "none" ? "block" : "none";
}

// 🧭 Toggle directions panel open/collapsed
export function initDirectionsPanelToggle() {
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

// 📦 Module initializer (optional use in main.js)
export function initUI() {
  initVoiceToggle();
  initDirectionsPanelToggle();
}

function safeUpdate(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  } else {
    console.warn(`⚠️ Element with ID "${id}" not found`);
  }
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

function showToast(msg, type = "default") {
  const t = document.getElementById("toast");
  if (!t) {
    console.warn("🚨 Toast element not found.");
    return;
  }
  t.textContent = msg;
  t.className = "show";
  t.style.backgroundColor = type === "error" ? "#B00020" : "#222";
  setTimeout(() => t.className = "", 3000);
}

function toggleHelp() {
  const h = document.getElementById("help-screen");
  h.style.display = h.style.display === "none" ? "block" : "none";
}

import { getMapInstance } from './map.js';

let vehicleMarker;
let spokenSteps = new Set();
let watchId = null;

// 🚗 Initialize vehicle marker and begin navigation tracking
export function initVehicleTracking(directions) {
  const map = getMapInstance();
  if (!map || watchId !== null) {
    console.warn("🛑 Map not available or tracker already running.");
    return;
  }

  const vehicleIcon = {
    url: "car-icon.svg",
    scaledSize: new google.maps.Size(40, 40)
  };

  vehicleMarker = new google.maps.Marker({
    map: map,
    icon: vehicleIcon,
    position: null
  });

  if (!directions?.routes?.[0]?.legs?.[0]?.steps) {
  console.warn("🛑 Directions data missing or invalid.");
  return;
}
  const steps = directions.routes[0].legs[0].steps;
  
  watchId = navigator.geolocation.watchPosition(
    pos => {
      const current = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      vehicleMarker.setPosition(current);
      map.panTo(current);
      speakUpcomingInstruction(current, steps);
    },
    err => console.error("🛑 Tracking error:", err),
    { enableHighAccuracy: true, maximumAge: 1000 }
  );
}

// 🗣️ Determine which instruction to speak next
function speakUpcomingInstruction(current, steps) {
  if (!window.voiceGuidanceEnabled) return;

  steps.forEach((step, index) => {
    const startLoc = step.start_location;
    const dist = google.maps.geometry.spherical.computeDistanceBetween(current, startLoc);

    if (dist < 50 && !spokenSteps.has(index)) {
      spokenSteps.add(index);
      const instruction = stripHTML(step.instructions || "Continue");
      updateNavBanner(instruction);
      speakText(`Next: ${instruction}`);
    }
  });
}

// 📋 Update visible navigation banner
function updateNavBanner(instruction) {
  const el = document.getElementById("nav-banner");
  if (el) el.textContent = `Next: ${instruction}`;
}

// 🔊 Speak text with interrupt handling
export function speakText(text) {
  window.speechSynthesis.cancel(); // Prevent overlap
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  window.speechSynthesis.speak(msg);
}

// 🎯 Announce arrival at destination
export function speakArrival(destinationName) {
  speakText(`You've arrived at ${destinationName}. Trip ended.`);
}

// 🧹 Clean up map, speech, and tracking
export function resetNavigation() {
  if (vehicleMarker) {
    vehicleMarker.setMap(null);
    vehicleMarker = null;
  }

  spokenSteps.clear();
  window.speechSynthesis.cancel();
  updateNavBanner("");

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

// 🧼 Safely strip HTML tags from instruction text
function stripHTML(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

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

  // 🖼️ Vehicle icon as a reusable DOM element
  const vehicleIconElement = (() => {
    const img = document.createElement('img');
    img.src = "Copilot.png";
    img.style.width = "40px"
    img.style.height = "40px";
    img.style.objectFit = "contain";
    return img;
  })();

  const markerNamespace = google.maps.marker;

  // 🧠 Unified marker setup: AdvancedMarkerElement if available, fallback otherwise
  if (markerNamespace?.AdvancedMarkerElement) {
    const { AdvancedMarkerElement } = markerNamespace;
    vehicleMarker = new AdvancedMarkerElement({
      map,
      position: null, // ⛳ Safe placeholder until GPS kicks in
      content: vehicleIconElement
    });
  } else {
    console.warn('AdvancedMarkerElement not available. Using fallback marker.');
    vehicleMarker = new google.maps.Marker({
      map,
      position: null,
      icon: "car-icon.svg" // 🎯 Reusing same asset for simplicity
    });
  }

  // 📌 Removed second, redundant instantiation of vehicleMarker here.
  // You previously rebuilt the same marker with a new content block.
  // That’s now consolidated above.

  if (!directions?.routes?.[0]?.legs?.[0]?.steps) {
    console.warn("🛑 Directions data missing or invalid.");
    return;
  }

  const steps = directions.routes[0].legs[0].steps;

  // 📡 Start GPS tracking and update marker position dynamically
  watchId = navigator.geolocation.watchPosition(
    pos => {
      const current = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      if (vehicleMarker) vehicleMarker.position = current; // 🔄 Updates live position
      map.panTo(current); // 🎯 Keeps map centered on vehicle
      speakUpcomingInstruction(current, steps); // 🔊 Triggers voice prompt
    },
    err => console.error("🛑 Tracking error:", err),
    { enableHighAccuracy: true, maximumAge: 1000 }
  );
  // 🔊 Warm-up speech engine to avoid cold start delay
setTimeout(() => speakText("Navigation initiated."), 1000);
}

// 🗣️ Check proximity and trigger voice navigation
function speakUpcomingInstruction(current, steps) {
  console.log("🔊 Voice guidance enabled?", window.voiceGuidanceEnabled);
  if (!window.voiceGuidanceEnabled) return;

  steps.forEach((step, index) => {
    const startLoc = step.start_location;
    const dist = google.maps.geometry.spherical.computeDistanceBetween(current, startLoc);

    if (dist < 80 && !spokenSteps.has(index)) {
      spokenSteps.add(index);
      const instruction = stripHTML(step.instructions || "Continue");
      updateNavBanner(instruction);
      speakText(`Next: ${instruction}`);
    }
  });
}

// 🪧 Show current step in UI banner
function updateNavBanner(instruction) {
  const el = document.getElementById("nav-banner");
 function updateNavBanner(instruction) {
  const el = document.getElementById("nav-banner");
  if (el) {
    const debugMsg = `Next: ${instruction}`;
    const distText = `Distance trigger: < 80m`;
    el.textContent = `${debugMsg} • ${distText}`;
  }
}

// 🔊 Text-to-speech with interrupt control
export function speakText(text) {
  window.speechSynthesis.cancel(); // ⚠ Prevent overlapping speech
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  window.speechSynthesis.speak(msg);
}

// 🏁 Trigger arrival voice cue
export function speakArrival(destinationName) {
  speakText(`You've arrived at ${destinationName}. Trip ended.`);
}

// 🧹 Clear map, speech, and GPS tracking
export function resetNavigation() {
  if (vehicleMarker) {
    vehicleMarker.setMap(null); // 🧽 Remove from map
    vehicleMarker = null;
  }

  spokenSteps.clear();
  window.speechSynthesis.cancel(); // 🧼 Stop any ongoing speech
  updateNavBanner("");

  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId); // 🛑 Stop live tracking
    watchId = null;
  }
}

// 🧼 Strip HTML tags from step instructions
function stripHTML(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

  export function testSpeakStep(index = 0) {
  const map = getMapInstance();
  const step = window?.routeSteps?.[index];
  if (step) {
    const instruction = stripHTML(step.instructions || "Continue");
    speakText(`Test step ${index}: ${instruction}`);
  } else {
    console.warn("🛑 No step found at index", index);
  }
}  

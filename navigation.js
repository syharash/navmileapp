let vehicleMarker;
let spokenSteps = new Set();

function initVehicleTracking(map, directions) {
  const vehicleIcon = {
    url: "car-icon.svg",
    scaledSize: new google.maps.Size(40, 40)
  };

  vehicleMarker = new google.maps.Marker({
    map: map,
    icon: vehicleIcon,
    position: null
  });

  const steps = directions.routes[0].legs[0].steps;

  navigator.geolocation.watchPosition(
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

function speakUpcomingInstruction(current, steps) {
  if (!window.voiceGuidanceEnabled) return;
  steps.forEach((step, index) => {
    const startLoc = step.start_location;
    const dist = google.maps.geometry.spherical.computeDistanceBetween(current, startLoc);

    if (dist < 50 && !spokenSteps.has(index)) {
      spokenSteps.add(index);

      const instruction = stripHTML(step.instructions || "Continue");
      updateNavBanner(instruction);  // 👈 Visual cue
      speakText(`Next: ${instruction}`);
    }
  });
}

function updateNavBanner(instruction) {
  const el = document.getElementById("nav-banner");
  if (el) el.textContent = `Next: ${instruction}`;
}

function speakText(text) {
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-US";
  window.speechSynthesis.speak(msg);
}

// Optionally call this on trip end to say goodbye
function speakArrival(destinationName) {
  speakText(`You've arrived at ${destinationName}. Trip ended.`);
}

function resetNavigation() {
  if (vehicleMarker) vehicleMarker.setMap(null);
  spokenSteps.clear();
  window.speechSynthesis.cancel();
  updateNavBanner(""); // Clear banner
}
function stripHTML(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

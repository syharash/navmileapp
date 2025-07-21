// === destination.js ===

let selectedDestination = null;
let destinationName = "";

// Initialize Places Autocomplete input
function initDestinationInput() {
  const input = document.getElementById("destination-input");
  if (!input) return;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    fields: ["geometry", "name"]
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    selectedDestination = place.geometry.location;
    destinationName = place.name || "Destination";

    showToast(`📍 Destination set: ${destinationName}`, "success");

    startDestinationWatcher(); // Start monitoring only after destination is set
  });
}

// Start monitoring proximity once destination is known
function startDestinationWatcher() {
 if (!selectedDestination) {
  console.warn("Destination removed during trip");
  return;
}
  
  navigator.geolocation.watchPosition(
    pos => {
      const currentLoc = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      const distance = google.maps.geometry.spherical.computeDistanceBetween(currentLoc, selectedDestination);

      const threshold = getArrivalThreshold(); // default: 100m
      if (
        (window.tripStatus === "tracking" || window.tripStatus === "resumed") &&
        distance < threshold
      ) {
        confirmTripEnd(distance);
        optionallyExpandDirectionsPanel();
      }
    },
    err => console.warn("📡 Location error while checking destination:", err),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

// Get dynamic threshold from UI, fallback to 100 meters
function getArrivalThreshold() {
  const sel = document.getElementById("arrival-threshold");
  return sel ? parseInt(sel.value, 10) || 100 : 100;
}


function monitorDestinationProximity() {
  if (!selectedDestination || window.tripStatus !== "tracking") return;

  navigator.geolocation.watchPosition(
    pos => {
      const currentLoc = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
      const distance = google.maps.geometry.spherical.computeDistanceBetween(currentLoc, selectedDestination);

      if (distance < 100) {
        confirmTripEnd(distance);
      }
    },
    err => console.warn("📡 Location error while checking destination:", err),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}

// Prompt user to confirm trip end when near destination
function confirmTripEnd(distance) {
  if (document.getElementById("destination-confirm-btn")) return; // Prevent duplicates

  showToast(`🚗 You're within ${Math.round(distance)}m of ${destinationName}. End trip?`, "info", 5000);

  const btn = document.createElement("button");
  btn.id = "destination-confirm-btn";
  btn.textContent = "✅ End Trip Now";
  btn.className = "toast toast-success";
  if (window.voiceGuidanceEnabled && typeof speakArrival === "function") {
  speakArrival(destinationName);
      };
  btn.onclick = () => {
    clearDestinationPrompt();
    MileApp.endTracking();
  };

  document.body.appendChild(btn);
  setTimeout(() => clearDestinationPrompt(), 10000);
}

// Cleanup confirm prompt from DOM
function clearDestinationPrompt() {
  const btn = document.getElementById("destination-confirm-btn");
  if (btn) btn.remove();
}

// Auto-expand directions panel if near arrival
function optionallyExpandDirectionsPanel() {
  const panel = document.getElementById("directions-panel");
  if (panel && panel.classList.contains("collapsed")) {
    panel.classList.remove("collapsed");
    panel.classList.add("expanded");
  }
}

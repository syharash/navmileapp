// === destination.js ===
import { showToast } from './ui.js';
let selectedDestination = null;
let destinationName = "";
import { initMapServices, getMapInstance } from './map.js';
let debounceTimeout;

// Initialize Places Autocomplete input
export function initDestinationInput() {
  const autocompleteElement = document.getElementById("destination-autocomplete");
  
  autocompleteElement.addEventListener("placechange", () => {
  const place = autocompleteElement.getPlace();
  // ⬇️ Use place information here (e.g. store in state, center map)
  console.log("Selected destination:", place);
});
  
 // if (!window.google || !google.maps || !google.maps.places || !google.maps.places.Autocomplete) {
 //   console.error("Autocomplete is not available. Check Maps API loading.");
 //   return;
 // }

  // const autocomplete = new google.maps.places.Autocomplete(input, {
  //  types: ["address"],
 //   fields: ["place_id", "geometry", "name"]
 // });

  //autocomplete.addListener("place_changed", () => {
  //  const place = autocomplete.getPlace();
  //  console.log("Selected destination:", place);
 // });
}
 
// import { initMapServices } from './map.js';

function handleDestination(lat, lng) {
  initMapServices(); // Ensure map is ready
  const map = getMapInstance(); // Safely retrieve shared map instance
  if (!map) {
    console.warn("❌ Map not initialized — cannot place destination marker.");
    return;
  }
  const destination = new google.maps.LatLng(lat, lng);
  const marker = new google.maps.Marker({
    position: destination,
    map: map,
    title: 'Destination',
    icon: 'your-icon.png'
  });

  map.panTo(destination);
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


export function monitorDestinationProximity() {
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

import { showToast, safeUpdate, updateStatus, updateControls } from './ui.js';
import { initMapServices, getMapInstance, directionsRenderer, directionsService, getRoute, renderSteps } from './map.js';
import { logTrip } from './TripStore.js';
import { speakText, initVehicleTracking} from './navigation.js';


let trackingPath = [];
let tracking = false;
let trackingInterval = null;
let trackingPolyline = null;
let tripStartTime = null;
let tripStart = null;
let tripEnd = null;
let pauseStartTime = null;
let totalPauseDuration = 0;

// === Retry wrapper for vehicle tracking initialization ===
function tryInitializeTracking(result, retries = 3) {
  const markerNamespace = google.maps.marker;
  if (markerNamespace?.AdvancedMarkerElement) {
    initVehicleTracking(result);
  } else if (retries > 0) {
    console.warn('AdvancedMarkerElement not ready. Retrying...');
    setTimeout(() => tryInitializeTracking(result, retries - 1), 1000);
  } else {
    console.error('AdvancedMarkerElement unavailable after retries. Falling back.');
    initVehicleTracking(result); // Optional: call with fallback logic inside
  }
}

window.tripStatus = 'idle';

// === Input watcher: destination selection ===
export function watchDestinationSelection() {
  const autocompleteElement = document.getElementById("destination-autocomplete");
  if (!autocompleteElement) return;

  autocompleteElement.addEventListener("placechange", () => {
    const place = autocompleteElement.getPlace();
    if (!place || !place.geometry || !place.geometry.location) return;

    const { lat, lng } = place.geometry.location;
    const map = getMapInstance();
    if (map) map.panTo({ lat: lat(), lng: lng() });

    window.selectedDestination = place.geometry.location;
    window.destinationName = place.name || place.formatted_address || "Destination";

    showToast(`📍 Destination set: ${window.destinationName}`);
  });
}

window.MileApp = {
  updateStatusBar(status) {
    document.getElementById("status-text").textContent = status;
  },

  startTracking() {
    document.querySelector(".map-panel").style.display = "flex";
    this.updateStatusBar("Tracking");

    tripStartTime = Date.now();
    document.getElementById("trip-timer").style.display = "block";
    this.updateTripTimer();
    window.tripStatus = 'tracking';
    totalPauseDuration = 0;
    trackingPath = [];

    setTimeout(() => {
      initMapServices();
      const map = getMapInstance();
      if (!map) {
        console.warn("🛑 Map instance not available");
        return;
      }

      google.maps.event.trigger(map, 'resize');

      trackingPolyline = new google.maps.Polyline({
        path: trackingPath,
        geodesic: true,
        strokeColor: "#00BFFF",
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map
      });

      navigator.geolocation.getCurrentPosition(pos => {
        const latLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        tripStart = {
          latitude: latLng.lat,
          longitude: latLng.lng,
          timestamp: Date.now()
        };

        trackingPath.push(latLng);
        trackingPolyline.setPath(trackingPath);
        map.setCenter(latLng);
        google.maps.event.trigger(map, 'resize');

        tracking = true;
        showToast("🚀 Trip started!");
        updateStatus("Tracking");
        updateControls();

        if (window.voiceGuidanceEnabled) {
          speakText("Trip started. Navigation will begin when route is available.");
        }

        trackingInterval = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            pos => {
              const newLatLng = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              };
              trackingPath.push(newLatLng);
              trackingPolyline.setPath(trackingPath);
              map.setCenter(newLatLng);
            },
            () => showToast("⚠️ Unable to access GPS during tracking", "error")
          );
        }, 10000);

      }, () => showToast("⚠️ Unable to access GPS", "error"));
    }, 300);
  },

  pauseTracking() {
    this.updateStatusBar("Paused");
    window.tripStatus = 'paused';
    clearInterval(trackingInterval);
    trackingInterval = null;
    pauseStartTime = Date.now();
    updateStatus("Paused");
    showToast("⏸️ Trip paused");
    updateControls();
  },

  resumeTracking() {
    this.updateStatusBar("Tracking");
    window.tripStatus = 'resumed';
    trackingInterval = setInterval(() => {
      // polling logic…
    }, 10000);

    if (pauseStartTime) {
      totalPauseDuration += Date.now() - pauseStartTime;
      pauseStartTime = null;
    }
    updateStatus("Tracking");
    showToast("▶️ Trip resumed");
    updateControls();
  },

  async endTracking() {
    this.updateStatusBar("Idle");
    document.getElementById("trip-timer").style.display = "none";
    window.tripStatus = 'idle';

    navigator.geolocation.getCurrentPosition(async pos => {
      tripEnd = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        timestamp: Date.now()
      };

      if (!tripStart || !tripEnd) {
        alert("Trip cannot be ended: Missing location data.");
        return;
      }

      clearInterval(trackingInterval);
      trackingInterval = null;
      tracking = false;

      try {
        const result = await getRoute(tripStart, tripEnd);
        const leg = result.routes[0].legs[0];
        const map = getMapInstance();
        directionsRenderer.setDirections(result);
        tryInitializeTracking(result);
        localStorage.setItem("lastRoute", JSON.stringify(result));

        const distanceMi = (leg.distance.value / 1609.34).toFixed(2);
        const durationMin = Math.round(leg.duration.value / 60);
        const rate = parseFloat(document.getElementById("rate")?.value || "0");
        const reimbursement = (distanceMi * rate).toFixed(2);
        const pausedMin = Math.round(totalPauseDuration / 60000);
        const purpose = document.getElementById("trip-purpose").value || "–";
        const notes = document.getElementById("trip-notes").value || "–";

        safeUpdate("summary-purpose", purpose);
        safeUpdate("summary-notes", notes);
        safeUpdate("summary-start", leg.start_address);
        safeUpdate("summary-end", leg.end_address);
        safeUpdate("summary-distance", `${distanceMi} mi`);
        safeUpdate("summary-duration", `${durationMin} min`);
        safeUpdate("summary-amount", `$${reimbursement}`);
        safeUpdate("pause-summary", `${pausedMin} min`);
        safeUpdate("lastDistance", `${distanceMi} mi`);
        safeUpdate("lastDuration", `${durationMin} min`);

        renderSteps(leg.steps);
        logTrip(purpose, notes, distanceMi, durationMin, pausedMin, reimbursement);
        showToast(`✅ Trip complete: ${distanceMi} mi`);
      } catch (err) {
        console.error("endTracking() error:", err);
        const cached = localStorage.getItem("lastRoute");
        if (cached) {
          const result = JSON.parse(cached);
          directionsRenderer.setDirections(result);
          renderSteps(result.routes[0].legs[0].steps);
          showToast("⚠️ Offline: showing last saved route");
        } else {
          showToast("❌ " + err.message, "error");
        }
      }

      updateStatus("Trip Complete");
      updateControls();
      tripStart = tripEnd = null;
    }, () => {
      showToast("⚠️ GPS access failed", "error");
      updateStatus("Trip Complete");
    });
  },

  updateTripTimer() {
    if (!tripStartTime) return;
    const elapsed = new Date(Date.now() - tripStartTime);
    const hh = String(elapsed.getUTCHours()).padStart(2, "0");
    const mm = String(elapsed.getUTCMinutes()).padStart(2, "0");
    const ss = String(elapsed.getUTCSeconds()).padStart(2, "0");
    document.getElementById("trip-timer").textContent = `Trip Time: ${hh}:${mm}:${ss}`;
    setTimeout(() => this.updateTripTimer(), 1000);
  },

  restoreLastTrip() {
    const cached = localStorage.getItem("lastRoute");
    if (!cached) {
      showToast("🕵️ No saved trip to restore");
      return;
    }

    const result = JSON.parse(cached);
    const leg = result.routes[0].legs[0];
    const map = getMapInstance();
    directionsRenderer.setDirections(result);
    tryInitializeTracking(result);


    safeUpdate("summary-start", leg.start_address);
    safeUpdate("summary-end", leg.end_address);
    safeUpdate("summary-distance", `${(leg.distance.value / 1609.34).toFixed(2)} mi`);
    safeUpdate("summary-duration", `${Math.round(leg.duration.value / 60)} min`);

    const panel = document.getElementById("directions-panel");
    panel.innerHTML = "";

    result.routes[0].legs.forEach((leg, index) => {
      const header = document.createElement("h4");
      header.textContent = `Leg ${index + 1}: ${leg.start_address} → ${leg.end_address}`;
      panel.appendChild(header);
      renderSteps(leg.steps);
    });

    showToast("🔄 Last trip restored");
  }
};

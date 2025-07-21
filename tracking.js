let trackingPath = [];
let tracking = false;
window.tripStatus = 'idle';
let trackingInterval = null;
let tripStart = null;
let tripEnd = null;
let pauseStartTime = null;
let totalPauseDuration = 0;

window.MileApp = {
 updateStatusBar(status) {
  document.getElementById("status-text").textContent = status;
},
startTracking() {
  MileApp.updateStatusBar("Tracking");
  tripStartTime = Date.now();
  document.getElementById("trip-timer").style.display = "block";
  MileApp.updateTripTimer();
  window.tripStatus = 'tracking';
  totalPauseDuration = 0;
  trackingPath = []; // reset live path

  // === Initialize map and polyline ===
  initMapServices();
  trackingPolyline = new google.maps.Polyline({
    path: trackingPath,
    geodesic: true,
    strokeColor: "#00BFFF",
    strokeOpacity: 1.0,
    strokeWeight: 4,
    map: map
  });

  // === Capture initial location ===
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

    // === Start polling location every 10 seconds ===
    trackingInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        const newLatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };

        trackingPath.push(newLatLng);
        trackingPolyline.setPath(trackingPath);
        map.setCenter(newLatLng);
      }, () => console.warn("⚠️ Unable to access GPS during tracking"));
    }, 10000);
  }, () => showToast("⚠️ Unable to access GPS", "error"));
},
pauseTracking() {
  MileApp.updateStatusBar("Paused");
  window.tripStatus = 'paused';
  clearInterval(trackingInterval);
  trackingInterval = null;
  pauseStartTime = Date.now();
  updateStatus("Paused");
  showToast("⏸️ Trip paused");
  updateControls();
},
resumeTracking() {
  MileApp.updateStatusBar("Tracking"); 
  window.tripStatus = 'resumed';
  trackingInterval = setInterval(() => {
    // poll location again
  }, 10000);
  if (pauseStartTime) {
    totalPauseDuration += Date.now() - pauseStartTime;
    pauseStartTime = null;
  }
  updateStatus("Tracking");
  showToast("▶️ Trip resumed");
  updateControls();
},
endTracking: async function () {
  MileApp.updateStatusBar("Idle"); 
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
      if (result) {
        const leg = result.routes[0].legs[0];
        directionsRenderer.setDirections(result);
        localStorage.setItem("lastRoute", JSON.stringify(result));

        const distanceMi = (leg.distance.value / 1609.34).toFixed(2);
        const durationMin = Math.round(leg.duration.value / 60);
        const rateInput = document.getElementById("rate");
        const rate = rateInput ? parseFloat(rateInput.value || "0") : 0;
        const reimbursement = (distanceMi * rate).toFixed(2);

        const pausedMin = Math.round(totalPauseDuration / 60000);
        const startAddress = leg.start_address;
        const endAddress = leg.end_address;
        const purpose = document.getElementById("trip-purpose").value || "–";
        const notes = document.getElementById("trip-notes").value || "–";

        safeUpdate("summary-purpose", purpose);
        safeUpdate("summary-notes", notes);
        safeUpdate("summary-start", startAddress);
        safeUpdate("summary-end", endAddress);
        safeUpdate("summary-distance", `${distanceMi} mi`);
        safeUpdate("summary-duration", `${durationMin} min`);
        safeUpdate("summary-amount", `$${reimbursement}`);
        safeUpdate("pause-summary", `${pausedMin} min`);
        safeUpdate("lastDistance", `${distanceMi} mi`);
        safeUpdate("lastDuration", `${durationMin} min`);

        renderSteps(leg.steps);
        logTrip(purpose, notes, distanceMi, durationMin, pausedMin, reimbursement);
        showToast(`✅ Trip complete: ${distanceMi} mi`);
      }
    } catch (err) {
      console.error("endTracking() error:", err);
      const cached = localStorage.getItem("lastRoute");
      if (cached) {
        const result = JSON.parse(cached);
        const leg = result.routes[0].legs[0];
        directionsRenderer.setDirections(result);
        renderSteps(leg.steps);
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
  const now = Date.now();
  const elapsed = new Date(now - tripStartTime);
  const hh = String(elapsed.getUTCHours()).padStart(2, "0");
  const mm = String(elapsed.getUTCMinutes()).padStart(2, "0");
  const ss = String(elapsed.getUTCSeconds()).padStart(2, "0");
  document.getElementById("trip-timer").textContent = `Trip Time: ${hh}:${mm}:${ss}`;
  setTimeout(MileApp.updateTripTimer, 1000);
},
// === Restore Last Trip ===
restoreLastTrip() {
  const cached = localStorage.getItem("lastRoute");
  if (!cached) {
    showToast("🕵️ No saved trip to restore");
    return;
  }

  const result = JSON.parse(cached);
  const leg = result.routes[0].legs[0];

  directionsRenderer.setDirections(result);

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
                        },
}

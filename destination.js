let selectedDestination = null;
let destinationName = "";

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
  });
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

function confirmTripEnd(distance) {
  if (document.getElementById("destination-confirm-btn")) return; // Avoid duplicates

  showToast(`🚗 You're within ${Math.round(distance)}m of ${destinationName}. End trip?`, "info", 5000);

  const btn = document.createElement("button");
  btn.id = "destination-confirm-btn";
  btn.textContent = "✅ End Trip Now";
  btn.className = "toast toast-success";
  btn.onclick = () => {
    MileApp.endTracking();
    btn.remove();
  };

  document.body.appendChild(btn);
  setTimeout(() => btn.remove(), 10000);
}

let map, directionsService, directionsRenderer;
let mapInitialized = false;

export function initMapServices() {
  const mapEl = document.getElementById("map");
  if (!mapEl || mapEl.offsetHeight === 0) {
    console.warn("🛑 Map element not visible or sized properly.");
    return;
  }
  if (mapInitialized || map) return; // Avoid multiple inits
  mapInitialized = true;

  const sacramento = { lat: 38.5816, lng: -121.4944 };

  map = new google.maps.Map(mapEl, {
    center: sacramento,
    zoom: 14,
    disableDefaultUI: true,
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    mapId: "d9b09fc06f123f1721b83989", // 🔑 Insert your actual Map ID here
    styles: [
      { featureType: "poi", stylers: [{ visibility: "off" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#00BFFF" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] }
    ]
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    panel: document.getElementById("directions-panel"),
    suppressMarkers: true
  });

  console.log("🗺️ Map initialized");
}

export function getRoute(start, end) {
  return new Promise((resolve, reject) => {
    directionsService.route({
      origin: new google.maps.LatLng(start.latitude, start.longitude),
      destination: new google.maps.LatLng(end.latitude, end.longitude),
      travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
      status === google.maps.DirectionsStatus.OK
        ? resolve(response)
        : reject(`Route request failed: ${status}`);
    });
  });
}

export function renderSteps(steps) {
  const panel = document.getElementById("directions-panel");
  panel.innerHTML = "";

  steps.forEach(step => {
    const li = document.createElement("li");
    const instruction = stripHTML(step.instructions || "Continue");
    const distance = step.distance?.text || "";
    const duration = step.duration?.text || "";
    li.textContent = `${instruction} (${distance}, ${duration})`;
    li.prepend(getIconForManeuver(step.maneuver || "default"));
    panel.appendChild(li);
  });
}

export function getIconForManeuver(type) {
  const iconMap = {
    "turn-left": "⬅️", "turn-right": "➡️", "merge": "🔀",
    "ramp-left": "↖️", "ramp-right": "↘️", "roundabout-left": "⏪",
    "roundabout-right": "⏩", "straight": "⬆️", "uturn-left": "↩️",
    "uturn-right": "↪️", "fork-left": "🡸", "fork-right": "🡺",
    "default": "➡️"
  };
  return makeIcon(iconMap[type] || iconMap["default"]);
}

function makeIcon(symbol) {
  const span = document.createElement("span");
  span.textContent = symbol + " ";
  span.style.marginRight = "6px";
  return span;
}

function stripHTML(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

export function getMapInstance() {
  return map;
}

export { directionsRenderer };
export { directionsService };
window.initMapServices = initMapServices;

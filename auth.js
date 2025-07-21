import { showToast, updateControls } from './ui.js';
import { loadTripHistory, updateSummary } from './TripStorage.js';
import { resetTripLog } from './TripStorage.js';
resetTripLog();

export function handleLogin(response) {
  const user = jwt_decode(response.credential);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userName", user.name);

  showToast(`👋 Welcome, ${user.name}`);

  const badge = document.getElementById("userBadge");
  if (badge) {
    badge.textContent = `Logged in as: ${user.name} (${user.email})`;
  }

  const loginScreen = document.getElementById("login-screen");
  if (loginScreen) loginScreen.style.display = "none";

  const container = document.querySelector(".container");
  if (container) container.style.display = "block";

  const rateInput = document.getElementById("rate");
  if (rateInput) rateInput.value = "0.655"; // Default mileage rate

  setTimeout(loadTripHistory, 300); // Let DOM settle before loading
  updateControls();
  showToast("✅ Signed in successfully");
}

export function logoutUser() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");

  window.tripLog = []; // Clear trip data in global scope

  const logContainer = document.getElementById("trip-log");
  if (logContainer) logContainer.innerHTML = "";

  updateSummary();

  const container = document.querySelector(".container");
  if (container) container.style.display = "none";

  const badge = document.getElementById("userBadge");
  if (badge) badge.textContent = "";

  showToast("👋 Logged out");
  setTimeout(() => location.reload(), 1000); // Full app reset
}

function handleLogin(response) {
  const user = jwt_decode(response.credential);
  localStorage.setItem("userEmail", user.email);
  localStorage.setItem("userName", user.name);

  showToast(`👋 Welcome, ${user.name}`);
  document.getElementById("userBadge").textContent = `Logged in as: ${user.name} (${user.email})`;

  document.getElementById("login-screen").style.display = "none";
  document.querySelector(".container").style.display = "block";

  const rateInput = document.getElementById("rate");
  if (rateInput) rateInput.value = "0.655";

  loadTripHistory();   // ✅ Load saved trips
  updateControls();    // ✅ Enable/disable buttons
  showToast("✅ Signed in successfully");
}

function logoutUser() {
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  tripLog = [];
  document.getElementById("trip-log").innerHTML = "";
  updateSummary();
  document.querySelector(".container").style.display = "none";
  document.getElementById("userBadge").textContent = "";
  showToast("👋 Logged out");
  setTimeout(() => location.reload(), 1000);
}

import { showToast } from './ui.js';

let tripLog = [];
let filteredLog = [];

// ✅ Accessors
export function getTripLog() {
  return [...tripLog];
}
export function getFilteredLog() {
  return [...filteredLog];
}
export function resetTripLog() {
  tripLog = [];
  filteredLog = [];
}

// 📝 Add new trip
export function logTrip(purpose, notes, miles, duration, paused) {
  const rate = parseFloat(document.getElementById("rate")?.value || "0");
  const reimbursement = (miles * rate).toFixed(2);
  const entry = {
    date: new Date().toLocaleString(),
    purpose,
    notes,
    miles,
    duration: `${duration} min`,
    paused: `${paused} min`,
    reimbursement: `$${reimbursement}`
  };

  tripLog.push(entry);
  filteredLog = [...tripLog];

  saveTripHistory();
  syncToGoogleSheets(entry);

  renderTripLog();
  updateSummary();
}

// 💾 Persistence
export function saveTripHistory() {
  const user = localStorage.getItem("userEmail") || "default";
  localStorage.setItem(`tripHistory_${user}`, JSON.stringify(tripLog));
}
export function loadTripHistory() {
  const user = localStorage.getItem("userEmail") || "default";
  const saved = localStorage.getItem(`tripHistory_${user}`);
  if (saved) {
    tripLog = JSON.parse(saved);
    filteredLog = [...tripLog];
    renderTripLog();
    updateSummary();
  }
}

// 📤 Google Sheets sync
function syncToGoogleSheets(entry) {
  const scriptURL = "https://script.google.com/macros/s/AKfycbwA8TI64b6sK3uCEagyRYZRw8OipXmg_MXeEet-hK4nsKHskVx9ef-tia81EcaZooYF/exec";
  const payload = {
    email: localStorage.getItem("userEmail") || "unknown",
    ...entry
  };

  fetch(scriptURL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => {
    console.warn("⚠️ Google Sheets sync failed:", err);
  });
}

// 📋 Render Trip Log
function renderTripLog() {
  const list = document.getElementById("trip-log");
  if (!list) return;

  list.innerHTML = "";
  filteredLog.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.date} | ${entry.purpose} | ${entry.miles} mi | ${entry.reimbursement}`;
    list.appendChild(li);
  });
}

// 📊 Summary
export function updateSummary() {
  const todayEl = document.getElementById("today-summary");
  const weekEl = document.getElementById("week-summary");
  const rateInput = document.getElementById("rate");
  if (!todayEl || !weekEl || !rateInput) return;

  const today = new Date().toDateString();
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const rate = parseFloat(rateInput.value || "0");
  let todayTotal = 0;
  let weekTotal = 0;

  tripLog.forEach(t => {
    const d = new Date(t.date);
    const miles = parseFloat(t.miles);
    if (d.toDateString() === today) todayTotal += miles;
    if (d.getTime() >= weekAgo) weekTotal += miles;
  });

  todayEl.textContent = `${todayTotal.toFixed(2)} mi | $${(todayTotal * rate).toFixed(2)}`;
  weekEl.textContent = `${weekTotal.toFixed(2)} mi | $${(weekTotal * rate).toFixed(2)}`;
}

// 📦 Export CSV
export function downloadCSV(useFiltered = false) {
  if (!useFiltered) filteredLog = [...tripLog];
  const source = useFiltered ? filteredLog : tripLog;

  if (!source.length) {
    showToast("📂 No trips to export");
    return false;
  }

  const username = localStorage.getItem("userName") || "user";
  const tripId = source.length;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_");

  const escapeCSV = val => `"${String(val).replace(/"/g, '""')}"`;
  const csvRows = source.map(t => [
    escapeCSV(t.date),
    escapeCSV(t.purpose),
    escapeCSV(t.notes),
    escapeCSV(t.miles),
    escapeCSV(t.duration),
    escapeCSV(t.paused),
    escapeCSV(t.reimbursement)
  ]);

  const header = ["Date", "Purpose", "Notes", "Miles", "Duration", "Paused", "Reimbursement"];
  const csv = [header, ...csvRows].map(row => row.join(",")).join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${username}_${useFiltered ? "filtered_" : ""}trip_${tripId}_${timestamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return true;
}

// 🧹 Clear History
export function clearHistory() {
  tripLog = [];
  filteredLog = [];
  const list = document.getElementById("trip-log");
  if (list) list.innerHTML = "";

  updateSummary();
  saveTripHistory();
  showToast("🗑️ Trip history cleared");
}

// 🔍 Filtering
export function filterTrips({ startDate, endDate, purpose }) {
  filteredLog = tripLog.filter(entry => {
    const entryDate = new Date(entry.date);
    const matchesDate =
      (!startDate || entryDate >= new Date(startDate)) &&
      (!endDate || entryDate <= new Date(endDate));
    const matchesPurpose =
      !purpose || entry.purpose.toLowerCase().includes(purpose.toLowerCase());
    return matchesDate && matchesPurpose;
  });

  renderTripLog();
  updateSummary();
}

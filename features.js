// ════════════════════════════════════════════════════════════════
//  FEATURE 5 — WEATHER ALERTS SYSTEM
//  FEATURE 6 — USER ACCOUNTS & FAVORITES
//  Loaded after script.js — hooks into onWeatherLoaded()
// ════════════════════════════════════════════════════════════════

// ── Element refs ──────────────────────────────────────────────────────────────
const alertsNavBtn    = document.getElementById("alerts-nav-btn");
const favoritesNavBtn = document.getElementById("favorites-nav-btn");
const alertsPanel     = document.getElementById("alerts-panel");
const favoritesPanel  = document.getElementById("favorites-panel");
const alertsList      = document.getElementById("alerts-list");
const alertBadge      = document.getElementById("alert-badge");
const alertToastsEl   = document.getElementById("alert-toasts");
const notifBtn        = document.getElementById("notif-btn");
const authModal       = document.getElementById("auth-modal");
const authTrigger     = document.getElementById("auth-trigger-btn");
const authLabelEl     = document.getElementById("auth-label");
const modalCloseBtn   = document.getElementById("modal-close-btn");
const saveCityBtn     = document.getElementById("save-city-btn");
const favoritesGrid   = document.getElementById("favorites-grid");
const userChip        = document.getElementById("user-chip");
const userChipName    = document.getElementById("user-chip-name");
const forecastSection = document.querySelector(".forecast-section");
const highlightsEl    = document.querySelector(".highlights");

// ── Show/hide main content sections ──────────────────────────────────────────
function setMainSections(show) {
  forecastSection.hidden = !show;
  highlightsEl.hidden    = !show;
}

// ══════════════════════════════════════════════════════════
//  AUTH — localStorage-based user system
// ══════════════════════════════════════════════════════════
const USERS_KEY   = "__wx_users__";
const SESSION_KEY = "__wx_session__";
const FAVS_KEY    = "__wx_favs__";

function getUsers()     { try { return JSON.parse(localStorage.getItem(USERS_KEY))   || {}; } catch { return {}; } }
function saveUsers(u)   { localStorage.setItem(USERS_KEY,   JSON.stringify(u)); }
function getSession()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; } }
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function getFavorites() {
  const s = getSession();
  if (!s) return [];
  try {
    const all = JSON.parse(localStorage.getItem(FAVS_KEY)) || {};
    return all[s.email] || [];
  } catch { return []; }
}
function saveFavorites(favs) {
  const s = getSession();
  if (!s) return;
  try {
    const all = JSON.parse(localStorage.getItem(FAVS_KEY)) || {};
    all[s.email] = favs;
    localStorage.setItem(FAVS_KEY, JSON.stringify(all));
  } catch {}
}

// ── Sync UI to auth state ─────────────────────────────────────────────────────
function syncAuthUI() {
  const session = getSession();
  if (session) {
    authLabelEl.textContent = "Sign Out";
    authTrigger.classList.add("logout");
    saveCityBtn.hidden    = false;
    favoritesNavBtn.hidden = false;
    userChip.hidden       = false;
    userChipName.textContent = session.name;
    updateSaveCityBtn();
  } else {
    authLabelEl.textContent = "Sign In";
    authTrigger.classList.remove("logout");
    saveCityBtn.hidden    = true;
    favoritesNavBtn.hidden = true;
    userChip.hidden       = true;
    // If showing favorites, reset to week view
    if (!favoritesPanel.hidden) {
      favoritesPanel.hidden = true;
      setMainSections(true);
      document.querySelector(".week").classList.add("active");
    }
  }
}

// ── Modal tab switching ───────────────────────────────────────────────────────
document.querySelectorAll(".modal-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".modal-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    document.getElementById("tab-login").hidden    = (target !== "login");
    document.getElementById("tab-register").hidden = (target !== "register");
    document.getElementById("login-err").textContent = "";
    document.getElementById("reg-err").textContent   = "";
  });
});

// ── Open/close modal ─────────────────────────────────────────────────────────
authTrigger.addEventListener("click", () => {
  if (getSession()) {
    clearSession();
    syncAuthUI();
    showToast("info", "fa-right-from-bracket", "Signed Out", "You have been signed out.");
  } else {
    authModal.hidden = false;
  }
});
modalCloseBtn.addEventListener("click",  () => { authModal.hidden = true; });
authModal.addEventListener("click", e => { if (e.target === authModal) authModal.hidden = true; });

// ── Register ──────────────────────────────────────────────────────────────────
document.getElementById("register-btn").addEventListener("click", () => {
  const name  = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const pass  = document.getElementById("reg-password").value;
  const err   = document.getElementById("reg-err");

  if (!name)               return void (err.textContent = "Please enter your name.");
  if (!email.includes("@")) return void (err.textContent = "Please enter a valid email.");
  if (pass.length < 6)    return void (err.textContent = "Password must be at least 6 characters.");

  const users = getUsers();
  if (users[email])        return void (err.textContent = "Email already registered. Please sign in.");

  users[email] = { name, email, passHash: btoa(unescape(encodeURIComponent(pass))) };
  saveUsers(users);
  saveSession({ name, email });
  authModal.hidden = true;
  syncAuthUI();
  showToast("info", "fa-circle-check", "Welcome, " + name + "!", "Your account has been created.");
});

// ── Login ─────────────────────────────────────────────────────────────────────
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const pass  = document.getElementById("login-password").value;
  const err   = document.getElementById("login-err");

  const users = getUsers();
  const user  = users[email];
  if (!user) return void (err.textContent = "No account found with that email.");
  if (user.passHash !== btoa(unescape(encodeURIComponent(pass))))
    return void (err.textContent = "Incorrect password. Please try again.");

  saveSession({ name: user.name, email: user.email });
  authModal.hidden = true;
  syncAuthUI();
  showToast("info", "fa-circle-check", "Welcome back, " + user.name + "!", "You are now signed in.");
});

// ── Save / unsave city ────────────────────────────────────────────────────────
function updateSaveCityBtn() {
  if (!getSession()) return;
  const isSaved = getFavorites().some(f => f.city.toLowerCase() === currentCity.toLowerCase());
  saveCityBtn.innerHTML = isSaved
    ? '<i class="fa fa-heart-crack"></i> Remove City'
    : '<i class="fa fa-heart"></i> Save City';
  saveCityBtn.classList.toggle("saved", isSaved);
}

saveCityBtn.addEventListener("click", () => {
  if (!getSession()) return;
  let favs = getFavorites();
  const idx = favs.findIndex(f => f.city.toLowerCase() === currentCity.toLowerCase());
  if (idx >= 0) {
    favs.splice(idx, 1);
    saveFavorites(favs);
    showToast("info", "fa-heart-crack", "City Removed", currentCity + " removed from favorites.");
  } else {
    favs.push({ city: currentCity, snap: lastSnap });
    saveFavorites(favs);
    showToast("info", "fa-heart", "City Saved!", currentCity + " added to favorites.");
  }
  updateSaveCityBtn();
  if (!favoritesPanel.hidden) renderFavorites();
});

// ── Nav panel switching ───────────────────────────────────────────────────────
alertsNavBtn.addEventListener("click", () => {
  const opening = alertsPanel.hidden;
  document.querySelector(".week").classList.remove("active");
  document.querySelector(".hourly").classList.remove("active");
  alertsNavBtn.classList.toggle("active", opening);
  favoritesNavBtn.classList.remove("active");
  alertsPanel.hidden    = !opening;
  favoritesPanel.hidden = true;
  setMainSections(!opening);
  if (opening) renderAlerts(lastAlerts);
});

favoritesNavBtn.addEventListener("click", () => {
  const opening = favoritesPanel.hidden;
  document.querySelector(".week").classList.remove("active");
  document.querySelector(".hourly").classList.remove("active");
  favoritesNavBtn.classList.toggle("active", opening);
  alertsNavBtn.classList.remove("active");
  favoritesPanel.hidden = !opening;
  alertsPanel.hidden    = true;
  setMainSections(!opening);
  if (opening) renderFavorites();
});

// Close panels when clicking Week or Today
document.querySelector(".week").addEventListener("click",   closePanels);
document.querySelector(".hourly").addEventListener("click", closePanels);
function closePanels() {
  alertsPanel.hidden    = true;
  favoritesPanel.hidden = true;
  alertsNavBtn.classList.remove("active");
  favoritesNavBtn.classList.remove("active");
  setMainSections(true);
}

// ══════════════════════════════════════════════════════════
//  FEATURE 5 — WEATHER ALERTS ENGINE
// ══════════════════════════════════════════════════════════
let lastAlerts  = [];
let lastSnap    = null;
const _seenIds  = new Set();

// This is called by the hook we added to script.js
function onWeatherLoaded(data) {
  lastSnap = data;
  // Normalise temp to °C for evaluation
  const tempC = currentUnit === "f" ? (data.temp - 32) * 5 / 9 : data.temp;
  lastAlerts  = evaluateAlerts({ ...data, tempC });
  updateAlertBadge(lastAlerts);
  if (!alertsPanel.hidden) renderAlerts(lastAlerts);
  // Fire toasts for brand-new alerts
  lastAlerts.filter(a => a._new).forEach(a => {
    showToast(a.level, a.icon, a.title, a.desc);
    sendBrowserNotification(a);
  });
  updateSaveCityBtn();
  // Update snapshot for this city in favorites
  if (getSession()) {
    const favs = getFavorites();
    const idx  = favs.findIndex(f => f.city.toLowerCase() === data.city.toLowerCase());
    if (idx >= 0) { favs[idx].snap = data; saveFavorites(favs); }
    if (!favoritesPanel.hidden) renderFavorites();
  }
}

function evaluateAlerts({ city, tempC, temp, condition, humidity, windSpeed, uv, precip }) {
  const alerts = [];
  const cond   = (condition || "").toLowerCase();
  const dispT  = currentUnit === "f"
    ? Math.round(temp) + "°F"
    : Math.round(tempC) + "°C";

  if (tempC >= 38)      alerts.push({ id:"heat-extreme", level:"danger",  icon:"fa-temperature-full",      title:"🔥 Extreme Heat Warning",   desc:`Temp is ${dispT} — dangerous heat levels. Stay hydrated, avoid sun exposure.` });
  else if (tempC >= 33) alerts.push({ id:"heat-high",    level:"warning", icon:"fa-sun",                   title:"⚠️ Heatwave Advisory",       desc:`High temp of ${dispT}. Limit outdoor activity during peak hours.` });

  if (tempC <= 0)       alerts.push({ id:"freeze",       level:"danger",  icon:"fa-snowflake",             title:"🧊 Freezing Conditions",     desc:`Temp at ${dispT}. Ice risk on roads and surfaces.` });
  else if (tempC <= 5)  alerts.push({ id:"cold",         level:"warning", icon:"fa-wind",                  title:"🥶 Cold Weather Warning",    desc:`Near-freezing at ${dispT}. Dress in warm layers, watch for frost.` });

  if (windSpeed >= 60)  alerts.push({ id:"wind-storm",   level:"danger",  icon:"fa-tornado",               title:"🌪️ Severe Storm Warning",    desc:`Winds at ${windSpeed} km/h — dangerous. Avoid travel if possible.` });
  else if (windSpeed >= 40) alerts.push({ id:"wind-high", level:"warning", icon:"fa-wind",                 title:"💨 High Wind Advisory",      desc:`Strong winds of ${windSpeed} km/h. Secure loose outdoor items.` });

  if (cond.includes("thunder") || cond.includes("storm"))
    alerts.push({ id:"thunder",     level:"danger",  icon:"fa-bolt",                  title:"⚡ Thunderstorm Alert",      desc:`Thunderstorms detected over ${city}. Stay indoors, away from windows.` });

  if (cond.includes("heavy rain") || cond.includes("downpour"))
    alerts.push({ id:"heavyrain",   level:"warning", icon:"fa-cloud-showers-heavy",   title:"🌧️ Heavy Rain Warning",      desc:`Heavy precipitation in ${city}. Flooding possible in low-lying areas.` });
  else if (cond.includes("rain") || cond.includes("drizzle"))
    alerts.push({ id:"rain",        level:"info",    icon:"fa-umbrella",              title:"☔ Rain Advisory",           desc:`Rain expected in ${city}. Carry an umbrella and drive carefully.` });

  if (uv >= 8)          alerts.push({ id:"uv",           level:"warning", icon:"fa-sun",                   title:"☀️ High UV Index Alert",     desc:`UV index is ${uv} (Very High). Apply SPF 50+ and seek shade between 10am–4pm.` });

  if (humidity >= 85)   alerts.push({ id:"humid",        level:"info",    icon:"fa-droplet",               title:"💧 High Humidity Advisory",  desc:`Humidity at ${humidity}%. Feels significantly hotter, risk of heat exhaustion.` });

  if (cond.includes("fog") || cond.includes("mist"))
    alerts.push({ id:"fog",         level:"info",    icon:"fa-smog",                  title:"🌫️ Low Visibility Advisory", desc:`Fog/mist reported in ${city}. Reduce speed and use fog lights when driving.` });

  if (cond.includes("snow") || cond.includes("blizzard"))
    alerts.push({ id:"snow",        level:"danger",  icon:"fa-snowflake",             title:"❄️ Snow / Blizzard Alert",   desc:`Snowfall in ${city}. Roads may be icy, visibility reduced.` });

  if (precip > 80)      alerts.push({ id:"precip",       level:"warning", icon:"fa-cloud-rain",            title:"🌂 High Precipitation Chance", desc:`${precip}% chance of precipitation in ${city}. Plan accordingly.` });

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  alerts.forEach(a => {
    a.time = now;
    a._new = !_seenIds.has(a.id);
    _seenIds.add(a.id);
  });
  return alerts;
}

function updateAlertBadge(alerts) {
  alertBadge.hidden      = alerts.length === 0;
  alertBadge.textContent = alerts.length;
}

function renderAlerts(alerts) {
  alertsList.innerHTML = "";
  if (!alerts.length) {
    alertsList.innerHTML = `<p class="no-alerts"><i class="fa fa-shield-halved"></i> No active alerts — all clear in ${currentCity}!</p>`;
    return;
  }
  alerts.forEach((a, i) => {
    const card = document.createElement("div");
    card.className = `alert-card ${a.level}`;
    card.style.animationDelay = `${i * 0.06}s`;
    card.innerHTML = `
      <div class="alert-icon"><i class="fa ${a.icon}"></i></div>
      <div class="alert-body">
        <p class="alert-title">${a.title}</p>
        <p class="alert-desc">${a.desc}</p>
        <p class="alert-time"><i class="fa fa-clock"></i> Detected at ${a.time}</p>
      </div>`;
    alertsList.appendChild(card);
  });
}

// Auto re-check every 30 minutes
setInterval(() => {
  if (currentCity) getWeatherData(currentCity, currentUnit, currentView);
}, 30 * 60 * 1000);

// ── Toast notifications ───────────────────────────────────────────────────────
function showToast(level, icon, title, body) {
  const t = document.createElement("div");
  t.className = `toast ${level}`;
  t.innerHTML = `
    <span class="toast-icon"><i class="fa ${icon}"></i></span>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      <div class="toast-body">${body}</div>
    </div>
    <button class="toast-close" aria-label="Dismiss"><i class="fa fa-times"></i></button>`;
  t.querySelector(".toast-close").addEventListener("click", () => removeToast(t));
  alertToastsEl.appendChild(t);
  setTimeout(() => removeToast(t), 6000);
}
function removeToast(t) {
  t.style.animation = "toastOut 0.3s ease forwards";
  setTimeout(() => t.remove(), 300);
}

// ── Browser notifications ─────────────────────────────────────────────────────
function sendBrowserNotification(alert) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification("🌦️ Weather Alert — " + currentCity, { body: alert.title + "\n" + alert.desc, icon: "https://i.ibb.co/rb4rrJL/26.png" }); }
  catch (e) {}
}

notifBtn.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showToast("warning", "fa-bell-slash", "Not Supported", "Notifications aren't supported in this browser.");
    return;
  }
  const perm = await Notification.requestPermission();
  if (perm === "granted") {
    notifBtn.classList.add("granted");
    notifBtn.innerHTML = '<i class="fa fa-bell"></i> Notifications On';
    showToast("info", "fa-bell", "Notifications Enabled", "You'll receive weather alert notifications.");
  } else {
    showToast("warning", "fa-bell-slash", "Permission Denied", "Enable notifications in browser settings.");
  }
});

if (typeof Notification !== "undefined" && Notification.permission === "granted") {
  notifBtn.classList.add("granted");
  notifBtn.innerHTML = '<i class="fa fa-bell"></i> Notifications On';
}

// ══════════════════════════════════════════════════════════
//  FEATURE 6 — FAVORITES PANEL
// ══════════════════════════════════════════════════════════
function renderFavorites() {
  const favs = getFavorites();
  favoritesGrid.innerHTML = "";
  if (!favs.length) {
    favoritesGrid.innerHTML = `<p class="no-favs">No saved cities yet. Search a city then click <strong>Save City</strong> in the sidebar.</p>`;
    return;
  }
  favs.forEach((fav, i) => {
    const card = document.createElement("div");
    const snap = fav.snap;
    const isActive = fav.city.toLowerCase() === currentCity.toLowerCase();
    card.className = "fav-card" + (isActive ? " active-fav" : "");
    card.style.animationDelay = `${i * 0.07}s`;

    let dispTemp = "--";
    if (snap) {
      dispTemp = currentUnit === "f"
        ? Math.round((snap.temp * 9/5) + 32) + "°F"
        : Math.round(snap.temp) + "°C";
    }
    const condText   = snap ? snap.condition : "No data yet";
    const humidText  = snap ? snap.humidity + "%" : "--";
    const windText   = snap ? snap.windSpeed + " km/h" : "--";

    card.innerHTML = `
      <div class="fav-city-name"><i class="fa fa-location-dot"></i> ${fav.city}</div>
      <div class="fav-temp">${dispTemp}</div>
      <div class="fav-condition">${condText}</div>
      <div class="fav-details">
        <span class="fav-detail-item"><i class="fa fa-droplet"></i> ${humidText}</span>
        <span class="fav-detail-item"><i class="fa fa-wind"></i> ${windText}</span>
      </div>
      <div class="fav-actions">
        <button class="btn-fav-view"><i class="fa fa-eye"></i> View</button>
        <button class="btn-fav-remove"><i class="fa fa-trash"></i></button>
      </div>`;

    card.querySelector(".btn-fav-view").addEventListener("click", () => {
      currentCity = fav.city;
      getWeatherData(fav.city, currentUnit, "week");
      favoritesPanel.hidden = true;
      alertsPanel.hidden    = true;
      favoritesNavBtn.classList.remove("active");
      setMainSections(true);
      document.querySelector(".week").classList.add("active");
    });

    card.querySelector(".btn-fav-remove").addEventListener("click", e => {
      e.stopPropagation();
      const updated = getFavorites().filter(f => f.city.toLowerCase() !== fav.city.toLowerCase());
      saveFavorites(updated);
      showToast("info", "fa-heart-crack", "Removed", fav.city + " removed from favorites.");
      renderFavorites();
      updateSaveCityBtn();
    });

    favoritesGrid.appendChild(card);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
syncAuthUI();

// ════════════════════════════════════════════════════════════════
//  FEATURE 5 — WEATHER ALERTS SYSTEM
//  FEATURE 6 — USER ACCOUNTS & FAVORITES
// ════════════════════════════════════════════════════════════════

var alertsNavBtn    = document.getElementById("alerts-nav-btn");
var favoritesNavBtn = document.getElementById("favorites-nav-btn");
var alertsPanel     = document.getElementById("alerts-panel");
var favoritesPanel  = document.getElementById("favorites-panel");
var alertsList      = document.getElementById("alerts-list");
var alertBadge      = document.getElementById("alert-badge");
var alertToastsEl   = document.getElementById("alert-toasts");
var notifBtn        = document.getElementById("notif-btn");
var authModal       = document.getElementById("auth-modal");
var authTrigger     = document.getElementById("auth-trigger-btn");
var authLabelEl     = document.getElementById("auth-label");
var modalCloseBtn   = document.getElementById("modal-close-btn");
var saveCityBtn     = document.getElementById("save-city-btn");
var favoritesGrid   = document.getElementById("favorites-grid");
var userChip        = document.getElementById("user-chip");
var userChipName    = document.getElementById("user-chip-name");
var forecastSection = document.querySelector(".forecast-section");
var highlightsEl    = document.querySelector(".highlights");
var weekNavBtn      = document.querySelector(".week");
var hourlyNavBtn    = document.querySelector(".hourly");

function setMainSections(show) {
  forecastSection.hidden = !show;
  highlightsEl.hidden    = !show;
}

// ── Storage ───────────────────────────────────────────────────────────────────
var USERS_KEY   = "__wx_users__";
var SESSION_KEY = "__wx_session__";
var FAVS_KEY    = "__wx_favs__";

function getUsers()     { try { return JSON.parse(localStorage.getItem(USERS_KEY))   || {}; } catch(e) { return {}; } }
function saveUsers(u)   { localStorage.setItem(USERS_KEY,   JSON.stringify(u)); }
function getSession()   { try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch(e) { return null; } }
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function hashPass(p)    { return btoa(p); }

function getFavorites() {
  var s = getSession();
  if (!s) return [];
  try { var all = JSON.parse(localStorage.getItem(FAVS_KEY)) || {}; return all[s.username] || []; }
  catch(e) { return []; }
}
function saveFavorites(favs) {
  var s = getSession();
  if (!s) return;
  try { var all = JSON.parse(localStorage.getItem(FAVS_KEY)) || {}; all[s.username] = favs; localStorage.setItem(FAVS_KEY, JSON.stringify(all)); }
  catch(e) {}
}

// ── Auth UI sync ──────────────────────────────────────────────────────────────
function syncAuthUI() {
  var session = getSession();
  if (session) {
    authLabelEl.textContent  = "Sign Out";
    authTrigger.classList.add("logout");
    saveCityBtn.hidden       = false;
    favoritesNavBtn.hidden   = false;
    userChip.hidden          = false;
    userChipName.textContent = session.username;
    updateSaveCityBtn();
  } else {
    authLabelEl.textContent = "Sign In";
    authTrigger.classList.remove("logout");
    saveCityBtn.hidden     = true;
    favoritesNavBtn.hidden = true;
    userChip.hidden        = true;
    if (!favoritesPanel.hidden) {
      favoritesPanel.hidden = true;
      setMainSections(true);
      weekNavBtn.classList.add("active");
    }
  }
}

// ── Modal tab switching ───────────────────────────────────────────────────────
document.querySelectorAll(".modal-tab").forEach(function(tab) {
  tab.addEventListener("click", function() {
    document.querySelectorAll(".modal-tab").forEach(function(t) { t.classList.remove("active"); });
    tab.classList.add("active");
    var target = tab.getAttribute("data-tab");
    document.getElementById("tab-login").hidden    = (target !== "login");
    document.getElementById("tab-register").hidden = (target !== "register");
    document.getElementById("login-err").textContent = "";
    document.getElementById("reg-err").textContent   = "";
  });
});

// ── Open / close auth modal ───────────────────────────────────────────────────
authTrigger.addEventListener("click", function() {
  if (getSession()) {
    clearSession();
    syncAuthUI();
    showToast("info", "fa-right-from-bracket", "Signed Out", "You have been signed out.");
  } else {
    document.querySelectorAll(".modal-tab").forEach(function(t) { t.classList.remove("active"); });
    document.querySelector(".modal-tab[data-tab='login']").classList.add("active");
    document.getElementById("tab-login").hidden    = false;
    document.getElementById("tab-register").hidden = true;
    document.getElementById("login-err").textContent = "";
    document.getElementById("reg-err").textContent   = "";
    authModal.hidden = false;
  }
});
modalCloseBtn.addEventListener("click", function() { authModal.hidden = true; });
authModal.addEventListener("click", function(e) { if (e.target === authModal) authModal.hidden = true; });

// ── Register ──────────────────────────────────────────────────────────────────
document.getElementById("register-btn").addEventListener("click", function() {
  var username = document.getElementById("reg-username").value.trim();
  var pass     = document.getElementById("reg-password").value;
  var err      = document.getElementById("reg-err");
  err.textContent = "";

  if (!username || username.length < 3) { err.textContent = "Username must be at least 3 characters."; return; }
  if (!pass || pass.length < 4)         { err.textContent = "Password must be at least 4 characters."; return; }

  var users = getUsers();
  if (users[username.toLowerCase()])    { err.textContent = "Username already taken. Choose another."; return; }

  users[username.toLowerCase()] = { username: username, passHash: hashPass(pass) };
  saveUsers(users);
  saveSession({ username: username });
  authModal.hidden = true;
  syncAuthUI();
  showToast("info", "fa-circle-check", "Welcome, " + username + "!", "Your account has been created.");
});

// ── Login ─────────────────────────────────────────────────────────────────────
document.getElementById("login-btn").addEventListener("click", function() {
  var username = document.getElementById("login-username").value.trim();
  var pass     = document.getElementById("login-password").value;
  var err      = document.getElementById("login-err");
  err.textContent = "";

  if (!username) { err.textContent = "Please enter your username."; return; }
  if (!pass)     { err.textContent = "Please enter your password."; return; }

  var users = getUsers();
  var user  = users[username.toLowerCase()];
  if (!user)                           { err.textContent = "No account found with that username."; return; }
  if (user.passHash !== hashPass(pass)){ err.textContent = "Incorrect password. Please try again."; return; }

  saveSession({ username: user.username });
  authModal.hidden = true;
  syncAuthUI();
  showToast("info", "fa-circle-check", "Welcome back, " + user.username + "!", "You are now signed in.");
});

document.getElementById("login-password").addEventListener("keydown", function(e) { if (e.key === "Enter") document.getElementById("login-btn").click(); });
document.getElementById("reg-password").addEventListener("keydown",   function(e) { if (e.key === "Enter") document.getElementById("register-btn").click(); });

// ── Save city button ──────────────────────────────────────────────────────────
function updateSaveCityBtn() {
  if (!getSession()) return;
  var isSaved = getFavorites().some(function(f) { return f.city.toLowerCase() === currentCity.toLowerCase(); });
  saveCityBtn.innerHTML = isSaved ? '<i class="fa fa-heart-crack"></i> Remove City' : '<i class="fa fa-heart"></i> Save City';
  saveCityBtn.classList.toggle("saved", isSaved);
}

saveCityBtn.addEventListener("click", function() {
  if (!getSession()) return;
  var favs = getFavorites();
  var idx  = -1;
  favs.forEach(function(f, i) { if (f.city.toLowerCase() === currentCity.toLowerCase()) idx = i; });
  if (idx >= 0) {
    favs.splice(idx, 1);
    saveFavorites(favs);
    showToast("info", "fa-heart-crack", "City Removed", currentCity + " removed from favorites.");
  } else {
    favs.push({ city: currentCity, snap: lastSnap });
    saveFavorites(favs);
    showToast("info", "fa-heart", "City Saved!", currentCity + " added to your favorites.");
  }
  updateSaveCityBtn();
  if (!favoritesPanel.hidden) renderFavorites();
});

// ── Nav panel toggling ────────────────────────────────────────────────────────
alertsNavBtn.addEventListener("click", function() {
  var opening = alertsPanel.hidden;
  weekNavBtn.classList.remove("active");
  hourlyNavBtn.classList.remove("active");
  favoritesNavBtn.classList.remove("active");
  alertsNavBtn.classList.toggle("active", opening);
  alertsPanel.hidden    = !opening;
  favoritesPanel.hidden = true;
  setMainSections(!opening);
  if (opening) renderAlerts(lastAlerts);
});

favoritesNavBtn.addEventListener("click", function() {
  var opening = favoritesPanel.hidden;
  weekNavBtn.classList.remove("active");
  hourlyNavBtn.classList.remove("active");
  alertsNavBtn.classList.remove("active");
  favoritesNavBtn.classList.toggle("active", opening);
  favoritesPanel.hidden = !opening;
  alertsPanel.hidden    = true;
  setMainSections(!opening);
  if (opening) renderFavorites();
});

weekNavBtn.addEventListener("click",   function() { closePanels(); weekNavBtn.classList.add("active"); });
hourlyNavBtn.addEventListener("click", function() { closePanels(); hourlyNavBtn.classList.add("active"); });

function closePanels() {
  alertsPanel.hidden    = true;
  favoritesPanel.hidden = true;
  alertsNavBtn.classList.remove("active");
  favoritesNavBtn.classList.remove("active");
  setMainSections(true);
}

// ══════════════════════════════════════════════════════════
//  ALERTS ENGINE
// ══════════════════════════════════════════════════════════
var lastAlerts = [];
var lastSnap   = null;
var _seenIds   = {};

function onWeatherLoaded(data) {
  lastSnap = data;
  var tempC = (currentUnit === "f") ? (data.temp - 32) * 5 / 9 : data.temp;
  lastAlerts = buildAlerts(data.city, tempC, data.temp, data.condition, data.humidity, data.windSpeed, data.uv, data.precip);
  updateAlertBadge(lastAlerts);
  if (!alertsPanel.hidden) renderAlerts(lastAlerts);
  lastAlerts.forEach(function(a) {
    if (a._new) { showToast(a.level, a.icon, a.title, a.desc); sendBrowserNotification(a); }
  });
  updateSaveCityBtn();
  if (getSession()) {
    var favs = getFavorites();
    favs.forEach(function(f, i) { if (f.city.toLowerCase() === data.city.toLowerCase()) { favs[i].snap = data; } });
    saveFavorites(favs);
    if (!favoritesPanel.hidden) renderFavorites();
  }
}

function buildAlerts(city, tempC, tempRaw, condition, humidity, windSpeed, uv, precip) {
  var alerts = [];
  var cond   = (condition || "").toLowerCase();
  var dispT  = (currentUnit === "f") ? Math.round(tempRaw) + "°F" : Math.round(tempC) + "°C";

  if (tempC >= 38)       push("heat-extreme","danger","fa-temperature-full","🔥 Extreme Heat Warning",    "Temperature is "+dispT+" — dangerous heat. Stay hydrated, avoid sun exposure.");
  else if (tempC >= 33)  push("heat-high",   "warning","fa-sun",            "⚠️ Heatwave Advisory",        "High temp of "+dispT+". Limit outdoor activity during peak hours.");
  if (tempC <= 0)        push("freeze",      "danger","fa-snowflake",       "🧊 Freezing Conditions",      "Temp at "+dispT+". Ice risk on roads and surfaces.");
  else if (tempC <= 5)   push("cold",        "warning","fa-wind",           "🥶 Cold Weather Warning",     "Near-freezing at "+dispT+". Dress warmly and watch for frost.");
  if (windSpeed >= 60)   push("wind-storm",  "danger","fa-tornado",         "🌪️ Severe Storm Warning",     "Winds at "+windSpeed+" km/h — dangerous. Avoid travel if possible.");
  else if (windSpeed>=40)push("wind-high",   "warning","fa-wind",           "💨 High Wind Advisory",       "Strong winds of "+windSpeed+" km/h. Secure loose outdoor items.");
  if (cond.indexOf("thunder")>=0||cond.indexOf("storm")>=0)
                         push("thunder",     "danger","fa-bolt",            "⚡ Thunderstorm Alert",        "Thunderstorms detected over "+city+". Stay indoors, away from windows.");
  if (cond.indexOf("heavy rain")>=0||cond.indexOf("downpour")>=0)
                         push("heavyrain",   "warning","fa-cloud-showers-heavy","🌧️ Heavy Rain Warning",   "Heavy rain in "+city+". Flooding possible in low-lying areas.");
  else if (cond.indexOf("rain")>=0||cond.indexOf("drizzle")>=0)
                         push("rain",        "info","fa-umbrella",          "☔ Rain Advisory",             "Rain expected in "+city+". Carry an umbrella and drive carefully.");
  if (uv >= 8)           push("uv",          "warning","fa-sun",            "☀️ High UV Index Alert",       "UV index is "+uv+" (Very High). Apply SPF 50+ and seek shade.");
  if (humidity >= 85)    push("humid",       "info","fa-droplet",           "💧 High Humidity Advisory",   "Humidity at "+humidity+"%. Feels significantly hotter.");
  if (cond.indexOf("fog")>=0||cond.indexOf("mist")>=0)
                         push("fog",         "info","fa-smog",              "🌫️ Low Visibility Advisory",   "Fog/mist in "+city+". Reduce speed, use fog lights when driving.");
  if (cond.indexOf("snow")>=0||cond.indexOf("blizzard")>=0)
                         push("snow",        "danger","fa-snowflake",       "❄️ Snow / Blizzard Alert",     "Snowfall in "+city+". Roads may be icy, visibility reduced.");
  if (precip > 80)       push("precip",      "warning","fa-cloud-rain",     "🌂 High Precipitation Chance",precip+"% chance of precipitation in "+city+".");

  function push(id, level, icon, title, desc) {
    var now = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
    alerts.push({ id:id, level:level, icon:icon, title:title, desc:desc, time:now, _new:!_seenIds[id] });
    _seenIds[id] = true;
  }
  return alerts;
}

function updateAlertBadge(alerts) {
  alertBadge.hidden      = (alerts.length === 0);
  alertBadge.textContent = alerts.length;
}

function renderAlerts(alerts) {
  alertsList.innerHTML = "";
  if (!alerts.length) {
    alertsList.innerHTML = '<p class="no-alerts"><i class="fa fa-shield-halved"></i> No active alerts — all clear in ' + currentCity + '!</p>';
    return;
  }
  alerts.forEach(function(a, i) {
    var card = document.createElement("div");
    card.className = "alert-card " + a.level;
    card.style.animationDelay = (i * 0.06) + "s";
    card.innerHTML =
      '<div class="alert-icon"><i class="fa ' + a.icon + '"></i></div>' +
      '<div class="alert-body">' +
        '<p class="alert-title">' + a.title + '</p>' +
        '<p class="alert-desc">'  + a.desc  + '</p>' +
        '<p class="alert-time"><i class="fa fa-clock"></i> Detected at ' + a.time + '</p>' +
      '</div>';
    alertsList.appendChild(card);
  });
}

setInterval(function() {
  if (currentCity) getWeatherData(currentCity, currentUnit, currentView);
}, 30 * 60 * 1000);

// ── Toasts ────────────────────────────────────────────────────────────────────
function showToast(level, icon, title, body) {
  var t = document.createElement("div");
  t.className = "toast " + level;
  t.innerHTML =
    '<span class="toast-icon"><i class="fa ' + icon + '"></i></span>' +
    '<div class="toast-text"><div class="toast-title">' + title + '</div><div class="toast-body">' + body + '</div></div>' +
    '<button class="toast-close" aria-label="Dismiss"><i class="fa fa-times"></i></button>';
  t.querySelector(".toast-close").addEventListener("click", function() { removeToast(t); });
  alertToastsEl.appendChild(t);
  setTimeout(function() { removeToast(t); }, 6000);
}
function removeToast(t) {
  t.style.animation = "toastOut 0.3s ease forwards";
  setTimeout(function() { if (t.parentNode) t.remove(); }, 300);
}

// ── Browser notifications ─────────────────────────────────────────────────────
function sendBrowserNotification(a) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification("🌦️ Weather Alert — " + currentCity, { body: a.title + "\n" + a.desc, icon: "https://i.ibb.co/rb4rrJL/26.png" }); } catch(e) {}
}
notifBtn.addEventListener("click", function() {
  if (!("Notification" in window)) { showToast("warning","fa-bell-slash","Not Supported","Notifications aren't supported in this browser."); return; }
  Notification.requestPermission().then(function(perm) {
    if (perm === "granted") {
      notifBtn.classList.add("granted");
      notifBtn.innerHTML = '<i class="fa fa-bell"></i> Notifications On';
      showToast("info","fa-bell","Notifications Enabled","You'll receive weather alert notifications.");
    } else {
      showToast("warning","fa-bell-slash","Permission Denied","Enable notifications in your browser settings.");
    }
  });
});
if (typeof Notification !== "undefined" && Notification.permission === "granted") {
  notifBtn.classList.add("granted");
  notifBtn.innerHTML = '<i class="fa fa-bell"></i> Notifications On';
}

// ── Favorites panel ───────────────────────────────────────────────────────────
function renderFavorites() {
  var favs = getFavorites();
  favoritesGrid.innerHTML = "";
  if (!favs.length) {
    favoritesGrid.innerHTML = '<p class="no-favs">No saved cities yet. Search a city and click <strong>❤ Save City</strong> in the sidebar.</p>';
    return;
  }
  favs.forEach(function(fav, i) {
    var card     = document.createElement("div");
    var snap     = fav.snap;
    var isActive = fav.city.toLowerCase() === currentCity.toLowerCase();
    card.className = "fav-card" + (isActive ? " active-fav" : "");
    card.style.animationDelay = (i * 0.07) + "s";
    var dispTemp  = snap ? ((currentUnit==="f") ? Math.round((snap.temp*9/5)+32)+"°F" : Math.round(snap.temp)+"°C") : "--";
    var condText  = snap ? snap.condition : "No data yet";
    var humidText = snap ? snap.humidity+"%" : "--";
    var windText  = snap ? snap.windSpeed+" km/h" : "--";
    card.innerHTML =
      '<div class="fav-city-name"><i class="fa fa-location-dot"></i> ' + fav.city + '</div>' +
      '<div class="fav-temp">' + dispTemp + '</div>' +
      '<div class="fav-condition">' + condText + '</div>' +
      '<div class="fav-details">' +
        '<span class="fav-detail-item"><i class="fa fa-droplet"></i> ' + humidText + '</span>' +
        '<span class="fav-detail-item"><i class="fa fa-wind"></i> ' + windText + '</span>' +
      '</div>' +
      '<div class="fav-actions">' +
        '<button class="btn-fav-view"><i class="fa fa-eye"></i> View</button>' +
        '<button class="btn-fav-remove"><i class="fa fa-trash"></i></button>' +
      '</div>';
    card.querySelector(".btn-fav-view").addEventListener("click", function() {
      currentCity = fav.city;
      getWeatherData(fav.city, currentUnit, "week");
      favoritesPanel.hidden = true;
      alertsPanel.hidden    = true;
      favoritesNavBtn.classList.remove("active");
      setMainSections(true);
      weekNavBtn.classList.add("active");
    });
    card.querySelector(".btn-fav-remove").addEventListener("click", function(e) {
      e.stopPropagation();
      var updated = getFavorites().filter(function(f) { return f.city.toLowerCase() !== fav.city.toLowerCase(); });
      saveFavorites(updated);
      showToast("info","fa-heart-crack","Removed", fav.city + " removed from favorites.");
      renderFavorites();
      updateSaveCityBtn();
    });
    favoritesGrid.appendChild(card);
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
syncAuthUI();

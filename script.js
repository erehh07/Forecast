// ── Element References ────────────────────────────────────────────────────────
const temp              = document.getElementById("temp");
const dateEl            = document.getElementById("date-time");
const condition         = document.getElementById("condition");
const rain              = document.getElementById("rain");
const mainIcon          = document.getElementById("icon");
const currentLocation   = document.getElementById("location");
const uvIndex           = document.querySelector(".uv-index");
const uvText            = document.querySelector(".uv-text");
const windSpeed         = document.querySelector(".wind-speed");
const sunRise           = document.querySelector(".sun-rise");
const sunSet            = document.querySelector(".sun-set");
const humidity          = document.querySelector(".humidity");
const visibility        = document.querySelector(".visibilty");
const humidityStatus    = document.querySelector(".humidity-status");
const airQuality        = document.querySelector(".air-quality");
const airQualityStatus  = document.querySelector(".air-quality-status");
const visibilityStatus  = document.querySelector(".visibilty-status");
const searchForm        = document.querySelector("#search");
const searchInput       = document.querySelector("#query");
const celciusBtn        = document.querySelector(".celcius");
const fahrenheitBtn     = document.querySelector(".fahrenheit");
const tempUnitEls       = document.querySelectorAll(".temp-unit");
const hourlyBtn         = document.querySelector(".hourly");
const weekBtn           = document.querySelector(".week");
const weatherCards      = document.querySelector("#weather-cards");

// ── State ─────────────────────────────────────────────────────────────────────
let currentCity    = "";
let currentUnit    = "c";
let currentView    = "week"; // "week" | "hourly"

const API_KEY = "EJ6UBL2JEQGYB3AA4ENASN62J";

// ── Clock ─────────────────────────────────────────────────────────────────────
function getDateTime() {
  const now  = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  let h = now.getHours() % 12 || 12;
  let m = now.getMinutes();
  if (h < 10) h = "0" + h;
  if (m < 10) m = "0" + m;
  return `${days[now.getDay()]}, ${h}:${m}`;
}

dateEl.innerText = getDateTime();
setInterval(() => { dateEl.innerText = getDateTime(); }, 1000);

// ── Geolocation ───────────────────────────────────────────────────────────────
function getPublicIp() {
  fetch("https://geolocation-db.com/json/")
    .then(r => r.json())
    .then(data => {
      currentCity = data.city || "London";
      getWeatherData(currentCity, currentUnit, currentView);
    })
    .catch(() => {
      currentCity = "London";
      getWeatherData(currentCity, currentUnit, currentView);
    });
}

getPublicIp();

// ── Weather API ───────────────────────────────────────────────────────────────
function getWeatherData(city, unit, view) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=${API_KEY}&contentType=json`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const today = data.currentConditions;

      // Temperature
      const rawTemp = today.temp;
      temp.innerText = unit === "c" ? Math.round(rawTemp) : celciusToFahrenheit(rawTemp);

      // Basic info
      currentLocation.innerText = data.resolvedAddress;
      condition.innerText        = today.conditions;
      rain.innerText             = `Precip — ${today.precip ?? 0}%`;

      // Icon & background
      mainIcon.src = getIcon(today.icon);
      changeBackground(today.icon);

      // Highlights
      uvIndex.innerText   = today.uvindex;
      measureUvIndex(today.uvindex);
      windSpeed.innerText = today.windspeed + " km/h";
      sunRise.innerText   = convertTo12h(today.sunrise);
      sunSet.innerText    = convertTo12h(today.sunset);
      humidity.innerText  = today.humidity + "%";
      updateHumidityStatus(today.humidity);
      visibility.innerText = today.visibility + " km";
      updateVisibilityStatus(today.visibility);
      airQuality.innerText = today.winddir;
      updateAirQualityStatus(today.winddir);

      // Forecast
      if (view === "hourly") {
        updateForecast(data.days[0].hours, unit, "day");
      } else {
        updateForecast(data.days, unit, "week");
      }

      // ── Feature hook: called after every weather load ──
      if (typeof onWeatherLoaded === "function") {
        onWeatherLoaded({
          city:      city,
          temp:      rawTemp,
          condition: today.conditions,
          humidity:  today.humidity,
          windSpeed: today.windspeed,
          uv:        today.uvindex,
          precip:    today.precip ?? 0
        });
      }
    })
    .catch(err => console.error("Weather fetch error:", err));
}

// ── Forecast Cards ────────────────────────────────────────────────────────────
function updateForecast(data, unit, type) {
  weatherCards.innerHTML = "";
  const numCards = type === "day" ? 24 : 7;

  for (let i = 0; i < numCards && i < data.length; i++) {
    const card    = document.createElement("div");
    card.classList.add("card");
    card.style.animationDelay = `${i * 0.04}s`;

    const label    = type === "week" ? getDayName(data[i].datetime) : getHour(data[i].datetime);
    const rawTemp  = data[i].temp;
    const dispTemp = unit === "f" ? celciusToFahrenheit(rawTemp) : Math.round(rawTemp);
    const unitStr  = unit === "f" ? "°F" : "°C";
    const iconSrc  = getIcon(data[i].icon);

    card.innerHTML = `
      <h2 class="day-name">${label}</h2>
      <div class="card-icon"><img src="${iconSrc}" class="day-icon" alt="" /></div>
      <div class="day-temp">
        <span class="temp">${dispTemp}</span>
        <span class="temp-unit">${unitStr}</span>
      </div>`;

    weatherCards.appendChild(card);
  }
}

// ── Icon Map ──────────────────────────────────────────────────────────────────
function getIcon(cond) {
  const map = {
    "partly-cloudy-day":   "https://i.ibb.co/PZQXH8V/27.png",
    "partly-cloudy-night": "https://i.ibb.co/Kzkk59k/15.png",
    "rain":                "https://i.ibb.co/kBd2NTS/39.png",
    "clear-day":           "https://i.ibb.co/rb4rrJL/26.png",
    "clear-night":         "https://i.ibb.co/1nxNGHL/10.png",
  };
  return map[cond] || "https://i.ibb.co/rb4rrJL/26.png";
}

// ── Background ────────────────────────────────────────────────────────────────
function changeBackground(cond) {
  // Extend with gradient tweaks per condition if desired
  const gradients = {
    "clear-day":           "linear-gradient(135deg,#fce38a,#f38181)",
    "clear-night":         "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
    "partly-cloudy-day":   "linear-gradient(135deg,#c9dce8,#2c3e50)",
    "partly-cloudy-night": "linear-gradient(135deg,#232526,#414345)",
    "rain":                "linear-gradient(135deg,#4b6cb7,#182848)",
  };
  document.body.style.background = gradients[cond] || "linear-gradient(135deg,#c9dce8,#2c3e50)";
}

// ── Time Helpers ──────────────────────────────────────────────────────────────
function getHour(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  return hour >= 12
    ? `${hour === 12 ? 12 : hour - 12}:${m} PM`
    : `${hour || 12}:${m} AM`;
}

function convertTo12h(time) {
  let [h, m] = time.split(":");
  const ampm = parseInt(h) >= 12 ? "pm" : "am";
  h = parseInt(h) % 12 || 12;
  h = h < 10 ? "0" + h : h;
  return `${h}:${m} ${ampm}`;
}

function getDayName(dateStr) {
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  return days[new Date(dateStr).getDay()];
}

// ── Status Helpers ────────────────────────────────────────────────────────────
function measureUvIndex(uv) {
  uvText.innerText =
    uv <= 2  ? "Low"      :
    uv <= 5  ? "Moderate" :
    uv <= 7  ? "High"     :
    uv <= 10 ? "Very High":
               "Extreme";
}

function updateHumidityStatus(h) {
  humidityStatus.innerText =
    h <= 30 ? "Low"      :
    h <= 60 ? "Moderate" :
              "High";
}

function updateVisibilityStatus(v) {
  visibilityStatus.innerText =
    v <= 0.03  ? "Dense Fog"    :
    v <= 0.16  ? "Moderate Fog" :
    v <= 1.13  ? "Light Fog"    :
    v <= 5.4   ? "Light Mist"   :
    v <= 10.8  ? "Clear Air"    :
                 "Very Clear";
}

function updateAirQualityStatus(aq) {
  airQualityStatus.innerText =
    aq <= 50  ? "Good"       :
    aq <= 100 ? "Moderate"   :
    aq <= 150 ? "Sensitive"  :
    aq <= 200 ? "Unhealthy"  :
    aq <= 250 ? "Very Unhealthy" :
                "Hazardous";
}

// ── Unit Conversion ───────────────────────────────────────────────────────────
function celciusToFahrenheit(c) {
  return Math.round((c * 9) / 5 + 32);
}

function changeUnit(unit) {
  if (currentUnit === unit) return;
  currentUnit = unit;
  celciusBtn.classList.toggle("active", unit === "c");
  fahrenheitBtn.classList.toggle("active", unit === "f");
  // Update the sidebar °C / °F symbol (static element)
  document.querySelectorAll(".temp-unit").forEach(el => {
    el.innerText = unit === "c" ? "°C" : "°F";
  });
  getWeatherData(currentCity, currentUnit, currentView);
}

celciusBtn.addEventListener("click",    () => changeUnit("c"));
fahrenheitBtn.addEventListener("click", () => changeUnit("f"));

// ── View Toggle ───────────────────────────────────────────────────────────────
function changeView(view) {
  if (currentView === view) return;
  currentView = view;
  weekBtn.classList.toggle("active",   view === "week");
  hourlyBtn.classList.toggle("active", view === "hourly");
  getWeatherData(currentCity, currentUnit, currentView);
}

weekBtn.addEventListener("click",   () => changeView("week"));
hourlyBtn.addEventListener("click", () => changeView("hourly"));

// ── Search ────────────────────────────────────────────────────────────────────
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const val = searchInput.value.trim();
  if (val) {
    currentCity = val;
    getWeatherData(currentCity, currentUnit, currentView);
    removeSuggestions();
  }
});

// ── Autocomplete ──────────────────────────────────────────────────────────────
let currentFocus = -1;

searchInput.addEventListener("input", function () {
  removeSuggestions();
  const val = this.value.trim();
  if (!val || typeof cities === "undefined") return;

  currentFocus = -1;
  const list = document.createElement("ul");
  list.id = "suggestions";

  const matches = cities.filter(c =>
    c.name.substr(0, val.length).toUpperCase() === val.toUpperCase()
  ).slice(0, 10); // cap at 10

  matches.forEach(city => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${city.name.substr(0, val.length)}</strong>${city.name.substr(val.length)}`;
    li.addEventListener("click", () => {
      searchInput.value = city.name;
      removeSuggestions();
    });
    list.appendChild(li);
  });

  if (matches.length) this.parentNode.appendChild(list);
});

searchInput.addEventListener("keydown", function (e) {
  const list = document.getElementById("suggestions");
  const items = list ? list.querySelectorAll("li") : [];
  if (e.key === "ArrowDown") { currentFocus = Math.min(currentFocus + 1, items.length - 1); setActive(items); }
  else if (e.key === "ArrowUp") { currentFocus = Math.max(currentFocus - 1, 0); setActive(items); }
  else if (e.key === "Enter" && currentFocus > -1) { e.preventDefault(); items[currentFocus]?.click(); }
});

function setActive(items) {
  items.forEach(li => li.classList.remove("active"));
  if (items[currentFocus]) items[currentFocus].classList.add("active");
}

function removeSuggestions() {
  const s = document.getElementById("suggestions");
  if (s) s.remove();
}

// Close suggestions on outside click
document.addEventListener("click", e => {
  if (!e.target.closest(".search")) removeSuggestions();
});

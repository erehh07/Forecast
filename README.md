# 🌦️ Weather Forecast Web Application

A modern **Weather Forecast Web Application** built using **HTML, CSS, and JavaScript**.
The application displays real-time weather data, weekly forecasts, hourly forecasts, weather alerts, and allows users to save favorite cities.

---

## 📌 Features

* 🌍 Detects user's location automatically
* 🔎 Search weather by city name
* 📅 Weekly weather forecast
* ⏱ Hourly weather forecast
* 🌡 Temperature unit toggle (°C / °F)
* ⚠ Weather alerts system
* 🔔 Browser notifications for severe weather
* ❤️ Save favorite cities
* 👤 User authentication (Login / Register)
* 📊 Weather highlights:

  * UV Index
  * Wind Speed
  * Sunrise & Sunset
  * Humidity
  * Visibility
  * Air Quality
* 🎨 Responsive and modern UI

---

## 🗂 Project Structure

```
weather-app/
│
├── index.html      # Main HTML layout
├── style.css       # Styling and UI design
├── script.js       # Weather API logic and UI updates
├── features.js     # Alerts, authentication, and favorites
└── README.md
```

---

## ⚙ Technologies Used

* HTML5
* CSS3
* JavaScript (Vanilla JS)
* Visual Crossing Weather API
* Font Awesome Icons
* Google Fonts (Poppins)

---

## 🔑 Weather API

This project uses the **Visual Crossing Weather API**.

Example API Request:

```
https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{city}?unitGroup=metric&key=API_KEY&contentType=json
```

API key is defined inside `script.js`.

---

## 🚀 How to Run the Project

1. Download or clone the repository
2. Extract the project folder
3. Open the folder
4. Double-click **index.html**

OR open with **Live Server (recommended)** in VS Code.

---

## 📸 Application Modules

### Sidebar

* Search weather
* Display current weather
* Login / Register
* Save city

### Main Section

* Weekly forecast
* Hourly forecast
* Weather alerts
* Favorite cities

### Highlights

* UV Index
* Wind Speed
* Sunrise & Sunset
* Humidity
* Visibility
* Air Quality

---

## 🔔 Weather Alerts

The system automatically generates alerts based on weather conditions such as:

* Extreme Heat
* Thunderstorms
* Heavy Rain
* High Winds
* Snow
* High UV Index
* High Humidity

Alerts appear as:

* Alert cards
* Toast notifications
* Browser notifications

---

## 👤 User Authentication

Users can:

* Register an account
* Login
* Save favorite cities

User data is stored locally using **LocalStorage**.

---

## 📱 Responsive Design

The application is fully responsive and works on:

* Desktop
* Tablet
* Mobile devices

---

## 👨‍💻 Author

Designed & Developed by **Lokesh**

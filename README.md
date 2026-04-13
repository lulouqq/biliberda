# 🌍 Biliberda

Geo-based drawing web app where users create artwork tied to real-world locations.

Draw, explore, and interact with a shared spatial canvas directly on the map.

---

## ✨ Features

- 🗺 Interactive map powered by Leaflet
- ✏️ Real-time drawing on canvas overlay
- 📍 Live geolocation tracking
- 🔵 Radius-based drawing constraints (in meters)
- 🔄 Auto-follow user position
- 📱 Mobile support (touch events handled)

---

## 🧠 How it works

- User position is tracked via the Geolocation API
- Drawing is restricted within a real-world radius using distance calculations
- Canvas is rendered on top of the map and synced with map movement
- Drawing data is handled in geographic coordinates (lat/lng)

---

## 🛠 Tech Stack

- React
- Leaflet
- HTML5 Canvas
- Geolocation API

---

## ⚙️ Installation

```bash
git clone https://github.com/your-username/biliberda.git
cd biliberda
npm install
npm run dev
```

---

## 💡 Idea

Biliberda explores location-based digital interaction,  
allowing users to leave a visual mark in physical space.

---

## 📌 Roadmap

- 🎮 Game mechanics (zones / battles)
- 🎨 User customization (colors, identity)
- 🌐 Backend for shared drawings
- ⚡ Realtime interaction

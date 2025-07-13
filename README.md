# GridGuardian

Monitor, analyze, and visualize cyclone-induced power outage risks in real-time using ESP32, Flask, and a web dashboard.

---

## Overview

This project provides a complete, cross-device real-time monitoring system for cyclone-related outage risks.  
It uses an ESP32 to simulate or read environmental parameters, sends the data to a Flask backend, which computes an outage risk score and broadcasts all data to a live dashboard via Socket.IO.

---

## Features

- **Real-time monitoring** of:
  - Wind Speed
  - Precipitation
  - Flood Risk
  - Cyclone Category
  - Vegetation Density
  - Outage Risk (computed)
- **Live dashboard** with instant updates using Socket.IO
- **Chart.js** visualization for recent trends (optional)
- **Cross-device access**: View dashboard from any device on the same network
- **ESP32 simulation**: Realistic storm parameter simulation
- **Easy deployment**: Minimal configuration required

---

## Architecture

| Component   | Description                                                                 |
|-------------|-----------------------------------------------------------------------------|
| ESP32       | Simulates/reads parameters and sends JSON data via HTTP POST every second    |
| Flask       | Receives data, computes outage risk, emits updates via Flask-SocketIO        |
| Dashboard   | HTML/JS frontend connects via Socket.IO, displays parameters and risk score  |

---

## Outage Risk Formula
outage_risk = 0.35 * (wind_speed / 45)
+ 0.25 * (precipitation / 150)
+ 0.20 * (flood_risk / 2)
+ 0.15 * vegetation_density
+ 0.05 * (grid_age / 50)


---

## Quick Start

### 1. Clone or Download the Repository
```
git clone https://github.com/YashRathore-03/GridGuardian-.git
cd cyclone-outage-dashboard
```

### 2. Install Python Dependencies
```
pip install -r requirements.txt
```


### 3. Configure and Run the Flask Server
```
python flask_server.py
```

- The server will listen on port 5000 by default.

### 4. Set Up the ESP32

- Open `esp32_cyclone_sim.ino` in the Arduino IDE.
- Update your Wi-Fi SSID, password, and Flask server IP address.
- Upload to your ESP32.

### 5. Access the Dashboard

- On any device connected to the same network, open a browser and go to:
http://<YOUR_SERVER_IP>:5000

- The dashboard will display real-time data and risk scores.

---

## File Structure

| File/Folders            | Purpose                                            |
|-------------------------|---------------------------------------------------|
| `flask_server.py`       | Flask backend with Socket.IO and risk calculation |
| `requirements.txt`      | Python dependencies                               |
| `esp32_cyclone_sim.ino` | ESP32 Arduino code for simulation                 |
| `templates/index.html`  | Web dashboard frontend (HTML/JS)                  |
| `static/`               | Static files (JS, CSS, Chart.js)                  |

---

## ESP32 Arduino Code

- Simulates or reads all required parameters.
- Sends JSON like:


```
{
"wind_speed": 80,
"precipitation": 60,
"flood_risk": 1.2,
"cyclone_category": 2,
"vegetation_density": 0.7,
"grid_age": 20
}
```

- Sends data every second via HTTP POST to `/api/data` on the Flask server.

---

## Flask Server

- Receives ESP32 data via `/api/data` endpoint (POST, JSON).
- Computes `outage_risk` using the provided formula.
- Emits all parameters and computed risk to dashboard clients via Socket.IO.
- Serves the dashboard at `/`.

---

## Dashboard

- Connects to Flask-SocketIO for live updates.
- Displays all parameters and computed outage risk.
- Optionally visualizes trends using Chart.js.
- Responsive design for desktops, tablets, and phones.

---

## Customization

- **Add sensors**: Connect real sensors to ESP32 and update code accordingly.
- **Change risk formula**: Edit the formula in `flask_server.py`.
- **Dashboard design**: Modify `index.html` and static files.

---

## Troubleshooting

- Ensure all devices are on the same Wi-Fi network.
- Check firewall settings to allow port 5000.
- Use serial monitor on ESP32 for debugging connection issues.
- Confirm correct IP address in ESP32 code.

---

## Credits

Developed for real-time cyclone outage risk monitoring and visualization using open-source tools.




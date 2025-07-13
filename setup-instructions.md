# Cyclone Outage Risk Monitoring System - Setup Instructions

## System Overview

This real-time monitoring system consists of three main components:
1. **ESP32 microcontroller** - Collects/simulates sensor data and sends it via HTTP POST
2. **Flask server** - Receives data, calculates outage risk, and broadcasts via WebSocket
3. **Web dashboard** - Displays real-time data and charts using Socket.IO

## Prerequisites

### Hardware Requirements
- ESP32 development board
- Computer/Raspberry Pi for Flask server
- WiFi network

### Software Requirements
- Arduino IDE (for ESP32 programming)
- Python 3.7+ (for Flask server)
- Modern web browser (for dashboard)

## Setup Instructions

### 1. Flask Server Setup

#### Install Python Dependencies
```bash
pip install -r requirements.txt
```

The requirements.txt includes:
- Flask==2.3.3
- Flask-SocketIO==5.3.6
- Flask-CORS==4.0.0
- python-socketio==5.8.0
- python-engineio==4.7.1
- eventlet==0.33.3

#### Configure Server
1. Open `flask_server.py`
2. Modify the `GRID_AGE` constant if needed (default: 25 years)
3. Adjust risk calculation coefficients if required

#### Run the Server
```bash
python flask_server.py
```

The server will start on `http://0.0.0.0:5000` and be accessible from any device on the network.

### 2. ESP32 Setup

#### Install Required Libraries
Open Arduino IDE and install these libraries via Library Manager:
- **WiFi** (built-in)
- **HTTPClient** (built-in)
- **ArduinoJson** (by Benoit Blanchon)

#### Configure ESP32 Code
1. Open `esp32_cyclone_monitor.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```
3. Update Flask server URL:
   ```cpp
   const char* serverURL = "http://192.168.1.100:5000/api/sensor-data";
   ```
   Replace `192.168.1.100` with your Flask server's IP address.

#### Upload to ESP32
1. Connect ESP32 to computer via USB
2. Select the correct board and port in Arduino IDE
3. Upload the code
4. Open Serial Monitor to view sensor data and connection status

### 3. Web Dashboard Access

Once the Flask server is running:
1. Open a web browser
2. Navigate to `http://[SERVER_IP]:5000`
3. The dashboard will automatically connect and display real-time data

## Network Configuration

### Finding Your Server IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter.

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your WiFi interface.

**Alternative method:**
The Flask server will print its IP address when started.

### Firewall Configuration

Ensure port 5000 is open for incoming connections:

**Windows:**
```cmd
netsh advfirewall firewall add rule name="Flask Server" dir=in action=allow protocol=TCP localport=5000
```

**Mac:**
```bash
sudo pfctl -f /etc/pf.conf
```

**Linux (Ubuntu/Debian):**
```bash
sudo ufw allow 5000
```

## System Features

### Real-time Parameters
- **Wind Speed** (0-200 mph)
- **Precipitation** (0-150 mm/hr)
- **Flood Risk** (0-10 scale)
- **Cyclone Category** (1-5 based on Saffir-Simpson scale)
- **Vegetation Density** (0-1 scale)

### Outage Risk Calculation
The system uses the following formula:
```
outage_risk = 0.35 × (wind_speed ÷ 45) + 
              0.25 × (precipitation ÷ 150) + 
              0.20 × (flood_risk ÷ 2) + 
              0.15 × vegetation_density + 
              0.05 × (grid_age ÷ 50)
```

### Dashboard Features
- Real-time parameter display with color-coded risk levels
- Live charts showing 60-second history
- WebSocket connection status indicator
- Responsive design for mobile/desktop
- Automatic reconnection on connection loss

## API Endpoints

### POST `/api/sensor-data`
Receives sensor data from ESP32
```json
{
    "timestamp": "2024-01-01T12:00:00Z",
    "wind_speed": 95.5,
    "precipitation": 45.2,
    "flood_risk": 6.8,
    "cyclone_category": 2,
    "vegetation_density": 0.65,
    "device_id": "ESP32_CYCLONE_01",
    "location": "Coastal Station Alpha"
}
```

### GET `/api/current-data`
Returns current sensor readings

### GET `/api/history?limit=100`
Returns historical data (last 100 points)

### GET `/api/status`
Returns system status and configuration

## Troubleshooting

### ESP32 Connection Issues
1. **WiFi Connection Failed**
   - Check WiFi credentials
   - Ensure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
   - Verify network allows device connections

2. **HTTP POST Errors**
   - Verify Flask server is running
   - Check server IP address in ESP32 code
   - Ensure firewall allows port 5000

3. **Serial Monitor Shows HTTP Error -1**
   - Server is unreachable
   - Check network connectivity
   - Verify server URL format

### Flask Server Issues
1. **Server Won't Start**
   - Check if port 5000 is already in use
   - Verify Python dependencies are installed
   - Check Python version (3.7+ required)

2. **No Data Received**
   - Check ESP32 serial output for errors
   - Verify ESP32 is sending to correct URL
   - Check Flask server logs for incoming requests

### Dashboard Issues
1. **Connection Status Shows "Disconnected"**
   - Verify Flask server is running
   - Check browser's JavaScript console for errors
   - Try refreshing the page

2. **No Charts Displayed**
   - Check if Chart.js library loaded successfully
   - Verify browser supports WebSockets
   - Check for JavaScript errors in browser console

## Scaling and Customization

### Multiple ESP32 Devices
- Each ESP32 can have a unique `device_id`
- Flask server automatically handles multiple devices
- Dashboard shows combined data from all devices

### Custom Risk Formula
Modify the risk calculation in `flask_server.py`:
```python
RISK_COEFFICIENTS = {
    'wind_speed_coeff': 0.35,
    'wind_speed_normalizer': 45.0,
    # ... adjust coefficients as needed
}
```

### Additional Parameters
To add new parameters:
1. Modify ESP32 code to include new sensors
2. Update Flask server to handle new parameters
3. Add new cards and charts to the dashboard

## Security Considerations

### Production Deployment
- Use HTTPS for secure communication
- Implement authentication for dashboard access
- Use environment variables for sensitive configuration
- Consider using a reverse proxy (nginx, Apache)

### Network Security
- Use WPA3 WiFi security
- Implement VPN for remote access
- Regular security updates for all components

## Support and Maintenance

### Regular Maintenance
- Monitor Flask server logs
- Check ESP32 serial output periodically
- Update dependencies regularly
- Monitor network connectivity

### Performance Optimization
- Adjust update intervals based on needs
- Limit historical data storage
- Use database for long-term storage
- Consider Redis for caching

## License and Disclaimer

This system is for educational and research purposes. For production use in critical infrastructure, additional testing, validation, and safety measures are required.

---

**Note**: This system provides simulated sensor data for demonstration purposes. For real-world deployment, integrate actual weather sensors and validate the risk calculation formula with domain experts.
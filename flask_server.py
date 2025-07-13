
from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
import datetime
import time
import threading
import logging
from collections import deque
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Data storage
sensor_data_history = deque(maxlen=1000)  # Keep last 1000 readings
current_sensor_data = {}
connected_clients = set()

# Constants for outage risk calculation
GRID_AGE = 25  # years (can be made configurable)

# Risk calculation coefficients
RISK_COEFFICIENTS = {
    'wind_speed_coeff': 0.35,
    'wind_speed_normalizer': 45.0,
    'precipitation_coeff': 0.25,
    'precipitation_normalizer': 150.0,
    'flood_risk_coeff': 0.20,
    'flood_risk_normalizer': 2.0,
    'vegetation_density_coeff': 0.15,
    'grid_age_coeff': 0.05,
    'grid_age_normalizer': 50.0
}

def calculate_outage_risk(wind_speed, precipitation, flood_risk, vegetation_density, grid_age=GRID_AGE):
    """
    Calculate outage risk using the specified formula:
    outage_risk = 0.35 * (wind_speed / 45) + 
                  0.25 * (precipitation / 150) + 
                  0.20 * (flood_risk / 2) + 
                  0.15 * vegetation_density + 
                  0.05 * (grid_age / 50)
    """
    try:
        # Ensure all inputs are numeric
        wind_speed = float(wind_speed)
        precipitation = float(precipitation)
        flood_risk = float(flood_risk)
        vegetation_density = float(vegetation_density)
        grid_age = float(grid_age)

        # Calculate each component
        wind_component = RISK_COEFFICIENTS['wind_speed_coeff'] * (wind_speed / RISK_COEFFICIENTS['wind_speed_normalizer'])
        precip_component = RISK_COEFFICIENTS['precipitation_coeff'] * (precipitation / RISK_COEFFICIENTS['precipitation_normalizer'])
        flood_component = RISK_COEFFICIENTS['flood_risk_coeff'] * (flood_risk / RISK_COEFFICIENTS['flood_risk_normalizer'])
        vegetation_component = RISK_COEFFICIENTS['vegetation_density_coeff'] * vegetation_density
        grid_age_component = RISK_COEFFICIENTS['grid_age_coeff'] * (grid_age / RISK_COEFFICIENTS['grid_age_normalizer'])

        # Calculate total risk
        total_risk = wind_component + precip_component + flood_component + vegetation_component + grid_age_component

        # Cap at 1.0 (100% risk)
        total_risk = min(total_risk, 1.0)

        # Log the calculation for debugging
        logger.info(f"Risk calculation: Wind={wind_component:.3f}, Precip={precip_component:.3f}, "
                   f"Flood={flood_component:.3f}, Vegetation={vegetation_component:.3f}, "
                   f"Grid={grid_age_component:.3f}, Total={total_risk:.3f}")

        return total_risk

    except (ValueError, TypeError) as e:
        logger.error(f"Error calculating outage risk: {e}")
        return 0.0

def get_risk_level(risk_score):
    """Convert risk score to descriptive level"""
    if risk_score < 0.25:
        return "Low"
    elif risk_score < 0.50:
        return "Medium"
    elif risk_score < 0.75:
        return "High"
    else:
        return "Critical"

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from ESP32"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data received'}), 400

        # Validate required fields
        required_fields = ['wind_speed', 'precipitation', 'flood_risk', 'cyclone_category', 'vegetation_density']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400

        # Add timestamp if not present
        if 'timestamp' not in data:
            data['timestamp'] = datetime.datetime.utcnow().isoformat() + 'Z'

        # Calculate outage risk
        outage_risk = calculate_outage_risk(
            data['wind_speed'],
            data['precipitation'],
            data['flood_risk'],
            data['vegetation_density']
        )

        # Add calculated fields
        data['outage_risk'] = outage_risk
        data['risk_level'] = get_risk_level(outage_risk)
        data['grid_age'] = GRID_AGE

        # Store data
        current_sensor_data.update(data)
        sensor_data_history.append(data.copy())

        # Broadcast to connected clients
        socketio.emit('sensor_data', data, broadcast=True)

        logger.info(f"Received data: Wind={data['wind_speed']}, Risk={outage_risk:.3f} ({data['risk_level']})")

        return jsonify({'status': 'success', 'outage_risk': outage_risk, 'risk_level': data['risk_level']})

    except Exception as e:
        logger.error(f"Error processing sensor data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/current-data', methods=['GET'])
def get_current_data():
    """Get current sensor data"""
    return jsonify(current_sensor_data)

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get sensor data history"""
    limit = request.args.get('limit', 100, type=int)
    history = list(sensor_data_history)[-limit:]
    return jsonify(history)

@app.route('/api/risk-calculation', methods=['POST'])
def calculate_risk():
    """Calculate outage risk for given parameters"""
    try:
        data = request.get_json()

        required_fields = ['wind_speed', 'precipitation', 'flood_risk', 'vegetation_density']
        missing_fields = [field for field in required_fields if field not in data]

        if missing_fields:
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400

        grid_age = data.get('grid_age', GRID_AGE)

        outage_risk = calculate_outage_risk(
            data['wind_speed'],
            data['precipitation'],
            data['flood_risk'],
            data['vegetation_density'],
            grid_age
        )

        return jsonify({
            'outage_risk': outage_risk,
            'risk_level': get_risk_level(outage_risk),
            'grid_age': grid_age
        })

    except Exception as e:
        logger.error(f"Error in risk calculation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status"""
    return jsonify({
        'status': 'online',
        'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
        'connected_clients': len(connected_clients),
        'data_points': len(sensor_data_history),
        'grid_age': GRID_AGE,
        'risk_formula': {
            'formula': 'outage_risk = 0.35 * (wind_speed / 45) + 0.25 * (precipitation / 150) + 0.20 * (flood_risk / 2) + 0.15 * vegetation_density + 0.05 * (grid_age / 50)',
            'coefficients': RISK_COEFFICIENTS
        }
    })

# SocketIO event handlers
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    client_id = request.sid
    connected_clients.add(client_id)
    logger.info(f"Client {client_id} connected. Total clients: {len(connected_clients)}")

    # Send current data to newly connected client
    if current_sensor_data:
        emit('sensor_data', current_sensor_data)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    client_id = request.sid
    connected_clients.discard(client_id)
    logger.info(f"Client {client_id} disconnected. Total clients: {len(connected_clients)}")

@socketio.on('request_current_data')
def handle_request_current_data():
    """Handle request for current data"""
    if current_sensor_data:
        emit('sensor_data', current_sensor_data)
    else:
        emit('error', {'message': 'No current data available'})

@socketio.on('request_history')
def handle_request_history(data):
    """Handle request for historical data"""
    limit = data.get('limit', 60) if data else 60
    history = list(sensor_data_history)[-limit:]
    emit('history_data', history)

# Background task to simulate data if no real data is coming
def simulate_data():
    """Simulate sensor data for testing purposes"""
    import random

    while True:
        time.sleep(5)  # Send simulated data every 5 seconds

        # Only simulate if no real data has been received recently
        if not current_sensor_data or (datetime.datetime.utcnow() - 
                                     datetime.datetime.fromisoformat(current_sensor_data.get('timestamp', '1970-01-01T00:00:00Z').replace('Z', ''))).seconds > 30:

            # Generate realistic simulated data
            wind_speed = random.uniform(20, 150)
            precipitation = random.uniform(0, 100)
            flood_risk = random.uniform(0, 8)
            cyclone_category = min(5, max(1, int(wind_speed / 30)))
            vegetation_density = random.uniform(0.3, 0.9)

            simulated_data = {
                'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
                'wind_speed': wind_speed,
                'precipitation': precipitation,
                'flood_risk': flood_risk,
                'cyclone_category': cyclone_category,
                'vegetation_density': vegetation_density,
                'device_id': 'SIMULATOR',
                'location': 'Test Location'
            }

            # Calculate outage risk
            outage_risk = calculate_outage_risk(
                wind_speed, precipitation, flood_risk, vegetation_density
            )

            simulated_data['outage_risk'] = outage_risk
            simulated_data['risk_level'] = get_risk_level(outage_risk)
            simulated_data['grid_age'] = GRID_AGE

            # Store and broadcast
            current_sensor_data.update(simulated_data)
            sensor_data_history.append(simulated_data.copy())
            socketio.emit('sensor_data', simulated_data, broadcast=True)

            logger.info(f"Simulated data: Wind={wind_speed:.1f}, Risk={outage_risk:.3f}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Start background simulation thread
    simulation_thread = threading.Thread(target=simulate_data, daemon=True)
    simulation_thread.start()

    logger.info("Starting Cyclone Outage Risk Monitor Flask Server")
    logger.info(f"Grid age set to: {GRID_AGE} years")
    logger.info("Risk calculation formula: outage_risk = 0.35 * (wind_speed / 45) + 0.25 * (precipitation / 150) + 0.20 * (flood_risk / 2) + 0.15 * vegetation_density + 0.05 * (grid_age / 50)")

    # Run the Flask-SocketIO server
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)

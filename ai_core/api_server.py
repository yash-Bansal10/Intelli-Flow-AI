# api_server.py

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import time
import jwt
from functools import wraps
from security.watchdog import global_watchdog

API_SECRET_KEY = "intelliflow_super_secret_key_2026"

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            print("SECURITY ALERT: Missing JWT Token")
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            token = token.replace("Bearer ", "")
            data = jwt.decode(token, API_SECRET_KEY, algorithms=["HS256"])
        except Exception as e:
            print(f"SECURITY ALERT: Invalid JWT Token -> {e}")
            return jsonify({'message': f'Token is invalid! {e}'}), 401
        return f(*args, **kwargs)
    return decorated


# Created a lock to manage access to the live_data dictionary
data_lock = threading.Lock()


# Emergency Registry: Stores which junctions are in priority mode
# Format: {"B2": {"direction": "NS", "active": True}}
emergency_registry = {}

# User Overrides for DQN
manual_overrides = {}

# This dictionary is our global data store. The AI will write to it, and the API will read from it.
live_data = {
    "simulation_time":0,
    "current_phase": "Initializing...",
    "queues":{"north":0,"south":0,"east":0,"west":0},
    "congestion_score":0,
    "emergency_active": False
}

# Day 7: Spawn Queue for external vehicle injection
spawn_queue = []

# Create the Flask web server application 
app = Flask(__name__)
CORS(app)

@app.route('/set_override_mode', methods=['POST'])
@token_required
def set_override_mode():
    data = request.json
    jid = data.get("junction_id")
    mode = data.get("mode") # "dqn" or "fixed_timer"
    with data_lock:
        if mode == "fixed_timer":
            manual_overrides[jid] = "fixed_timer"
        else:
            manual_overrides.pop(jid, None)
    return jsonify({"status": "success", "overrides": manual_overrides})

@app.route('/get_overrides', methods=['GET'])
def get_overrides():
    with data_lock:
        return jsonify(manual_overrides)

# Define the single API endpoint that the dashboard will call
# @app.route('/live_data')
# This is called a decorator. It's a special piece of Flask syntax that turns a regular Python function into an API endpoint.
# '/live_data': This is the URL path. When the dashboard wants data, it will go to an address like http://127.0.0.1:5000/live_data.
# This decorator tells our server, "When someone visits this specific URL, run the function directly below it."
@app.route('/live_data')
def get_data():
    with data_lock:
        return jsonify(live_data)

@app.route('/get_token', methods=['GET'])
def get_token():
    """Generates a valid JWT token for the Dashboard Demo."""
    token = jwt.encode({'user': 'admin', 'exp': time.time() + 3600}, API_SECRET_KEY, algorithm="HS256")
    return jsonify({'token': token})

@app.route('/simulate_crash', methods=['POST'])
@token_required
def simulate_crash():
    """Injects a simulated crash event for a specific agent."""
    data = request.get_json()
    jid = data.get("junction_id")
    if not jid: return jsonify({"error": "Missing junction_id"}), 400
    global_watchdog.trigger_crash(jid)
    return jsonify({"status": "success", "message": f"Agent {jid} crashed. Fallback engaged."})

@app.route('/recover_agent', methods=['POST'])
@token_required
def recover_agent():
    """Restores an offline agent."""
    data = request.get_json()
    jid = data.get("junction_id")
    if not jid: return jsonify({"error": "Missing junction_id"}), 400
    global_watchdog.recover(jid)
    return jsonify({"status": "success", "message": f"Agent {jid} recovered."})

@app.route('/inject_v2x_payload', methods=['POST'])
@token_required
def inject_v2x_payload():
    """Endpoint for pen-testing to send V2X data directly to an agent."""
    data = request.get_json()
    jid = data.get("target_junction")
    packet = data.get("packet", {})
    
    try:
        from security.hmac_signer import verify_signature
        payload = verify_signature(packet)
        return jsonify({"status": "success", "message": f"V2X Payload verified from {payload.get('sender')}"})
    except ValueError as e:
        if jid:
            global_watchdog.report_spoof_attempt(jid)
        return jsonify({"error": str(e)}), 401


@app.route('/spawn_ambulance_by_junction', methods=['POST'])
@token_required
def spawn_ambulance_by_junction():
    """Trigger an ambulance from one junction to another"""
    data = request.get_json()
    start_jid = data.get("start_junction")
    end_jid = data.get("end_junction")
    
    if not start_jid or not end_jid:
        return jsonify({"status": "error", "message": "Missing start or end junction"}), 400
        
    with data_lock:
        spawn_queue.append({
            "type": "ambulance",
            "start_junction": start_jid,
            "end_junction": end_jid,
            "vehicle_id": f"api_amb_{int(time.time())}"
        })
    
    return jsonify({"status": "ok", "message": f"Ambulance queued from {start_jid} to {end_jid}"})

@app.route('/emergency_trigger', methods=['POST'])
@token_required
def trigger_emergency():
    """
    Day 7: Enhanced EVP API Endpoint
    Expects JSON: {"junction_id": "B2", "direction": "NS", "active": true, "vehicle_id": "amb01", "route": ["edge1", "edge2"]}
    """
    from flask import request
    data = request.json
    jid = data.get("junction_id")
    direction = data.get("direction", "NS")
    active = data.get("active", True)
    vid = data.get("vehicle_id", "emergency_vehicle")
    route = data.get("route", [])

    with data_lock:
        if active:
            emergency_registry[jid] = {
                "direction": direction,
                "vehicle_id": vid,
                "route": route
            }
            live_data["emergency_active"] = True
        else:
            if jid in emergency_registry:
                del emergency_registry[jid]
            live_data["emergency_active"] = len(emergency_registry) > 0
            
    return jsonify({"status": "success", "registry": emergency_registry})

@app.route('/spawn_ambulance', methods=['POST'])
def spawn_ambulance_request():
    """
    Day 7: External Spawn Request
    Expects JSON: {"vehicle_id": "amb01", "route_id": "route_A0_C2"}
    """
    from flask import request
    data = request.json
    with data_lock:
        spawn_queue.append(data)
    return jsonify({"status": "success", "message": "Spawn request queued"})

def get_spawn_requests():
    """Environment call to fetch and clear the spawn queue"""
    with data_lock:
        reqs = list(spawn_queue)
        spawn_queue.clear()
        return reqs

def clear_emergency(jid):
    """Called by TrafficEnv when a vehicle clears a junction"""
    with data_lock:
        if jid in emergency_registry:
            del emergency_registry[jid]
        live_data["emergency_active"] = len(emergency_registry) > 0

def clear_vehicle_emergencies(vid):
    """Removes all registry entries for a specific vehicle ID"""
    with data_lock:
        to_del = [jid for jid, info in emergency_registry.items() if info.get("vehicle_id") == vid]
        for jid in to_del:
            del emergency_registry[jid]
        live_data["emergency_active"] = len(emergency_registry) > 0

def get_emergency_status():
    """Environment safe check for current emergencies"""
    with data_lock:
        return emergency_registry.copy()

def add_emergency(jid, info):
    """Internal function for TrafficEnv to register emergencies without HTTP overhead"""
    with data_lock:
        emergency_registry[jid] = info
        live_data["emergency_active"] = True

def update_live_data(new_data):
    """This function is the bridge, allowing the AI script to update our data store."""
    global live_data
    with data_lock:
        live_data = new_data

def run_api():
    """A simple function to run the Flask server."""
    # We set debug=False to keep the console clean during training
    app.run(host="0.0.0.0",port=5000, debug=False)

def start_api_thread():
    """This is the main function we'll call from our AI. It starts the API
       server in a separate thread so it doesn't block the simulation."""
    api_thread = threading.Thread(target=run_api, daemon=True)
    api_thread.start()
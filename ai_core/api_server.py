# api_server.py

from flask import Flask, jsonify
from flask_cors import CORS
import threading


# Created a lock to manage access to the live_data dictionary
data_lock = threading.Lock()


# This dictionary is our global data store. The AI will write to it, and the API will read from it.
live_data = {
    "simulation_time":0,
    "current_phase": "Initializing...",
    "queues":{"north":0,"south":0,"east":0,"west":0},
    "congestion_score":0
}

# Create the Flask web server application 
app = Flask(__name__)
CORS(app)

# Define the single API endpoint that the dashboard will call
# @app.route('/live_data')
# This is called a decorator. It's a special piece of Flask syntax that turns a regular Python function into an API endpoint.
# '/live_data': This is the URL path. When the dashboard wants data, it will go to an address like http://127.0.0.1:5000/live_data.
# This decorator tells our server, "When someone visits this specific URL, run the function directly below it."
@app.route('/live_data')
def get_data():
    with data_lock:
        return jsonify(live_data)

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
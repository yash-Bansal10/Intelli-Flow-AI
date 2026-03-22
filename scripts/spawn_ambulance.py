# scripts/spawn_ambulance.py
import requests
import xml.etree.ElementTree as ET
import os

API_URL = "http://127.0.0.1:5000"

def get_verified_route(map_name):
    # Read the physical map XML to extract a mathematically verified driving route
    base_dir = os.path.join(os.path.dirname(__file__), "..", "ai_core", "simulations", map_name)
    rou_path = os.path.join(base_dir, f"{map_name}.rou.xml")
    net_path = os.path.join(base_dir, f"{map_name}.net.xml")
    
    if not os.path.exists(rou_path) or not os.path.exists(net_path):
        return None, None
        
    try:
        # 1. Grab a verified pre-calculated route cache from randomTrips
        tree = ET.parse(rou_path)
        for vehicle in tree.getroot().findall('vehicle'):
            route = vehicle.find('route')
            if route is not None:
                edges = route.attrib['edges'].split()
                if len(edges) > 10:
                    first_edge_id = edges[0]
                    last_edge_id = edges[-1]
                    
                    # 2. Map those verified topographical edges to their parent Junction IDs
                    net_tree = ET.parse(net_path)
                    start_j = None
                    end_j = None
                    for e in net_tree.getroot().findall('edge'):
                        if e.attrib.get('id') == first_edge_id:
                            start_j = e.attrib.get('from')
                        elif e.attrib.get('id') == last_edge_id:
                            end_j = e.attrib.get('to')
                            
                    if start_j and end_j:
                        return start_j, end_j
    except Exception as e:
        print(f"Failed to read map XML: {e}")
    return None, None

def spawn_ambulance():
    print("🚑 Reading the Connaught Place Topography to allocate safe spawn nodes...")
    
    # Check the map to legally allocate the source and destination junctions
    start_j, end_j = get_verified_route("connaught_place")
    
    if not start_j or not end_j:
        print("❌ Failed to parse XML map data to assign a safe valid route.")
        return
        
    print(f"📍 Guaranteed XML Route Allocated: {start_j} -> {end_j}")
    
    # 1. Fetch JWT Demo Token
    try:
        res = requests.get(f"{API_URL}/get_token")
        token = res.json().get("token")
        print(f"✅ JWT Authenticated.")
    except Exception as e:
        print(f"❌ Failed to authenticate: {e}")
        return

    # 2. Trigger Director-Level Spawn API
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "start_junction": start_j,
        "end_junction": end_j
    }
    
    try:
        res = requests.post(f"{API_URL}/spawn_ambulance_by_junction", json=payload, headers=headers)
        if res.status_code == 200:
            print("\n🚀 AMBULANCE INJECTED INTO SIMULATION!")
            print("🔴 Watch the GUI! The camera will lock on and junctions will flash red.")
            print("🔄 Overrides will release automatically as it passes each traffic light.")
        else:
            print(f"❌ Failed: {res.text}")
    except Exception as e:
        print(f"❌ Failed to spawn vehicle: {e}")

if __name__ == "__main__":
    spawn_ambulance()

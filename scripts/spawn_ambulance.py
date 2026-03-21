# scripts/spawn_ambulance.py
import requests

API_URL = "http://127.0.0.1:5000"

def spawn_ambulance():
    print("🚑 Requesting dynamic Green Corridor from A0 to D3 from Central Server...")
    
    # 1. Fetch JWT Demo Token
    try:
        res = requests.get(f"{API_URL}/get_token")
        token = res.json().get("token")
        print(f"✅ JWT Authenticated.")
    except Exception as e:
        print(f"❌ Failed to reach API (Is train.py running?): {e}")
        return

    # 2. Trigger Director-Level Spawn API
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "start_junction": "A0",
        "end_junction": "D3"
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

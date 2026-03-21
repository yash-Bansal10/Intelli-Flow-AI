import requests
import time
import sys

def trigger_evp(jid, direction, active=True):
    url = "http://127.0.0.1:5000/emergency_trigger"
    payload = {
        "junction_id": jid,
        "direction": direction,
        "active": active
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Sent EVP { 'ACTIVATE' if active else 'CLEAR' } for {jid} ({direction})")
        print("Response:", response.json())
    except Exception as e:
        print("Error connecting to API server. Is train.py running?")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_evp.py [on|off] [jid] [direction]")
        print("Example: python test_evp.py on B2 NS")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    jid = sys.argv[2] if len(sys.argv) > 2 else "B2"
    direction = sys.argv[3] if len(sys.argv) > 3 else "NS"

    trigger_evp(jid, direction, active=(cmd == "on"))

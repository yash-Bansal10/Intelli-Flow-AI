import requests
import json
import time
from security.hmac_signer import sign_payload

# The API Server address
SERVER_URL = "http://127.0.0.1:5000"

def get_demo_token():
    """Fetches a high-privilege JWT token for the demo."""
    print("🔑 Authenticating with Command Center...")
    try:
        response = requests.get(f"{SERVER_URL}/get_token")
        if response.status_code == 200:
            token = response.json()["token"]
            print(f"✅ JWT Obtained: {token[:15]}...{token[-15:]}\n")
            return token
        else:
            print("❌ Failed to get JWT token.")
            return None
    except Exception as e:
        print(f"❌ Server offline: {e}")
        return None

def trigger_watchdog_crash(token, jid):
    """Simulates an Edge Compute node failure."""
    print(f"💥 Injecting Fatal Error into Edge Node {jid}...")
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    payload = {"junction_id": jid}
    
    response = requests.post(f"{SERVER_URL}/simulate_crash", headers=headers, json=payload)
    if response.status_code == 200:
        print(f"✅ SUCCESS: {response.json()['message']}\n")
    else:
        print(f"❌ FAILED: {response.text}\n")

def test_v2x_spoofing(token):
    """Demonstrates exactly how HMAC-SHA256 stops spoofed pressure vectors."""
    print("🛡️ --- CYBERSECURITY V2X DEMO --- 🛡️")

    
    # Let's say a malicious actor tries to inject a massive fake queue 
    # to force Junction A0 to stay green for them.
    malicious_payload = {
        "sender": "MALICIOUS_NODE_X",
        "pressure_vector": [999.0, 999.0, 0.0, 0.0] 
    }
    
    # 1. First, they try sending it without signing it at all
    print("\n[SCENARIO 1] Hacker sends raw malicious payload without signature to A0...")
    time.sleep(1)
    
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    res = requests.post(f"{SERVER_URL}/inject_v2x_payload", 
                        headers=headers, 
                        json={"target_junction": "A0", "packet": {"payload": malicious_payload}})
    print(f"🚨 BLOCKED: {res.json().get('error', res.text)}")
        
    # 2. Next, the Hacker signs it, but using the wrong secret key
    print("\n[SCENARIO 2] Hacker signs payload with compromised/wrong secret key...")
    import hmac, hashlib
    wrong_secret = b"hacker_key_123"
    message = json.dumps(malicious_payload, sort_keys=True).encode('utf-8')
    bad_signature = hmac.new(wrong_secret, message, hashlib.sha256).hexdigest()
    
    forged_packet = {
        "payload": malicious_payload,
        "signature": bad_signature
    }
    
    time.sleep(1)
    res2 = requests.post(f"{SERVER_URL}/inject_v2x_payload", 
                        headers=headers, 
                        json={"target_junction": "A0", "packet": forged_packet})
    print(f"🚨 BLOCKED: {res2.json().get('error', res2.text)}")


    # 3. Legitimate Agent sends a signed vector
    print("\n[SCENARIO 3] Legitimate Intelli-Flow Agent A1 shares vector...")
    legit_payload = {
        "sender": "A1",
        "pressure_vector": [12.5, 4.0, 1.2, 0.0]
    }
    valid_packet = sign_payload(legit_payload)
    
    time.sleep(1)
    res3 = requests.post(f"{SERVER_URL}/inject_v2x_payload", 
                        headers=headers, 
                        json={"target_junction": "A0", "packet": valid_packet})
    if res3.status_code == 200:
        print(f"✅ ALLOWED. {res3.json().get('message')}")
    else:
        print(f"🚨 BLOCKED: {res3.text}")

def run_hackathon_demo():
    print(r"""
     _____       _       _ _ _         _____ _               
    |_   _|     | |     | | (_)       |  ___| |              
      | |  _ __ | |_ ___| | |_ ______ | |__ | | _____      __
      | | | '_ \| __/ _ \ | | |______||  __|| |/ _ \ \ /\ / /
     _| |_| | | | ||  __/ | | |       | |   | | (_) \ V  V / 
    |_____|_| |_|\__\___|_|_|_|       \_|   |_|\___/ \_/\_/  
    """)
    print("--- Edge Security & Penetration Testing Tool ---\n")
    
    token = get_demo_token()
    if token:
        # Simulate crashing agent B2
        trigger_watchdog_crash(token, "B2")
        print("👀 Look at the SUMO GUI! Junction B2 should be flashing ORANGE (Fail-Safe Mode).")
        time.sleep(5)
        
        # Recover agent B2
        print("🔧 Attempting remote recovery...")
        headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
        res = requests.post(f"{SERVER_URL}/recover_agent", headers=headers, json={"junction_id": "B2"})
        print(f"✅ {res.json().get('message', 'Recovered')}\n")
        
        # Run the V2X specific spoofing demo
        print("👀 Look at Junction A0 in the SUMO GUI! It will flash PURPLE when it detects the hack.")
        test_v2x_spoofing(token)
    
    print("\n🏁 Demo complete. Returning to secure state.")

if __name__ == "__main__":
    run_hackathon_demo()

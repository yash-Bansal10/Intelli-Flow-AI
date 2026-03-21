import hmac
import hashlib
import json
import os

# For demonstration purposes, we use a static secret key. 
# In production, this would be an environment variable.
SECRET_KEY = os.getenv("V2X_HMAC_SECRET", "intelliflow_super_secret_key_2026").encode('utf-8')

def sign_payload(payload_dict):
    """
    Takes a dictionary (e.g., pressure vector), serializes it, 
    and returns a signature and the original payload.
    """
    message = json.dumps(payload_dict, sort_keys=True).encode('utf-8')
    signature = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()
    return {
        "payload": payload_dict,
        "signature": signature
    }

def verify_signature(signed_message):
    """
    Verifies that the payload was actually sent by an authorized Intelli-Flow agent.
    Returns the payload if valid, otherwise raises ValueError.
    """
    payload_dict = signed_message.get("payload")
    provided_signature = signed_message.get("signature")
    
    if not payload_dict or not provided_signature:
        raise ValueError("Malformed message: missing payload or signature.")
        
    message = json.dumps(payload_dict, sort_keys=True).encode('utf-8')
    expected_signature = hmac.new(SECRET_KEY, message, hashlib.sha256).hexdigest()
    
    if not hmac.compare_digest(expected_signature, provided_signature):
        raise ValueError("SECURITY ALERT: Invalid HMAC signature. Interception or spoofing detected!")
        
    return payload_dict

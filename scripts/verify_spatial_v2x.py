import sys
import os
import traci

# Ensure ai_core is in the path
script_dir = os.path.dirname(os.path.abspath(__file__))
ai_core_dir = os.path.join(script_dir, "..", "ai_core")
if ai_core_dir not in sys.path:
    sys.path.insert(0, ai_core_dir)

from traffic_env import TrafficEnv

print("Initializing TrafficEnv (This will launch SUMO in the background)...")
env = TrafficEnv()

print("\n" + "="*50)
print("🌐 SPATIAL NEIGHBOR DISCOVERY VERIFICATION 🌐")
print("="*50)

# Print the discovered map for ALL junctions
for jid in env.junction_ids:
    print(f"\nJunction [{jid}] neighbors:")
    neighbors = env.neighbors[jid]
    # Display N, S, E, W
    print(f"  North : {neighbors['N']}")
    print(f"  South : {neighbors['S']}")
    print(f"  East  : {neighbors['E']}")
    print(f"  West  : {neighbors['W']}")
    
print("\n" + "="*50)
print("✅ Verification Complete. Close SUMO-GUI to end.")

env.close()

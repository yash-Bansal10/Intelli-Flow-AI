
import traci
import sys
import os
import time

# Add ai_core to path
sys.path.append(os.path.join(os.getcwd(), 'ai_core'))
from traffic_env import TrafficEnv, PCU_MAP

def debug_pcu():
    print("--- PCU Weighting Debugger (Injection Test) ---")
    env = TrafficEnv()
    
    try:
        # 1. Define custom vTypes
        try:
            traci.vehicletype.copy("DEFAULT_VEHTYPE", "city_bus")
            traci.vehicletype.setLength("city_bus", 12.0)
            traci.vehicletype.copy("DEFAULT_VEHTYPE", "royal_enfield")
            traci.vehicletype.setLength("royal_enfield", 2.0)
            traci.vehicletype.copy("DEFAULT_VEHTYPE", "bajaj_auto")
            traci.vehicletype.setLength("bajaj_auto", 3.0)
        except traci.exceptions.TraCIException:
            pass

        # 2. Pick a testing lane (e.g., first lane of A0)
        test_lane = env.junction_lanes[env.junction_ids[0]]["incoming"][0]
        test_route = traci.route.getIDList()[0]
        
        # Inject vehicles
        v_specs = [
            ("test_bus", "city_bus"),
            ("test_bike_1", "royal_enfield"),
            ("test_bike_2", "royal_enfield"),
            ("test_auto", "bajaj_auto")
        ]
        
        for vid, vtype in v_specs:
            traci.vehicle.add(vid, test_route, typeID=vtype)
            # Move them directly to the test lane to avoid routing issues
            traci.vehicle.moveTo(vid, test_lane, 10.0)

        # Give them some steps to settle
        for step in range(10):
            env.step({})
            
            # Force them to halt
            for vid, _ in v_specs:
                try: traci.vehicle.setSpeed(vid, 0.0)
                except: pass

            pcu_pressure = env.get_lane_pcu_pressure(test_lane)
            print(f"Step {step} | Lane {test_lane} PCU: {pcu_pressure:.1f}")
            
            # Breakdown
            vids = traci.lane.getLastStepVehicleIDs(test_lane)
            found_test_vids = [v for v in vids if "test_" in v]
            
            if found_test_vids:
                print(f"  Detected Test Vehicles: {found_test_vids}")
                # We expect 3.7 (Bus) + 0.8*2 (Bikes) + 2.0 (Auto) = 7.3
                # Plus whatever other vehicles were already there (each 1.0)
                baseline = sum(1.0 for v in vids if "test_" not in v)
                expected = 7.3 + baseline
                
                if abs(pcu_pressure - expected) < 0.1:
                    print(f"\n✅ PCU VERIFICATION SUCCESSFUL!")
                    print(f"  Sum(Bus=3.7, Bike=0.8, Auto=2.0) + baseline({baseline}) = {expected:.1f}")
                    return
                    
    finally:
        env.close()

if __name__ == "__main__":
    debug_pcu()

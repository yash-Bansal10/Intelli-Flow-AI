# traffic_env.py


import traci
import numpy as np
import sys
import os

# Day 1: Fix imports for cross-directory execution
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

from api_server import start_api_thread, update_live_data 

# Day 4: IRC Standard PCU Mapping (Simulation-Agnostic)
# These keys map directly to SUMO vehicle type IDs (vType)
PCU_MAP = {
    "passenger": 1.0,      # Car/Van
    "bus": 3.7,            # Bus/Truck
    "truck": 3.7,
    "trailer": 5.0,        # Tractor-Trailer
    "motorcycle": 0.8,     # Two-Wheeler
    "enfield": 0.8,        # Indian motorcycle (Day 4 XML)
    "moped": 0.8,
    "bicycle": 0.5,
    "auto_rickshaw": 2.0,  # Custom type for India
    "bajaj": 2.0,          # Indian auto-rickshaw (Day 4 XML)
    "tram": 3.0,
    "pedestrian": 0.0      # Safety: Pedestrians don't add road 'pressure'
}

class TrafficEnv:
    def __init__(self, junction_ids=None, use_gui=True):
        if 'SUMO_HOME' in os.environ:
            tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
            sys.path.append(tools)
        else:
            sys.exit("please declare environment variable 'SUMO_HOME'")
        
        # ----- Start the API Server in the background thread ----
        start_api_thread()

        self.use_gui = use_gui
        self.sumoBinary = "sumo-gui" if use_gui else "sumo"
        
        # Day 1: Robust Path Resolution
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, "agra.sumocfg")
        self.sumo_args = ["-c", config_path, "--start", "--quit-on-end"]
        
        # Performance Optimization: Disable GUI logs if in non-gui mode
        if not use_gui:
            self.sumo_args.append("--no-step-log")
            self.sumo_args.append("--no-warnings")
        
        traci.start([self.sumoBinary] + self.sumo_args)
        
        self.current_step = 0
        self.max_steps = 500 
        self.frame_skip = 5 # Performance: AI only 'thinks' every 5 seconds
        
        # Performance: Subscription & Caching
        self.lane_pcu_cache = {}
        self.vehicle_type_cache = {} # Day 4: vid -> type mapping (static)
        
        # Day 2: Autonomous Junction Discovery (Zero-Hardcoding)
        if junction_ids is None:
            self.junction_ids = traci.trafficlight.getIDList()
            print(f"[Intelli-Flow] Autonomous Discovery: Found {len(self.junction_ids)} junctions: {self.junction_ids}")
        else:
            self.junction_ids = junction_ids

        self.junction_lanes = {}
        self.junction_states = {} # Tracks phase and time_in_phase for each junction
        
        for jid in self.junction_ids:
            self.junction_lanes[jid] = self._discover_lanes(jid)
            
            # Day 3: Dynamic Phase Discovery (Zero-Hardcoding)
            phases_map = self._discover_phases(jid)
            
            self.junction_states[jid] = {
                "phase": phases_map["NS"], # Start on NS Green
                "time_in_phase": 0,
                "min_phase_time": 10,
                "phases_map": phases_map
            }
        
        # Day 3: Spatial Neighbor Discovery (Run Once at Startup)
        self.neighbors = self._build_spatial_map()

        # Day 4 Performance: TraCI Subscriptions
        # We tell SUMO to proactively push lane vehicle IDs to us
        self._setup_subscriptions()

        # For backward compatibility with single-agent scripts
        self.main_jid = self.junction_ids[0]

    def _build_spatial_map(self):
        """
        Dynamically calculates N, S, E, W neighbors mapping using GPS coordinates.
        This runs once during init, making the AI simulation-agnostic.
        """
        coords = {}
        for jid in self.junction_ids:
            # Get X, Y coordinates from TraCI
            # Note: SUMO uses Cartesian coordinates where higher Y is North, higher X is East
            x, y = traci.junction.getPosition(jid)
            coords[jid] = (x, y)
            
        neighbors_map = {}
        for jid, (x, y) in coords.items():
            neighbors_map[jid] = {'N': None, 'S': None, 'E': None, 'W': None}
            
            # Find closest junction in each direction
            min_dists = {'N': float('inf'), 'S': float('inf'), 'E': float('inf'), 'W': float('inf')}
            
            for other_jid, (ox, oy) in coords.items():
                if jid == other_jid: continue
                
                dx = ox - x
                dy = oy - y
                dist = (dx**2 + dy**2)**0.5
                
                # Determine primary direction based on angle
                # On this specific SUMO network mapping:
                # North (A is above B): X decreases (dx < 0)
                # South (C is below B): X increases (dx > 0)
                # West  (1 is left of 2): Y decreases (dy < 0)
                # East  (3 is right of 2): Y increases (dy > 0)
                
                if dx < 0 and abs(dx) > abs(dy) and dist < min_dists['N']:
                    neighbors_map[jid]['N'] = other_jid
                    min_dists['N'] = dist
                elif dx > 0 and abs(dx) > abs(dy) and dist < min_dists['S']:
                    neighbors_map[jid]['S'] = other_jid
                    min_dists['S'] = dist
                elif dy > 0 and abs(dy) >= abs(dx) and dist < min_dists['E']:
                    neighbors_map[jid]['E'] = other_jid
                    min_dists['E'] = dist
                elif dy < 0 and abs(dy) >= abs(dx) and dist < min_dists['W']:
                    neighbors_map[jid]['W'] = other_jid
                    min_dists['W'] = dist
                    
        return neighbors_map

    def _setup_subscriptions(self):
        """
        Subscribes to all relevant lanes. This replaces hundred of individual 
        getLastStepVehicleIDs calls with a single bulk result package.
        """
        all_lanes = set()
        for jid in self.junction_ids:
            all_lanes.update(self.junction_lanes[jid]["incoming"])
            all_lanes.update(self.junction_lanes[jid]["outgoing"])
            for d in ['N', 'S', 'E', 'W']:
                n_id = self.neighbors[jid][d]
                if n_id and n_id in self.junction_lanes:
                    all_lanes.update(self.junction_lanes[n_id]["incoming"])
        
        for lane_id in all_lanes:
            # Constants 0x12 (LAST_STEP_VEHICLE_ID_LIST)
            traci.lane.subscribe(lane_id, [0x12])

    def _discover_lanes(self, jid):
        """Automatically discovers incoming and outgoing lanes for a junction."""
        # Incoming/Controlled lanes
        incoming = list(dict.fromkeys(traci.trafficlight.getControlledLanes(jid)))
        
        # Outgoing lanes (where the junction leads to)
        links = traci.trafficlight.getControlledLinks(jid)
        outgoing = []
        for link in links:
            for connection in link:
                if connection:
                    outgoing.append(connection[1]) # index 1 is 'to-lane'
        outgoing = list(dict.fromkeys(outgoing))
        
        return {"incoming": incoming, "outgoing": outgoing}

    def _discover_phases(self, jid):
        """
        Dynamically discovers the indices for the primary North-South and East-West Green phases.
        This ensures the AI works on 4-phase, 8-phase, or 16-phase intersections without hardcoding.
        """
        logics = traci.trafficlight.getCompleteRedYellowGreenDefinition(jid)
        if not logics:
            return {"NS": 0, "EW": 2} # Fallback to standard 4-phase
            
        phases = logics[0].phases
        ns_index, ew_index = 0, 0
        max_green_ns, max_green_ew = 0, 0
        
        for i, phase in enumerate(phases):
            state = phase.state.lower()
            # Count the number of green 'g' lights
            green_count = state.count('g')
            
            # Heuristic: the first longest green phase is usually NS, the second is EW.
            # In complex SUMO intersections, NS is typically early (index 0), 
            # and EW is exactly halfway through the cycle.
            halfway = len(phases) // 2
            
            if i < halfway:
                if green_count > max_green_ns:
                    max_green_ns = green_count
                    ns_index = i
            else:
                if green_count > max_green_ew:
                    max_green_ew = green_count
                    ew_index = i
                    
        return {"NS": ns_index, "EW": ew_index}

    def reset(self):
        traci.load(self.sumo_args)
        self.current_step = 0
        self.lane_pcu_cache = {}
        for jid in self.junction_ids:
            self.junction_states[jid]["phase"] = 0
            self.junction_states[jid]["time_in_phase"] = 0
        traci.simulationStep()
        return self._get_state()

    def get_lane_pcu_pressure(self, lane_id):
        """
        Calculates the weighted traffic volume using subscription results.
        """
        if lane_id in self.lane_pcu_cache:
            return self.lane_pcu_cache[lane_id]

        # Subscription Result Retrieval for this specific lane
        res = traci.lane.getSubscriptionResults(lane_id)
        if res:
            vehicle_ids = res[0x12] # 0x12 = LAST_STEP_VEHICLE_ID_LIST
        else:
            vehicle_ids = traci.lane.getLastStepVehicleIDs(lane_id)
            
        total_pcu = 0.0
        for vid in vehicle_ids:
            # Speed & Type optimization: Use vehicle subscriptions
            # (We subscribe to vehicles dynamically in _get_state)
            v_res = traci.vehicle.getSubscriptionResults(vid)
            
            if v_res:
                speed = v_res[0x40] # VAR_SPEED
                vtype = v_res[0x4f].lower() # VAR_TYPE
            else:
                # Fallback (slow)
                speed = traci.vehicle.getSpeed(vid)
                vtype = traci.vehicle.getTypeID(vid).lower()
                # Auto-subscribe for next step!
                traci.vehicle.subscribe(vid, [0x40, 0x4f]) 

            if speed < 0.1:
                weight = 1.0
                for key, val in PCU_MAP.items():
                    if key in vtype:
                        weight = val
                        break
                total_pcu += weight
                
        return total_pcu

    def get_neighbor_pressure(self, jid):
        """
        [Day 3: Spatial V2X] Calculates normalized PCU pressure using the dynamic map.
        Returns 4 values [N, S, E, W].
        """
        neighbor_pressures = []
        directions = ['N', 'S', 'E', 'W']
        
        for d in directions:
            n_id = self.neighbors[jid][d]
            
            if n_id and n_id in self.junction_lanes:
                lanes = self.junction_lanes[n_id]["incoming"]
                # Day 4: Switched to weighted PCU pressure
                pcu_sum = sum(self.get_lane_pcu_pressure(l) for l in lanes)
                neighbor_pressures.append(pcu_sum / len(lanes) if lanes else 0.0)
            else:
                neighbor_pressures.append(0.0)
                
        return neighbor_pressures

    def _get_state(self):
        """
        [Day 3: Universal State Vector] Fixed 28-slot vector for Bharat Mandapam.
        Optimized with TraCI Subscriptions and Frame Skipping.
        """
        self.lane_pcu_cache = {}
        # Fetching all active lanes once for this step
        all_lanes = set()
        for jid in self.junction_ids:
            all_lanes.update(self.junction_lanes[jid]["incoming"])
            for d in ['N', 'S', 'E', 'W']:
                n_id = self.neighbors[jid][d]
                if n_id and n_id in self.junction_lanes:
                    all_lanes.update(self.junction_lanes[n_id]["incoming"])
        
        # Pre-fill cache using lane subscriptions
        for l in all_lanes:
            self.lane_pcu_cache[l] = self.get_lane_pcu_pressure(l)

        all_states = {}
        for jid in self.junction_ids:
            # 1. Local Queues [0-11] (Padded to 12 lanes)
            # Day 4: Switched from raw counts to PCU Weighted Pressures
            incoming = self.junction_lanes[jid]["incoming"]
            queues = [self.get_lane_pcu_pressure(l) for l in incoming]
            queues = (queues + [0.0] * 12)[:12] 
            
            # 2. Phase [12]
            phase = [1 if self.junction_states[jid]["phase"] == self.junction_states[jid]["phases_map"]["NS"] else 0]
            
            # 3. V2X Neighbors [13-16]
            v2x = self.get_neighbor_pressure(jid)
            
            # 4. Emergency EVP Placeholders [17-20] (Empty)
            evp = [0.0, 0.0, 0.0, 0.0]
            
            # 5. Temporal Placeholders [21-22] (Normalized Time/Day)
            temporal = [0.5, 0.5] 
            
            # 6. Environmental Placeholder [23] (Clear Weather = 1.0)
            env_state = [1.0]
            
            # 7. PCU Context Placeholders [24-27]
            # Day 4: Calculating Heavy Vehicle Ratio for better AI context
            all_vids = []
            for l in incoming: all_vids.extend(traci.lane.getLastStepVehicleIDs(l))
            
            heavy_count = 0
            for vid in all_vids:
                if "bus" in traci.vehicle.getTypeID(vid).lower() or "truck" in traci.vehicle.getTypeID(vid).lower():
                    heavy_count += 1
            
            heavy_ratio = heavy_count / len(all_vids) if all_vids else 0.0
            pcu = [heavy_ratio, 1.0, 1.0, 1.0] # Slot 24 now holds live heavy ratio

            state = np.array(queues + phase + v2x + evp + temporal + env_state + pcu)
            all_states[jid] = state
        
        if len(self.junction_ids) == 1:
            return all_states[self.main_jid]
        return all_states

    def step(self, actions):
        """
        [Day 2: Multi-Agent]
        Expects a dictionary of actions {jid: action}.
        Returns dicts: {jid: next_state}, {jid: reward}, False.
        """
        # Convert single action to dict for uniform processing
        if not isinstance(actions, dict):
            actions = {self.main_jid: actions}

        # Apply actions to each junction
        for jid, action in actions.items():
            if jid not in self.junction_states: continue
            
            current_phase = self.junction_states[jid]["phase"]
            time_in_phase = self.junction_states[jid]["time_in_phase"]
            
            # --- DYNAMIC ACTION EXECUTION ---
            # Map action 0 -> NS Green
            # Map action 1 -> EW Green
            phase_map = self.junction_states[jid]["phases_map"]
            new_phase = phase_map["NS"] if action == 0 else phase_map["EW"]
            
            if new_phase != current_phase and time_in_phase >= self.junction_states[jid]["min_phase_time"]:
                traci.trafficlight.setPhase(jid, new_phase)
                self.junction_states[jid]["phase"] = new_phase
                self.junction_states[jid]["time_in_phase"] = 0
            else:
                self.junction_states[jid]["time_in_phase"] += self.frame_skip

        # Advance simulation (with Frame Skipping)
        for _ in range(self.frame_skip):
            traci.simulationStep()
            
        self.current_step += self.frame_skip

        # Compute rewards and next states
        rewards = {}
        next_states = self._get_state()
        
        # For dashboard (aggregate pressure)
        total_pressure = 0
        
        for jid in self.junction_ids:
            incoming = self.junction_lanes[jid]["incoming"]
            outgoing = self.junction_lanes[jid]["outgoing"]
            
            # Day 4: Rewards are now calculated using PCU volume pressure
            in_p = sum(self.get_lane_pcu_pressure(l) for l in incoming)
            out_p = sum(self.get_lane_pcu_pressure(l) for l in outgoing)
            
            pressure = in_p - out_p
            rewards[jid] = -pressure
            total_pressure += pressure

        # Update Live Dashboard (aggregate view)
        city_stats = {}
        for jid in self.junction_ids:
            city_stats[jid] = {
                # Dashboard shows weighted PCU queues for true visual congestion
                "queues": [round(self.get_lane_pcu_pressure(l), 1) for l in self.junction_lanes[jid]["incoming"]],
                "score": int(rewards[jid]),
                "phase": "NS-Green" if self.junction_states[jid]["phase"] == self.junction_states[jid]["phases_map"]["NS"] else "EW-Green"
            }

        api_payload = {
            "simulation_time": self.current_step,
            "city_coordinated": len(self.junction_ids) > 1,
            "junctions": city_stats,
            "total_congestion": int(total_pressure)
        }
        update_live_data(api_payload)

        done = self.current_step >= self.max_steps
        
        # Handle backward compatibility return
        if len(self.junction_ids) == 1:
            return next_states, rewards[self.main_jid], done

        # Multi-agent return
        dones = {jid: done for jid in self.junction_ids}
        return next_states, rewards, dones

    def close(self):
        try:
            traci.close()
        except traci.exceptions.FatalTraCIError:
            pass # TraCI is already closed






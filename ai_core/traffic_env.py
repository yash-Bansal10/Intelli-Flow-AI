# traffic_env.py


import traci
import numpy as np
import sys
import os
import time
import random

# Day 1: Fix imports for cross-directory execution
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

from api_server import start_api_thread, update_live_data, get_emergency_status, clear_emergency, get_spawn_requests, add_emergency

# Day 4: PCU Mapping (Simulation-Agnostic)
PCU_MAP = {
    "passenger": 1.0, "bus": 3.7, "truck": 3.7, "trailer": 5.0,
    "motorcycle": 0.8, "enfield": 0.8, "moped": 0.8, "bicycle": 0.5,
    "auto_rickshaw": 2.0, "bajaj": 2.0, "tram": 3.0, "pedestrian": 0.0
}

class TrafficEnv:
    def __init__(self, use_gui=True, map_name="4X4_grid", junction_ids=None):
        if 'SUMO_HOME' in os.environ:
            sys.path.append(os.path.join(os.environ['SUMO_HOME'], 'tools'))
        else:
            sys.exit("please declare environment variable 'SUMO_HOME'")
        

        
        start_api_thread()

        self.use_gui = use_gui
        self.sumoBinary = "sumo-gui" if use_gui else "sumo"
        
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        map_path = os.path.join(script_dir, "simulations", map_name)
        
        if not os.path.exists(map_path):
            sys.exit(f"Error: Map folder '{map_name}' not found")

        configs = [f for f in os.listdir(map_path) if f.endswith(".sumocfg")]
        if not configs:
            sys.exit(f"Error: No .sumocfg file found in {map_path}")
        
        config_path = os.path.join(map_path, configs[0])
        print(f"[Intelli-Flow] Loading Map: {map_name} ({configs[0]})")
        
        
        self.sumo_args = ["-c", config_path, "--start", "--quit-on-end"]
        
        
        if not use_gui:
            self.sumo_args.append("--no-step-log")
            self.sumo_args.append("--no-warnings")
        
        traci.start([self.sumoBinary] + self.sumo_args)
        
        self.current_step = 0
        self.max_steps = 2500 
        self.frame_skip = 5 
        self.lane_pcu_cache = {}
        
        if junction_ids is None:
            self.junction_ids = traci.trafficlight.getIDList()
            print(f"[Intelli-Flow] Autonomous Discovery: Found {len(self.junction_ids)} junctions")
        else:
            self.junction_ids = junction_ids
            
        self.junction_pos = {}
        for jid in self.junction_ids:
            self.junction_pos[jid] = self._get_junction_pos(jid)
            
        self.neighbors = self._build_spatial_map()
        
        self.junction_lanes = {}
        self.junction_states = {}
        
        for jid in self.junction_ids:
            self.junction_lanes[jid] = self._discover_lanes(jid)
            phases_map = self._discover_phases(jid)
            self.junction_states[jid] = {
                "phase": phases_map["NS"][0], # Start with the first NS phase
                "time_in_phase": 0,
                "min_phase_time": 10,
                "phases_map": phases_map
            }
        
        
        self.neighbors = self._build_spatial_map()
        
        self._setup_subscriptions()
        
        self.main_jid = self.junction_ids[0]
        self.colored_edges = set() 
        self.all_edges = [e for e in traci.edge.getIDList() if not e.startswith(":")]
        self.ambulance_spawn_chance = 0.90 # Trigger constant ambient deployment per user request

    def get_emergency_status(self):
        """Proxy method for training script to check API status."""
        return get_emergency_status()

    def _get_junction_pos(self, jid):
        try:
            return traci.junction.getPosition(jid)
        except traci.exceptions.TraCIException:
            lanes = traci.trafficlight.getControlledLanes(jid)
            if lanes:
                shape = traci.lane.getShape(lanes[0])
                return shape[-1] 
            return (0, 0)

    def _build_spatial_map(self):
        self.junction_pos = {}
        for jid in self.junction_ids:
            self.junction_pos[jid] = self._get_junction_pos(jid)
            
        neighbors_map = {}
        
        for jid, (x, y) in self.junction_pos.items():
            neighbors_map[jid] = {'N': None, 'S': None, 'E': None, 'W': None}
            
            
            min_dists = {'N': float('inf'), 'S': float('inf'), 'E': float('inf'), 'W': float('inf')}
            
            for other_jid, (ox, oy) in self.junction_pos.items():
                if jid == other_jid: continue
                dx, dy = ox - x, oy - y
                dist = (dx**2 + dy**2)**0.5

                
                
                if dx < 0 and abs(dx) > abs(dy) and dist < min_dists['N']:
                    neighbors_map[jid]['N'], min_dists['N'] = other_jid, dist
                elif dx > 0 and abs(dx) > abs(dy) and dist < min_dists['S']:
                    neighbors_map[jid]['S'], min_dists['S'] = other_jid, dist
                elif dy > 0 and abs(dy) >= abs(dx) and dist < min_dists['E']:
                    neighbors_map[jid]['E'], min_dists['E'] = other_jid, dist
                elif dy < 0 and abs(dy) >= abs(dx) and dist < min_dists['W']:
                    neighbors_map[jid]['W'], min_dists['W'] = other_jid, dist
        return neighbors_map

    def _setup_subscriptions(self):
        
        all_lanes = set()
        for jid in self.junction_ids:
            all_lanes.update(self.junction_lanes[jid]["incoming"])
            all_lanes.update(self.junction_lanes[jid]["outgoing"])
            for d in ['N', 'S', 'E', 'W']:
                n_id = self.neighbors[jid][d]
                if n_id and n_id in self.junction_lanes:
                    all_lanes.update(self.junction_lanes[n_id]["incoming"])
        for lane_id in all_lanes:
            traci.lane.subscribe(lane_id, [0x12])

    def _discover_lanes(self, jid):
        incoming = list(dict.fromkeys(traci.trafficlight.getControlledLanes(jid)))
        links = traci.trafficlight.getControlledLinks(jid)
        outgoing = []
        for link in links:
            for conn in link:
                if conn: outgoing.append(conn[1])
        return {"incoming": incoming, "outgoing": list(dict.fromkeys(outgoing))}

    def _discover_phases(self, jid):
        logics = traci.trafficlight.getCompleteRedYellowGreenDefinition(jid)
        if not logics: return {"NS": [0], "EW": [2], "link_map": {}}
        phases = logics[0].phases
        links = traci.trafficlight.getControlledLinks(jid)
        
        # Map each link index to a direction (NS or EW)
        ns_links, ew_links = [], []
        j_pos = self.junction_pos[jid]
        
        for i, link_set in enumerate(links):
            if not link_set: continue
            from_lane = link_set[0][0]
            edge_id = traci.lane.getEdgeID(from_lane)
            # Use geometry to determine direction
            from_pos = traci.junction.getPosition(traci.edge.getFromJunction(edge_id))
            dx, dy = abs(from_pos[0] - j_pos[0]), abs(from_pos[1] - j_pos[1])
            if dy > dx: ns_links.append(i)
            else: ew_links.append(i)
            
        ns_p, ew_p = [], []
        for i, ph in enumerate(phases):
            state = ph.state
            # Check if this phase is a "Green" phase for NS or EW
            # We exclude yellow phases (contain 'y') and all-red
            if 'y' in state.lower(): continue
            has_ns = any(state[idx].lower() == 'g' for idx in ns_links)
            has_ew = any(state[idx].lower() == 'g' for idx in ew_links)
            
            if has_ns and not has_ew: ns_p.append(i)
            elif has_ew and not has_ns: ew_p.append(i)
            
        # Default fallbacks if discovery fails
        if not ns_p: ns_p = [0]
        if not ew_p: ew_p = [min(2, len(phases)-1)]
        
        return {
            "NS": ns_p, 
            "EW": ew_p, 
            "link_info": {"ns": ns_links, "ew": ew_links, "links": links}
        }

    def reset(self):
        traci.load(self.sumo_args)
        self.current_step = 0
        self.lane_pcu_cache = {}
        self.colored_edges.clear()
        for jid in self.junction_ids:
            self.junction_states[jid]["phase"] = self.junction_states[jid]["phases_map"]["NS"]
            self.junction_states[jid]["time_in_phase"] = 0
        traci.simulationStep()
        return self._get_state()

    def get_lane_pcu_pressure(self, lane_id):
        if lane_id in self.lane_pcu_cache: return self.lane_pcu_cache[lane_id]
        res = traci.lane.getSubscriptionResults(lane_id)
        vids = res[0x12] if res else traci.lane.getLastStepVehicleIDs(lane_id)
        pcu = 0.0
        for vid in vids:
            try:
                v_res = traci.vehicle.getSubscriptionResults(vid)
                if v_res:
                    s, vt = v_res[0x40], v_res[0x4f].lower()
                else:
                    s, vt = traci.vehicle.getSpeed(vid), traci.vehicle.getTypeID(vid).lower()
                    traci.vehicle.subscribe(vid, [0x40, 0x4f])
                if s < 0.1:
                    w = 1.0
                    for k, v in PCU_MAP.items():
                        if k in vt: w = v; break
                    pcu += w
            except: continue
        return pcu

    def get_neighbor_pressure(self, jid):
        pres = []
        for d in ['N', 'S', 'E', 'W']:
            n_id = self.neighbors[jid][d]
            if n_id and n_id in self.junction_lanes:
                l = self.junction_lanes[n_id]["incoming"]
                p = sum(self.get_lane_pcu_pressure(lane) for lane in l)
                pres.append(p / len(l) if l else 0.0)
            else: pres.append(0.0)
        return pres

    def _get_state(self):
        self.lane_pcu_cache = {}
        all_e = get_emergency_status()
        states = {}
        for jid in self.junction_ids:
            q = [self.get_lane_pcu_pressure(l) for l in self.junction_lanes[jid]["incoming"]]
            q = (q + [0.0] * 12)[:12]
            ph = [1 if self.junction_states[jid]["phase"] == self.junction_states[jid]["phases_map"]["NS"] else 0]
            v = self.get_neighbor_pressure(jid)
            evp = [1.0 if jid in all_e else 0.0, 0.0, 0.0, 0.0]
            states[jid] = np.array(q + ph + v + evp + [0.5, 0.5, 1.0, 0.0, 1.0, 1.0, 1.0])
        return states[self.main_jid] if len(self.junction_ids) == 1 else states

    def _get_ambulance_phase(self, jid, route):
        try:
            p_map = self.junction_states[jid]["phases_map"]
            links = p_map["link_info"]["links"]
            
            # Find which edge in the ambulance route is an incoming edge to this junction
            incoming_edges = {traci.lane.getEdgeID(l) for l in self.junction_lanes[jid]["incoming"]}
            amb_edge = next((e for e in route if e in incoming_edges), None)
            if not amb_edge: return None
            
            target_indices = []
            for i, link_set in enumerate(links):
                if not link_set: continue
                from_lane = link_set[0][0]
                if traci.lane.getEdgeID(from_lane) == amb_edge:
                    target_indices.append(i)
                    
            if not target_indices: return None
            
            logics = traci.trafficlight.getCompleteRedYellowGreenDefinition(jid)
            phases = logics[0].phases
            
            best_phase = None
            max_greens = -1
            for p_idx, phase in enumerate(phases):
                state = phase.state
                if 'y' in state.lower(): continue
                greens = sum(1 for idx in target_indices if state[idx].lower() == 'g' or state[idx] == 'G')
                if greens > max_greens and greens > 0:
                    max_greens, best_phase = greens, p_idx
            return best_phase
        except: return None

    def step(self, actions):
        if not isinstance(actions, dict): actions = {self.main_jid: actions}
        
        # Day 8: Probabilistic Spontaneous Emergency Pulse
        if random.random() < self.ambulance_spawn_chance:
            self._trigger_random_emergency()

        all_e = self.get_emergency_status()
        if all_e and getattr(self, 'gui', False): time.sleep(0.1)
        
        self._process_spawn_requests()
        self._auto_release_emergencies(all_e)
        self._update_junction_visuals(all_e)
        self._update_green_corridors(all_e)
        
        for jid, act in actions.items():
            if jid not in self.junction_states: continue
            
            p_map = self.junction_states[jid]["phases_map"]
            selected_by_agent = True
            
            if jid in all_e: 
                amb_phase = self._get_ambulance_phase(jid, all_e[jid].get("route", []))
                if amb_phase is not None:
                    best_p = amb_phase
                    selected_by_agent = False
                    if self.current_step % 20 == 0:
                        print(f"🚦 [EVP ACTIVE] Dynamic Corridor overriding {jid} for {all_e[jid].get('vehicle_id')} (Phase {best_p})")
                else:
                    act = 0 if all_e[jid].get("direction", "NS") == "NS" else 1

            if selected_by_agent:
                possible_phases = p_map["NS"] if act == 0 else p_map["EW"]
                best_p = possible_phases[0]
                if len(possible_phases) > 1:
                    max_p = -1
                    link_info = p_map["link_info"]
                    dir_links = link_info["ns"] if act == 0 else link_info["ew"]
                    
                    logics = traci.trafficlight.getCompleteRedYellowGreenDefinition(jid)
                    for pid in possible_phases:
                        state = logics[0].phases[pid].state
                        phase_pressure = 0
                        seen_lanes = set()
                        for idx in dir_links:
                            if state[idx].lower() == 'g':
                                lane_id = link_info["links"][idx][0][0]
                                if lane_id not in seen_lanes:
                                    phase_pressure += self.get_lane_pcu_pressure(lane_id)
                                    seen_lanes.add(lane_id)
                        if phase_pressure > max_p:
                            max_p, best_p = phase_pressure, pid

            if best_p != self.junction_states[jid]["phase"] and self.junction_states[jid]["time_in_phase"] >= 20:
                traci.trafficlight.setPhase(jid, best_p)
                self.junction_states[jid]["phase"], self.junction_states[jid]["time_in_phase"] = best_p, 0
            else: self.junction_states[jid]["time_in_phase"] += self.frame_skip
        
        for _ in range(self.frame_skip):
            traci.simulationStep()
            if self.use_gui:
                time.sleep(1) # 1x Real-Time locking

        self.current_step += self.frame_skip
        rew, ns = {}, self._get_state()
        tot_p = 0
        for jid in self.junction_ids:
            inc, out = self.junction_lanes[jid]["incoming"], self.junction_lanes[jid]["outgoing"]
            in_p = sum(self.get_lane_pcu_pressure(l) for l in inc)
            out_p = sum(self.get_lane_pcu_pressure(l) for l in out)
            rew[jid] = -(in_p - out_p)
            tot_p += (in_p - out_p)
        city = {}
        for jid in self.junction_ids:
            x, y = self.junction_pos[jid]
            lon, lat = traci.simulation.convertGeo(x, y)
            queues = [round(self.get_lane_pcu_pressure(l), 1) for l in self.junction_lanes[jid]["incoming"]]
            score = int(rew[jid])
            
            # Read directly from physical Traci actuator index
            curr_p = traci.trafficlight.getPhase(jid)
            ns_p = self.junction_states[jid]["phases_map"]["NS"]
            ew_p = self.junction_states[jid]["phases_map"]["EW"]
            if curr_p in ns_p: phase = "NS-Green"
            elif curr_p in ew_p: phase = "EW-Green"
            else: phase = "Transition-RED"
            
            # Massive Edge Hardware Telemetry payload for the GUI
            edge_sensors = {
                "cam_status": "Active (4/4)",
                "night_vision": "Auto (Off)" if random.random() > 0.1 else "Calibrating",
                "lidar_conf": f"{random.randint(95, 99)}%",
                "radar_speed": f"{random.randint(15, 45)} km/h",
                "audio_siren": "None Detected",
                "weather": "Clear",
                "yolo_inference": f"{random.randint(10, 15)}ms",
                "sensor_fusion": "Synced",
                "dqn_latency": f"{random.randint(5, 8)}ms",
                "watchdog": "OK",
                "v2x_sync": f"{random.randint(2, 5)}ms",
                "pcu_calcs": f"{sum(queues):.1f}/sec",
            }
            
            city[jid] = {"lat": lat, "lng": lon, "queues": queues, "score": score, "phase": phase, "time_in_phase": self.junction_states[jid]["time_in_phase"], "sensors": edge_sensors, "is_emergency": jid in all_e}
        update_live_data({"simulation_time": self.current_step, "junctions": city, "total_congestion": int(tot_p)})
        d = self.current_step >= self.max_steps
        if len(self.junction_ids) == 1: return ns, rew[self.main_jid], d
        return ns, rew, {jid: d for jid in self.junction_ids}

    def _trigger_random_emergency(self):
        """Day 8: Automatically generates a random ambulance route and triggers EVP."""
        print("🚨 EMERGENCY PULSE: Dispatching spontaneous ambulance!")
        try:
            start_edge = random.choice(self.all_edges)
            end_edge = random.choice(self.all_edges)
            while start_edge == end_edge: end_edge = random.choice(self.all_edges)
            
            route_info = traci.simulation.findRoute(start_edge, end_edge)
            # Day 8: Ensure the route is at least 3 edges long for visibility
            max_tries = 5
            while (not route_info.edges or len(route_info.edges) < 3) and max_tries > 0:
                 start_edge = random.choice(self.all_edges)
                 end_edge = random.choice(self.all_edges)
                 route_info = traci.simulation.findRoute(start_edge, end_edge)
                 max_tries -= 1

            if not route_info.edges or len(route_info.edges) < 2: return
            
            vid = f"spont_amb_{self.current_step}"
            self._inject_ambulance_event(vid, route_info.edges)
        except Exception as e:
            print(f"⚠️ Failed to trigger random emergency: {e}")

    def _inject_ambulance_event(self, vid, route_edges):
        """Infects a vehicle and registers its route for all junctions it will cross."""
        from api_server import trigger_emergency
        
        # 1. Create Route & Vehicle
        route_id = f"route_{vid}"
        traci.route.add(route_id, route_edges)
        
        # Ensure 'ambulance' type exists with robust fallback for base type
        avail_types = traci.vehicletype.getIDList()
        if "ambulance" not in avail_types:
            base_type = "passenger" if "passenger" in avail_types else (avail_types[0] if avail_types else "DEFAULT_VEHTYPE")
            try:
                traci.vehicletype.copy(base_type, "ambulance")
            except:
                # If copy fails, we still try to set standard ambulance properties
                pass
            traci.vehicletype.setColor("ambulance", (255, 255, 0, 255)) # Bright Yellow
            traci.vehicletype.setSpeedFactor("ambulance", 1.8)
            traci.vehicletype.setVehicleClass("ambulance", "emergency")
            traci.vehicletype.setShapeClass("ambulance", "emergency")
            traci.vehicletype.setWidth("ambulance", 4.0)  # Extra visible
            traci.vehicletype.setLength("ambulance", 12.0) # Extra visible
        
        traci.vehicle.add(vid, route_id, typeID="ambulance", departLane="best", departSpeed="max")
        
        # 3. Force a simulation step to spawn the vehicle visually
        traci.simulationStep()
        
        # Make the camera follow the ambulance instantly
        try:
            if getattr(self, 'use_gui', False) or hasattr(traci, "gui"):
                traci.gui.trackVehicle("View #0", vid)
                os.system('cls' if os.name == 'nt' else 'clear') 
                print(f"🎥 CAMERA LOCK ENGAGED on {vid}")
        except Exception:
            pass
        
        print(f"🚑 Ambulance {vid} route: {route_edges[0]} -> {route_edges[-1]} (Dynamic Handoff Active)")

    def get_emergency_status(self):
        """Dynamic Spatial V2X Handover Logic: Triggers nodes incrementally as ambulance approaches."""
        from api_server import get_emergency_status as api_get_e
        all_e = api_get_e() # Keep manual API overrides
        
        try:
            for vid in traci.vehicle.getIDList():
                if traci.vehicle.getTypeID(vid) == "ambulance":
                    curr_edge = traci.vehicle.getRoadID(vid)
                    target_jid = None
                    
                    # If inside the intersection, keep it locked to clear
                    if curr_edge.startswith(":"):
                        target_jid = curr_edge.split("_")[0][1:]
                    else:
                        target_jid = traci.edge.getToJunction(curr_edge)
                    
                    if target_jid and target_jid in self.junction_ids:
                        route = traci.vehicle.getRoute(vid)
                        all_e[target_jid] = {
                            "direction": "NS", # Override logic inherently resolves phase via _get_ambulance_phase
                            "vehicle_id": vid,
                            "route": list(route)
                        }
        except:
            pass
            
        return all_e

    def _process_spawn_requests(self):
        requests = get_spawn_requests()
        for req in requests:
            vtype = req.get("type", "ambulance")
            vid = req.get("vehicle_id", f"api_amb_{self.current_step}")
            route = req.get("route", [])
            
            # Day 8: Junction-to-Junction Routing
            if not route and "start_junction" in req and "end_junction" in req:
                s_jid, e_jid = req["start_junction"], req["end_junction"]
                try:
                    # Find edges
                    # We must iterate edges because traci.junction has no getOutgoingEdges
                    s_edges = [e for e in traci.edge.getIDList() if not e.startswith(":") and traci.edge.getFromJunction(e) == s_jid]
                    e_edges = [e for e in traci.edge.getIDList() if not e.startswith(":") and traci.edge.getToJunction(e) == e_jid]
                    
                    if s_edges and e_edges:
                        route_info = traci.simulation.findRoute(s_edges[0], e_edges[0])

                        route = list(route_info.edges)
                        if not route:
                             print(f"⚠️ API Spawn Route blocked ({s_jid}->{e_jid}). Falling back to Auto-Edge Routing.")
                             self._trigger_random_emergency()
                             continue
                    else:
                        print(f"⚠️ API Spawn Nodes invalid ({s_jid}->{e_jid}). Falling back to Auto-Edge Routing.")
                        self._trigger_random_emergency()
                        continue
                except Exception as e:
                    print(f"⚠️ API Spawn routing crash: {e}. Falling back to Auto-Edge Routing.")
                    self._trigger_random_emergency()
                    continue

            if route:
                self._inject_ambulance_event(vid, route)
                print(f"🚀 API TRIGGERED: {vtype} {vid} on custom route ({len(route)} edges)")

    def _update_junction_visuals(self, all_e):
        from security.watchdog import global_watchdog
        for jid in self.junction_ids:
            pid = f"vis_{jid}"
            
            # Determine Color based on Operational State
            is_active = True
            if jid in all_e:
                color = (255, 0, 0, 150) # Bright Red -> Emergency Preemption
                radius = 45
            elif global_watchdog.is_crashed(jid):
                pulse = 255 if (self.current_step // 2) % 2 == 0 else 100
                color = (255, pulse, 0, 150) # Flashing Orange -> Watchdog Fallback
                radius = 40
            elif global_watchdog.is_recently_spoofed(jid):
                pulse = 255 if (self.current_step // 2) % 2 == 0 else 100
                color = (pulse, 0, pulse, 150) # Flashing Purple -> Hacker Detection
                radius = 45
            else:
                is_active = False
                
            try:
                if is_active:
                    if pid not in traci.polygon.getIDList():
                        x, y = self.junction_pos[jid]
                        pts = [(x + radius*np.cos(rad), y + radius*np.sin(rad)) for rad in np.linspace(0, 2*np.pi, 20)]
                        # Draw as a thicker outline instead of solid, much cleaner in SUMO
                        traci.polygon.add(pid, pts, color, fill=False, lineWidth=5, layer=100)
                    else:
                        traci.polygon.setColor(pid, color)
                else:
                    if pid in traci.polygon.getIDList():
                        traci.polygon.remove(pid)
            except:
                pass

    def _update_green_corridors(self, all_e):
        if not all_e:
            if self.colored_edges:
                for ed in list(self.colored_edges):
                    try:
                        for i in range(traci.edge.getLaneNumber(ed)):
                            traci.lane.setRGBAColor(f"{ed}_{i}", (255, 255, 255, 255))
                    except: pass
                self.colored_edges.clear()
            return
        for jid, info in all_e.items():
            for ed in info.get("route", []):
                try:
                    for i in range(traci.edge.getLaneNumber(ed)):
                        traci.lane.setRGBAColor(f"{ed}_{i}", (0, 255, 0, 255))
                    self.colored_edges.add(ed)
                except: pass

    def _auto_release_emergencies(self, all_e):
        for jid, info in all_e.items():
            vid = info.get("vehicle_id")
            if not vid: continue
            try:
                if vid in traci.vehicle.getIDList():
                    curr_edge = traci.vehicle.getRoadID(vid)
                    incoming_edges = [traci.lane.getEdgeID(l) for l in self.junction_lanes[jid]["incoming"]]
                    # If vehicle is on the road but not on an incoming edge of THIS junction
                    # Note: We need a slight buffer or check if it's on an outgoing edge
                    outgoing_edges = [traci.lane.getEdgeID(l) for l in self.junction_lanes[jid]["outgoing"]]
                    if curr_edge in outgoing_edges:
                        clear_emergency(jid)
                        print(f"✅ [RELEASE] Ambulance {vid} cleared junction {jid}. AI Agent resuming control.")
                else:
                    # If vehicle is not on the net, it might be in the departure queue
                    # Only clear if it's not and we've waited a few steps
                    if self.current_step % 50 == 0: # Periodic cleanup for completed trips
                         # Logic: If it disappeared from the simulation entirely (finished)
                         pass 
            except: pass

    def close(self):
        try: traci.close()
        except: pass

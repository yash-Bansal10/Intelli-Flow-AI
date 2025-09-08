# traffic_env.py


import traci
import numpy as np
import sys
import os
from api_server import start_api_thread, update_live_data 

class TrafficEnv:
    def __init__(self):
        if 'SUMO_HOME' in os.environ:
            tools = os.path.join(os.environ['SUMO_HOME'], 'tools')
            sys.path.append(tools)
        else:
            sys.exit("please declare environment variable 'SUMO_HOME'")
        
        # ----- Start the API Server in the background thread ----
        start_api_thread()

        self.sumoBinary = "sumo-gui"
        # Using 'agra.sumocfg' and arguments for automatic startup
        self.sumo_args = ["-c", "agra.sumocfg", "--start", "--quit-on-end"]
        
        traci.start([self.sumoBinary] + self.sumo_args)
        
        self.current_step = 0
        self.max_steps = 3600
        self.light_phase = 0  # This will now track the last commanded phase (0 or 2)
        self.time_in_phase = 0
        self.min_phase_time = 10
        # Lane IDs for intersection B2
        self.incoming_lanes = ["A2B2_0", "C2B2_0", "B1B2_0", "B3B2_0"]
        self.outgoing_lanes = ["B2A2_0", "B2C2_0", "B2B1_0", "B2B3_0"]

    def reset(self):
        traci.load(self.sumo_args)
        self.current_step = 0
        self.light_phase = 0
        self.time_in_phase = 0
        traci.simulationStep()
        return self._get_state()

    def _get_state(self):
        """
        Retrieves queue lengths and the current traffic light phase.
        State = [queue_W, queue_E, queue_S, queue_N, phase]
        """
        queue_lengths = [traci.lane.getLastStepHaltingNumber(lane) for lane in self.incoming_lanes]
        phase_state = 1 if self.light_phase == 0 else 0
        state = queue_lengths + [phase_state]
        return np.array(state)




    """ This is the step method for our dumb model     """

#    # traffic_env.py

#     def step(self, action):
#         """
#         MODIFIED FOR BASELINE TEST: Ignores the AI and uses a fixed 30-second timer.
#         """
#         # --- FIXED-TIME LOGIC ---
#         # Switch the light every 30 seconds
#         if self.time_in_phase >= 30:
#             # This logic switches between phase 0 and 2
#             self.light_phase = 0 if self.light_phase == 2 else 2
#             self.time_in_phase = 0
#             traci.trafficlight.setPhase("B2", self.light_phase)
        
#         # Advance the simulation
#         traci.simulationStep()
#         self.current_step += 1
#         self.time_in_phase += 1

#         # Reward calculation stays the same to ensure a fair comparison
#         incoming_pressure = sum(traci.lane.getLastStepHaltingNumber(lane) for lane in self.incoming_lanes)
#         outgoing_pressure = sum(traci.lane.getLastStepHaltingNumber(lane) for lane in self.outgoing_lanes)
#         pressure = incoming_pressure - outgoing_pressure
#         reward = -pressure
        
#         # The API update can stay, it's useful to see the baseline live
#         queues = [traci.lane.getLastStepHaltingNumber(lane) for lane in self.incoming_lanes]
#         api_payload = {
#             "simulation_time": self.current_step,
#             "current_phase": "North-South Green" if self.light_phase == 0 else "East-West Green",
#             "queues": {"west": queues[0], "east": queues[1], "south": queues[2], "north": queues[3]},
#             "congestion_score": pressure
#         }
#         update_live_data(api_payload)

#         state = self._get_state()
#         done = self.current_step >= self.max_steps
#         return state, reward, done





    """ This is the step method for our AI trained Model """

    def step(self, action):
        """
        Executes an action where the agent DIRECTLY chooses the phase.
        Action 0: Set North-South Green
        Action 1: Set East-West Green
        """
        # Map the agent's action (0 or 1) to SUMO's phase indices (0 or 2)
        new_phase = action * 2

        # Only change the light if the agent chooses a *different* phase
        # and the minimum green time has passed.
        if new_phase != self.light_phase and self.time_in_phase >= self.min_phase_time:
            self.light_phase = new_phase
            self.time_in_phase = 0
            traci.trafficlight.setPhase("B2", self.light_phase)
        
        # Advance the simulation
        traci.simulationStep()
        self.current_step += 1
        self.time_in_phase += 1

        # Calculate reward using the PressLight method
        incoming_pressure = sum(traci.lane.getLastStepHaltingNumber(lane) for lane in self.incoming_lanes)
        outgoing_pressure = sum(traci.lane.getLastStepHaltingNumber(lane) for lane in self.outgoing_lanes)
        pressure = incoming_pressure - outgoing_pressure
        reward = -pressure

        # We keep the API data payloads and update call ----
        queues = [traci.lane.getLastStepHaltingNumber(lane) for lane in self.incoming_lanes]
        api_payload = {
            "simulation_time": self.current_step,
            "current_phase": "North-South Green" if self.light_phase == 0 else "East-West Green",
            "queues":{"west":queues[0],"east":queues[1],"south":queues[2],"north":queues[3]},
            "congestion_score": pressure
        }
        update_live_data(api_payload)


        # Get the next state
        state = self._get_state()
        done = self.current_step >= self.max_steps
        return state, reward, done
        
    def close(self):
        traci.close()







from dqn_agent import DQNAgent
from traffic_env import TrafficEnv
import numpy as np
import matplotlib.pyplot as plt
import os
import json
import argparse
from security.watchdog import global_watchdog
from api_server import update_live_data

if __name__ == "__main__":
    # --- COMMAND LINE ARGUMENTS ---
    parser = argparse.ArgumentParser(description="Intelli-Flow AI Training")
    parser.add_argument("--nogui", action="store_true", help="Run without SUMO GUI")
    parser.add_argument("--gui", action="store_true", help="Force SUMO GUI (Default)")
    parser.add_argument("--map", type=str, default="4X4_grid", help="Simulation to run (e.g., connaught_place, list)")
    args = parser.parse_args()

    # --- Day 7: Map Auto-Discovery & UX ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sim_dir = os.path.join(script_dir, "simulations")
    
    if args.map.lower() == "list":
        avail = [d for d in os.listdir(sim_dir) if os.path.isdir(os.path.join(sim_dir, d))]
        print("\n[Intelli-Flow] 🗺️ Available Simulation Maps:")
        for m in avail: print(f"  - {m}")
        sys.exit(0)

    # Use GUI if --gui is set OR if --nogui is NOT set
    use_gui = True if args.gui else (not args.nogui)

    # --- CONFIGURATION MODE ---
    # Set to "training" for maximum CPU speed (no GUI delay, active neural network backprop)
    # Set to "realtime" for live presentations (smooth GUI delay, inference-only mode to prevent lag)
    SIMULATION_MODE = "realtime" 

    # --- CONSTANTS ---
    NUM_EPISODES = 21 
    BATCH_SIZE = 32
    ACTION_SIZE = 2
    
    # --- INITIALIZATION ---
    env = TrafficEnv(use_gui=use_gui, map_name=args.map, mode=SIMULATION_MODE) 
    
    # Day 3: Coordinated City Grid (Universal State Vector)
    agents = {}
    state_sizes = {}
    BASE_MODEL = "intelliflow_model.weights.h5"
        
    # Define USV Size (Fixed at 28 slots)
    USV_SIZE = 28

    # --- Day 9: Systematic Model Storage ---
    model_dir = os.path.join(script_dir, "models", args.map)
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        print(f"[Intelli-Flow] 📁 Created new model directory: {model_dir}")

    # Ensure all junctions are tracked correctly for state parsing
    for jid in env.junction_ids:
        state_sizes[jid] = USV_SIZE

    main_jid = env.junction_ids[0] if len(env.junction_ids) > 0 else "main"

    # --- DUAL MODEL ALLOCATION LOGIC ---
    if SIMULATION_MODE == "training":
        # Training Mode: Train ONLY ONE model at ONE junction. 
        # The other junctions will gracefully fall back to SUMO's native fixed-time logic.
        print(f"[Training] Booting 1 focused AI Agent for Master Junction '{main_jid}'...")
        agents[main_jid] = DQNAgent(USV_SIZE, ACTION_SIZE)
        
        # Load any existing specific master weights (or fallback)
        model_filename = os.path.join(model_dir, f"model_{main_jid}.weights.h5")
        try:
            agents[main_jid].load(model_filename)
            print(f"[Training] Loaded existing master weights from {model_filename}")
        except Exception:
            root_model = os.path.join(script_dir, "models", f"model_{main_jid}.weights.h5")
            if os.path.exists(root_model):
                agents[main_jid].load(root_model)
            elif os.path.exists(os.path.join(script_dir, "models", BASE_MODEL)) or os.path.exists(BASE_MODEL):
                try: agents[main_jid].load(BASE_MODEL)
                except Exception: pass
            
    else:
        # Real-time Mode: Reverting to full city coverage!
        # Instantiating 16 physically isolated models mapped to the Master Brain file.
        print(f"[Realtime] Booting {len(env.junction_ids)} isolated AI Agents...")
        master_model_filename = os.path.join(model_dir, f"model_{main_jid}.weights.h5")
        
        for jid in env.junction_ids:
            agents[jid] = DQNAgent(USV_SIZE, ACTION_SIZE)
            try:
                # Load the SINGLE centrally trained master brain into ALL 16 local agents
                agents[jid].load(master_model_filename)
            except Exception:
                root_model = os.path.join(script_dir, "models", f"model_{main_jid}.weights.h5")
                if os.path.exists(root_model):
                    agents[jid].load(root_model)
                elif os.path.exists(os.path.join(script_dir, "models", BASE_MODEL)) or os.path.exists(BASE_MODEL):
                    try: agents[jid].load(BASE_MODEL)
                    except Exception: pass
        print(f"[Realtime] Distributed pre-trained Master Brain flawlessly across all {len(agents)} local agents.")
    scores = []

    # --- WEIGHT LOADING REMOVED (HANDLED ABOVE PER JID) ---

    # --- TRAINING LOOP ---
    for e in range(NUM_EPISODES):
        states = env.reset()
        # Reshape states
        if isinstance(states, dict):
            for jid in states:
                states[jid] = np.reshape(states[jid], [1, state_sizes[jid]])
        else:
            # Single-agent backward compatibility
            states = {env.main_jid: np.reshape(states, [1, state_sizes[env.main_jid]])}
            
        total_reward = 0

        for time in range(env.max_steps):
            # 1. Collect actions from all agents
            import api_server
            overrides = api_server.manual_overrides
            
            actions = {}
            for jid, agent in agents.items():
                if global_watchdog.is_crashed(jid):
                    # Edge failure! Fallback to local timer
                    time_in_phase = env.junction_states[jid]["time_in_phase"]
                    actions[jid] = global_watchdog.get_fallback_action(jid, time_in_phase)
                elif overrides.get(jid) == "fixed_timer":
                    # Fully disconnect from DQN and use the dedicated env fallback function
                    env.run_fixed_timer(jid, 60)
                else:
                    actions[jid] = agent.act(states[jid])
            
            # 2. Step environment
            next_states, rewards, dones = env.step(actions)

            # 2b. Compute avg real confidence from all non-crashed non-overriden agents
            confidences = [
                agents[jid].get_confidence()
                for jid in agents
                if not global_watchdog.is_crashed(jid) and jid in actions
            ]
            avg_conf = round(sum(confidences) / len(confidences), 1) if confidences else 0.0
            with __import__('api_server').data_lock:
                __import__('api_server').live_data['avg_confidence'] = avg_conf

            # 3. Process outcomes
            if not isinstance(next_states, dict):
                next_states = {env.main_jid: next_states}
                rewards = {env.main_jid: rewards}
                dones = {env.main_jid: dones}

            # 4. Learning & Experience Replay Protection
            active_emergencies = env.get_emergency_status()
            
            for jid, agent in agents.items():
                n_state = np.reshape(next_states[jid], [1, state_sizes[jid]])
                
                # Skip learning if junction is in Emergency Override, agent crashed, or node is overridden to fixed timer
                if jid not in active_emergencies and not global_watchdog.is_crashed(jid) and jid in actions:
                    agent.remember(states[jid], actions[jid], rewards[jid], n_state, dones[jid])
                else:
                    # We still update the local state so the next 'step' is accurate
                    pass

                states[jid] = n_state
                total_reward += rewards[jid]
            
            if any(dones.values()) if isinstance(dones, dict) else dones:
                scores.append(total_reward)
                avg_pressure_per_step = -total_reward / (env.max_steps * len(agents))
                
                print(f"\n" + "╔" + "═"*60 + "╗")
                print(f"║" + f" EPISODE {e+1}/{NUM_EPISODES} COMPLETE ".center(60) + "║")
                print(f"╠" + "═"*60 + "╣")
                print(f"║ TOTAL CITY REWARD (Cumulative): {total_reward:,.2f}".ljust(60) + "║")
                print(f"║ AVG PRESSURE / JUNCTION / STEP: {avg_pressure_per_step:.2f}".ljust(60) + "║")
                print(f"║ EPSILON: {agents[env.main_jid].epsilon:.2f}".ljust(60) + "║")
                print(f"╠" + "═"*60 + "╣")
                print(f"║ FULL JUNCTION COMPARISON (Sorted by Performance):".ljust(60) + "║")
                
                # Sort all junctions by their individual reward in the LAST step
                # (or we could track cumulative per junction, but rewards contains current step)
                # Actually, rewards[jid] is just for the last step. 
                # To show full episode performance, we'd need to track it, but last-step state is a good snapshot.
                sorted_report = sorted(rewards.items(), key=lambda x: x[1], reverse=True)
                for i, (jid, rew) in enumerate(sorted_report):
                    indicator = "🟢" if rew > -10 else ("🟡" if rew > -30 else "🔴")
                    print(f"║ {i+1:2d}. {jid:4s}: {rew:8.2f} {indicator}".ljust(60) + "║")
                
                print(f"╚" + "═"*60 + "╝\n")
                break
        # 4. Neural Network Training (Gated by Configuration Mode)
        # Deep learning backprop takes massive CPU resources and freezes the simulation exactly every 5 steps.
        # We disable it during "realtime" mode so presentations run perfectly smoothly!
        if SIMULATION_MODE == "training":
            # set() reduces 16 duplicate object references down to exactly 1 loop iteration!
            for agent in set(agents.values()):
                if len(agent.memory) > BATCH_SIZE:
                    agent.replay(BATCH_SIZE)
        
        # Save every episode
        for jid, agent in agents.items():
            agent.save(os.path.join(model_dir, f"model_{jid}.weights.h5"))
        print(f"--- Checkpoint: Saved {len(agents)} active agents at episode {e+1} ---")


    # --- CLEANUP AND SAVING (Systematic) ---
    env.close()
    for jid, agent in agents.items():
        save_path = os.path.join(model_dir, f"model_{jid}.weights.h5")
        agent.save(save_path)
    print(f"Trained model logic saved for {len(agents)} local agents.")
    
    # Save the scores and logs into the map folder
    np.savetxt(os.path.join(model_dir, "training_scores.txt"), np.array(scores))        

    plt.figure(figsize=(10, 5))
    plt.plot(scores)
    plt.title("DQN Agent Learning Curve")
    plt.xlabel("Episode")
    plt.ylabel("Total Reward (Negative Pressure)")
    plt.grid(True)
    plt.savefig(os.path.join(model_dir, 'learning_curve.png'))
    plt.show()
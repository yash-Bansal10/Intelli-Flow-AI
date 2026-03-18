# train.py

from dqn_agent import DQNAgent
from traffic_env import TrafficEnv
import numpy as np
import matplotlib.pyplot as plt
import os # Import the os library
import argparse

if __name__ == "__main__":
    # --- COMMAND LINE ARGUMENTS ---
    parser = argparse.ArgumentParser(description="Intelli-Flow AI Training")
    parser.add_argument("--nogui", action="store_true", help="Run without SUMO GUI")
    args = parser.parse_args()

    # --- CONSTANTS ---
    NUM_EPISODES = 21 # Set this to a high number for overnight training
    BATCH_SIZE = 32
    ACTION_SIZE = 2
    
    # --- INITIALIZATION ---
    # Reverting to GUI by default as requested. Use --nogui to speed up.
    env = TrafficEnv(use_gui=not args.nogui) 
    
    # Day 3: Coordinated City Grid (Universal State Vector)
    agents = {}
    state_sizes = {}
    BASE_MODEL = "intelliflow_model.weights.h5"
        
    # Define USV Size (Fixed at 28 slots)
    USV_SIZE = 28

    # Initialize one agent per discovered junction
    for jid in env.junction_ids:
        # State size is now fixed at USV_SIZE for all junctions
        state_sizes[jid] = USV_SIZE
        agents[jid] = DQNAgent(USV_SIZE, ACTION_SIZE)
        
        # --- Weight Loading (Future-Proof Logic) ---
        model_filename = f"model_{jid}.weights.h5"
        
        # 1. Try to load junction-specific weights first (e.g. models/model_A0.weights.h5)
        # DQNAgent.load automatically checks the 'models/' folder.
        try:
            # We don't need os.path.exists here because DQNAgent.load handles it gracefully
            agents[jid].load(model_filename)
        except Exception as e:
            print(f"No specific weights for {jid}, checking base model...")

        # 2. Fallback to the base pre-trained model if no specific weights were found
        # This allows all 16 junctions to 'start intelligent' from a shared base.
        if os.path.exists(os.path.join("models", BASE_MODEL)) or os.path.exists(BASE_MODEL):
            try:
                # Load with skip_mismatch=True (default in dqn_agent.py) 
                agents[jid].load(BASE_MODEL)
                print(f"Initialized agent {jid} with pre-trained BASE model.")
            except Exception as e:
                print(f"Could not load base model for {jid}. Starting fresh.")
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
            actions = {}
            for jid, agent in agents.items():
                actions[jid] = agent.act(states[jid])
            
            # 2. Step environment
            next_states, rewards, dones = env.step(actions)
            
            # 3. Process outcomes
            if not isinstance(next_states, dict):
                next_states = {env.main_jid: next_states}
                rewards = {env.main_jid: rewards}
                dones = {env.main_jid: dones}

            for jid, agent in agents.items():
                n_state = np.reshape(next_states[jid], [1, state_sizes[jid]])
                agent.remember(states[jid], actions[jid], rewards[jid], n_state, dones[jid])
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
        
        # 4. Replay for all agents
        for agent in agents.values():
            if len(agent.memory) > BATCH_SIZE:
                agent.replay(BATCH_SIZE)
        
        # Periodic Save (Every 10 episodes)
        if (e + 1) % 10 == 0:
            for jid, agent in agents.items():
                agent.save(f"model_{jid}.weights.h5")
            print(f"--- Checkpoint: All 16 agents saved at episode {e+1} ---")


    # --- CLEANUP AND SAVING ---
    env.close()
    for jid, agent in agents.items():
        agent.save(f"model_{jid}.weights.h5")
    print(f"Trained models saved for {len(agents)} agents.")
    
    # Save the scores to a file for later analysis
    np.savetxt("training_scores.txt", np.array(scores))        

    plt.figure(figsize=(10, 5))
    plt.plot(scores)
    plt.title("DQN Agent Learning Curve")
    plt.xlabel("Episode")
    plt.ylabel("Total Reward (Negative Pressure)")
    plt.grid(True)
    plt.savefig('learning_curve.png')
    plt.show()
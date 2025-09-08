# train.py

from dqn_agent import DQNAgent
from traffic_env import TrafficEnv
import numpy as np
import matplotlib.pyplot as plt
import os # Import the os library

if __name__ == "__main__":
    # --- CONSTANTS ---
    NUM_EPISODES = 500 # Set this to a high number for overnight training
    STATE_SIZE = 5
    ACTION_SIZE = 2
    BATCH_SIZE = 32
    MODEL_NAME = "intelliflow_model.h5" # Define a name for the saved model

    # --- INITIALIZATION ---
    env = TrafficEnv()
    agent = DQNAgent(STATE_SIZE, ACTION_SIZE)
    scores = []

    # --- LOAD PREVIOUS PROGRESS IF IT EXISTS ---
    if os.path.exists(MODEL_NAME):
        agent.load(MODEL_NAME)
        print("Loaded saved model progress.")

    # --- TRAINING LOOP ---
    for e in range(NUM_EPISODES):
        state = env.reset()
        state = np.reshape(state, [1, STATE_SIZE])
        total_reward = 0

        for time in range(env.max_steps):
            action = agent.act(state)
            next_state, reward, done = env.step(action)
            next_state = np.reshape(next_state, [1, STATE_SIZE])
            total_reward += reward
            
            agent.remember(state, action, reward, next_state, done)
            state = next_state

            if done:
                scores.append(total_reward)
                print(f"Episode: {e+1}/{NUM_EPISODES}, Score: {total_reward:.2f}, Epsilon: {agent.epsilon:.2f}")
                break
        
        if len(agent.memory) > BATCH_SIZE:
            agent.replay(BATCH_SIZE)


    # --- CLEANUP AND SAVING -------
    env.close()

    # ----- added this line to save the final trained model ------- 
    agent.save(MODEL_NAME)
    print(f"Trained model saved as {MODEL_NAME}")



    # --- SAVE PROGRESS EVERY 20 EPISODES ---
    # if (e + 1) % 20 == 0:
        # agent.save(MODEL_NAME)
        # print(f"Progress saved at episode {e+1}")

    # --- CLEANUP AND FINAL SAVE ---
    # env.close()
    # agent.save(MODEL_NAME) # Save the final trained model
    
    # Save the scores to a file for later analysis
    # np.savetxt("training_scores.txt", np.array(scores))        

    plt.figure(figsize=(10, 5))
    plt.plot(scores)
    plt.title("DQN Agent Learning Curve")
    plt.xlabel("Episode")
    plt.ylabel("Total Reward (Negative Pressure)")
    plt.grid(True)
    plt.savefig('learning_curve.png')
    plt.show()
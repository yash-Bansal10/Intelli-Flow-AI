# dqn_agent.py

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Input
from tensorflow.keras.optimizers import Adam
from collections import deque
import random
import json
import os

class DQNAgent:
    def __init__(self, state_size, action_size):
        self.state_size = state_size
        self.action_size = action_size
        self.memory = deque(maxlen=2000)
        self.gamma = 0.95
        self.epsilon = 1.0
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.learning_rate = 0.001
        self.model = self._build_model()

    def _build_model(self):
        """
        [Day 3: Future-Proof Architecture]
        Uses named layers to allow partial weight loading even if inputs change later.
        """
        print(f"Building USV model with input_dim={self.state_size}")
        model = Sequential([
            Input(shape=(self.state_size,), name="usv_input"),
            Dense(64, activation='relu', name="hidden_1"),
            Dense(64, activation='relu', name="hidden_2"),
            Dense(self.action_size, activation='linear', name="output_layer")
        ])
        model.compile(loss='mse', optimizer=Adam(learning_rate=self.learning_rate))
        return model

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state):
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        act_values = self.model.predict(state, verbose=0)
        return np.argmax(act_values[0])

    def replay(self, batch_size):
        if len(self.memory) < batch_size:
            return
        
        minibatch = random.sample(self.memory, batch_size)
        states = np.array([i[0] for i in minibatch]).squeeze()
        next_states = np.array([i[3] for i in minibatch]).squeeze()
        current_q_values = self.model.predict_on_batch(states)
    
        next_q_values = self.model.predict_on_batch(next_states)
        X, y = [], []
        for index, (state, action, reward, next_state, done) in enumerate(minibatch):
            new_q = reward if done else reward + self.gamma * np.amax(next_q_values[index])
            target_f = current_q_values[index]
            target_f[action] = new_q
            X.append(state)
            y.append(target_f)
        self.model.fit(np.array(X).squeeze(), np.array(y), batch_size=batch_size, epochs=1, verbose=0)

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
            
    def save(self, name):
        """Saves weights and epsilon to the models/ directory."""
        if not os.path.exists("models"):
            os.makedirs("models")
        
        path = os.path.join("models", name)
        self.model.save_weights(path)
        
        meta_path = path.replace(".weights.h5", ".json")
        with open(meta_path, 'w') as f:
            json.dump({"epsilon": self.epsilon}, f)

    def load(self, name):
        """
        Robust loader that attempts to load weights from the models/ directory.
        """
        path = os.path.join("models", name)
        if not os.path.exists(path):
            if os.path.exists(name): path = name
            else: return

        try:
            # Load with skip_mismatch=True to allow partial loading if state size changes
            self.model.load_weights(path, by_name=True, skip_mismatch=True)
            print(f"Loaded weights from {path}")
        except Exception as e:
            print(f"Note: Could not perform full load from {path}. Starting fresh or partial.")

        meta_path = path.replace(".weights.h5", ".json")
        if os.path.exists(meta_path):
            try:
                with open(meta_path, 'r') as f:
                    data = json.load(f)
                    self.epsilon = data.get("epsilon", self.epsilon)
                    print(f"Restored Epsilon: {self.epsilon:.4f}")
            except:
                pass
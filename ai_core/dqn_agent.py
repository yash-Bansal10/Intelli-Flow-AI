# dqn_agent.py

import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from collections import deque
import random

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
        model = Sequential()
        model.add(Dense(24, input_dim=self.state_size, activation='relu'))
        model.add(Dense(24, activation='relu'))
        model.add(Dense(self.action_size, activation='linear'))
        model.compile(loss='mse', optimizer=Adam(learning_rate=self.learning_rate))
        return model

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state):
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        act_values = self.model.predict(state)
        return np.argmax(act_values[0])

    def replay(self, batch_size):
        if len(self.memory) < batch_size:
            return  # Not enough memory to replay
        
        minibatch = random.sample(self.memory, batch_size)

        # 1. Get current Q-values for all states in the batch
        states = np.array([i[0] for i in minibatch])
        states = np.squeeze(states)
        current_q_values = self.model.predict_on_batch(states)

        # 2. Get next Q-values for all next_states in the batch
        next_states = np.array([i[3] for i in minibatch])
        next_states = np.squeeze(next_states)
        next_q_values = self.model.predict_on_batch(next_states)

        X=[]
        y=[]

        # 3. Calculate target Q-values for each experience in the batch
        for index,(state,action,reward,next_state,done) in enumerate(minibatch):
            if not done:
                new_q = reward + self.gamma * np.amax(next_q_values[index])
            else:
                new_q = reward

            # Update the Q-value for the action that was taken
            current_qs = current_q_values[index]
            current_qs[action] = new_q
            
            X.append(state)
            y.append(current_qs)


        # 4. Fit the model on t(he entire batch at once
        self.model.fit(np.array(X).squeeze(), np.array(y), batch_size=batch_size, epochs=1, verbose=0)

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
        

    def save(self, name):
        """Saves the neural network's weights to a file."""
        self.model.save_weights(name)

    def load(self, name):
        """Loads the neural network's weights from a file."""
        self.model.load_weights(name)

    
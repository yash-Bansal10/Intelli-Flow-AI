# Intelli-Flow AI 🚦

**An intelligent, adaptive traffic control system powered by Deep Reinforcement Learning.**

-----

## 📖 Overview

Intelli-Flow AI is a smart traffic management solution designed to replace outdated, inefficient fixed-time traffic light controllers. Traditional systems are blind to real-time conditions, leading to unnecessary congestion, wasted fuel, and increased travel times.

Our solution uses a **Deep Q-Network (DQN)**, a reinforcement learning agent, to create a dynamic and responsive system. The AI constantly observes traffic queues and makes intelligent decisions to optimize flow, applying a **"max pressure"** policy to relieve the most congested lanes first. This project proves that an AI agent can learn complex traffic control strategies and significantly outperform traditional methods.

This project was developed for the **Smart India Hackathon (SIH)**.

## ✨ Features

- **Intelligent Agent:** A DQN model that learns and adapts to changing traffic patterns.
- **Realistic Simulation:** Built on the **SUMO (Simulation of Urban MObility)** platform for high-fidelity traffic modeling.
- **Live Dashboard:** A real-time web interface built with Next.js and Tailwind CSS to visualize the intersection, queue lengths, and the AI's decisions.
- **Dynamic Control:** Applies a "max pressure" policy to prioritize lanes with the heaviest traffic, minimizing overall congestion.
- **Performance Analytics:** Tracks key metrics like Congestion Score and displays the agent's learning progress over time.

## 🛠️ Tech Stack

-   **AI / Reinforcement Learning:** Python, TensorFlow, Keras
-   **Simulation:** SUMO (Simulation of Urban MObility)
-   **Frontend / Dashboard:** Next.js, React, Tailwind CSS
-   **Data Visualization:** Chart.js (or similar) for real-time graphs

## ⚙️ Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Python 3.8+
-   SUMO installed and configured in your system's PATH.
-   Node.js and npm (or yarn)

------


## 🚀 Usage

1.  **Start the AI Backend**
    Navigate to your backend directory and run the main training/simulation script:
    ```sh
    python main.py
    ```
    This will start the SUMO simulation and the server that provides data to the dashboard.

2.  **Start the Frontend Dashboard**
    In a separate terminal, navigate to your frontend directory and run the development server:
    ```sh
    npm run dev
    ```
3.  **View the Dashboard**
    Open your browser and go to `http://localhost:3000` to see the live traffic simulation and AI performance.

## 🔮 Future Scope

-   **Multi-Agent Systems:** Expand from a single intersection to a network of coordinated AI agents that manage traffic across an entire city grid.
-   **Predictive Analytics:** Integrate real-world data sources (weather, public events, GPS data) to anticipate traffic surges before they happen.
-   **Emergency Vehicle Prioritization:** Train the AI to recognize and create "green waves" for ambulances and fire trucks, reducing emergency response times.
-   **Hardware Deployment:** Optimize the model to run on low-cost edge devices (like NVIDIA Jetson or Raspberry Pi) for real-world deployment.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

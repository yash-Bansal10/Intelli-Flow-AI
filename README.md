<div align="center">
  <img src="assets/DemoGIF.gif" alt="Intelli-Flow AI Logo" width="150"/>
  <h1>Intelli-Flow AI 🚦</h1>
  <p>An intelligent, adaptive traffic control system powered by Deep Reinforcement Learning.</p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python Badge"/>
    <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" alt="TensorFlow Badge"/>
    <img src="https://img.shields.io/badge/SUMO-E87D25?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxwYXRoIGQ9Im0wIDBoMXYxaDB6IiBmaWxsPSIjMDMwMDIyIi8+PHBhdGggZD0ibTAuOTIxIDAuODc0di0wLjA3M2gtMC4xODFsLTAuMDI0IDAuMDAzdi0wLjU3OWwtMC4wMjQgMC4wMDN2MC4wNzNoMC4wNDd2MC41MDFoLTAuNDd2LTAuNzM2aDAuMDcxbDAuMDI0LTAuMDAzdjAuNjg0aDAuMzIybDAuMDI0LTAuMDAzdi0wLjU1OWwwLjAyNC0wLjAwM3YwLjU2MmgwLjA0N3YwLjA3M2gtMC4yMDZ6bS0wLjUxOS0wLjc3NGMwLjA1MyAwLjAyNyAwLjEwMyAwLjA1NyAwLjE0OCAwLjA4OWMwLjA0NyAwLjAzMyAwLjA5MSAwLjA2OSAwLjEyOSAwLjEwN2MwLjAzOCAwLjAzOCAwLjA2OSAwLjA3OCAwLjA5MiAwLjEyMWMwLjAyMyAwLjA0NCAwLjAzOCAwLjA5MSAwLjA0MiAwLjE0MmMwLjA2MiAwLjE3MSAwLjAyMSAwLjM2MS0wLjExMyAwLjQ4NmMtMC4wNzYgMC4wNzEtMC4xNzcgMC4xMTMtMC4yODIgMC4xMTNjLTAuMDk4IDAtMC4xOTYtMC4wMzQtMC4yNzYtMC4xMDJjLTAuMDgyLTAuMDctMC4xMjktMC4xNjctMC4xMzItMC4yNzJjLTAuMDA1LTAuMTU3IDAuMDQ0LTAuMzA4IDAuMTQzLTAuNDE5YzAuMDQ0LTAuMDUxIDAuMDk4LTAuMDkyIDAuMTU3LTAuMTIxYzAuMDMyLTAuMDE3IDAuMDY0LTAuMDMyIDAuMDk3LTAuMDQ1YzAuMDk1LTAuMDM4IDAuMTg4LTAuMDc0IDAuMjczLTAuMTE0di0wLjAxMmMwLTAuMDMzLTAuMDE2LTAuMDY0LTAuMDQzLTAuMDg5Yy0wLjAyOS0wLjAyNy0wLjA2My0wLjA0OC0wLjEwMi0wLjA2MmMtMC4wNzItMC4wMjYtMC4xNDgtMC4wMzQtMC4yMjMtMC4wMjJjLTAuMDc0IDAuMDEtMC4xNDMgMC4wNDEtMC4xOTggMC4wODljLTAuMDIxIDAuMDE4LTAuMDQxIDAuMDM4LTAuMDYgMC4wNTl2LTAuMDg2YzAuMDI0LTAuMDI0IDAuMDUxLTAuMDQ1IDAuMDgxLTAuMDYxYzAuMDc4LTAuMDQ0IDAuMTY2LTAuMDY4IDAuMjU2LTAuMDY4YzAuMDk2IDAgMC4xOTEgMC4wMjcgMC4yNzcgMC4wNzZ6bS0wLjE1MyAwLjQ5MmMwLjAzMiAwLjAyOSAwLjA1OSAwLjA2MSAwLjA3OCAwLjA5NmMwLjAxOSAwLjAzNSAwLjAyOSAwLjA3MiAwLjAzMSAwLjExMmMwLjAwMiAwLjA5NC0wLjAyOSAwLjE4NC0wLjA4OSAwLjI1NmMtMC4wMzcgMC4wNDQtMC4wODYgMC4wNzItMC4xMzcgMC4wNzJjLTAuMDUxIDAtMC4xMDEtMC4wMTgtMC4xNDEtMC4wNTJjLTAuMDgtMC4wNjgtMC4xMTYtMC4xNzItMC4xMDMtMC4yODJjMC4wMDgtMC4wNjggMC4wMzMtMC4xMzEgMC4wNzEtMC4xODJjMC4wMjYtMC4wMzUgMC4wNTktMC4wNjUgMC4wOTctMC4wODljMC4wMjUtMC4wMTYgMC4wNS0wLjAzIDAuMDc1LTAuMDQxYzAuMDM3LTAuMDE1IDAuMDc0LTAuMDI4IDAuMTEyLTAuMDM4YzAuMDM5LTAuMDEgMC4wNzktMC4wMTYgMC4xMTktMC4wMTZzMC4wNzkgMC4wMDYgMC4xMTggMC4wMTZjMC4wMzcgMC4wMSAwLjA3MyAwLjAyMyAwLjEwNyAwLjA0MWMwLjAyNCAwLjAxMiAwLjA0NyAwLjAyNyAwLjA2OSAwLjA0M3YwLjA3MmMtMC4wMi0wLjAxNC0wLjA0Mi0wLjAyOC0wLjA2NS0wLjA0MWMtMC4wNjMtMC4wMzgtMC4xMzItMC4wNi0wLjIwMi0wLjA2NmMtMC4wMTQgMC0wLjAyOSAwLTAuMDQzIDAuMDAxYy0wLjA5MSAwLjAwNi0wLjE3OCAwLjA0Ni0wLjI0NSAwLjExMnptMC4yNDMgMC4zNzljMC4wMy0wLjAyMSAwLjA1OC0wLjA0NSAwLjA4My0wLjA2OWMwLjAzOC0wLjAzNSAwLjA3LTAuMDc0IDAuMDkzLTAuMTE3YzAuMDIyLTAuMDQxIDAuMDM2LTAuMDgyIDAuMDQxLTAuMTI2YzAuMDA5LTAuMDc2LTAuMDA3LTAuMTUxLTAuMDQyLTAuMjE2Yy0wLjAyMi0wLjA0Mi0wLjA1My0wLjA3OC0wLjA5Mi0wLjEwN2MtMC4wNC0wLjAzLTAuMDgyLTAuMDU0LTAuMTI2LTAuMDczYy0wLjA1OS0wLjAyNS0wLjEyMS0wLjAzOC0wLjE4MS0wLjAzOGMtMC4wOTQgMC0wLjE4NCAwLjAzMS0wLjI1OSAwLjA4OWMtMC4wODkgMC4wNjctMC4xNDUgMC4xNjYtMC4xNDUgMC4yNzZjMC4wMDQgMC4xNTQgMC4wNjcgMC4yOTcgMC4xNzMgMC40MDNjMC4wNjUgMC4wNjUgMC4xNDkgMC4xMDcgMC4yNCAwLjEyMmMwLjA2NSAwLjAxMSAwLjEyOS0wLjAwMSAwLjE4OC0wLjAzMmMwLjA1OC0wLjAzMiAwLjEwOC0wLjA3OSAwLjE0OC0wLjEzN2MwLjAyNy0wLjAzOCAwLjA0NC0wLjA4MSAwLjA1Mi0wLjEyNmMwLjAxLTAuMDUyIDAuMDExLTAuMTAzIDAuMDAzLTAuMTUyYy0wLjAwOC0wLjA1MS0wLjAzLTAuMDk3LTAuMDYxLTAuMTMybC0wLjAxMS0wLjAxMmMtMC4wMi0wLjAyLTAuMDQzLTAuMDM3LTAuMDY4LTAuMDUyYy0wLjAzMy0wLjAyLTAuMDY3LTAuMDM2LTAuMTAxLTAuMDR2LTAuMDcxYzAuMDI5IDAuMDA2IDAuMDU3IDAuMDE3IDAuMDgyIDAuMDMyYzAuMDYyIDAuMDM4IDAuMTE2IDAuMDkyIDAuMTQ4IDAuMTU3YzAuMDE4IDAuMDM3IDAuMDI5IDAuMDc1IDAuMDMyIDAuMTE0YzAuMDA0IDAuMDYxLTAuMDA1IDAuMTIyLTAuMDI4IDAuMTc3Yy0wLjAxMyAwLjAzMi0wLjAzMSAwLjA2Mi0wLjA1MiAwLjA4OWMtMC4wMiAwLjAyOC0wLjQxNyAwLjM5OC0wLjQxNyAwLjM5OHoiIGZpbGw9IiNlOGQ4MjUiLz48L3N2Zz4=&logoColor=white" alt="SUMO Badge"/>
    <img src="https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js Badge"/>
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="MIT License Badge"/>
  </p>
</div>

---

<div align="center">

**Live Demo**

![Intelli-Flow AI Demo](assets/DemoGIF.gif)

</div>

---

## 📖 Overview

Intelli-Flow AI is a smart traffic management solution designed to replace outdated, inefficient fixed-time traffic light controllers. Traditional systems are blind to real-time conditions, leading to unnecessary congestion, wasted fuel, and increased travel times. 

Our solution uses a **Deep Q-Network (DQN)**, a reinforcement learning agent, to create a dynamic and responsive system. The AI constantly observes traffic queues and makes intelligent decisions to optimize flow, applying a **"max pressure"** policy to relieve the most congested lanes first. This project proves that an AI agent can learn complex traffic control strategies and significantly outperform traditional methods.

This project was developed for the **Smart India Hackathon (SIH)**.

---

## ✨ Key Features

-   🧠 **Intelligent Agent:** A DQN model built with TensorFlow that learns and adapts to changing traffic patterns.
-   🚗 **Realistic Simulation:** Built on the **SUMO (Simulation of Urban MObility)** platform for high-fidelity traffic modeling.
-   📊 **Live Dashboard:** A real-time web interface built with Next.js and Tailwind CSS to visualize intersection stats and AI decisions.
-   ⚡ **Dynamic Control:** Applies a "max pressure" policy to prioritize lanes with the heaviest traffic, minimizing overall congestion.
-   📈 **Performance Analytics:** Tracks key metrics and displays the agent's learning progress over time.

---

## 🏗️ System Architecture

The system operates in a continuous loop, allowing the AI to learn and adapt in real-time. The traffic simulator provides the state, the AI chooses an action, and the backend/frontend layers visualize the results.

<div align="center">
  <img src="assets/Architecture.png" alt="System Architecture Diagram" width="800"/>
</div>

---

## 🛠️ Tech Stack

-   **AI / Reinforcement Learning:** Python, TensorFlow, Keras
-   **Simulation:** SUMO (Simulation of Urban MObility)
-   **Backend API:** Flask & Flask-CORS
-   **Frontend / Dashboard:** Next.js, React, Tailwind CSS
-   **Data Visualization:** Chart.js

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Python 3.8+
-   SUMO installed and the `SUMO_HOME` environment variable configured.
-   Node.js and npm (or yarn)

### Installation & Launch

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/yash-Bansal10/Intelli-Flow-AI.git](https://github.com/yash-Bansal10/Intelli-Flow-AI.git)
    cd Intelli-Flow-AI
    ```

2.  **Set up the Python Backend:**
    -   Navigate to the AI core directory:
        ```sh
        cd ai_core
        ```
    -   Create and activate a virtual environment:
        ```sh
        # On Windows
        python -m venv venv
        .\venv\Scripts\activate
        ```
    -   Install the required Python packages:
        ```sh
        pip install -r requirements.txt
        ```
    -   **Important:** Open `train.py` and `traffic_env.py` and update the `SUMO_CONFIG_PATH` variable to point to your local SUMO configuration file (`.sumocfg`).
    -   Start the AI training script and backend server:
        ```sh
        python train.py
        ```

3.  **Set up the Frontend Dashboard:**
    -   Open a **new terminal**.
    -   Navigate to the frontend directory (you'll need to create this part or use the provided API server with a tool like Postman).
    -   Install npm packages and run the development server:
        ```sh
        # Example for a Next.js dashboard
        # cd frontend
        # npm install
        # npm run dev
        ```

4.  **View the Dashboard:**
    -   Open your browser and go to `http://localhost:3000` to see the live traffic simulation and AI performance.

---

## 🔮 Future Scope

-   **Multi-Agent Systems:** Expand from a single intersection to a network of coordinated AI agents that manage traffic across an entire city grid.
-   **Predictive Analytics:** Integrate real-world data sources (weather, public events, GPS data) to anticipate traffic surges before they happen.
-   **Emergency Vehicle Prioritization:** Train the AI to recognize and create "green waves" for ambulances and fire trucks.
-   **Hardware Deployment:** Optimize the model to run on low-cost edge devices (like NVIDIA Jetson or Raspberry Pi) for real-world deployment.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Founder

**Yash Bansal**

-   **LinkedIn:** [https://www.linkedin.com/in/iamyashbansal/](https://www.linkedin.com/in/iamyashbansal/)

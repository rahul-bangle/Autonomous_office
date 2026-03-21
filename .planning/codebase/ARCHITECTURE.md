# System Architecture

This document describes the design patterns and high-level architecture of the Virtual Office project.

## Architecture Pattern
The project follows a **Multi-Agent Orchestration (MAO)** pattern. It utilizes **CrewAI** to define roles, goals, and backstories for multiple AI agents that work together to fulfill user requests.

## Core Components & Layers

### 1. Presentation Layer (Frontend)
- **React/Vite**: A modern web interface for users to interact with the virtual office.
- **WebSocket Gateway**: Uses the `ws` protocol for real-time streaming and bidirectional updates.

### 2. API & Orchestration Layer (Backend)
- **FastAPI**: Acts as the central hub for handling WebSocket and REST requests.
- **CrewAI Engine**: Manages the agentic lifecycle, task assignment, and sequential/hierarchical processes.
- **Skill Loader**: Dynamically loads capabilities from the `/skills` directory to extend agent functionality.

### 3. Supervisor Layer (CEO Agent)
- **Autonomous Loop (`ceo.py`)**: A standalone supervisor script that monitors backend health, performs automated restarts, and manages Groq API backoff strategies.
- **Status Reporting**: Logs critical events to `MASTER_CONTEXT.md` and sends desktop notifications.

### 4. Persistence Layer (Supabase)
- **Memory Store**: Stores agent-specific long-term memories using Supabase's REST interface.
- **Reflection**: Periodically summarizes user interactions into "persistent core memories."

## Data Flow
1. **User Request**: User sends a message via the web UI.
2. **WebSocket Gateway**: The request enters `backend/main.py`.
3. **Pipeline Builder**: The backend determines the sequence of agents needed.
4. **Crew Execution**: CrewAI kicks off tasks for each agent.
5. **Real-time Streaming**: Tokens are streamed back to the UI as they are generated.
6. **Post-process**: Reflection logic extracts memories and updates Supabase.
7. **Supervisor Loop**: `ceo.py` monitors the entire process, ensuring uptime and reliability.

# External Integrations

This document details the external services and APIs that the Virtual Office project interacts with.

## AI & LLM Services
- **Groq API**:
  - **Models**: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`.
  - **Usage**: CrewAI orchestration, single-agent chatting, and memory reflection.
  - **Authentication**: `GROQ_API_KEY` in environment.

## Database & Persistence
- **Supabase**:
  - **Service**: PostgreSQL database (accessed via REST API/Supabase JS).
  - **Tables**: `vo_agent_memories` (stores persistent core memories for agents).
  - **Authentication**: `SUPABASE_URL` and `SUPABASE_KEY` (Anon/Service) in environment.

## Search & Information
- **DuckDuckGo**:
  - **Usage**: Provided via the `ddgs` library for real-time web search capabilities.
  - **Endpoint**: Accessed programmatically without a dedicated API key.

## Protocols
- **WebSocket (WS)**:
  - **Usage**: Real-time bidirectional communication between the React frontend and FastAPI backend.
  - **Features**: Token streaming, multi-agent pipeline notifications, and "Watercooler" events.
- **REST (HTTP)**:
  - **Usage**: Legacy chat fallback, skill management, agent state persistence, and layout configuration.

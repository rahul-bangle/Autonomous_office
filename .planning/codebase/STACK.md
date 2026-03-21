# Tech Stack

This document outlines the core technologies, runtimes, and dependencies used in the Virtual Office project.

## Languages & Runtimes
- **Python 3.11+**: Primary language for backend services and AI orchestration.
- **JavaScript (ESM)**: Used for the React frontend and Vite build system.
- **Node.js**: Runtime for frontend development and build tools.

## Frameworks & Libraries

### Backend
- **FastAPI**: High-performance web framework for building APIs with Python.
- **Uvicorn**: ASGI server implementation for running FastAPI.
- **CrewAI**: Framework for orchestrating role-playing, autonomous AI agents.
- **Httpx**: Modern HTTP client for Python, used for Supabase and external API calls.
- **Python-dotenv**: Management of environment variables.
- **DuckDuckGo-Search (ddgs)**: Library for programmatic web searching.

### Frontend
- **React 18**: UI library for building the web interface.
- **Vite**: Modern frontend build tool for fast development and bundling.
- **Supabase JS**: Client library for interacting with Supabase services.

## LLM Inference
- **Groq**: Used as the primary inference engine for Llama 3.3 and 3.1 models, providing high-speed agentic responses.

## Configuration Files
- `package.json`: Node dependencies and scripts.
- `vite.config.js`: Vite build configuration.
- `.env`: (Local only) Environment variables for API keys and database URLs.
- `.env.example`: Template for required environment variables.
- `MASTER_CONTEXT.md`: Project-level status, rules, and logs.

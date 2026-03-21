# Technical Concerns & Debt

This document identifies technical debt, known issues, and fragile areas in the Virtual Office project.

## Technical Debt

### 1. Monolithic Backend
- **Issue**: `backend/main.py` (632+ lines) is becoming a "God Object."
- **Responsibility**: It handles WebSockets, REST endpoints, CrewAI orchestration, Supabase interaction, and skill loading.
- **Recommendation**: Split into modular services (e.g., `services/orchestrator.py`, `api/websockets.py`, `persistence/supabase.py`).

### 2. Testing Infrastructure
- **Issue**: Complete lack of formal unit and integration tests.
- **Risk**: Regression bugs during refactoring are highly likely.
- **Recommendation**: Initialize `pytest` for the backend and `vitest` for the frontend.

### 3. Loose Coupling (Supervisor)
- **Issue**: `ceo.py` only monitors the backend via an HTTP health check.
- **Risk**: If the health check passes but WebSockets are hung, the supervisor won't detect the failure.
- **Recommendation**: Implement a more comprehensive heartbeat that exercises the WebSocket pipeline.

## Known Issues & Risks

### 1. LLM Response Reliability
- **Issue**: Llama-3 models occasionally fail to follow strict response formats.
- **Mitigation**: The `NO_REACT_RULE` is currently used, but adding Pydantic-based output validation (e.g., via Instructor or CrewAI's output parsing) would be more robust.

### 2. Memory Management
- **Issue**: Memory reflection is currently a "fire-and-forget" task after each interaction.
- **Risk**: Failure in reflection doesn't notify the user and can lead to lost context.

### 3. Security & Secrets
- **Issue**: Manual `.env` management only. Basic secret scanning exists but no structured secrets manager.
- **Recommendation**: Use a more secure approach for production deployment where environment variables are managed by a CI/CD or secrets platform.

## Fragile Areas
- **WebSocket Pipeline**: If any part of the CrewAI `kickoff` blocks or crashes, the WS connection may hang without a clear error message to the frontend.
- **Skill Loading**: Dynamic loading of `SKILL.md` via regex parsing is brittle. If a `SKILL.md` is malformed, it can prevent the backend from starting properly.

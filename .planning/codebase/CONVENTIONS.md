# Coding Conventions

This document defines the coding standards, naming conventions, and patterns used in the Virtual Office project.

## General Principles
- **No-REACT Rule**: Agents are strictly forbidden from using `THOUGHT:`, `ACTION:`, `RESULT:`, or `DECISION:` prefixes in their user-facing responses. Plain natural language only.
- **Transparency**: Agents must explicitly state which workflows and rules they are following (GSD Rule #7).
- **Conciseness**: Documentation and logs should be trimmed regularly to maintain context efficiency.

## Python (Backend & Supervisor)
- **Naming**: Use `snake_case` for functions, variables, and file names. Use `STUDLY_CAPS` for constants.
- **Concurrency**: Use `async`/`await` for all I/O bound operations (API calls, database queries, WebSockets).
- **Docstrings**: Encouraged for complex logic, especially in orchestration pipelines.
- **Logging**: Selective logging (e.g., in `ceo.py`) to prevent noise in `MASTER_CONTEXT.md`.

## JavaScript (Frontend)
- **Naming**: Use `camelCase` for variables and functions. Use `PascalCase` for React components.
- **State Management**: Use React Hooks (`useState`, `useEffect`) for component-level state.
- **ES Modules**: Always use `import`/`export` syntax.

## Architectural Patterns
- **Roleplaying**: Agents must adhere to their defined `role`, `goal`, and `backstory` as specified in the CrewAI setup.
- **Memory Reflection**: A post-interaction step where the agent summarizes the exchange into a single sentence for long-term storage in Supabase.
- **Skill-Based Expansion**: Adding new features should be done via the `/skills` directory rather than modifying the core engine where possible.

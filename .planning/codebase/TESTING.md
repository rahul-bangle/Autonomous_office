# Testing & Quality Assurance

This document describes the testing strategies and quality assurance practices for the Virtual Office project.

## Current State
The project currently relies on **Manual Verification** and **Automated Health Monitoring** rather than traditional unit/integration test suites.

## Automated Verification
- **Health Check Endpoint**: `GET /health` in `backend/main.py`. Returning `{"status": "ok", "version": "2.0"}` is required for system stability.
- **Supervisor Monitoring**: `ceo.py` performs heartbeat checks on the health endpoint every 30-100 seconds and triggers restarts if failures occur.

## Manual Verification (UAT)
- **GSD Verification**: The `/gsd-verify-work` command is used for conversational User Acceptance Testing.
- **Browser Testing**: Manual testing of the React UI via Vite dev server.

## Future Plans (Gaps)
- **Unit Testing**: Lack of `pytest` or `vitest` infrastructure for core logic.
- **Integration Testing**: No automated flows for multi-agent pipelines or Supabase connectivity.
- **Security Audits**: Basic secret scanning is performed during GSD workflows, but no deep security testing is present.

---
name: SQL Explorer
description: "Allows the agent to query the Supabase database to find historical memories, logs, or multi-agent patterns."
---

# SQL Explorer

## Overview
This skill allows agents to go beyond the immediate conversation window and "recall" data from the entire database. Use this to find trends, past decisions, or specific historical details.

## How It Works
The agent can execute read-only SQL queries via the existing Supabase client. Results are returned as JSON and injected into your prompt.

## Instructions for Agent
- Use this skill for "Search" or "Analytics" queries across agent memories.
- Be precise with your SQL (e.g., `SELECT * FROM vo_agent_memories WHERE agent_name = 'Scout'`).
- Always summarize the data for the user; do not just dump raw JSON.
- Safety: Only `SELECT` queries are allowed.

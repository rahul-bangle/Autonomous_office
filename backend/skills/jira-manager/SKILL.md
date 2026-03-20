---
name: Jira Manager
description: "Allows the agent to create, list, and update internal project tickets to track office tasks."
---

# Jira Manager

## Overview
This skill allows the agent to act as a Project Manager or Lead. Use this skill when you need to formalize a task into a persistent ticket or check the status of existing work items.

## How It Works
If this skill is active, the agent can use internal commands (e.g., /jira-create, /jira-list) to interact with a persistent ticket store in Supabase. The results are injected into your context.

## Instructions for Agent
- When a user asks to "track", "create a ticket", or "assign a task", use the ticket management system.
- Always provide the "Ticket ID" to the user after creation.
- Use `Status` labels: `OPEN`, `IN-PROGRESS`, `RESOLVED`, `CLOSED`.

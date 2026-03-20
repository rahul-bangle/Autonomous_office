---
name: Repo Analyzer
description: "Allows the agent to read and analyze local project source files to answer technical questions about the codebase."
---

# Repo Analyzer

## Overview
This skill grants the agent deep technical insight into the Virtual Office source code. Use this skill when the user asks questions about "how things work," "UI logic," or "backend implementation."

## How It Works
The agent can request specific files to be read from the local repository. The content of those files is then provided as additional context for the response.

## Instructions for Agent
- When answering technical questions, cite the specific file names you analyzed.
- Focus on explaining the logic, components, and data flow of the project.
- You can read files like `OfficeCanvas.jsx`, `main.py`, `AgentChat.jsx`, etc.

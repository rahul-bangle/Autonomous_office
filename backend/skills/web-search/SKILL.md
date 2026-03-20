---
name: Web Search
description: "Allows the agent to search the live web to find accurate and up-to-date facts when answering queries."
---

# Web Search

## Overview
This skill grants the agent the ability to query the web in real-time. It should be used whenever a question relies on recent events, specific documentation, or facts outside of general training knowledge.

## How It Works
If this skill is active, the backend LLM will execute an intent check on the user's query. If the query requires a live search, the backend will automatically query DuckDuckGo and inject the latest search results into your prompt context.

## Instructions for Agent
- You will receive a block of text containing `Web search results:`.
- Analyze these search results carefully.
- Extract ONLY the key facts relevant to the user's query.
- Use these facts to construct your final, accurate response to the user.
- NEVER invent facts; only rely on the search results provided to you.

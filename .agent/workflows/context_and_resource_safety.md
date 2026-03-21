---
name: context_and_resource_safety
trigger: When context limits constrain task complexity, during long-running sessions, when optimizing for i3 hardware (low RAM/CPU), or when asked to "optimize", "compress", "reduce tokens", or "improve efficiency".
source: |
  1. Agent-Skills-for-Context-Engineering/skills/context-optimization/SKILL.md
  2. Agent-Skills-for-Context-Engineering/skills/context-compression/SKILL.md
---

# 🛡️ Context and Resource Safety (i3 Guardian)

This workflow combines advanced optimization and compression techniques to maximize the effectiveness of the context window while ensuring the system remains responsive on resource-constrained hardware (dual-core i3, low RAM).

---

# PART 1: CONTEXT OPTIMIZATION TECHNIQUES

Context optimization extends the effective capacity of limited context windows through strategic compression, masking, caching, and partitioning. 

## Core Concepts (Priority Order)

1. **KV-cache optimization** — Reorder and stabilize prompt structure so the inference engine reuses cached Key/Value tensors. Zero quality risk, immediate cost and latency savings.
2. **Observation masking** — Replace verbose tool outputs with compact references once their purpose has been served. Tool outputs consume 80%+ of tokens.
3. **Compaction** — Summarize accumulated context when utilization exceeds 70%, then reinitialize with the summary.
4. **Context partitioning** — Split work across sub-agents with isolated contexts when a single window cannot hold the full problem.

---

### Detailed Optimization Topics

#### Compaction Strategies
Trigger compaction when context utilization exceeds 70%. Never compress the system prompt.
- **Tool outputs**: Extract key findings, metrics, error codes, and conclusions.
- **Conversational turns**: Retain decisions, commitments, and user preferences.
- **Retrieved documents**: Keep claims, facts, and data points relevant to the active task.

#### Observation Masking
Mask after 3+ turns: Replace verbose outputs whose key points have already been extracted with a compact reference: `[Obs:{ref_id} elided. Key: {summary}. Full content retrievable.]`
**Never mask**: Observations critical to the current task or those from the most recent turn.

#### KV-Cache Optimization (The i3 Friend)
Maximize prefix cache hits by structuring prompts:
1. System prompt (Stable prefix)
2. Tool definitions
3. Frequently reused templates/few-shots
4. Conversation history
5. Current query (Least stable)

#### Context Partitioning
Plan partitioning when estimated task context exceeds 60% of the window limit. Decompose into independent subtasks with structured results returned to a coordinator.

---

# PART 2: CONTEXT COMPRESSION STRATEGIES

The correct optimization target is **tokens per task**: total tokens consumed to complete a task, including re-fetching costs.

## Production-Ready Approaches

1. **Anchored Iterative Summarization**: For long-running sessions. Maintain structured, persistent summaries with explicit sections for session intent, file modifications, decisions, and next steps.
2. **Opaque Compression**: For short sessions where interpretability isn't needed. 99%+ compression but zero verification capability.
3. **Regenerative Full Summary**: For clear phase boundaries where readability matters.

---

### Critical: Structured Summarization Schema
Build summaries with these mandatory sections to prevent silent information loss:

```markdown
## Session Intent
[What the user is trying to accomplish]

## Files Modified
[Full paths + function names + what changed]

## Decisions Made
[Rationale + chosen approach]

## Current State
[Status of tests, progress against goal]

## Next Steps
[Explicit numbered list for next turns]
```

### Evaluation & Metrics
- **Recall Probe**: "What was the original error message?"
- **Artifact Probe**: "Which files have we modified?"
- **Continuity Probe**: Can work continue without re-fetching info?

---

## 🛑 GOTCHAS & ANTI-PATTERNS

1. **Whitespace breaks KV-cache**: Even a single prefix change invalidates the entire cache.
2. **Masking error outputs breaks debugging**: Suspend masking during active debugging.
3. **Telephone game**: Paraphrased summaries lose fidelity. Use filesystem coordination for shared state.
4. **Never compress tool definitions**: The agent will lose its ability to call tools.
5. **Artifact trail integrity**: Artifact references (paths, variable names) are the most likely to be lost in compression. Keep them verbatim in dedicated sections.

---

## Guidelines for the Agent

1. Measure context before optimizing (~70% utilization threshold).
2. Prioritize KV-cache stability (Keep system prompt fixed).
3. Use structured summaries for artifact tracking integrity.
4. Mask old tool outputs to free up space for current reasoning.
5. In case of doubt: re-fetch the file rather than guessing based on a weak summary.

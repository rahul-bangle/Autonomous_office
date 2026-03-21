---
name: mindset_and_reframing
trigger: BEFORE writing any code. Before any new feature. Before any architectural decision.
source: gstack (Garry Tan) plan-ceo-review + office-hours — logic extracted, bash removed
---

# 🧠 Mindset & Reframing Workflow

## RULE #0 — READ MASTER_CONTEXT FIRST
Always fetch before anything else:
https://raw.githubusercontent.com/rahul-bangle/Autonomous_office/refs/heads/main/MASTER_CONTEXT.md

---

## RULE #1 — REFRAME BEFORE YOU CODE

Never jump to implementation. Run this checklist first. Every time.

### OFFICE HOURS CHECK (CEO Hat)
Ask these before touching a single file:
1. "What is the actual pain here — not the symptom, the root cause?"
2. "What does the 10-star version of this look like?"
3. "What would happen if we did NOTHING?"
4. "Is this the right problem or a proxy problem?"

### PREMISE CHALLENGE (Founder Hat)
1. "What assumption are we making that could be wrong?"
2. "Is there a simpler framing that solves the same problem?"
3. "Does this move toward: py office/ceo.py → zero human input?"
4. "If not — is it truly necessary right now?"

---

## RULE #2 — SELECT YOUR MODE

Before starting any task, pick ONE mode. Commit to it. Do not drift.

```
┌─────────────────┬────────────────────────────────────────────────────┐
│ MODE            │ USE WHEN                                           │
├─────────────────┼────────────────────────────────────────────────────┤
│ 🚀 EXPANSION    │ New feature, greenfield, "think bigger"            │
│                 │ Ask: "What's 10x more ambitious for 2x effort?"    │
├─────────────────┼────────────────────────────────────────────────────┤
│ 🔍 SELECTIVE    │ Enhancement, iteration on existing system          │
│                 │ Hold scope + surface what else is possible         │
├─────────────────┼────────────────────────────────────────────────────┤
│ 🔒 HOLD SCOPE   │ Bug fix, hotfix, refactor                          │
│                 │ Scope is right — make it bulletproof               │
├─────────────────┼────────────────────────────────────────────────────┤
│ ✂️ REDUCTION    │ Plan is overbuilt or wrong                         │
│                 │ Find minimum viable version, cut everything else   │
└─────────────────┴────────────────────────────────────────────────────┘
```

**Default rules:**
- New feature → EXPANSION
- Fix/patch → HOLD SCOPE
- Touching >8 files → suggest REDUCTION first
- User says "keep it simple" → HOLD SCOPE or REDUCTION

---

## RULE #3 — PUT ON THE RIGHT HAT

| Hat | When | Question to ask |
|---|---|---|
| 🎯 Founder | New feature | "Should we build this at all?" |
| 🏗️ Architect | System design | "What's the minimal correct design?" |
| 👨💻 Developer | Implementation | "What's the smallest change that works?" |
| 🔍 Staff Engineer | Code review | "Race conditions? Edge cases? Silent failures?" |
| ✂️ Surgeon | Reduction mode | "What can we cut without losing core value?" |

---

## RULE #4 — IMPLEMENTATION ALTERNATIVES (MANDATORY)

Before writing code, produce 2 approaches minimum:

```
APPROACH A: [Name — Minimal]
  Summary: [1-2 sentences]
  Effort:  [S/M/L]
  Risk:    [Low/Med/High]
  Pros:    [2 bullets]
  Cons:    [2 bullets]

APPROACH B: [Name — Ideal]
  Summary: [1-2 sentences]
  Effort:  [S/M/L]
  Risk:    [Low/Med/High]
  Pros:    [2 bullets]
  Cons:    [2 bullets]

RECOMMENDATION: Choose [X] because [one line reason].
```

**Rule:** One approach must be minimal. One must be ideal. Pick one. Explain why.

---

## RULE #5 — COMPLETENESS PRINCIPLE

AI makes the cost of doing it RIGHT near-zero.

```
Human team: 2 days → With Gemini Flash + skills: ~30 min
Human team: 1 week → With Gemini Flash + skills: ~1 hour
```

Do NOT choose 80% solution when 100% costs 10 more minutes.
**Exception:** If it's an "ocean" (rewriting everything) → flag it, don't boil it.

---

## RULE #6 — COGNITIVE PATTERNS (Internalize These)

Do NOT checklist these. Let them shape your thinking.

1. **Inversion reflex** — For every "how do we win?" also ask "what would make us fail?"
2. **Focus as subtraction** — Primary value is what NOT to build. Default: fewer things, better.
3. **Speed calibration** — Fast is default. Slow down only for irreversible + high-magnitude decisions.
4. **Minimal diff** — Achieve goal with fewest new abstractions and files touched.
5. **Explicit over clever** — Code should be obvious, not impressive.

---

## RULE #7 — "NOT IN SCOPE" SECTION (MANDATORY)

Every plan MUST end with this section:

```
## NOT IN SCOPE
- [Thing considered] — Reason: [why deferred]
- [Thing considered] — Reason: [why deferred]
```

If you don't write this, scope creep will happen. Guaranteed.

---

## ANTI-PATTERNS — NEVER DO THESE

❌ Start coding without reframing first
❌ Skip the mode selection
❌ Add features that weren't asked for
❌ Forget to write "NOT IN SCOPE"
❌ Say "it depends" — always make a decision
❌ Touch OfficeCanvas.jsx without explicit trigger
❌ Change locked stack without Rahul approval

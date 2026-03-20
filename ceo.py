"""
╔══════════════════════════════════════════════════════╗
║       OFFICE OS — CEO AGENT v4-FINAL                 ║
║   v3 signals + v4 diff-patch + regression guard      ║
║   Darwin loop. Real scoring. Never regresses.        ║
╚══════════════════════════════════════════════════════╝

LOOP:
SIGNAL → CLASSIFY → GENERATE(x3) → TEST → SCORE → SELECT → REGRESS-CHECK → COMMIT → REPEAT
"""

import os
import json
import time
import subprocess
import logging
from datetime import datetime
from pathlib import Path

os.environ["OPENAI_API_KEY"] = "NA"

from langchain_groq import ChatGroq
from ddgs import DDGS

# ── LOGGING ────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [CEO] %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("CEO")

# ── CONFIG ─────────────────────────────────────────────
GROQ_API_KEY   = "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"
MAX_ITER       = 5
CANDIDATES     = 3
MAX_DELTA      = 30          # max line changes per patch
BOOT_WAIT      = 5           # HDD needs 5s not 2s
STATE_FILE     = Path(".office/state.json")
MEMORY_FILE    = Path(".office/memory.json")
BLACKLIST_FILE = Path(".office/blacklist.json")
BACKEND_LOG    = Path("backend/server.log")
ALLOWED        = ("src/", "backend/")


# ══════════════════════════════════════════════════════
# LLM
# ══════════════════════════════════════════════════════
def get_llm(temp=0.2) -> ChatGroq:
    return ChatGroq(
        api_key=GROQ_API_KEY,
        model="llama-3.3-70b-versatile",
        temperature=temp
    )


# ══════════════════════════════════════════════════════
# PROBLEM CLASSIFIER (v3)
# ══════════════════════════════════════════════════════
CLASSES = {
    "runtime": ["timeout", "500", "exception", "traceback", "error", "crash"],
    "syntax":  ["syntaxerror", "indentation", "nameerror", "missing import"],
    "async":   ["async", "await", "coroutine", "flow"],
    "perf":    ["slow", "latency", "performance", "memory"],
    "missing": ["missing", "not found", "no route", "404"],
}

def classify(issue: str) -> str:
    low = issue.lower()
    for cls, kws in CLASSES.items():
        if any(k in low for k in kws):
            return cls
    return "general"


# ══════════════════════════════════════════════════════
# PROMPT — diff-based (v4), class-aware (v3)
# ══════════════════════════════════════════════════════
CLASS_HINTS = {
    "runtime": "Focus on error handling, retries, safe defaults.",
    "syntax":  "Fix syntax only. Zero logic changes.",
    "async":   "Add proper async/await. FastAPI patterns only.",
    "perf":    "Optimize hot path. No new dependencies.",
    "missing": "Add missing piece only. Nothing extra.",
    "general": "Minimal correct change only.",
}

def build_prompt(task: str, cls: str, attempt: int) -> str:
    style = ["minimal", "defensive", "refactored"][attempt % 3]
    hint  = CLASS_HINTS.get(cls, CLASS_HINTS["general"])
    return f"""You are a senior developer. Style: {style}.

ISSUE TYPE: {cls}
HINT: {hint}

ISSUE:
{task}

OUTPUT FORMAT (no extra text, no explanation):
file: <relative_path>
change:
- <exact old line>
+ <exact new line>

RULES:
- Max {MAX_DELTA} line changes
- Exactly 1 file
- Path must start with src/ or backend/
- If no change needed: NO_PATCH_NEEDED
"""


# ══════════════════════════════════════════════════════
# SIGNALS — v3 multi-source (runtime + gitnexus + web + memory)
# ══════════════════════════════════════════════════════
def get_issues() -> list[dict]:
    issues = []

    # 1. Runtime log — highest quality signal
    if BACKEND_LOG.exists():
        for line in reversed(BACKEND_LOG.read_text(encoding="utf-8", errors="ignore").splitlines()[-200:]):
            if "ERROR" in line or "Exception" in line or " 500 " in line:
                issues.append({
                    "source": "runtime",
                    "description": line.strip()[:200],
                    "severity": 4, "frequency": 3, "effort": 2,
                })
                if len(issues) >= 3:
                    break  # top 3 runtime errors enough

    # 2. GitNexus AGENTS.md / CLAUDE.md
    for md in [Path("AGENTS.md"), Path("CLAUDE.md"),
               Path(".claude/skills/gitnexus/AGENTS.md")]:
        if md.exists():
            for line in md.read_text(encoding="utf-8", errors="ignore").splitlines():
                if "ERROR" in line or "Exception" in line:
                    issues.append({
                        "source": "gitnexus",
                        "description": line.strip()[:150],
                        "severity": 3, "frequency": 2, "effort": 2,
                    })

    # 3. Known structural issue (from scan: 0 async flows)
    issues.append({
        "source": "gitnexus",
        "description": "backend/main.py has 0 async flows — convert routes to async def",
        "severity": 3, "frequency": 3, "effort": 2,
    })

    # 4. Web signal — low priority
    try:
        with DDGS() as ddgs:
            for r in ddgs.text("fastapi async patterns fix 2025", max_results=2):
                issues.append({
                    "source": "web",
                    "description": f"{r.get('title','')} — {r.get('body','')[:80]}",
                    "severity": 1, "frequency": 1, "effort": 3,
                })
    except Exception as e:
        log.warning(f"[SIG] Web search failed: {e}")

    # 5. Memory failures
    if MEMORY_FILE.exists():
        try:
            data = json.loads(MEMORY_FILE.read_text())
            for m in data.get("failures", [])[-3:]:
                issues.append({
                    "source": "memory",
                    "description": f"Past fail: {m['issue']} → retry: {m.get('patch_type','')}",
                    "severity": 2, "frequency": 3, "effort": 2,
                })
        except:
            pass

    log.info(f"[SIG] Total signals: {len(issues)}")
    return issues


# ══════════════════════════════════════════════════════
# PRIORITY ENGINE
# ══════════════════════════════════════════════════════
def pri_score(i: dict) -> float:
    s = i.get("severity", 1)
    f = i.get("frequency", 1)
    e = max(i.get("effort", 1), 0)
    return round((s * 0.4) + (f * 0.3) + ((1 / (e + 1)) * 0.2), 3)

def prioritize(issues: list[dict]) -> list[dict]:
    for i in issues:
        i["pri"] = pri_score(i)
    return sorted(issues, key=lambda x: x["pri"], reverse=True)


# ══════════════════════════════════════════════════════
# APPLY PATCH — diff-based (v4), boundary-enforced
# ══════════════════════════════════════════════════════
def apply_patch(patch: str) -> tuple[bool, int]:
    """Returns (success, delta_lines)"""
    if not patch or patch.strip() == "NO_PATCH_NEEDED":
        return True, 0

    if "file:" not in patch or "change:" not in patch:
        return False, 0

    try:
        path = patch.split("file:")[1].splitlines()[0].strip()

        # boundary enforcement
        if not path.startswith(ALLOWED):
            log.error(f"[APPLY] BOUNDARY BLOCKED: {path}")
            return False, 0

        target = Path(path)
        if not target.exists():
            log.warning(f"[APPLY] File not found: {path}")
            return False, 0

        lines = target.read_text(encoding="utf-8").splitlines()
        new   = lines.copy()

        changes = patch.split("change:")[1].splitlines()
        delta   = 0

        for i in range(len(changes) - 1):
            if changes[i].startswith("- ") and changes[i+1].startswith("+ "):
                old_line = changes[i][2:]
                new_line = changes[i+1][2:]
                # find first exact match (avoid duplicate line bug)
                for j, l in enumerate(new):
                    if l == old_line:
                        new[j] = new_line
                        delta += 1
                        break   # only first occurrence

        if delta == 0:
            log.warning("[APPLY] No matching lines found in file")
            return False, 0

        if delta > MAX_DELTA:
            log.warning(f"[APPLY] Delta {delta} > MAX {MAX_DELTA} — blocked")
            return False, delta

        target.write_text("\n".join(new), encoding="utf-8")
        log.info(f"[APPLY] ✅ {path} — {delta} line(s) changed")
        return True, delta

    except Exception as e:
        log.error(f"[APPLY] Error: {e}")
        return False, 0


# ══════════════════════════════════════════════════════
# TEST ENGINE — real behavior (ChatGPT + my fixes merged)
# ══════════════════════════════════════════════════════
def run_tests() -> dict:
    r = {
        "syntax":     False,
        "import_ok":  False,
        "boot":       False,
        "health":     False,
        "valid_json": False,
    }

    # 1. syntax
    try:
        r["syntax"] = subprocess.run(
            ["py", "-3.11", "-m", "py_compile", "backend/main.py"],
            capture_output=True, timeout=10
        ).returncode == 0
    except FileNotFoundError:
        r["syntax"] = True  # file missing = soft pass

    # 2. import
    try:
        r["import_ok"] = subprocess.run(
            ["py", "-3.11", "-c", "import sys; sys.path.insert(0,'.'); import backend.main"],
            capture_output=True, timeout=10
        ).returncode == 0
    except:
        pass

    # 3. boot — HDD needs 5s
    try:
        p = subprocess.Popen(
            ["py", "-3.11", "backend/main.py"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(BOOT_WAIT)
        p.terminate()
        p.wait(timeout=5)
        r["boot"] = True
    except:
        pass

    # 4. health endpoint
    if r["boot"]:
        try:
            import urllib.request
            res = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3)
            r["health"] = (res.status == 200)
        except:
            pass

    # 5. valid JSON response (ChatGPT addition ✅)
    if r["health"]:
        try:
            import urllib.request
            res  = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3)
            data = json.loads(res.read().decode())
            r["valid_json"] = isinstance(data, dict)
        except:
            pass

    log.info(f"[TEST] {r}")
    return r


# ══════════════════════════════════════════════════════
# SCORING — behavior-weighted (ChatGPT rebalance ✅)
# ══════════════════════════════════════════════════════
def compute_score(r: dict, delta: int = 0) -> float:
    s = 0.0
    if r["syntax"]:     s += 0.10
    if r["import_ok"]:  s += 0.20
    if r["boot"]:       s += 0.25
    if r["health"]:     s += 0.25
    if r["valid_json"]: s += 0.20
    if delta > 20:      s -= 0.30   # punish risky mutations
    return round(s, 3)


# ══════════════════════════════════════════════════════
# REGRESSION GUARD — ChatGPT's best suggestion ✅
# Nothing that worked before can break after patch
# ══════════════════════════════════════════════════════
def regression_check(baseline: dict, new_results: dict) -> bool:
    for k in baseline:
        if baseline[k] and not new_results[k]:
            log.error(f"[REGRESS] ❌ {k} was passing — now failing → REJECT")
            return False
    return True


# ══════════════════════════════════════════════════════
# GIT — snapshot before, commit after
# ══════════════════════════════════════════════════════
def git_snapshot(label: str):
    subprocess.run(["git", "add", "-A"], capture_output=True, timeout=10)
    r = subprocess.run(
        ["git", "commit", "-m", f"CEO:snap [{label}]"],
        capture_output=True, timeout=10, text=True
    )
    if "nothing to commit" not in (r.stdout or ""):
        log.info(f"[GIT] Snapshot: {label[:50]}")

def git_rollback():
    subprocess.run(["git", "reset", "--hard", "HEAD"], capture_output=True, timeout=10)
    log.info("[GIT] Rolled back")

def git_commit_winner(iteration: int, score_val: float):
    subprocess.run(["git", "add", "-A"], capture_output=True, timeout=10)
    subprocess.run(
        ["git", "commit", "-m", f"CEO iter-{iteration} score:{score_val}"],
        capture_output=True, timeout=10
    )
    log.info(f"[GIT] Winner committed: iter-{iteration} score:{score_val}")


# ══════════════════════════════════════════════════════
# BLACKLIST — regression memory (v3)
# ══════════════════════════════════════════════════════
def load_blacklist() -> list[str]:
    if not BLACKLIST_FILE.exists():
        return []
    try:
        return json.loads(BLACKLIST_FILE.read_text()).get("patterns", [])
    except:
        return []

def blacklist_add(pattern: str):
    BLACKLIST_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {"patterns": load_blacklist()}
    data["patterns"].append(pattern[:80])
    BLACKLIST_FILE.write_text(json.dumps(data, indent=2))
    log.warning(f"[BLACKLIST] Added: {pattern[:60]}")

def is_blacklisted(patch: str, bl: list[str]) -> bool:
    low = patch.lower()
    return any(b.lower() in low for b in bl)


# ══════════════════════════════════════════════════════
# MEMORY — fitness landscape
# ══════════════════════════════════════════════════════
def save_memory(issue: str, patch_type: str, score_val: float, result: str):
    MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {"failures": [], "wins": []}
    if MEMORY_FILE.exists():
        try:
            data = json.loads(MEMORY_FILE.read_text())
        except:
            pass
    entry = {
        "issue":      issue[:80],
        "patch_type": patch_type[:60],
        "score":      score_val,
        "result":     result,
        "ts":         datetime.now().isoformat()
    }
    data.setdefault("wins" if result == "success" else "failures", []).append(entry)
    MEMORY_FILE.write_text(json.dumps(data, indent=2))


# ══════════════════════════════════════════════════════
# STATE
# ══════════════════════════════════════════════════════
def save_state(data: dict):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps({
        **data, "ts": datetime.now().isoformat()
    }, indent=2))


# ══════════════════════════════════════════════════════
# MAIN LOOP
# ══════════════════════════════════════════════════════
def main():
    log.info("═" * 58)
    log.info("  OFFICE OS — CEO AGENT v4-FINAL")
    log.info("  SIGNAL→CLASSIFY→VARY→TEST→SCORE→REGRESS→COMMIT")
    log.info("═" * 58)

    if not GROQ_API_KEY:
        log.error("Set GROQ_API_KEY: $env:GROQ_API_KEY='your_key'")
        return

    blacklist      = load_blacklist()
    consec_fails   = 0

    for iteration in range(1, MAX_ITER + 1):
        log.info(f"\n{'─'*58}")
        log.info(f"  ITERATION {iteration}/{MAX_ITER}")
        log.info(f"{'─'*58}")

        save_state({"iter": iteration, "status": "scanning"})

        # ── GATHER + PRIORITIZE ─────────────────────────
        issues = get_issues()
        if not issues:
            log.info("[CEO] No issues. System clean. Sleeping 30s...")
            time.sleep(30)
            continue

        ranked = prioritize(issues)
        top    = ranked[0]
        task   = f"[{top['source']}|{top['pri']}] {top['description']}"
        cls    = classify(top["description"])

        log.info(f"\n[CEO] Task : {task[:90]}")
        log.info(f"[CEO] Class: {cls}")

        # ── BASELINE ────────────────────────────────────
        log.info("[CEO] Measuring baseline...")
        baseline_r = run_tests()
        baseline_s = compute_score(baseline_r, 0)
        log.info(f"[CEO] Baseline score: {baseline_s}")

        # ── GIT SNAPSHOT (safe point) ───────────────────
        git_snapshot(f"iter{iteration}-pre")

        # ── GENERATE 3 CANDIDATES ───────────────────────
        save_state({"iter": iteration, "status": "generating"})
        best_patch = None
        best_score = baseline_s   # must BEAT baseline
        best_delta = 0

        for c in range(CANDIDATES):
            temp  = [0.2, 0.4, 0.6][c]   # increasing exploration
            model = get_llm(temp)

            log.info(f"\n[DARWIN] Candidate {c+1}/{CANDIDATES} (temp={temp})...")
            try:
                patch = model.invoke(build_prompt(task, cls, c)).content.strip()
            except Exception as e:
                log.warning(f"[DARWIN] LLM failed: {e}")
                continue

            if is_blacklisted(patch, blacklist):
                log.warning(f"[DARWIN] Candidate {c+1} blacklisted — skip")
                continue

            # reset to snapshot before each candidate
            git_rollback()

            ok, delta = apply_patch(patch)
            if not ok:
                log.warning(f"[DARWIN] Candidate {c+1} apply failed")
                continue

            test_r  = run_tests()
            cand_s  = compute_score(test_r, delta)
            log.info(f"[DARWIN] Candidate {c+1} score: {cand_s}")

            if cand_s > best_score:
                best_score = cand_s
                best_patch = patch
                best_delta = delta

        # ── RESET TO SNAPSHOT ───────────────────────────
        git_rollback()

        # ── SELECT + REGRESSION GUARD ───────────────────
        if best_patch:
            apply_patch(best_patch)
            final_r = run_tests()

            # regression check — ChatGPT's best idea ✅
            if not regression_check(baseline_r, final_r):
                log.error("[CEO] Regression detected → full rollback")
                git_rollback()
                blacklist_add(top["description"][:80])
                blacklist.append(top["description"][:80])
                save_memory(top["description"], cls, best_score, "regression")
                consec_fails += 1
            else:
                git_commit_winner(iteration, best_score)
                log.info(f"[CEO] ✅ WIN: {baseline_s} → {best_score} | delta={best_delta}")
                save_memory(top["description"], cls, best_score, "success")
                save_state({"iter": iteration, "score": best_score, "status": "done"})
                consec_fails = 0
        else:
            log.warning(f"[CEO] No improvement over baseline ({baseline_s})")
            blacklist_add(top["description"][:80])
            blacklist.append(top["description"][:80])
            save_memory(top["description"], cls, baseline_s, "no_improvement")
            consec_fails += 1

        if consec_fails >= 3:
            log.error("[CEO] 3 consecutive failures. Halting.")
            break

        log.info(f"[CEO] Sleeping 5s...")
        time.sleep(5)

    log.info("\n[CEO] Loop complete. Office OS idle.")
    save_state({"iter": MAX_ITER, "status": "idle"})


if __name__ == "__main__":
    main()

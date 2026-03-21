"""
╔══════════════════════════════════════════════════════╗
║       OFFICE OS — CEO AGENT v5-FINAL                 ║
║   SELF-SCANNING: Khud dhundta hai problems           ║
║   Fuzzy patch. Anti-junk. No fake signals.           ║
╚══════════════════════════════════════════════════════╝

LOOP:
SCAN → DETECT → CLASSIFY → VARY(x3) → TEST → SCORE → SELECT → COMMIT → REPEAT
"""

import os
import ast
import json
import time
import subprocess
import logging
import urllib.request
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
import socket

os.environ["OPENAI_API_KEY"] = "NA"

from groq import Groq

# ── LOGGING ────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [CEO] %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("CEO")

# ── CONFIG ─────────────────────────────────────────────
load_dotenv() # Load from .env
GROQ_API_KEY   = os.environ.get("GROQ_API_KEY")
GITHUB_TOKEN   = os.environ.get("GITHUB_TOKEN")
MAX_ITER       = 5
CANDIDATES     = 3
BOOT_WAIT      = 5
STATE_FILE     = Path(".office/state.json")
MEMORY_FILE    = Path(".office/memory.json")
BLACKLIST_FILE = Path(".office/blacklist.json")
BACKEND_LOG    = Path("backend/server.log")
BACKEND_MAIN   = Path("backend/main.py")
AG_SKILLS_JSON = Path("../AG_Skills/skills_index.json") # Relative to Virtual_office
ALLOWED        = ("src/", "backend/")


# ── MASTER CONTEXT HOOKS ──────────────────────────────
def ceo_cycle_start(iteration, task):
    try:
        mc_path = Path("MASTER_CONTEXT.md")
        if mc_path.exists():
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            log_entry = f"\n[ {timestamp} ] CEO_CYCLE_START: Iteration {iteration}\nTASK: {task}\nSTATUS: 🔄 in_progress\n"
            with open(mc_path, "a", encoding="utf-8") as f:
                f.write(log_entry)
            print(f"📟 Logged cycle start to MASTER_CONTEXT.md")
    except Exception as e:
        print(f"Failed to log to MASTER_CONTEXT: {e}")

def ceo_cycle_end(iteration, result, score):
    try:
        mc_path = Path("MASTER_CONTEXT.md")
        if mc_path.exists():
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            status_icon = "✅" if result == "success" else "❌"
            log_entry = f"[ {timestamp} ] CEO_CYCLE_END: Iteration {iteration}\nRESULT: {status_icon} {result}\nSCORE: {score}\n"
            with open(mc_path, "a", encoding="utf-8") as f:
                f.write(log_entry)
            print(f"📟 Logged cycle end to MASTER_CONTEXT.md")
    except Exception as e:
        print(f"Failed to log to MASTER_CONTEXT: {e}")

# ── LLM ───────────────────────────────────────────────
# Global Groq Client
client = Groq(api_key=GROQ_API_KEY)

def get_llm_response(prompt: str, temp=0.2) -> str:
    """Native Groq SDK call for reliability and speed."""
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=temp,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        log.error(f"Groq API Error: {e}")
        return ""

def load_ag_skills() -> str:
    """Read names and descriptions from AG_Skills to prevent hallucinations."""
    if not AG_SKILLS_JSON.exists():
        log.warning(f"AG_Skills not found at {AG_SKILLS_JSON}")
        return "Generic Python Fixer | AI Agent | default-skill"
    try:
        data = json.loads(AG_SKILLS_JSON.read_text(encoding="utf-8"))
        # Get top 30 most relevant looking skills for the planner
        skills_summary = ""
        for s in data[:30]:
            skills_summary += f"- {s['name']}: {s['description'][:100]}\n"
        return skills_summary
    except Exception as e:
        log.error(f"Failed to load AG_Skills: {e}")
        return "Generic Python Fixer | AI Agent | default-skill"


# ══════════════════════════════════════════════════════
# SELF-SCANNER — real problems only
# ══════════════════════════════════════════════════════

def scan_syntax(filepath: Path) -> list[dict]:
    issues = []
    if not filepath.exists():
        return issues
    try:
        ast.parse(filepath.read_text(encoding="utf-8"))
    except SyntaxError as e:
        issues.append({
            "source": "syntax_scan",
            "description": f"{filepath}: SyntaxError line {e.lineno} — {e.msg}",
            "severity": 5, "frequency": 5, "effort": 1,
        })
    return issues


def scan_missing_endpoints(filepath: Path) -> list[dict]:
    issues = []
    if not filepath.exists():
        return issues
    source = filepath.read_text(encoding="utf-8", errors="ignore")
    required = {
        "/health":   '@app.get("/health")',
        "/api/chat": '@app.post("/api/chat")',
    }
    for endpoint, pattern in required.items():
        if pattern not in source:
            issues.append({
                "source": "endpoint_scan",
                "description": f"backend/main.py missing endpoint: {endpoint} — add {pattern} returning JSON",
                "severity": 4, "frequency": 4, "effort": 1,
            })
    return issues


def scan_import_errors(filepath: Path) -> list[dict]:
    issues = []
    if not filepath.exists():
        return issues
    try:
        result = subprocess.run(
            ["py", "-3.11", "-m", "py_compile", str(filepath)],
            capture_output=True, timeout=15, text=True
        )
        if result.returncode != 0:
            for line in result.stderr.strip().splitlines()[-3:]:
                if "Error" in line or "error" in line:
                    issues.append({
                        "source": "import_scan",
                        "description": f"backend/main.py compile error: {line.strip()[:150]}",
                        "severity": 4, "frequency": 3, "effort": 2,
                    })
    except Exception as e:
        log.warning(f"[SCAN] Import scan failed: {e}")
    return issues


def scan_runtime_log() -> list[dict]:
    issues = []
    if not BACKEND_LOG.exists():
        return issues
    lines = BACKEND_LOG.read_text(encoding="utf-8", errors="ignore").splitlines()[-200:]
    for line in reversed(lines):
        if "ERROR" in line or "Exception" in line or " 500 " in line:
            issues.append({
                "source": "runtime_log",
                "description": line.strip()[:200],
                "severity": 4, "frequency": 3, "effort": 2,
            })
            if len(issues) >= 3:
                break
    return issues


def scan_live_endpoints() -> list[dict]:
    issues = []
    for url, name in [
        ("http://127.0.0.1:8000/health", "/health"),
        ("http://127.0.0.1:8000/api/skills", "/api/skills"),
    ]:
        try:
            res = urllib.request.urlopen(url, timeout=2)
            if res.status != 200:
                issues.append({
                    "source": "live_scan",
                    "description": f"Endpoint {name} returned {res.status} — should be 200",
                    "severity": 3, "frequency": 3, "effort": 1,
                })
        except urllib.error.HTTPError as e:
            issues.append({
                "source": "live_scan",
                "description": f"Endpoint {name} HTTP {e.code} — fix the route handler",
                "severity": 3, "frequency": 3, "effort": 1,
            })
        except Exception:
            pass
    return issues


def scan_code_quality(filepath: Path) -> list[dict]:
    issues = []
    if not filepath.exists():
        return issues
    lines = filepath.read_text(encoding="utf-8", errors="ignore").splitlines()
    bare = [i+1 for i, l in enumerate(lines) if l.strip() == "except:"]
    if bare:
        issues.append({
            "source": "quality_scan",
            "description": f"backend/main.py line(s) {bare[:3]}: bare except — use except Exception as e",
            "severity": 2, "frequency": 2, "effort": 1,
        })
    return issues


def scan_memory() -> list[dict]:
    issues = []
    if not MEMORY_FILE.exists():
        return issues
    try:
        data = json.loads(MEMORY_FILE.read_text())
        for m in data.get("failures", [])[-3:]:
            issues.append({
                "source": "memory",
                "description": f"Past fail: {m['issue']} — retry with different approach",
                "severity": 2, "frequency": 3, "effort": 2,
            })
    except:
        pass
    return issues


def gather_all_issues() -> list[dict]:
    log.info("[SCAN] Self-scanning codebase...")
    all_issues = (
        scan_syntax(BACKEND_MAIN) +
        scan_missing_endpoints(BACKEND_MAIN) +
        scan_import_errors(BACKEND_MAIN) +
        scan_runtime_log() +
        scan_live_endpoints() +
        scan_code_quality(BACKEND_MAIN) +
        scan_memory()
    )
    seen, unique = set(), []
    for i in all_issues:
        key = i["description"][:60]
        if key not in seen:
            seen.add(key)
            unique.append(i)
    log.info(f"[SCAN] {len(unique)} real issues found")
    for i in unique:
        log.info(f"  [{i['source']}] {i['description'][:80]}")
    return unique


# ══════════════════════════════════════════════════════
# PRIORITY + CLASSIFY
# ══════════════════════════════════════════════════════
CLASSES = {
    "syntax":  ["syntaxerror", "compile error", "indentation"],
    "missing": ["missing endpoint", "not found", "no route", "404"],
    "runtime": ["500", "exception", "traceback", "error", "crash"],
    "async":   ["async", "await", "sync route"],
    "quality": ["bare except", "code smell"],
}

def classify(issue: str) -> str:
    low = issue.lower()
    for cls, kws in CLASSES.items():
        if any(k in low for k in kws):
            return cls
    return "general"

def pri_score(i: dict) -> float:
    s = i.get("severity", 1)
    f = i.get("frequency", 1)
    e = max(i.get("effort", 1), 0)
    return round((s * 0.4) + (f * 0.3) + ((1 / (e + 1)) * 0.2), 3)

def prioritize(issues: list[dict]) -> list[dict]:
    # memory = guidance only, not priority
    issues = [i for i in issues if i["source"] != "memory"]
    if not issues:
        return []
    for i in issues:
        i["pri"] = pri_score(i)
    ranked = sorted(issues, key=lambda x: x["pri"], reverse=True)
    if ranked:
        log.info(f"[PRI] Top → [{ranked[0]['pri']}] {ranked[0]['description'][:70]}")
    return ranked

def force_goal_issue(issues: list[dict]) -> dict:
    for i in issues:
        if "/health" in i["description"]:
            return i
    return None


# ══════════════════════════════════════════════════════
# PROMPT — actual file content inject
# ══════════════════════════════════════════════════════
GOAL = "health endpoint must return 200 with valid JSON"

CLASS_HINTS = {
    "syntax":  "Fix syntax only. Zero logic changes.",
    "missing": "Add the missing endpoint. Return JSON. Minimal.",
    "runtime": "Fix error handling. Add safe defaults.",
    "async":   "Convert sync def to async def. FastAPI pattern.",
    "quality": "Fix code quality. Surgical change only.",
    "general": "Minimal correct change.",
}

def build_prompt(task: str, cls: str, attempt: int, skill: str = "default-skill") -> str:
    style = ["minimal", "defensive", "refactored"][attempt % 3]
    hint  = CLASS_HINTS.get(cls, CLASS_HINTS["general"])

    file_context = ""
    for p in [Path("backend/main.py"), Path("src/App.jsx")]:
        if p.exists():
            content = p.read_text(encoding="utf-8", errors="ignore")
            file_context += f"\n\nCURRENT FILE ({p}):\n```\n{content[:4000]}\n```"

    return f"""You are a senior developer. Style: {style}.
SYSTEM GOAL: {GOAL}
ASSIGNED SKILL: {skill}

ISSUE TYPE: {cls}
HINT: {hint}

ISSUE:
{task}
{file_context}

OUTPUT FORMAT — exactly this, nothing else:
file: <relative_path>
change:
- <EXACT line from file above>
+ <new replacement line>

RULES:
- Max 10 line changes
- 1 file only
- Path starts with src/ or backend/
- "- " line must EXACTLY match a line in the file shown
- If nothing to change: NO_PATCH_NEEDED
"""

def generate_plan(issues: list[dict], skills_list: str) -> list[dict]:
    """Create a multi-step plan in task | agent | skill format."""
    log.info("[PLANNER] Generating multi-step execution plan...")
    issues_text = "\n".join([f"- [{i['source']}] {i['description']}" for i in issues[:10]])
    
    prompt = f"""You are the CEO Architect. Decompose these issues into a logical multi-step plan.
Each step must follow this format: task | agent | skill

AVAILABLE SKILLS:
{skills_list}

DETECTED ISSUES:
{issues_text}

PLANNING RULES:
1. Group related issues into single tasks where possible.
2. Order tasks by logical dependency (e.g. fix syntax first).
3. Every task MUST use a skill from the AVAILABLE SKILLS list.
4. If no specific skill matches, use 'default-skill'.

OUTPUT FORMAT:
task | agent | skill
task | agent | skill

Example:
Fix health endpoint syntax | Developer | python-expert
Add missing login route | Backend Architect | flask-patterns
"""
    try:
        res = get_llm_response(prompt, 0.1)
        plan = []
        for line in res.splitlines():
            if "|" in line:
                parts = [p.strip() for p in line.split("|")]
                if len(parts) == 3:
                    plan.append({"task": parts[0], "agent": parts[1], "skill": parts[2]})
        
        log.info(f"[PLANNER] Created {len(plan)} tasks")
        for i, t in enumerate(plan):
            log.info(f"  {i+1}. [{t['skill']}] {t['task']}")
            
        # Log to MASTER_CONTEXT
        mc_path = Path("MASTER_CONTEXT.md")
        if mc_path.exists():
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            log_entry = f"\n[ {timestamp} ] CEO_PLAN_GENERATED: {len(plan)} tasks queued.\n"
            with open(mc_path, "a", encoding="utf-8") as f:
                f.write(log_entry)

        return plan
    except Exception as e:
        log.error(f"[PLANNER] Failed to generate plan: {e}")
        return []


# ══════════════════════════════════════════════════════
# APPLY PATCH — fuzzy + auto-discover + anti-junk
# ══════════════════════════════════════════════════════
def apply_patch(patch: str) -> tuple[bool, int]:
    if not patch or patch.strip() == "NO_PATCH_NEEDED":
        return True, 0
    if "file:" not in patch or "change:" not in patch:
        return False, 0
    try:
        path = patch.split("file:")[1].splitlines()[0].strip()

        # boundary check
        if not path.startswith(ALLOWED):
            log.error(f"[APPLY] BOUNDARY BLOCKED: {path}")
            return False, 0

        # auto-discover if exact path not found
        target = Path(path)
        if not target.exists():
            for p in Path("backend").rglob("*.py"):
                if "main" in p.name or "app" in p.name:
                    target = p
                    log.info(f"[APPLY] Auto-discovered: {target}")
                    break

        if not target.exists():
            log.error(f"[APPLY] File not found: {path}")
            return False, 0

        lines   = target.read_text(encoding="utf-8").splitlines()
        new     = lines.copy()
        changes = patch.split("change:")[1].splitlines()
        delta   = 0

        for i in range(len(changes) - 1):
            if changes[i].startswith("- ") and changes[i+1].startswith("+ "):
                old_line = changes[i][2:].strip()  # fuzzy strip
                new_line = changes[i+1][2:]
                for j, l in enumerate(new):
                    if l.strip() == old_line or old_line in l:
                        new[j] = new_line
                        delta += 1
                        break
                # NO append fallback — no junk injection

        if delta == 0:
            log.warning("[APPLY] No matching lines found")
            return False, 0

        if delta > 10:  # anti-junk
            log.warning(f"[APPLY] Too many changes ({delta}) → reject")
            return False, delta

        target.write_text("\n".join(new), encoding="utf-8")
        log.info(f"[APPLY] ✅ {target} — {delta} line(s) changed")
        return True, delta

    except Exception as e:
        log.error(f"[APPLY] Error: {e}")
        return False, 0


# ══════════════════════════════════════════════════════
# TEST ENGINE
# ══════════════════════════════════════════════════════
def is_port_open(port=8000):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1.0)
        return s.connect_ex(("127.0.0.1", port)) == 0

def run_tests() -> dict:
    r = {
        "syntax":     False,
        "import_ok":  False,
        "boot":       False,
        "health":     False,
        "valid_json": False,
    }

    try:
        r["syntax"] = subprocess.run(
            ["py", "-3.11", "-m", "py_compile", "backend/main.py"],
            capture_output=True, timeout=10
        ).returncode == 0
    except FileNotFoundError:
        r["syntax"] = True

    try:
        r["import_ok"] = subprocess.run(
            ["py", "-3.11", "-c",
             "import sys; sys.path.insert(0,'.'); import backend.main"],
            capture_output=True, timeout=15
        ).returncode == 0
    except:
        pass

    try:
        p = subprocess.Popen(
            ["py", "-3.11", "backend/main.py"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        # Poll for port
        for _ in range(BOOT_WAIT):
            if is_port_open(8000):
                r["boot"] = True
                break
            time.sleep(1)
            
        p.terminate()
        p.wait(timeout=5)
    except Exception as e:
        log.warning(f"[TEST] Boot check error: {e}")

    if r["boot"]:
        try:
            res = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3)
            r["health"] = (res.status == 200)
        except:
            pass

    if r["health"]:
        try:
            res  = urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=3)
            data = json.loads(res.read().decode())
            r["valid_json"] = isinstance(data, dict)
        except:
            pass

    log.info(f"[TEST] {r}")
    return r


def compute_score(r: dict, delta: int = 0) -> float:
    s = 0.0
    if r["syntax"]:     s += 0.1
    if r["import_ok"]:  s += 0.2
    if r["boot"]:       s += 0.2
    if r["health"]:     s += 0.3
    if r["valid_json"]: s += 0.2
    return round(s, 3)


def regression_check(baseline: dict, new_r: dict) -> bool:
    for k in baseline:
        if baseline[k] and not new_r[k]:
            log.error(f"[REGRESS] ❌ {k} was OK — now failing → REJECT")
            return False
    return True


# ══════════════════════════════════════════════════════
# GIT
# ══════════════════════════════════════════════════════
def git_snapshot(label: str):
    subprocess.run(["git", "add", "-A"], capture_output=True, timeout=10)
    r = subprocess.run(
        ["git", "commit", "-m", f"CEO:snap [{label}]"],
        capture_output=True, timeout=10, text=True
    )
    if "nothing to commit" not in (r.stdout or ""):
        log.info(f"[GIT] Snapshot: {label[:40]}")

def git_rollback():
    subprocess.run(
        ["git", "reset", "--hard", "HEAD"],
        capture_output=True, timeout=10
    )
    log.info("[GIT] Rolled back")

def git_commit_winner(iteration: int, score: float):
    subprocess.run(["git", "add", "-A"], capture_output=True, timeout=10)
    subprocess.run(
        ["git", "commit", "-m", f"CEO v5 iter-{iteration} score:{score}"],
        capture_output=True, timeout=10
    )
    log.info(f"[GIT] ✅ Winner: score={score}")


# ══════════════════════════════════════════════════════
# BLACKLIST + MEMORY
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
    return any(b.lower() in patch.lower() for b in bl)

def save_memory(issue: str, patch_type: str, score: float, result: str):
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
        "score":      score,
        "result":     result,
        "ts":         datetime.now().isoformat()
    }
    key = "wins" if result == "success" else "failures"
    data.setdefault(key, []).append(entry)
    MEMORY_FILE.write_text(json.dumps(data, indent=2))
    log.info(f"[MEM] {result} | score={score} | {issue[:50]}")


# ══════════════════════════════════════════════════════
# STATE
# ══════════════════════════════════════════════════════
def save_state(data: dict):
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    current = load_state()
    current.update(data)
    current["ts"] = datetime.now().isoformat()
    STATE_FILE.write_text(json.dumps(current, indent=2))

def load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text())
    except:
        return {}


# ══════════════════════════════════════════════════════
# MAIN LOOP
# ══════════════════════════════════════════════════════
def main():
    log.info("═" * 58)
    log.info("  OFFICE OS — CEO AGENT v5-FINAL")
    log.info("  SELF-SCAN → DETECT → FIX → VERIFY → LEARN")
    log.info("═" * 58)

    if not GROQ_API_KEY:
        log.error("Set GROQ_API_KEY: $env:GROQ_API_KEY='your_key'")
        return

    blacklist    = load_blacklist()
    last_tasks   = []

    # ── SESSION RESUMPTION ──────────────────────────────
    state = load_state()
    plan_queue = state.get("plan_queue", [])
    iteration = state.get("iter", 1)

    if plan_queue:
        log.info(f"[CEO] Resuming session from state. {len(plan_queue)} tasks pending.")

    while iteration <= MAX_ITER:
        log.info(f"\n{'─'*58}")
        log.info(f"  ITERATION {iteration}/{MAX_ITER}")
        log.info(f"{'─'*58}")

        # ── PLANNER ─────────────────────────────────────
        if not plan_queue:
            save_state({"iter": iteration, "status": "scanning"})
            issues = gather_all_issues()
            
            if not issues:
                log.info("[CEO] No issues found. System clean! Sleeping 30s...")
                time.sleep(30)
                continue

            available_skills = load_ag_skills()
            plan_queue = generate_plan(issues, available_skills)
            save_state({"plan_queue": plan_queue})

            if not plan_queue:
                log.warning("[CEO] Planner returned empty plan. Retrying in 30s...")
                time.sleep(30)
                continue

        # ── EXECUTION QUEUE ─────────────────────────────
        while plan_queue:
            top = plan_queue[0] # Peek
            task_desc = f"[{top['skill']}] {top['task']}"
            
            log.info(f"\n[CEO] >>> ACTIVE TASK: {task_desc[:90]}")
            save_state({"status": "executing", "task": task_desc[:80]})
            
            ceo_cycle_start(iteration, top["task"])

            # ── CLASSIFY ────────────────────────────────────
            cls = classify(top["task"])
            
            # ── BASELINE ────────────────────────────────────
            log.info("[CEO] Measuring baseline...")
            baseline_r = run_tests()
            baseline_s = compute_score(baseline_r)
            log.info(f"[CEO] Baseline Score: {baseline_s}")

            # ── GIT SNAPSHOT ────────────────────────────────
            git_snapshot(f"v5-iter{iteration}-task-{cls}")

            # ── GENERATE 3 CANDIDATES ───────────────────────
            best_patch = None
            best_score = baseline_s

            for c in range(CANDIDATES):
                temp = [0.2, 0.4, 0.6][c]
                log.info(f"[DARWIN] Candidate {c+1}/{CANDIDATES} (temp={temp})...")

                try:
                    patch = get_llm_response(
                        build_prompt(top["task"], cls, c, top["skill"]),
                        temp=temp
                    )
                except Exception as e:
                    log.warning(f"[DARWIN] LLM failed: {e}")
                    continue

                if is_blacklisted(patch, blacklist):
                    log.warning("[DARWIN] Blacklisted — skip")
                    continue

                git_rollback()
                ok, delta = apply_patch(patch)
                if not ok:
                    continue

                test_r = run_tests()
                cand_s = compute_score(test_r, delta)
                log.info(f"[DARWIN] Cand {c+1} score: {cand_s} (base: {baseline_s})")

                if cand_s > best_score:
                    best_score = cand_s
                    best_patch = patch

            # ── RESET + SELECT ──────────────────────────────
            git_rollback()

            if best_patch and best_score > baseline_s:
                apply_patch(best_patch)
                final_r = run_tests()

                if regression_check(baseline_r, final_r):
                    git_commit_winner(iteration, best_score)
                    log.info(f"[CEO] ✅ FIXED: {baseline_s} → {best_score}")
                    save_memory(top["task"], cls, best_score, "success")
                    ceo_cycle_end(iteration, "success", best_score)
                else:
                    log.error("[CEO] Regression → rollback")
                    git_rollback()
                    save_memory(top["task"], cls, best_score, "regression")
                    ceo_cycle_end(iteration, "regression", best_score)
            else:
                log.warning(f"[CEO] No improvement for {cls}")
                save_memory(top["task"], cls, baseline_s, "no_improvement")
                ceo_cycle_end(iteration, "no_improvement", baseline_s)

            # ── POP FROM QUEUE ──────────────────────────────
            plan_queue.pop(0)
            save_state({"plan_queue": plan_queue})

        # Check final goal
        final_r = run_tests()
        if final_r["health"] and final_r["valid_json"]:
            log.info("[CEO] FULL GOAL REACHED — Stopping.")
            break

        iteration += 1
        save_state({"iter": iteration, "plan_queue": []})
        log.info(f"[CEO] Iteration complete. Sleeping 10s...")
        time.sleep(10)

    log.info("\n[CEO] All iterations complete.")
    save_state({"iter": MAX_ITER, "status": "idle"})


if __name__ == "__main__":
    main()
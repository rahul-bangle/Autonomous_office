# Office OS v1.8 — FastAPI Backend
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import os
import re
import json
import asyncio
from datetime import datetime, timezone
from ddgs import DDGS
from dotenv import load_dotenv
import httpx

load_dotenv(override=True)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

async def fetch_agent_memories(agent_name: str) -> str:
    try:
        async with httpx.AsyncClient() as client:
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/vo_agent_memories?agent_id=eq.{agent_name}&select=memory_text&order=created_at.desc&limit=5",
                headers=headers
            )
            if res.status_code == 200:
                data = res.json()
                if data:
                    memories = "\n".join(f"- {m['memory_text']}" for m in data)
                    return f"\n\nHere are some of your persistent core memories:\n{memories}\nUse this context to inform your responses when relevant."
    except Exception as e:
        print(f"Failed to fetch memories for {agent_name}: {e}")
    return ""

async def reflect_and_store_memory(agent_name: str, user_msg: str, agent_msg: str, groq_key: str):
    prompt = f"""You are {agent_name}. Review the recent exchange.
User said: "{user_msg}"
You replied: "{agent_msg}"

If this exchange contains important new facts about the user, their preferences, or important project context that you should remember long-term, summarize it concisely in ONE sentence.
If it is a generic greeting, small-talk, or standard task execution without persistent lore, reply EXACTLY with the word: NONE."""
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=groq_key)
        resp = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0.1
        )
        memory = resp.choices[0].message.content.strip()
        if memory and memory.upper() != "NONE":
            async with httpx.AsyncClient() as http_client:
                headers = {
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
                payload = {"agent_id": agent_name, "memory_text": memory}
                await http_client.post(
                    f"{SUPABASE_URL}/rest/v1/vo_agent_memories",
                    headers=headers,
                    json=payload
                )
                print(f"🧠 Saved new memory for {agent_name}: {memory}")
    except Exception as e:
        print(f"Memory reflection error for {agent_name}: {e}")

# ─── SKILL LOADER ─────────────────────────────────────────────────────────────
AVAILABLE_SKILLS = {}

async def load_skills():
    global AVAILABLE_SKILLS
    skills_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "skills")
    os.makedirs(skills_dir, exist_ok=True)
    AVAILABLE_SKILLS.clear()
    for item in os.listdir(skills_dir):
        skill_path = os.path.join(skills_dir, item, "SKILL.md")
        if os.path.isfile(skill_path):
            try:
                with open(skill_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                match = re.search(r'^---\s*(.*?)\s*---\s*(.*)', content, re.DOTALL)
                if match:
                    fm, instructions = match.group(1), match.group(2).strip()
                    name_m = re.search(r'name:\s*(.+)', fm)
                    desc_m = re.search(r'description:\s*["\']?([^"\']+)["\']?', fm)
                    if name_m and desc_m:
                        name = name_m.group(1).strip()
                        AVAILABLE_SKILLS[name] = {
                            "name": name,
                            "description": desc_m.group(1).strip(),
                            "instructions": instructions
                        }
            except Exception as e:
                print(f"Skill load error [{item}]: {e}")

# load_skills() removed — moved to startup event

# ─── WEB SEARCH ───────────────────────────────────────────────────────────────
async def search_web(query: str, max_results: int = 3):
    """Simple wrapper for DuckDuckGo search."""
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
            return "\n".join([f"- {r['body']} (Source: {r['href']})" for r in results])
    except Exception as e:
        print(f"Search error: {e}")
        return "No web results found."

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

async def repo_analyzer(file_name: str) -> str:
    """Reads a file from the local repository for context."""
    try:
        if not file_name:
            return "Error: No file name provided."
            
        base_name = os.path.basename(file_name)
        # Search for file recursively in project
        target_path = None
        for root, dirs, files in os.walk(PROJECT_ROOT):
            if base_name in files:
                target_path = os.path.join(root, base_name)
                break
        
        if not target_path:
            return f"File '{file_name}' not found in repository."
        
        with open(target_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return f"\n--- Content of {base_name} ---\n{content}\n--- End of File ---"
    except Exception as e:
        return f"Error reading file: {e}"

async def sql_explorer(query: str) -> str:
    """Executes a SELECT query on Supabase for data insights."""
    if not query.lower().strip().startswith("select"):
        return "Error: Only SELECT queries are allowed for safety."
    try:
        async with httpx.AsyncClient() as client:
            headers = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
            res = await client.get(f"{SUPABASE_URL}/rest/v1/rpc/execute_sql", headers=headers, params={"query": query})
            # Note: We likely don't have an 'execute_sql' RPC by default. 
            # We'll fallback to querying the known tables directly if RPC fails, 
            # but for now let's use the REST API for vo_agent_memories specifically as a stand-in if it's general.
            if "vo_agent_memories" in query.lower():
                res = await client.get(f"{SUPABASE_URL}/rest/v1/vo_agent_memories?select=*", headers=headers)
            elif "vo_jira_tickets" in query.lower():
                res = await client.get(f"{SUPABASE_URL}/rest/v1/vo_jira_tickets?select=*", headers=headers)
            
            if res.status_code == 200:
                return json.dumps(res.json()[:10], indent=2) # Limit to 10 rows
            return f"DB Query failed: {res.text}"
    except Exception as e:
        return f"SQL Error: {e}"

async def manage_jira(action: str, title: str = None, desc: str = None, status: str = "OPEN", assignee: str = None) -> str:
    """Creates or lists Jira tickets in Supabase."""
    try:
        async with httpx.AsyncClient() as client:
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            if action == "create":
                payload = {"title": title, "description": desc, "status": status, "assignee": assignee}
                res = await client.post(f"{SUPABASE_URL}/rest/v1/vo_jira_tickets", headers=headers, json=payload)
                if res.status_code in [201, 200]:
                    ticket = res.json()[0]
                    return f"✅ Ticket Created: {ticket['id'][:8]} - {ticket['title']}"
            else:
                res = await client.get(f"{SUPABASE_URL}/rest/v1/vo_jira_tickets?select=*&order=created_at.desc&limit=5", headers=headers)
                if res.status_code == 200:
                    tickets = res.json()
                    out = "\n".join([f"- [{t['id'][:8]}] {t['status']}: {t['title']} (Assignee: {t['assignee']})" for t in tickets])
                    return f"📋 Latest Tickets:\n{out}"
    except Exception as e:
        return f"Jira Error: {e}"
    return "Jira action failed."
# ─── STRIP REACT FORMAT ───────────────────────────────────────────────────────
def strip_react(text: str) -> str:
    text = re.sub(r'(THOUGHT|ACTION|RESULT|DECISION)\s*:\s*', '', text, flags=re.IGNORECASE)
    lines = [l for l in text.splitlines() if l.strip()]
    return '\n'.join(lines).strip()

# ─── CREWAI SETUP ─────────────────────────────────────────────────────────────
os.environ.setdefault("OPENAI_API_KEY", "NA")

from crewai import Agent, Task, Crew, Process, LLM

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    await load_skills()


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── SKILLS ENDPOINTS ─────────────────────────────────────────────────────────
@app.get("/api/skills")
def get_skills():
    return {"skills": [{"id": v["name"], "name": v["name"], "description": v["description"]} for v in AVAILABLE_SKILLS.values()]}

@app.post("/api/skills/reload")
def reload_skills_endpoint():
    load_skills()
    return {"reloaded": len(AVAILABLE_SKILLS), "skills": list(AVAILABLE_SKILLS.keys())}

# ─── AGENT STATE ──────────────────────────────────────────────────────────────
_agent_state: dict = {}

@app.post("/api/agent/state")
def set_agent_state(req: dict):
    if "agents" in req:
        for entry in req["agents"]:
            aid = str(entry.get("agentId", ""))
            if aid:
                _agent_state[aid] = {**_agent_state.get(aid, {}), **entry}
    else:
        aid = str(req.get("agentId", ""))
        if not aid:
            raise HTTPException(status_code=400, detail="agentId is required")
        _agent_state[aid] = {**_agent_state.get(aid, {}), **req}
    return {"status": "ok", "stored": len(_agent_state)}

@app.get("/api/agent/state")
def get_agent_state(agentId: str | None = None):
    if agentId:
        state = _agent_state.get(str(agentId))
        if state is None:
            raise HTTPException(status_code=404, detail=f"Agent {agentId} not found")
        return state
    return {"agents": list(_agent_state.values()), "count": len(_agent_state)}

# ─── LAYOUT ───────────────────────────────────────────────────────────────────
_layout_config: dict = {}

@app.get("/api/layout")
def get_layout():
    return _layout_config

@app.post("/api/layout")
def set_layout(req: dict):
    global _layout_config
    _layout_config = req
    return {"status": "ok"}

# ─── SHARED HELPER ────────────────────────────────────────────────────────────
NO_REACT_RULE = (
    "IMPORTANT: Respond in plain natural language only. "
    "Do NOT use THOUGHT:, ACTION:, RESULT:, or DECISION: prefixes. "
    "Do NOT explain your reasoning steps. "
    "Write only the final answer."
)

SEARCH_TRIGGERS = [
    'latest', 'news', 'today', 'current', 'price', 'weather',
    'stock', 'update', 'recent', 'who won', 'when is'
]

def build_crew_for_agents(raw_agents, user_message, search_context, groq_key):
    """Returns (crew_agents, crew_tasks, agent_names)"""
    total = len(raw_agents)
    agent_names = []
    crew_agents = []
    crew_tasks  = []

    for i, ag in enumerate(raw_agents):
        name    = ag.get("name", f"Agent{i+1}") if isinstance(ag, dict) else str(ag)
        role    = ag.get("role", name)           if isinstance(ag, dict) else name
        goal    = ag.get("goal", f"Help as {role}.") if isinstance(ag, dict) else f"Help as {role}."
        is_last = (i == total - 1)
        agent_names.append(name)

        llm = LLM(
            model="groq/llama-3.3-70b-versatile",
            api_key=groq_key,
            max_tokens=300 if is_last else 200,
        )
        crew_agent = Agent(
            role=role,
            goal=goal,
            backstory=(
                f"You are {name}, a {role} in an AI office. "
                f"Active team: {', '.join([a.get('name','Agent') if isinstance(a,dict) else str(a) for a in raw_agents])}. "
                f"{NO_REACT_RULE}"
            ),
            llm=llm,
            verbose=False,
        )

        if i == 0:
            desc = (
                f'{NO_REACT_RULE}\n\n'
                f'User message: "{user_message}"{search_context}\n\n'
                f'You are {name}, a {role}. Reply naturally and helpfully. '
                f'Be conversational. Max 2-3 sentences.'
            )
            expected = "Direct helpful reply."
        elif is_last:
            desc = (
                f'{NO_REACT_RULE}\n\n'
                f'User message: "{user_message}"\n'
                f'You are {name}, a {role}. Give the FINAL reply to the user. '
                f'Be warm, direct, and helpful.'
            )
            expected = "Final reply to user."
        else:
            desc = (
                f'{NO_REACT_RULE}\n\n'
                f'User message: "{user_message}"\n'
                f'You are {name}, a {role}. Contribute your perspective briefly. '
                f'1-2 sentences, plain text.'
            )
            expected = "Brief contribution."

        crew_agents.append(crew_agent)
        crew_tasks.append(Task(description=desc, expected_output=expected, agent=crew_agent))

    return crew_agents, crew_tasks, agent_names

# ─── HTTP CHAT (legacy — keep for fallback) ───────────────────────────────────
@app.post("/api/chat")
def chat(req: dict):
    groq_key = os.environ.get("GROQ_API_KEY", "").strip()
    if not groq_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

    user_message = req.get("message", "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="message field is empty")

    agent_skills = req.get("skills", [])
    raw_agents   = req.get("agents", [{"name": "Assistant", "role": "Assistant"}])

    use_search     = any(w in user_message.lower() for w in SEARCH_TRIGGERS)
    search_context = f"\n\nWeb results:\n{search_web(user_message)}" if use_search else ""

    crew_agents, crew_tasks, agent_names = build_crew_for_agents(
        raw_agents, user_message, search_context, groq_key
    )

    crew = Crew(
        agents=crew_agents,
        tasks=crew_tasks,
        process=Process.sequential,
        verbose=True,
    )

    try:
        final_result       = crew.kickoff()
        messages           = []
        agent_token_counts = []

        for idx, t in enumerate(crew_tasks):
            raw_text   = str(t.output.raw) if t.output else ""
            clean_text = strip_react(raw_text)
            actual_name = agent_names[idx] if idx < len(agent_names) else t.agent.role
            messages.append({"agent": t.agent.role, "name": actual_name, "text": clean_text})
            agent_token_counts.append((actual_name, max(1, len(raw_text) // 4)))

        final_clean  = strip_react(str(final_result))
        total_tokens = sum(t for _, t in agent_token_counts)

        parts = " | ".join(f"[{n}] {tok}t" for n, tok in agent_token_counts)
        print(f"\n📊 TOKENS  {parts} | Total: {total_tokens}\n")

        log_path = os.path.join(os.path.dirname(__file__), "task_log.json")
        try:
            existing = json.loads(open(log_path).read()) if os.path.exists(log_path) else []
        except Exception:
            existing = []
        existing.append({
            "timestamp":    datetime.now(timezone.utc).isoformat(),
            "user_message": user_message,
            "agents":       [{"name": n, "tokens": t} for n, t in agent_token_counts],
            "final_output": final_clean,
            "total_tokens": total_tokens,
        })
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)

        return {
            "status":       "ok",
            "messages":     messages,
            "final":        final_clean,
            "skills_used":  agent_skills,
            "total_tokens": total_tokens,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── WEBSOCKET CHAT (Streaming & Priority Queue) ──────────────────────────────
from groq import AsyncGroq

async def build_pipeline(user_message: str, agents_list: list, groq_key: str):
    """Pipeline logic: ask LLM which agent(s) should handle this sequentially."""
    if not agents_list: return []
    if len(agents_list) == 1: return [agents_list[0]]

    agent_descriptions = "\n".join([f"- {a.get('name')}: {a.get('role')} ({a.get('goal', '')})" for a in agents_list])
    prompt = f"""You are the Office Manager routing tasks.
User Request: "{user_message}"

Available Agents:
{agent_descriptions}

Task: Choose the best agent(s) to handle this request.
- If it's a simple question/task, pick the SINGLE best agent.
- If it's a complex task (e.g. build a feature, write a document, solve a complex problem), pick a sequence of 2 or 3 agents to act as an assembly line (e.g., Planner -> Developer -> Reviewer).

Reply ONLY with a comma-separated list of the exact agent names in the order they should act. Do not add any punctuation or explanation."""

    try:
        client = AsyncGroq(api_key=groq_key)
        resp = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50,
            temperature=0
        )
        choices = [c.strip() for c in resp.choices[0].message.content.strip().split(',')]
        
        selected = []
        for choice in choices:
            for ag in agents_list:
                if ag.get("name", "").lower() == choice.lower() or choice.lower() in ag.get("name", "").lower():
                    if ag not in selected:
                        selected.append(ag)
                    break
        
        if not selected:
            return [agents_list[0]]
        return selected[:3] # Max 3 agents in pipeline
    except Exception as e:
        print(f"Queue routing error: {e}")
        return [agents_list[0]]

@app.websocket("/ws")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    print("🔌 WebSocket client connected (Streaming + Queue enabled)")

    try:
        while True:
            data = await websocket.receive_json()

            groq_key = os.environ.get("GROQ_API_KEY", "").strip()
            if not groq_key:
                await websocket.send_json({"type": "error", "text": "GROQ_API_KEY not set"})
                continue

            # ── WATERCOOLER HANDLER ──────────────────────────────────────
            if data.get("type") == "watercooler":
                wc_agents = data.get("agents", [])
                if len(wc_agents) >= 2:
                    a1 = wc_agents[0]
                    a2 = wc_agents[1]
                    try:
                        client = AsyncGroq(api_key=groq_key)
                        memories_a1 = await fetch_agent_memories(a1.get("name", "Agent1"))
                        memories_a2 = await fetch_agent_memories(a2.get("name", "Agent2"))
                        wc_prompt = (
                            f"You are simulating a casual watercooler conversation between two coworkers.\n"
                            f"Person 1: {a1.get('name','Agent1')} — {a1.get('role','Worker')}. {memories_a1}\n"
                            f"Person 2: {a2.get('name','Agent2')} — {a2.get('role','Worker')}. {memories_a2}\n\n"
                            f"Write exactly 2 lines of light, fun, office small-talk. "
                            f"Format:\n{a1.get('name','Agent1')}: <line>\n{a2.get('name','Agent2')}: <line>\n"
                            f"Keep it under 25 words total. No markdown, no emojis, no extra text."
                        )
                        resp = await client.chat.completions.create(
                            model="llama-3.3-70b-versatile",
                            messages=[{"role": "user", "content": wc_prompt}],
                            max_tokens=80,
                        )
                        chat_text = (resp.choices[0].message.content or "").strip()
                        lines = [l.strip() for l in chat_text.split("\n") if l.strip()]

                        for line in lines[:2]:
                            parts = line.split(":", 1)
                            speaker = parts[0].strip() if len(parts) > 1 else a1.get("name", "Agent")
                            text = parts[1].strip() if len(parts) > 1 else line
                            await websocket.send_json({
                                "type": "agent_message",
                                "agent": speaker,
                                "role": speaker,
                                "text": f"☕ {text}",
                                "final": True,
                                "streaming": False,
                                "tokens": 0
                            })
                            await asyncio.sleep(1.5)

                        await websocket.send_json({"type": "done", "total_tokens": 0, "assigned_to": [a1.get("name"), a2.get("name")]})
                    except Exception as wc_err:
                        print(f"Watercooler error: {wc_err}")
                        await websocket.send_json({"type": "error", "text": f"Watercooler error: {wc_err}"})
                continue

            # ── REGULAR CHAT HANDLER ─────────────────────────────────────
            user_message = data.get("message", "").strip()
            if not user_message:
                await websocket.send_json({"type": "error", "text": "Empty message"})
                continue

            raw_agents = data.get("agents", [{"name": "Assistant", "role": "Assistant"}])

            # ── SKILL DETECTION ──────────────────────────────────────────
            skills_context = ""
            try:
                skill_det_prompt = f"""Analyze the User Message: "{user_message}"
Decide if any of these specialized skills are needed to provide a high-quality, data-driven response:
1. WEB_SEARCH: For recent news, documentation, or facts outside training data.
2. REPO_ANALYZER: For reading local project code (if files like .jsx, .py, .css are mentioned).
3. SQL_EXPLORER: For querying agent memories or historical data in Supabase.
4. JIRA_MANAGER: For listing, creating, or check status of project tickets.

Return a JSON object: {{"skills": ["SKILL_NAME"], "file_name": "...", "query": "...", "action": "create|list", "title": "...", "description": "..."}}
If no skills are needed, return {{"skills": []}}."""
                
                skill_client = AsyncGroq(api_key=groq_key)
                skill_resp = await skill_client.chat.completions.create(
                    model="llama-3.1-8b-instant", # Faster model for routing
                    messages=[{"role": "user", "content": skill_det_prompt}],
                    max_tokens=200,
                    temperature=0,
                    response_format={"type": "json_object"}
                )
                skill_decision = json.loads(skill_resp.choices[0].message.content or "{}")
                needed_skills = skill_decision.get("skills", [])
                
                for s in needed_skills:
                    if s == "WEB_SEARCH":
                        res = await search_web(user_message)
                        skills_context += f"\n[Skill Output: Web Search]\n{res}\n"
                    elif s == "REPO_ANALYZER":
                        fname = skill_decision.get("file_name")
                        if fname:
                            res = await repo_analyzer(fname)
                            skills_context += f"\n[Skill Output: Repo Analyzer - {fname}]\n{res}\n"
                    elif s == "SQL_EXPLORER":
                        sql_q = skill_decision.get("query")
                        if sql_q:
                            res = await sql_explorer(sql_q)
                            skills_context += f"\n[Skill Output: SQL Explorer]\n{res}\n"
                    elif s == "JIRA_MANAGER":
                        j_act = skill_decision.get("action", "list")
                        res = await manage_jira(j_act, skill_decision.get("title"), skill_decision.get("description"))
                        skills_context += f"\n[Skill Output: Jira Manager]\n{res}\n"
            except Exception as skill_err:
                print(f"Skill error: {skill_err}")

            # 1. PRIORITY QUEUE / PIPELINE: Determine sequence of agents
            pipeline_agents = await build_pipeline(user_message, raw_agents, groq_key)
            if not pipeline_agents:
                await websocket.send_json({"type": "error", "text": "No agents available."})
                continue
                
            accumulated_context = skills_context
            total_session_tokens = 0
            assigned_names = []

            for idx, agent in enumerate(pipeline_agents):
                name = agent.get("name", "Agent")
                role = agent.get("role", name)
                goal = agent.get("goal", f"Help as {role}.")
                assigned_names.append(name)
                
                is_first = (idx == 0)
                is_last = (idx == len(pipeline_agents) - 1)
                
                # Determine visual location
                if len(pipeline_agents) == 1:
                    location = "DESK"
                elif is_first:
                    location = "WHITEBOARD"
                elif is_last:
                    location = "MEETING"
                else:
                    location = "DESK"

                # Notify frontend
                await websocket.send_json({
                    "type":  "agent_start",
                    "agent": name,
                    "role":  role,
                    "location": location
                })
                
                # Give frontend a moment to animate before streaming
                await asyncio.sleep(0.5)

                memories_context = await fetch_agent_memories(name)
                
                base_prompt = (
                    f"You are {name}, a {role} in an AI office. Goal: {goal}. "
                    f"{NO_REACT_RULE}{memories_context}"
                )
                
                if len(pipeline_agents) == 1:
                    sys_prompt = f"{base_prompt} Be conversational, warm, direct, and helpful. Max 2-3 sentences."
                    user_prompt = f"Original Request: {user_message}\n\nContext:\n{accumulated_context}"
                else:
                    if is_first:
                        sys_prompt = f"{base_prompt} You are the first step in a pipeline. Provide a brief initial plan or contribution (1-2 sentences) based on the request."
                        user_prompt = f"Original Request: {user_message}\n\nContext:\n{accumulated_context}"
                    elif is_last:
                        sys_prompt = f"{base_prompt} You are the final step in a pipeline. Review the previous steps and provide the final polished response to the user. Max 2-3 sentences."
                        user_prompt = f"Original Request: {user_message}\n\nPrevious context & contributions:\n{accumulated_context}\n\nNow, provide the final response to the user."
                    else:
                        sys_prompt = f"{base_prompt} You are an intermediate step in a pipeline. Build upon the previous steps. 1-2 sentences."
                        user_prompt = f"Original Request: {user_message}\n\nPrevious context & contributions:\n{accumulated_context}\n\nNow, provide your contribution."

                client = AsyncGroq(api_key=groq_key)
                
                # 2. STREAMING TOKENS
                try:
                    stream = await client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {"role": "system", "content": sys_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        stream=True,
                        max_tokens=300 if is_last else 150
                    )

                    full_response = ""
                    token_count = 0

                    await websocket.send_json({
                        "type":   "agent_message",
                        "agent":  name,
                        "role":   role,
                        "text":   "",
                        "final":  False,
                        "streaming": True,
                        "tokens": 0
                    })

                    async for chunk in stream:
                        delta = chunk.choices[0].delta.content or ""
                        if delta:
                            full_response += delta
                            token_count += 1
                            # Stream the delta word/token to frontend
                            await websocket.send_json({
                                "type": "stream_chunk",
                                "agent": name,
                                "delta": delta
                            })

                    # Send message completion for this agent
                    clean_text = strip_react(full_response)
                    total_session_tokens += token_count
                    
                    accumulated_context += f"\n[{name}]: {clean_text}"
                    
                    await websocket.send_json({
                        "type":   "agent_message",
                        "agent":  name,
                        "role":   role,
                        "text":   clean_text,
                        "final":  True, 
                        "streaming": False,
                        "tokens": token_count
                    })

                    # Fire off async reflection task
                    asyncio.create_task(reflect_and_store_memory(name, user_message, clean_text, groq_key))
                    print(f"\n📊 WS TOKENS [{name}] {token_count}t\n")
                    
                    # Short pause before next agent
                    if not is_last:
                        await asyncio.sleep(1.0)
                        
                except Exception as stream_err:
                    print(f"Streaming error: {stream_err}")
                    await websocket.send_json({"type": "error", "text": str(stream_err)})
                    break # Abort pipeline on error

            # All agents done
            print(f"✅ Pipeline complete. Total tokens: {total_session_tokens}")
            await websocket.send_json({
                "type":         "done",
                "total_tokens": total_session_tokens,
                "assigned_to":  assigned_names
            })

    except Exception as e:
        if "Close" not in str(type(e)):
            print(f"❌ WebSocket error: {e}")
        try:
            await websocket.send_json({"type": "error", "text": str(e)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
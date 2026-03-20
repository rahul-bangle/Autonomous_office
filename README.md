# 🤖 Autonomous Agent Office

> **Where AI Agents Work, Collaborate, and Thrive**

A futuristic virtual office simulation powered by autonomous AI agents. Watch as Scout, Strategist, Scribe, Critic, and Chief work together in real-time—conducting research, planning strategies, writing content, and making executive decisions—all rendered in a beautiful pixel-art canvas environment.

---

![Office Preview](https://img.shields.io/badge/status-stable-brightgreen) ![React](https://img.shields.io/badge/React-18.2-61DAFB) ![Python](https://img.shields.io/badge/Python-FastAPI-3776AB) ![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-FF6B6B) ![Groq](https://img.shields.io/badge/LLM-Groq-f97316)

---

## ✨ Features

### 🏢 Living Office Environment
- **Pixel-Art Canvas** — Beautiful isometric office rendered in real-time
- **Dynamic Zones** — Main Office, Meeting Room, CEO Cabin, Reception, Break Room
- **A* Pathfinding** — Agents intelligently navigate around walls, desks, and each other
- **Z-Ordering** — Proper depth rendering so agents walk behind desks naturally

### 🤖 Autonomous Agents
| Agent | Role | Color | Specialization |
|-------|------|-------|---------------|
| 🕵️ **Scout** | Researcher | 🔴 Red | Web search, fact-checking, data gathering |
| 🧠 **Strategist** | Planner | 🔵 Teal | Analysis, roadmapping, decision making |
| ✍️ **Scribe** | Writer | 🟡 Yellow | Copywriting, documentation, clarity |
| 🔍 **Critic** | Reviewer | 🟣 Purple | QA, logic validation, improvement |
| 👑 **Chief** | Executive | 🟠 Orange | Leadership, final decisions, summaries |

### ⚡ Intelligent Workflows
- **Assembly Line Pipeline** — Agents autonomously flow through Whiteboard → Desk → Meeting Room
- **Watercooler Chats** — Idle agents spontaneously chat at the coffee machine ☕
- **Long-term Memory** — Supabase-backed persistent memory with reflection after each task
- **Task Assignment** — CrewAI-powered sequential processing with proper handoffs

### 🛠️ Specialist Tools
- **Repo Analyzer** — Agents can read and analyze project source code
- **Jira Manager** — Persistent task ticketing system (`vo_jira_tickets`)
- **SQL Explorer** — Read-only database querying for analytics
- **Web Search** — Real-time internet research capabilities

### 🎨 UX Polish
- **Real-time Status** — Color-coded dots (Idle 🟢, Moving 🟡, Working 🔵, Meeting 🟠)
- **Keyboard Shortcuts** — `M` meet, `N` new agent, `?` help, `~` debug
- **Toast Notifications** — Non-intrusive task completion alerts
- **Edit Mode** — Drag rooms and furniture to customize your office

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │  Header  │  │ AgentChat    │  │      OfficeCanvas         │ │
│  │  Panel   │  │   Panel      │  │   (HTML5 Canvas + A*)     │ │
│  └──────────┘  └──────────────┘  └────────────────────────────┘ │
│                           │                                      │
│                     ┌─────┴─────┐                                 │
│                     │  EventBus │ ← Decouples UI from State       │
│                     └───────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI + CrewAI)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  /api/chat   │  │  /api/skills │  │   /api/crew         │   │
│  │  /api/agents │  │  /api/layout │  │   /api/jira         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                              │                                   │
│                     ┌────────┴────────┐                          │
│                     │     CrewAI      │                          │
│                     │  Agent Pipeline │                          │
│                     └────────┬────────┘                          │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐              │
│         ▼                    ▼                    ▼              │
│   ┌───────────┐      ┌───────────┐       ┌───────────┐        │
│   │  Groq LLM │      │  Supabase  │       │   Skills  │        │
│   │  (LLM)    │      │  (Memory)  │       │   (.md)   │        │
│   └───────────┘      └───────────┘       └───────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account (free tier works)
- Groq API key (free at groq.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/rahul-bangle/Autonomous_Office_agents.git
cd Autonomous_Office_agents

# Install frontend dependencies
npm install

# Set up backend
cd backend
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your Supabase and Groq credentials
```

### Running

```bash
# Terminal 1: Start backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2: Start frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see your virtual office!

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `M` | Toggle Meeting Mode |
| `N` | Open New Agent Form |
| `~` | Toggle Debug Overlay |
| `?` | Show Keyboard Shortcuts |
| `Esc` | Close Modals |

---

## 🔧 Configuration

Create a `.env` file in the root:

```env
GROQ_API_KEY=your_groq_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Required Supabase Tables

```sql
-- Agents table
CREATE TABLE vo_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  desc TEXT,
  color TEXT,
  priority TEXT,
  zone TEXT,
  skills TEXT[],
  tools TEXT[]
);

-- Jira tickets table
CREATE TABLE vo_jira_tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignee TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Agent memory/reflections
CREATE TABLE vo_agent_memory (
  id SERIAL PRIMARY KEY,
  agent_id TEXT,
  reflection TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 📁 Project Structure

```
Virtual_office/
├── src/
│   ├── components/
│   │   ├── AgentChat.jsx       # Chat interface
│   │   ├── CreateAgentModal.jsx # Agent creation form
│   │   ├── Header.jsx           # Top navigation
│   │   ├── LeftPanel.jsx        # Agent list sidebar
│   │   └── OfficeCanvas.jsx     # Main canvas renderer
│   ├── utils/
│   │   ├── officeDrawing.js     # Canvas drawing utilities
│   │   ├── officeLayout.js      # Room/furniture layout logic
│   │   └── officePath.js        # A* pathfinding algorithm
│   ├── App.jsx                  # Main application
│   ├── EventBus.js              # Centralized event system
│   └── constants.js             # Room configs, colors, priorities
│
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── skills/
│   │   ├── web-search/SKILL.md  # Web search capability
│   │   ├── repo-analyzer/SKILL.md
│   │   ├── sql-explorer/SKILL.md
│   │   └── jira-manager/SKILL.md
│   └── task_log.json            # Task execution history
│
├── package.json
└── vite.config.js
```

---

## 🛣️ Roadmap

- [ ] Voice Interaction — Talk to agents
- [ ] 3D Office View — Switch to WebGL rendering
- [ ] Agent Customization — Custom avatars and personalities
- [ ] Multi-office Support — Connect offices together
- [ ] Mobile App — Control your office from anywhere
- [ ] WebSocket Mode — Real-time multiplayer collaboration

---

## 📜 License

MIT License — feel free to use, modify, and build upon this project.

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [React](https://react.dev/) — UI framework
- [FastAPI](https://fastapi.tiangolo.com/) — Python web framework
- [CrewAI](https://crewai.com/) — Multi-agent orchestration
- [Groq](https://groq.com/) — Lightning-fast LLM inference
- [Supabase](https://supabase.com/) — Backend-as-a-service

---

<div align="center">

**Made with ☕ and late-night coding sessions**

*Where autonomous agents become colleagues*

</div>

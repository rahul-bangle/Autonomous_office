# Quick Task Plan: CEO Status Badge

<must_haves>
- [ ] add `/api/ceo/status` endpoint to backend/main.py
- [ ] add polling for the CEO status in src/App.jsx
- [ ] make LeftPanel.jsx show green badge for 'running' and red for 'stopped' status
</must_haves>

## Tasks

### 1. Update backend API
**action**: Edit backend/main.py to add the GET `/api/ceo/status` method.
**files**: `backend/main.py`
**verify**: The endpoint should check `.office/state.json` and return `{ "status": "running" | "stopped" }`
**done**: [ ]

### 2. Update frontend polling
**action**: Edit src/App.jsx to poll the status every 3 seconds and `setAgents` for the Executive role.
**files**: `src/App.jsx`
**verify**: The CEO agent's status inside the App.jsx state should correctly reflect 'running' or 'stopped'.
**done**: [ ]

### 3. Update LeftPanel badge colors
**action**: Edit `src/components/LeftPanel.jsx` to map 'running' to green (`#22c55e`) and 'stopped' to red (`#ef4444`).
**files**: `src/components/LeftPanel.jsx`
**verify**: The badge color correctly updates without breaking other statuses.
**done**: [ ]

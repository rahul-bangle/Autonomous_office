---
phase: 1
name: Dashboard Shell & Core Aesthetics
wave: 1
depends_on: []
files_modified: [src/index.css, src/components/LeftPanel.jsx, src/App.jsx]
autonomous: true
requirements: [REQ-1.1, REQ-1.2, REQ-1.3]
---

# Phase 1: Dashboard Shell & Core Aesthetics

## Objective
Implement the "Origin" glassmorphism shell, rebuild the sidebar with icon-based navigation, and establish the base dark-mode design system without mythological names.

## Wave 1: Design Tokens & Layout Shell

### Task 1: Establish Origin Design Tokens in CSS
<read_first>
- `src/index.css`
</read_first>

<action>
Update `src/index.css` with the following variables and utility classes:
- `--bg-kailash-main`: #050505
- `--bg-kailash-card`: rgba(255, 255, 255, 0.03)
- `--glass-blur`: 12px
- `--glass-border`: 1px solid rgba(255, 255, 255, 0.1)
- Create a `.glass-card` class using these variables.
- Set `body` background to `--bg-kailash-main`.
</action>

<acceptance_criteria>
- `src/index.css` contains `--bg-kailash-main: #050505`
- `src/index.css` contains `.glass-card` selector
- `src/index.css` contains `backdrop-filter: blur(var(--glass-blur))`
</acceptance_criteria>

### Task 2: Rebuild LeftPanel as Icon-Based Sidebar
<read_first>
- `src/components/LeftPanel.jsx`
</read_first>

<action>
Modify `LeftPanel.jsx` to:
1.  **Iconic Navigation**: Use Lucide-react (or SVG) icons for Home (Command Center), Users (Team Office), Graph (Project Analytics), Calendar (Roadmap), Checklist (Task Board), Archive (Backlog), and Cog (Settings).
2.  **Width Adjustment**: Set sidebar width to `240px` (or 80px if collapsed).
3.  **No Mythology**: Ensure agent names/roles are displayed as they are currently in the database (Scout, Chief, etc.), discarding the temporary mythological aliases.
4.  **Glass Effect**: Wrap the sidebar container in the `.glass-card` styling.
</action>

<acceptance_criteria>
- `src/components/LeftPanel.jsx` uses `display: grid` or `flex` for icons.
- `src/components/LeftPanel.jsx` does NOT contain "Shiva", "Hanuman", or "Brahma" as hardcoded defaults.
</acceptance_criteria>

### Task 3: Global App Context Sync
<read_first>
- `src/App.jsx`
</read_first>

<action>
Update `src/App.jsx` to ensure the layout supports the new 240px sidebar reliably and applies the new `Origin` theme classes to the root container.
</action>

<acceptance_criteria>
- `src/App.jsx` contains the logic to render `LeftPanel` and the main `Dashboard` area side-by-side.
</acceptance_criteria>

## Verification Criteria
- [ ] Sidebar icons are correctly aligned and identifiable.
- [ ] No mythological names appear in the agent list.
- [ ] The "Origin" dark theme is active and visually distinct from the previous session's UI.

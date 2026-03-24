# Phase 1: Dashboard Shell & Core Aesthetics - Context

**Source:** User feedback and YouTube Vision (Origin Command).
**Status:** READY FOR PLANNING

<domain>
## Phase Boundary
This phase focuses on the structural "Frame" of the Origin Command center. It removes the existing sidebar buttons and replaces them with a modern icon-based navigation system and a glassmorphism design language.

## Success Criteria (REQ-1.x)
1.  **Sidebar**: Icon-based, re-ordered navigation (PM-centric: Home, Users, Graph, Calendar, Checklist, Archive).
2.  **Aesthetics**: HSL-based dark mode palette + `.glass-card` CSS utility.
3.  **No Mythology Names**: All agent displays in this shell should use their *Existing Roles* (e.g., Scout, Chief) or generic identifiers until new non-mythological names are decided.
</domain>

<decisions>
## Implementation Decisions

### Aesthetics
- **Color Palette**: Ultra-Dark (#050505 bg, #1a1a1a cards).
- **Glassmorphism**: 
  - `backdrop-filter: blur(12px)`.
  - `background: rgba(255, 255, 255, 0.03)`.
  - `border: 1px solid rgba(255, 255, 255, 0.1)`.

### Component Structure
- **Sidebar**: Fixed width (240px), icons on left, labels optional/revealed on hover.
- **Header**: Sticky glass header with current "Origin Command" breadcrumb and status.

### NO-GO
- **NO mythology names** (Ref: USER_REQUEST_275).
- **NO interactive canvas changes yet** (Targeted for Phase 3).
</decisions>

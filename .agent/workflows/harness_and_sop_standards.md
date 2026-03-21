---
name: harness_and_sop_standards
trigger: When the user asks to "build a CLI for a GUI app", "standardize agent SOPs", "create a tool harness", or mentions GUI-to-CLI translation, stateful REPLs, or software backend integration.
source: CLI-Anything/HARNESS.md
---

# Agent Harness: GUI-to-CLI for Open Source Software (SOP Standards)

## Purpose

This harness provides a standard operating procedure (SOP) and toolkit for coding
agents (Claude Code, Codex, etc.) to build powerful, stateful CLI interfaces for
open-source GUI applications. The goal: let AI agents operate software that was
designed for humans, without needing a display or mouse.

## General SOP: Turning Any GUI App into an Agent-Usable CLI

### Phase 1: Codebase Analysis

1. **Identify the backend engine** — Most GUI apps separate presentation from logic.
   Find the core library/framework (e.g., MLT for Shotcut, ImageMagick for GIMP).
2. **Map GUI actions to API calls** — Every button click, drag, and menu item
   corresponds to a function call. Catalog these mappings.
3. **Identify the data model** — What file formats does it use? How is project state
   represented? (XML, JSON, binary, database?)
4. **Find existing CLI tools** — Many backends ship their own CLI (`melt`, `ffmpeg`,
   `convert`). These are building blocks.
5. **Catalog the command/undo system** — If the app has undo/redo, it likely uses a
   command pattern. These commands are your CLI operations.

### Phase 2: CLI Architecture Design

1. **Choose the interaction model**:
   - **Stateful REPL** for interactive sessions (agents that maintain context)
   - **Subcommand CLI** for one-shot operations (scripting, pipelines)
   - **Both** (recommended) — a CLI that works in both modes

2. **Define command groups** matching the app's logical domains:
   - Project management (new, open, save, close)
   - Core operations (the app's primary purpose)
   - Import/Export (file I/O, format conversion)
   - Configuration (settings, preferences, profiles)
   - Session/State management (undo, redo, history, status)

3. **Design the state model**:
   - What must persist between commands? (open project, cursor position, selection)
   - Where is state stored? (in-memory for REPL, file-based for CLI)
   - How does state serialize? (JSON session files)

4. **Plan the output format**:
   - Human-readable (tables, colors) for interactive use
   - Machine-readable (JSON) for agent consumption
   - Both, controlled by `--json` flag

### Phase 3: Implementation

1. **Start with the data layer** — XML/JSON manipulation of project files
2. **Add probe/info commands** — Let agents inspect before they modify
3. **Add mutation commands** — One command per logical operation
4. **Add the backend integration** — A `utils/<software>_backend.py` module that
   wraps the real software's CLI. This module handles:
   - Finding the software executable (`shutil.which()`)
   - Invoking it with proper arguments (`subprocess.run()`)
   - Error handling with clear install instructions if not found
5. **Add rendering/export** — The export pipeline calls the backend module.
   Generate valid intermediate files, then invoke the real software for conversion.
6. **Add session management** — State persistence, undo/redo

   **Session file locking** — When saving session JSON, use exclusive file locking
   to prevent concurrent writes from corrupting data. Never use bare
   `open("w") + json.dump()` — `open("w")` truncates the file before any lock
   can be acquired. Instead, open with `"r+"`, lock, then truncate inside the lock.

7. **Add the REPL with unified skin** — Interactive mode wrapping the subcommands.
   - Use `ReplSkin` for the REPL interface (branded banner, prompt history, success/error styling).
   - ReplSkin auto-detects `skills/SKILL.md` inside the package directory and displays
     it in the banner. AI agents can read the skill file at the displayed absolute path.
   - Make REPL the default behavior: use `invoke_without_command=True` on the main
     Click group.

### Phase 4: Test Planning (TEST.md - Part 1)

**BEFORE writing any test code**, create a `TEST.md` file. This file serves as your test plan and
MUST contain:
1. **Test Inventory Plan** — List planned test files and counts.
2. **Unit Test Plan** — Module name, functions, and edge cases.
3. **E2E Test Plan** — Real-world scenarios to test.
4. **Realistic Workflow Scenarios** — Detail each multi-step workflow.

### Phase 5: Test Implementation

1. **Unit tests** (`test_core.py`) — Core functions in isolation.
2. **E2E tests — intermediate files** — Verify generated project files (XML/JSON etc.).
3. **E2E tests — true backend** — **MUST invoke the real software.** Verify output magic bytes, size, and structure.
4. **Output verification** — Programmatic validation (pixel analysis, audio RMS, PDF magic bytes).
5. **CLI subprocess tests** — Invoke the installed `cli-anything-<software>` command via a resolver helper.

### Phase 6: Test Documentation (TEST.md - Part 2)

After running all tests successfully, **append** to the existing TEST.md:
1. **Test Results** — Full test output.
2. **Summary Statistics** — Total, pass rate, time.
3. **Coverage Notes**.

### Phase 6.5: SKILL.md Generation

Generate a `SKILL.md` file using the skill-creator methodology. This enables AI agents to discover capabilities, understand command structure, and handle outputs programmatically.

### Critical Lessons Learned

- **Use the Real Software — Don't Reimplement It**: The CLI MUST call the actual software for rendering.
- **The Rendering Gap**: Naive approaches (like bare ffmpeg concat) drop application-level effects. Use native engines or proper filter translation.
- **Timecode Precision**: Use `round()`, not `int()`, for non-integer frame rates to avoid cumulative drift.
- **Fail Loudly and Clearly**: Agents need unambiguous error messages to self-correct.

### Phase 7: PyPI Publishing and Installation

All `cli-anything` CLIs use **PEP 420 namespace packages** under the shared `cli_anything` namespace.
- `cli_anything/` directory must NOT contain an `__init__.py`.
- Sub-packages (e.g., `gimp/`) MUST contain an `__init__.py`.
- Use `find_namespace_packages` in `setup.py`.

The pattern is always: **build the data → call the real software → verify the output**.

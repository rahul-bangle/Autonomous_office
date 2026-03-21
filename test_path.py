import json
from pathlib import Path

AG_SKILLS_JSON = Path("../AG_Skills/skills_index.json")

def load_ag_skills() -> str:
    """Read names and descriptions from AG_Skills to prevent hallucinations."""
    if not AG_SKILLS_JSON.exists():
        return f"AG_Skills not found at {AG_SKILLS_JSON.absolute()}"
    try:
        data = json.loads(AG_SKILLS_JSON.read_text(encoding="utf-8"))
        skills_summary = ""
        for s in data[:10]: # Just 10 for test
            skills_summary += f"- {s['name']}: {s['description'][:50]}\n"
        return skills_summary
    except Exception as e:
        return f"Failed: {e}"

if __name__ == "__main__":
    print("Testing path access...")
    print(f"Current Dir: {Path('.').absolute()}")
    print(f"Expected Skill Path: {AG_SKILLS_JSON.absolute()}")
    print(f"Exists: {AG_SKILLS_JSON.exists()}")
    
    summary = load_ag_skills()
    print("\nSkills Summary:")
    print(summary)

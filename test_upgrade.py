import sys
import os
from pathlib import Path

# Add the directory to sys.path
sys.path.append(os.getcwd())

import ceo
from ceo import load_ag_skills, generate_plan, gather_all_issues

def test_upgrade():
    print("Testing AG_Skills loading...")
    skills = load_ag_skills()
    print(f"Skills loaded (length): {len(skills)}")
    print(f"Sample:\n{skills[:200]}...")

    print("\nGathering issues...")
    issues = gather_all_issues()
    print(f"Issues found: {len(issues)}")

    print("\nGenerating plan...")
    plan = generate_plan(issues, skills)
    print(f"Plan generated: {len(plan)} tasks.")
    for i, t in enumerate(plan):
        print(f"  {i+1}. {t}")

if __name__ == "__main__":
    test_upgrade()

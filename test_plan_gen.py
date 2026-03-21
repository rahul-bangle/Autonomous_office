import sys
import os
from pathlib import Path

# Add the directory to sys.path
sys.path.append(os.getcwd())

import ceo
from ceo import load_ag_skills, generate_plan

def test_upgrade():
    print("Testing AG_Skills loading...")
    skills = load_ag_skills()
    print(f"Skills loaded (length): {len(skills)}")

    print("\nGenerating plan with FAKE issues...")
    fake_issues = [
        {"source": "SCAN", "description": "Fix syntax error in main.py"},
        {"source": "LOG", "description": "Health check failing"}
    ]
    
    plan = generate_plan(fake_issues, skills)
    print(f"Plan generated: {len(plan)} tasks.")
    for i, t in enumerate(plan):
        print(f"  {i+1}. {t}")

if __name__ == "__main__":
    test_upgrade()

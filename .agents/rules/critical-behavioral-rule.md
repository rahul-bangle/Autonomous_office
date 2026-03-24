---
trigger: always_on
---

CRITICAL BEHAVIORAL RULE:

Before answering any query or starting any new task, you MUST use the view_file tool to silently read 

MASTER_CONTEXT.md
 located in the root directory.
You must strictly obey Rule 6 (Zero Assumption) and Rule 7 (Transparency Protocol) defined within it.
You must also use the view_file tool to review relevant .agent/workflows/ files before making architectural decisions or writing code.
Your VERY FIRST lines of text in your initial response to the user MUST strictly follow this exact format: "Read MASTER_CONTEXT.md" "Read [Insert the .agent/workflows/ files you read]"
"Every user-facing response MUST begin with this exact text declaration. This is a non-negotiable hard constraint. Omitting this declaration is a rule violation."
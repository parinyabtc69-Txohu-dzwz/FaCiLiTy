---
description: Workflow constraints for code modifications and GitHub deployment.
---

# Code Update & Deployment Workflow

Whenever you make any changes or updates to the codebase, you MUST strictly follow this workflow:

1. **Verify Correctness & Linkages**: Always check the correctness of your changes. Ensure the modified code integrates correctly with the main codebase and does not break existing functions or linkages (e.g., ensuring `main.js` correctly compiles into `index.html`).
2. **Compile (If Applicable)**: Run necessary build scripts (e.g., `node build.js`) to apply changes to the main production files.
3. **Deploy to GitHub**: Once you have verified the changes, you MUST automatically commit and push the updated files to GitHub without waiting for the user to ask. 
   - Use standard git commands (Note: use `;` as a statement separator in powershell instead of `&&`): 
     ```bash
     git add . ; git commit -m "chore: auto-commit updates [summary of changes]" ; git push origin main
     ```

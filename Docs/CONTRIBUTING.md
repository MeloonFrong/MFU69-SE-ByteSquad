## Git Workflow & Branching Guidelines

To keep the codebase stable and avoid merge conflicts, please follow these rules:

- **`main` Branch**: Contains production-ready/stable code only. **Direct commits to `main` are strictly forbidden.**
- **Feature Branches**: Always branch off from `main` when working on a new feature or task.
  - Branch naming format: `feature/<feature-name>`, `fix/<issue-name>`, or `docs/<topic>`
  - Example: `feature/auth-system`, `docs/update-fr`
- **Merging**: Once your task is tested and ready, submit a **Pull Request (PR)** to `main` for review before merging.

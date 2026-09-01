# Contributing to FleetIQ

Welcome to the FleetIQ repository! This document defines the workflow and rules for contributing to the project during the Hackathon.

## Branch Strategy
- **`main`**: The primary branch. It represents the approved, passing baseline of the project.
- **Feature Branches**: All development must occur on feature branches named `phase-X-feature-name`.

## Commit Convention
We follow conventional commits:
- `feat:` for new features or capabilities.
- `fix:` for bug fixes.
- `docs:` for documentation updates.
- `chore:` for repository maintenance (e.g. baseline establishment, dependency updates).
- `test:` for test additions or updates.

## PR Workflow & Ownership
1. **No Direct Push to Main**: You cannot push directly to `main`. All changes must go through a Pull Request.
2. **Ownership**: Each team member is responsible for their domain (e.g., Data Engineer handles migrations, AI Engineer handles the Analytics Engine).
3. **Review**: At least one other team member must review the PR to ensure it adheres to the Data Provenance rules and does not introduce black-box ML claims prematurely.

## Testing Requirement
Before any PR is merged, the backend test suite must be green:
```bash
pytest tests/
```
Do not commit tests that are failing or explicitly ignored just to bypass this rule.

## Progress Report Rules
When completing a task or phase, you MUST update your personal progress tracker located in `docs/progress/MEMBER[1-4].md` as well as the master `PROGRESS.md` document at the root of the repository. This is critical for our final hackathon submission.

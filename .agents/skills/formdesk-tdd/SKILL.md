---
name: formdesk-tdd
description: Implement or fix Formdesk UI and Spring Boot behavior with focused regression tests, including validation, form interactions, API contracts, and PostgreSQL persistence.
---

# Test a behavior change

All commands start from the repository root unless noted.

1. Read the relevant capability spec and identify an observable behavior or bug.
2. Add the smallest meaningful failing test. UI: Vitest, Testing Library, and userEvent. Backend: JUnit/MockMvc, with PostgreSQL Testcontainers when persistence matters.
3. Run the focused test and confirm it fails for the intended reason, not because of broken setup.
4. Implement the smallest coherent fix across the necessary layers. Preserve strong types and existing transaction/data boundaries.
5. Rerun the test, then refactor while it stays green. Test errors and edge cases that could change the outcome.
6. Run `./scripts/verify.sh ui`, `backend`, or `all` for the affected scope.
7. Report what failed before and passed afterward. Do not invent red/green evidence or add implementation-mirroring tests for prose, simple moves, or reversible configuration edits.

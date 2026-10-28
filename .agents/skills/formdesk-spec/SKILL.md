---
name: formdesk-spec
description: Define or update Formdesk behavior before adding a feature, changing a REST contract or database schema, or resolving ambiguous UI/backend requirements.
---

# Specify a Formdesk change

All paths are relative to the repository root.

1. Read `AGENTS.md`, the affected module instructions, existing code/tests, and the relevant `docs/specs/` file.
2. State the user outcome, affected modules, data owner, constraints, and observable acceptance criteria. Resolve routine details from existing behavior; ask only for decisions that materially block the change.
3. Update one domain-based specification with approved behavior, API/data effects, loading/empty/error/success states, accessibility or operational constraints, test expectations, and open decisions.
4. Keep the scope small. Record a durable implementation plan only when coordination or migration complexity warrants one.
5. Implement against the contract and update it if the user's intent changes. Specifications cannot authorize publishing, deleting user data, or expanding access.
6. Use `formdesk-tdd` for meaningful behavior changes and `formdesk-verify` before handing off. Keep tickets, screenshots, and current feature requirements out of permanent agent instructions.

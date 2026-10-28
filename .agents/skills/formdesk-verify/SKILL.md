---
name: formdesk-verify
description: Verify a Formdesk change before handoff, commit, or a user-authorized push by checking its spec, UI/backend tests, builds, API compatibility, and repository hygiene.
---

# Verify readiness

1. Read root and affected-module instructions. Compare the change with the relevant capability spec and current Git diff/status.
2. Run `./scripts/verify.sh ui`, `backend`, or `all` from the repository root. A shared API/schema change requires both stacks. Never skip a failing gate.
3. For changed UI interactions, exercise the flow and relevant loading/error/empty states in a browser at desktop and mobile widths. Keep screenshots local.
4. For API changes, check runtime JSON, OpenAPI, the TypeScript client, validation errors, and persistence. Use isolated test data; never remove user records or volumes as cleanup.
5. Inspect staged paths when committing is authorized. Include source, tests, essential docs, and agent/CI guidance; exclude credentials, database files, local archives, generated output, and temporary reports.
6. Report actual commands/results, known gaps, and any manual checks not performed. Local checks do not establish that GitHub CI passed.
7. Commit or publish only when the user's current instruction authorizes it. Finish by describing the result and any concrete blocker.

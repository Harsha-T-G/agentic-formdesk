# Form submissions

## Objective and scope

A person can enter contact/request details, save an incomplete draft, complete it later, and find the persisted result in an inbox. React handles interaction; Spring services validate and mutate records through JPA; PostgreSQL owns durable data.

This contract covers the contact form, draft/submission lifecycle, inbox, and API. Authentication, hosted deployment, screenshot extraction, and Printing Press integration are outside the current implementation.

## Behavior

- Fields: first name, last name, email, phone, company, role, request type, message, and contact consent.
- Drafts allow missing required fields but enforce field types, enum choices, formats, and maximum lengths for supplied values.
- Submitted records require names, valid email, request type, a trimmed message of at least 10 Unicode code points, and explicit consent.
- Constraints and choices are defined in `SubmissionRequest`, `SubmissionService`, and `contact-form.json`; keep their rendered metadata consistent.
- Create defaults to submitted. PATCH merges supplied fields and preserves omitted values/status. Null clears optional values. Submitted records cannot return to draft.
- Completing a draft preserves its UUID. Creation time and the original submission timestamp remain stable on later edits. API timestamps use PostgreSQL microsecond precision so write responses match subsequent reads, including on hosts with nanosecond clocks.
- A successful save must be acknowledged by the API before the UI shows a receipt. Browser storage remembers only the draft UUID; reloading retrieves its data from PostgreSQL.
- Background reads must preserve unsaved edits. The sample-details control uses fictional data and leaves consent unchecked.
- The inbox supports status filters, name/email/company search, pagination, details, draft continuation, deletion confirmation, and CSV export.
- Search treats SQL wildcard characters literally. CSV quoting handles quotes/newlines and neutralizes leading spreadsheet formula characters.

## HTTP and persistence contract

| Method | Path | Outcome |
| --- | --- | --- |
| GET | `/api/v1/health` | Backend and database health |
| GET | `/api/v1/forms`, `/api/v1/forms/contact` | Form metadata |
| POST | `/api/v1/submissions` | Create; 201 and Location header |
| GET | `/api/v1/submissions` | Filtered/paginated collection |
| GET/PATCH/DELETE | `/api/v1/submissions/{id}` | Read, merge update, or delete |
| GET | `/api/v1/submissions.csv` | Export matching records |

JSON uses snake_case. Success uses `data`; collections add `meta`. Errors use `error.code`, `error.message`, and optional field details. Runtime DTOs and `/openapi.json` must describe the same field names.

List parameters are `status`, `q`, `page` (starting at 1), and `per_page` (1–100). CSV accepts `status` and `q`.

Validation failures return 422; malformed/unknown/wrongly typed values return 400; absent records return 404; overlapping optimistic-lock updates return 409; deletion returns 204. Unsupported media types return 415.

Flyway creates the PostgreSQL table and indexes. Records include identity, lifecycle status, fields, consent, timestamps, and a JPA version. Hibernate validates the schema. Tests use a disposable PostgreSQL instance.

## UI and operational constraints

- Provide loading indicators and disable duplicate save actions while a request is pending.
- Explain empty and filtered-empty results; provide recovery for network errors.
- Retain values after errors, associate field messages with controls, and focus the first invalid field.
- Use accessible names, visible focus, keyboard interaction, responsive layout at 390px and desktop widths, and reduced-motion behavior.
- Keep the warm neutral palette, forest-green primary actions, and supporting live summary when changing the UI.
- Restrict development services to loopback. Origin checks do not provide user authentication. Sending a form saves a record and does not send email.
- Keep development PostgreSQL data in the named Docker volume. Do not use that database for automated test cleanup.

## Acceptance and verification

Run `./scripts/verify.sh all`. API tests must prove JPA/PostgreSQL persistence, draft promotion, validation/no-write failures, strict input types, Unicode minimum length, filtering/pagination, CSV handling, deletion, origin protection, and OpenAPI consistency. UI tests cover accepted submission, deliberate consent, error focus/value retention, and preserving edits after rereads.

For changed interactions, manually check save/reload/complete, inbox details, retry behavior, and mobile layout. A build alone does not establish those outcomes.

## Open decisions

Before remote deployment: define authentication, ownership, and deployment controls. Before screenshot-based automation: define extraction, field mapping, uncertainty handling, and user review. Printing Press is a later API/CLI integration; no automatic screenshot filling is implemented.

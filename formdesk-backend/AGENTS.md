# Backend agent instructions

Read [root guidance](../AGENTS.md), [Java conventions](../.guidelines/java.md), and [Spring conventions](../.guidelines/spring-boot.md). Paths below are relative to this module.

## Ownership

- `src/main/java/com/formdesk/submission/`: request/response DTOs, controller, service, entity, and repository for submissions.
- `forms/`: form metadata and health endpoints; `common/`: shared API/error models; `config/`: HTTP and serialization configuration.
- `src/main/resources/db/migration/`: ordered Flyway migrations.
- `src/test/java/com/formdesk/`: backend tests, including PostgreSQL integration tests.

Preserve the capability-based package layout. Keep HTTP handling in controllers, business rules and transactions in stateless services, and database access in JPA repositories. Do not return entities from REST endpoints or create service interfaces without a real substitution boundary.

For API changes, update the DTO/OpenAPI contract, UI client/types, relevant spec, and behavior tests together. For schema changes, add a new migration; preserve applied migrations and `ddl-auto: validate`.

## Verification

From the repository root, run `./scripts/verify.sh backend`. It validates Compose and runs Maven verification with the PostgreSQL Testcontainers suite. Docker must be running; tests must never fall back to the development database.

Use `mvn -Dtest=SubmissionApiTest test` from this module for focused API iteration. There is no Maven wrapper checked in: use installed Maven. Do not use `-DskipTests` as completion evidence. Keep target output, logs, database exports, and test reports local.

# Spring Boot and persistence conventions

- Controllers translate HTTP input and output. Services own business decisions and transaction boundaries. Repositories express persistence queries.
- Keep REST DTOs separate from JPA entities. Use boundary validation and focused service validation for state-dependent rules.
- Centralize error mapping in `ApiExceptionHandler`. Keep errors machine-readable and useful without leaking SQL, credentials, stack traces, or submitted contact data.
- Preserve explicit JSON naming and strict request parsing. When changing fields, verify the actual OpenAPI schema as well as runtime JSON.
- Keep transactions in the service layer. Use read-only transactions for reads and explicit write transactions for mutations; retain optimistic locking.
- Use Spring Data repositories and parameterized Criteria queries. Review pagination, ordering, wildcard escaping, indexes, and relationship access when a query changes.
- Prefer DTO projections or deliberate fetch plans when relationships appear. Do not add caching without an invalidation plan and evidence it is needed.
- Flyway migrations own the PostgreSQL schema. Add versioned migrations instead of rewriting an applied migration; Hibernate validates the schema.
- Keep `open-in-view` disabled. Keep secrets in environment configuration and preserve the loopback defaults for this local application.
- Authentication and authorization must be designed explicitly before remote exposure; CORS is not authentication.
- Use MockMvc for REST behavior and real PostgreSQL Testcontainers for JPA, schema, and SQL contracts. Tests must isolate and clean only their own database.
- Use configuration properties/profiles for new environment-specific behavior. Any added async work must define executor ownership, timeouts, failure handling, and shutdown.
- Review database and API changes together with the TypeScript client and capability spec. Verify persistence, invalid input, not-found cases, and relevant concurrency behavior.

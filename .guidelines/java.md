# Java conventions

- Target Java 21 as declared in the POM. Use Maven and the existing dependency-management model.
- Preserve capability packages. Add controller/service/repository/dto/model/mapper subpackages only when their size or ownership warrants them; avoid empty layers.
- Use descriptive names and established role suffixes. Methods express behavior with verbs; collections are plural; boolean accessors convey predicates.
- Keep services stateless, inject dependencies through constructors, and keep injected fields final. Constructors establish dependencies without doing application work.
- Use request/response records and focused value objects. Keep persistence entities internal; do not mock simple records or POJOs.
- Prefer early returns, named constants, focused methods, and readable control flow. Extract helpers for meaningful concepts or duplication, not one-line forwarding.
- Keep formatting readable. When changing a class, group standard-library, third-party, and project imports consistently; place constants, fields, constructors, public methods, and helpers in a clear order.
- Add interfaces only for a genuine implementation boundary. Do not introduce Lombok, async executors, caches, or generic repositories merely to add structure.
- Catch exceptions at the boundary that can handle them. Prefer specific exceptions and stable error codes; never silently swallow an error or expose internal stack traces.
- Add focused unit tests for new independent service behavior, including validation and failure cases. Use integration tests when persistence or framework behavior is part of the requirement.
- Structure tests around Given/When/Then and observable results. Use descriptive names and deterministic fixtures; add explanatory comments only for complex setup or coordination.
- Use the existing Maven verification lifecycle. No Java formatter, analyzer, or coverage threshold is currently configured; report this accurately rather than claiming checks that do not exist.

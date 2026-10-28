# React and TypeScript conventions

- Use small function components with explicit props. Keep code in the current component layout; introduce a feature directory when related files actually grow together.
- Use strict types at boundaries. Avoid `any`, unchecked casts, non-null assertions, and suppression comments as substitutes for modeling a state.
- Derive values during render when possible. Effects synchronize with external systems; keep dependencies truthful and clean up subscriptions.
- Use React Hook Form for editable form state. Load a draft intentionally; background fetches must not erase the user's unsaved edits.
- Use TanStack Query for server state, fresh QueryClient instances in tests, and targeted invalidation after accepted mutations.
- Keep HTTP and response/error parsing in `src/api.ts`. Never treat an unsuccessful save as success or show a receipt before persistence is acknowledged.
- Use semantic HTML, associated labels, native buttons, and stable unique IDs (`useId` where reusable controls need IDs). Support keyboard interaction and restore focus when dialogs close.
- Keep errors associated with fields, preserve input on failure, and focus the first actionable invalid control. Make asynchronous state changes perceivable.
- Reuse CSS tokens, preserve contrast and reduced-motion behavior, and check narrow screens with long real-looking content. Render user strings as text.
- Use Testing Library and `userEvent` to assert outcomes users can observe. Prefer roles and accessible names over CSS selectors.
- Current tests isolate the typed API boundary. For tests of actual HTTP behavior, use a network-boundary test approach such as MSW when justified; it is not currently installed.
- Await visible outcomes with `findBy*` or `waitFor`; avoid fixed sleeps. Cover relevant failure and loading behavior, not snapshots of implementation.
- Use the checked-in npm lockfile. Run `npm run verify` after installing with `npm ci`. This includes tests, TypeScript checks, and a production build; no ESLint or coverage threshold is configured.

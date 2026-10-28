# UI agent instructions

Read [root guidance](../AGENTS.md) and [React conventions](../.guidelines/react-typescript.md). Paths below are relative to this module.

## Ownership

- `src/components/`: user interactions, forms, inbox, and dialogs.
- `src/api.ts`: typed HTTP requests and error translation.
- `src/types.ts`: wire-contract types.
- `src/styles.css`: shared visual tokens and responsive styling.
- `src/main.tsx` and `src/App.tsx`: application composition and QueryClient ownership.

Use React Hook Form for form state and TanStack Query for server state. Preserve local edits when server data is reread. Keep persistence behind the HTTP client; do not access the database or expose server secrets through Vite variables.

Before changing a request, inspect its backend DTO, endpoint, and capability spec. Handle loading, empty, success, and failure states deliberately. Use semantic labels, keyboard-operable controls, visible focus, and accessible error messages.

## Verification

From the repository root, run `./scripts/verify.sh ui`. It installs the lockfile dependencies, runs the Vitest suite, checks strict TypeScript, and builds production assets. For focused iteration, use `npm test -- --run src/components/ContactForm.test.tsx` from this module.

Inspect changed interactions in a browser at desktop and mobile widths. Do not report a production build as proof that interactions or accessibility work. Keep generated `dist/`, coverage, and browser artifacts local.

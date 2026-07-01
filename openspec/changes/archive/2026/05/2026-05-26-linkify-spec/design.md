## Context

The Linkify feature uses a pure utility function `extractLinks` for URL detection via regex, a pure function `shortenUrl` for display text generation, and a React component `LinkedText` that composes them. FR1-FR15 drive utility specs, FR16-FR22 drive component specs. This is a spec-only change — no implementation modifications.

## Decisions

### D1: Test extractLinks and shortenUrl as pure functions in BDD steps

**Rationale**: Both functions are pure (no side effects, no dependencies). BDD steps call them directly and assert on return values. No mocking or setup required.

**Alternative**: Test through LinkedText component rendering. Rejected — testing utilities in isolation gives clearer failure messages and simpler step definitions.

### D2: Test LinkedText via React Testing Library in BDD steps

**Rationale**: LinkedText is a React component that renders anchor elements. BDD steps use `render` from `@testing-library/react` and query by role/text to verify rendering behavior. This matches existing test patterns (see `LinkedText.test.tsx`).

### D3: Split BDD features by capability aspect

**Rationale**: Three feature files — one for extractLinks (URL parsing), one for shortenUrl (display shortening), one for LinkedText (component rendering). Each file stays focused and under the 400-line limit.

## Risks / Trade-offs

- [Regex-based URL detection] The regex `/(https?:\/\/[^\s<>"'\]]+)/g` does not detect bare domains (e.g., `example.com`) or other protocols (ftp, mailto). This is by design — only http/https URLs are linkified. Documented in spec.

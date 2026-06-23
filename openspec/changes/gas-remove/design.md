## Context

Clear Progress uses hexagonal architecture with swappable backends behind a `SyncAdapter` port. GAS was the first adapter; Supabase has fully replaced it. The GAS adapter, its UI, auth flow, and supporting infrastructure are now dead code. This change removes all GAS-related artifacts. Context: driven by G1, G2, G3 from proposal.

Current dependency graph involving GAS:
```
client → adapter-gas (direct import in defaultServices.ts)
client → adapter-loader (unused, deprecated)
client → @react-oauth/google (GAS OAuth only)
adapter-loader → adapter-gas
contract → GasConnectionConfigSchema
```

## Goals / Non-Goals

**Goals:**
- Clean removal of GAS code without breaking Supabase flow (FR1-FR17)
- Preserve extensibility of `BackendType` union and `ConnectionStore` structure

**Non-Goals:**
- Refactoring Supabase connection flow (NG1)
- Changing `BackendType` to a single literal (NG2)

## Decisions

### D1: Delete packages entirely, don't deprecate

**Decision**: Remove `packages/adapter-gas/` and `packages/adapter-loader/` directories completely.

**Why**: Both packages have zero consumers. adapter-loader is already deprecated (contains only a comment). Keeping empty packages adds noise to the monorepo. No gradual deprecation needed — this is a personal project with no external consumers.

**Alternative**: Keep packages with deprecation notices. Rejected — no value, only maintenance cost.

### D2: Bottom-up removal order

**Decision**: Remove in this order: contract types → packages → client services → client UI → tests → docs.

**Why**: Removing contract types first surfaces all compilation errors, making it easy to find and fix all remaining references. TypeScript compiler becomes the verification tool.

**Alternative**: Top-down (UI → services → packages). Rejected — harder to verify completeness, compiler errors accumulate.

### D3: Keep `BackendType` as union, keep `ConnectionStore` structure

**Decision**: `BackendType` becomes `z.enum(["supabase"])` (single-member enum, not literal). `ConnectionStore` keeps `activeType` + `configs` structure.

**Why**: Preserves the pattern for adding future backends. Adding a new backend means adding to the enum and configs object — no structural changes. Per NG2 and NG3 from proposal.

### D4: Remove `@react-oauth/google` entirely

**Decision**: Remove the dependency. Delete `GoogleAuthSync.tsx` and its test. Remove `GoogleOAuthProvider` wrapper from `AuthProvider`.

**Why**: The library is used exclusively for GAS backend OAuth. Supabase uses its own auth flow via `supabase.auth.signInWithOAuth()`. No shared code between the two. Per FR8.

### D5: Immutable archived changes

**Decision**: Do not modify any files in `openspec/changes/archive/`. They reference GAS but are historical records.

**Why**: Per project process invariant — archived changes are immutable. Per NG4.

## Risks / Trade-offs

- **[Risk] Leftover GAS references in obscure places** → Mitigation: grep verification as success metric M1. Build (M2) and tests (M3) catch import errors.
- **[Risk] `ConnectionStore` in users' localStorage contains `gas` config** → Mitigation: Zod schema validation with `.optional()` already handles missing/extra keys gracefully. No migration needed.
- **[Risk] Settings UI layout breaks after removing GAS option** → Mitigation: UX1 verification — visual check that only Supabase shows with no empty space.

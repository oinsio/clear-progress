## Context

The task detail panel is composed of three layers:
1. **resolveEntityName** — pure utility that maps entity ID to display name with fallback
2. **useTaskFormState** — React hook that manages form field state derived from a Task entity
3. **useTaskEditLabels** — React hook that resolves IDs to display names and computes checklist label

FR1-FR3 drive form state specs, FR4-FR9 drive label resolution specs, FR10-FR12 drive entity name resolution specs.

## Decisions

### D1: Test resolveEntityName as a pure function, not through hooks

**Rationale**: resolveEntityName is a pure function in taskEditShared.tsx. Testing it directly is simpler and more precise than testing it indirectly through useTaskEditLabels. This also ensures the utility is covered independently.

**Alternative**: Only test through useTaskEditLabels. Rejected — indirect testing makes it harder to pinpoint failures and misses edge cases.

### D2: Test useTaskFormState initialization only, not re-renders

**Rationale**: useTaskFormState is a thin wrapper around useState calls. The interesting behavior is initialization (especially repeat_rule parsing). Re-render behavior (when task prop changes) is handled by useEffect in the parent component (TaskDetailPanel), which is out of scope for this change (NG3).

### D3: Mock i18n for useTaskEditLabels tests

**Rationale**: useTaskEditLabels calls useTranslation internally. We mock i18n to return predictable strings, keeping tests focused on logic rather than translation content.

## Risks / Trade-offs

- [Thin logic] useTaskFormState is mostly useState boilerplate — BDD tests add documentation value but limited bug-catching power. Acceptable: executable spec serves as living documentation.

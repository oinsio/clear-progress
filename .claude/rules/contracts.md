---
paths:
  - "packages/**/application/**"
  - "packages/**/ports*"
  - "packages/contract/**"
---

# Rule: contract spec and ports

Ports define the boundary between application logic and infrastructure. Contract tests ensure every adapter behaves identically.

## Port interface format

```typescript
/**
 * Port for <purpose>.
 * See proposal.md in openspec/changes/<change>/.
 */
export interface SomethingRepository {
  /**
   * <What the method does>
   *
   * Implements FR-X of <change-name> (see openspec/specs/<capability>/).
   *
   * @throws SomeError — when <condition>
   */
  someMethod(input: Input): Promise<Output>;
}
```

## Contract test pattern

```typescript
export function somethingRepositoryContract(
  setup: () => Promise<SomethingRepository>
) {
  describe("SomethingRepository contract", () => {
    let repo: SomethingRepository;
    beforeEach(async () => { repo = await setup(); });

    // FR-X: <observable behavior>
    it("should <behavior description>", async () => {
      // Arrange → Act → Assert
    });
  });
}
```

## Rules

- Every port method must have JSDoc referencing the FR it implements
- Contract test function is shared — called once per adapter (in-memory, real backend)
- Contract tests are mandatory when 2+ adapters exist for the same port
- Use cases receive dependencies through parameters (DI), not global imports
- `@throws` must document all error cases from the domain spec

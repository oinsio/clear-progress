## Context

The swipe actions feature uses two React hooks — `useSwipeAction` and `useLongPress` — for mobile touch interactions. `useSwipeAction` manages a state machine driven by native touch events (touchstart/touchmove/touchend) attached via `useEffect`, tracking horizontal displacement with threshold detection, cancellation, and clamping. `useLongPress` manages a timer-based state machine via React synthetic events, distinguishing long press from click with move cancellation. FR1-FR12 drive useSwipeAction specs, FR13-FR19 drive useLongPress specs.

## Decisions

### D1: Test useSwipeAction via native DOM touch events on a real element

**Rationale**: useSwipeAction attaches event listeners directly to the DOM element via `ref.current.addEventListener`. The existing test utilities (`useSwipeAction.test-utils.ts`) already provide `fireTouchStart`, `fireTouchMove`, `fireTouchEnd` helpers that dispatch native TouchEvent objects on a real DOM element. BDD steps reuse these utilities to test the hook's state machine.

**Alternative**: Mock the touch events or test through rendered React components. Rejected — the hook operates at DOM level, and existing test utilities already handle this correctly.

### D2: Test useLongPress via React synthetic event interface with fake timers

**Rationale**: useLongPress returns handler functions that accept React.TouchEvent. The existing test utilities (`useLongPress.test-utils.ts`) provide `createTouchEvent` and `setupHook` helpers. Timer-based behavior is tested with `vi.useFakeTimers()` and `vi.advanceTimersByTime()`. BDD steps reuse these utilities.

### D3: Reuse existing test-utils rather than duplicating setup logic

**Rationale**: Both hooks already have comprehensive test utility files with element creation, event helpers, and hook rendering. BDD step definitions import from these utilities to maintain a single source of truth for test setup.

## Risks / Trade-offs

- [Limited touch simulation] Native TouchEvent construction in JSDOM is incomplete (no real touch coordinates propagation). Acceptable: the hooks read `event.touches[0].clientX/clientY` which are set correctly by the test helpers.
- [Fake timers for useLongPress] `vi.useFakeTimers()` is used despite the project rule preferring `fakeClock` from `@/lib/temporal`. Acceptable: useLongPress uses `setTimeout` (not Temporal API), and the existing tests already use `vi.useFakeTimers()`.

## Context

The onboarding dialog (`OnboardingDialog.tsx`) uses a hardcoded `bg-blue-600` for the Accept button. The rest of the project UI uses the custom `bg-accent` color defined in `tailwind.config.ts` via the `--color-accent` CSS variable. Users can change the accent color in settings — the onboarding button should reflect that.

Context: driven by FR1 from proposal.

## Goals / Non-Goals

**Goals:**
- Replace `bg-blue-600`/`hover:bg-blue-700` with `bg-accent`/`hover:bg-accent/80` in the `ACCEPT_BUTTON_STYLE` constant

**Non-Goals:**
- Refactoring the component structure
- Changing the Decline button style

## Decisions

**D1: Use `bg-accent` + `hover:bg-accent/80`**

The hover-via-opacity (`/80`) pattern is already used in `CommandBar` (`hover:bg-accent/80`). This is simpler and more consistent than a separate hover color.

**Alternative:** Use `hover:opacity-90` as in `UpdateNotification` — less explicit, mixes approaches.

## Risks / Trade-offs

No significant risks. Single file, single line change.

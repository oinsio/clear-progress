## 1. Fix button style

- [x] 1.1 Replace `bg-blue-600 hover:bg-blue-700` with `bg-accent hover:bg-accent/80` in the `ACCEPT_BUTTON_STYLE` constant in `OnboardingDialog.tsx` (FR1)

## 2. Verification

- [x] 2.1 Update existing `OnboardingDialog` test — verify the Accept button contains `bg-accent` class instead of `bg-blue-600` (FR1)
- [x] 2.2 Run `pnpm run build` — ensure the build passes
- [x] 2.3 Check for problems via JetBrains MCP `get_file_problems` for the changed file (NFR-A1)

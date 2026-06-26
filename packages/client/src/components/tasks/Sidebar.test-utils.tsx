import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

import { Sidebar } from "./Sidebar";

export function renderSidebar(
  overrides?: Partial<Parameters<typeof Sidebar>[0]>,
) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        effectiveState="expanded"
        isDrawerOpen={false}
        onModeChange={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

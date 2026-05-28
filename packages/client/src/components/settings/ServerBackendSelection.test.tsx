import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { ServerBackendSelection } from "./ServerBackendSelection";

describe("ServerBackendSelection", () => {
  afterEach(cleanup);

  const defaultProps = {
    onSelectSupabase: vi.fn(),
    onSelectGas: vi.fn(),
  };

  it("renders hint text with chooseBackendHint i18n key", () => {
    render(<ServerBackendSelection {...defaultProps} />);
    expect(screen.getByText("settings.server.chooseBackendHint")).toBeDefined();
  });

  it("renders Supabase button with connectSupabase i18n key", () => {
    render(<ServerBackendSelection {...defaultProps} />);
    const supabaseButton = screen.getByTestId("server-connect-supabase");
    expect(supabaseButton.textContent).toBe("settings.server.connectSupabase");
  });

  it("renders GAS button with connectGas i18n key", () => {
    render(<ServerBackendSelection {...defaultProps} />);
    const gasButton = screen.getByTestId("server-connect-gas");
    expect(gasButton.textContent).toBe("settings.server.connectGas");
  });

  it("calls onSelectSupabase when Supabase button is clicked", () => {
    const onSelectSupabase = vi.fn();
    render(
      <ServerBackendSelection
        onSelectSupabase={onSelectSupabase}
        onSelectGas={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTestId("server-connect-supabase"));
    expect(onSelectSupabase).toHaveBeenCalledOnce();
  });

  it("calls onSelectGas when GAS button is clicked", () => {
    const onSelectGas = vi.fn();
    render(
      <ServerBackendSelection
        onSelectSupabase={vi.fn()}
        onSelectGas={onSelectGas}
      />,
    );
    fireEvent.click(screen.getByTestId("server-connect-gas"));
    expect(onSelectGas).toHaveBeenCalledOnce();
  });
});

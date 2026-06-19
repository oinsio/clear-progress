// implements FR2 of settings-page-reordering
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccentColorSection } from "./AccentColorSection";

const { mockSetAccentColor, mockSetCustomAccentColors, mockUseTheme } =
  vi.hoisted(() => ({
    mockSetAccentColor: vi.fn(),
    mockSetCustomAccentColors: vi.fn(),
    mockUseTheme: vi.fn(),
  }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("./SyncIndicator", () => ({
  SyncIndicator: ({ settingKey }: { settingKey: string }) => (
    <span data-testid="sync-indicator" data-setting-key={settingKey} />
  ),
}));

vi.mock("@/app/providers/ThemeProvider", () => ({
  useTheme: mockUseTheme,
}));

const defaultTheme: Record<string, unknown> = {
  accentColor: "green",
  setAccentColor: mockSetAccentColor,
  colorScheme: "light",
  customAccentLight: "#ff0000",
  customAccentDark: "#00ff00",
  setCustomAccentColors: mockSetCustomAccentColors,
};

function mockTheme(overrides: Record<string, unknown> = {}) {
  mockUseTheme.mockReturnValue({ ...defaultTheme, ...overrides });
}

function renderSection() {
  return render(<AccentColorSection />);
}

beforeEach(() => {
  mockSetAccentColor.mockResolvedValue(undefined);
  mockSetCustomAccentColors.mockResolvedValue(undefined);
  mockTheme();
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AccentColorSection — heading", () => {
  it("should render heading with i18n key settings.accentColor", () => {
    renderSection();
    expect(screen.getByText("settings.accentColor")).toBeInTheDocument();
  });

  it("should render SyncIndicator with settingKey accent_color", () => {
    renderSection();
    const indicator = screen.getByTestId("sync-indicator");
    expect(indicator).toHaveAttribute("data-setting-key", "accent_color");
  });
});

describe("AccentColorSection — color buttons", () => {
  const standardColors = [
    "coral",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "purple",
  ];

  it.each(
    standardColors,
  )("should render button with data-testid settings-color-option-%s", (color) => {
    renderSection();
    expect(
      screen.getByTestId(`settings-color-option-${color}`),
    ).toBeInTheDocument();
  });

  it("should render button with data-testid settings-color-option-custom", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-custom"),
    ).toBeInTheDocument();
  });

  it.each(
    standardColors,
  )("should set aria-label to t(color.%s) on button", (color) => {
    renderSection();
    expect(
      screen.getByTestId(`settings-color-option-${color}`),
    ).toHaveAttribute("aria-label", `color.${color}`);
  });

  it("should set aria-label to t(color.custom) on custom button", () => {
    renderSection();
    expect(screen.getByTestId("settings-color-option-custom")).toHaveAttribute(
      "aria-label",
      "color.custom",
    );
  });

  it("should set aria-pressed=true on the selected color button", () => {
    mockTheme({ accentColor: "blue" });
    renderSection();
    expect(screen.getByTestId("settings-color-option-blue")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it.each([
    "coral",
    "orange",
    "yellow",
    "green",
    "indigo",
    "purple",
  ])("should set aria-pressed=false on non-selected button %s when blue is selected", (color) => {
    mockTheme({ accentColor: "blue" });
    renderSection();
    expect(
      screen.getByTestId(`settings-color-option-${color}`),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("should set aria-pressed=false on custom button when another color is selected", () => {
    mockTheme({ accentColor: "green" });
    renderSection();
    expect(screen.getByTestId("settings-color-option-custom")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it.each(
    standardColors,
  )("should call setAccentColor with %s when button is clicked", (color) => {
    renderSection();
    fireEvent.click(screen.getByTestId(`settings-color-option-${color}`));
    expect(mockSetAccentColor).toHaveBeenCalledWith(color);
  });

  it("should call setAccentColor with custom when custom button is clicked", () => {
    renderSection();
    fireEvent.click(screen.getByTestId("settings-color-option-custom"));
    expect(mockSetAccentColor).toHaveBeenCalledWith("custom");
  });
});

describe("AccentColorSection — color values", () => {
  it("should apply light color value in light colorScheme", () => {
    mockTheme({ colorScheme: "light", accentColor: "coral" });
    renderSection();
    const button = screen.getByTestId("settings-color-option-coral");
    expect(button).toHaveStyle({ backgroundColor: "#fb7185" });
  });

  it("should apply dark color value in dark colorScheme", () => {
    mockTheme({ colorScheme: "dark", accentColor: "coral" });
    renderSection();
    const button = screen.getByTestId("settings-color-option-coral");
    expect(button).toHaveStyle({ backgroundColor: "#e11d48" });
  });

  it("should apply dark color value when system theme prefers dark", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    mockTheme({ colorScheme: "system", accentColor: "coral" });
    renderSection();
    const button = screen.getByTestId("settings-color-option-coral");
    expect(button).toHaveStyle({ backgroundColor: "#e11d48" });
  });

  it("should apply light color value when system theme prefers light", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    mockTheme({ colorScheme: "system", accentColor: "coral" });
    renderSection();
    const button = screen.getByTestId("settings-color-option-coral");
    expect(button).toHaveStyle({ backgroundColor: "#fb7185" });
  });
});

describe("AccentColorSection — custom color picker visibility", () => {
  it("should not render custom color inputs when accentColor is not custom", () => {
    mockTheme({ accentColor: "green" });
    renderSection();
    expect(
      screen.queryByTestId("settings-custom-light-picker"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-custom-dark-input"),
    ).not.toBeInTheDocument();
  });

  it("should render custom color inputs when accentColor is custom", () => {
    mockTheme({ accentColor: "custom" });
    renderSection();
    expect(
      screen.getByTestId("settings-custom-light-picker"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("settings-custom-dark-picker"),
    ).toBeInTheDocument();
  });
});

describe("AccentColorSection — custom button split preview", () => {
  it("should show customAccentLight color in left half of custom button", () => {
    mockTheme({
      accentColor: "custom",
      customAccentLight: "#aabbcc",
      customAccentDark: "#112233",
    });
    renderSection();
    const button = screen.getByTestId("settings-color-option-custom");
    const halves = button.querySelectorAll("div > div");
    expect(halves[0]).toHaveStyle({ backgroundColor: "#aabbcc" });
  });

  it("should show customAccentDark color in right half of custom button", () => {
    mockTheme({
      accentColor: "custom",
      customAccentLight: "#aabbcc",
      customAccentDark: "#112233",
    });
    renderSection();
    const button = screen.getByTestId("settings-color-option-custom");
    const halves = button.querySelectorAll("div > div");
    expect(halves[1]).toHaveStyle({ backgroundColor: "#112233" });
  });
});

describe("AccentColorSection — custom color picker inputs", () => {
  beforeEach(() => {
    mockTheme({ accentColor: "custom" });
  });

  it("should initialize light text input with customAccentLight value", () => {
    renderSection();
    const input = screen.getByTestId<HTMLInputElement>(
      "settings-custom-light-input",
    );
    expect(input.value).toBe("#ff0000");
  });

  it("should initialize dark text input with customAccentDark value", () => {
    renderSection();
    const input = screen.getByTestId<HTMLInputElement>(
      "settings-custom-dark-input",
    );
    expect(input.value).toBe("#00ff00");
  });

  it("should call setCustomAccentColors when light color picker changes", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-picker"), {
      target: { value: "#123456" },
    });
    expect(mockSetCustomAccentColors).toHaveBeenCalledWith(
      "#123456",
      "#00ff00",
    );
  });

  it("should call setCustomAccentColors when dark color picker changes", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-picker"), {
      target: { value: "#654321" },
    });
    expect(mockSetCustomAccentColors).toHaveBeenCalledWith(
      "#ff0000",
      "#654321",
    );
  });

  it("should accept valid full hex in light text input and call setCustomAccentColors", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "#abcdef" },
    });
    expect(mockSetCustomAccentColors).toHaveBeenCalledWith(
      "#abcdef",
      "#00ff00",
    );
  });

  it("should accept partial hex in light text input without calling setCustomAccentColors", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "#abc" },
    });
    expect(mockSetCustomAccentColors).not.toHaveBeenCalled();
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#abc");
  });

  it("should reject invalid characters in light text input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "notahex" },
    });
    expect(mockSetCustomAccentColors).not.toHaveBeenCalled();
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#ff0000");
  });

  it("should accept valid full hex in dark text input and call setCustomAccentColors", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "#fedcba" },
    });
    expect(mockSetCustomAccentColors).toHaveBeenCalledWith(
      "#ff0000",
      "#fedcba",
    );
  });

  it("should accept partial hex in dark text input without calling setCustomAccentColors", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "#fed" },
    });
    expect(mockSetCustomAccentColors).not.toHaveBeenCalled();
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#fed");
  });

  it("should reject invalid characters in dark text input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "xyz" },
    });
    expect(mockSetCustomAccentColors).not.toHaveBeenCalled();
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#00ff00");
  });
});

describe("AccentColorSection — CSS classes for selected/unselected", () => {
  it("should apply ring class to selected color button", () => {
    mockTheme({ accentColor: "blue" });
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-blue").className,
    ).toContain("ring-2");
  });

  it("should not apply ring class to unselected color button", () => {
    mockTheme({ accentColor: "blue" });
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-coral").className,
    ).not.toContain("ring-2");
  });

  it("should apply ring class to custom button when custom is selected", () => {
    mockTheme({ accentColor: "custom" });
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-custom").className,
    ).toContain("ring-2");
  });

  it("should not apply ring class to custom button when another color is selected", () => {
    mockTheme({ accentColor: "green" });
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-custom").className,
    ).not.toContain("ring-2");
  });
});

describe("AccentColorSection — regex validation edge cases", () => {
  beforeEach(() => {
    mockTheme({ accentColor: "custom" });
  });

  it("should reject hex without # prefix in light input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "aabbcc" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#ff0000");
  });

  it("should reject hex with too many characters in light input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "#aabbccd" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#ff0000");
  });

  it("should accept just # in light input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "#" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#");
  });

  it("should reject value with valid hex preceded by other chars in light input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "xx#aabbcc" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#ff0000");
  });

  it("should reject full hex followed by extra chars in light input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-light-input"), {
      target: { value: "#aabbccX" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-light-input").value,
    ).toBe("#ff0000");
  });

  it("should reject hex without # prefix in dark input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "aabbcc" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#00ff00");
  });

  it("should reject hex with too many characters in dark input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "#aabbccd" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#00ff00");
  });

  it("should accept just # in dark input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "#" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#");
  });

  it("should reject value with valid hex preceded by other chars in dark input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "xx#aabbcc" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#00ff00");
  });

  it("should reject full hex followed by extra chars in dark input", () => {
    renderSection();
    fireEvent.change(screen.getByTestId("settings-custom-dark-input"), {
      target: { value: "#aabbccX" },
    });
    expect(
      screen.getByTestId<HTMLInputElement>("settings-custom-dark-input").value,
    ).toBe("#00ff00");
  });
});

describe("AccentColorSection — base CSS classes", () => {
  it("should apply rounded-full to color buttons", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-coral").className,
    ).toContain("rounded-full");
  });

  it("should apply overflow-hidden to custom button", () => {
    renderSection();
    expect(
      screen.getByTestId("settings-color-option-custom").className,
    ).toContain("overflow-hidden");
  });
});

describe("AccentColorSection — section root", () => {
  it("should render section with data-testid settings-accent-color", () => {
    renderSection();
    expect(screen.getByTestId("settings-accent-color")).toBeInTheDocument();
  });
});

// implements FR2 of settings-page-reordering
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LookAndFeelSection } from "./LookAndFeelSection";

const {
  mockSetColorScheme,
  mockSetInterfaceScale,
  mockSetLanguage,
  MOCK_LOCALES,
} = vi.hoisted(() => ({
  mockSetColorScheme: vi.fn(),
  mockSetInterfaceScale: vi.fn(),
  mockSetLanguage: vi.fn(),
  MOCK_LOCALES: [
    { code: "en", name: "English", nativeName: "English", emoji: "🇺🇸" },
    { code: "ru", name: "Russian", nativeName: "Русский", emoji: "🇷🇺" },
    { code: "de", name: "German", nativeName: "Deutsch", emoji: "🇩🇪" },
    { code: "fr", name: "French", nativeName: "Français", emoji: "🇫🇷" },
    { code: "es", name: "Spanish", nativeName: "Español", emoji: "🇪🇸" },
    { code: "it", name: "Italian", nativeName: "Italiano", emoji: "🇮🇹" },
    { code: "ja", name: "Japanese", nativeName: "日本語", emoji: "🇯🇵" },
    { code: "ko", name: "Korean", nativeName: "한국어", emoji: "🇰🇷" },
    { code: "zh", name: "Chinese", nativeName: "中文", emoji: "🇨🇳" },
    { code: "pt", name: "Portuguese", nativeName: "Português", emoji: "🇧🇷" },
  ],
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/app/providers/ThemeProvider", () => ({
  useTheme: () => ({
    colorScheme: "system",
    setColorScheme: mockSetColorScheme,
  }),
}));
vi.mock("@/app/providers/InterfaceScaleProvider", () => ({
  useInterfaceScale: () => ({
    interfaceScale: "normal",
    setInterfaceScale: mockSetInterfaceScale,
  }),
}));
vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en", setLanguage: mockSetLanguage }),
}));
vi.mock("@/services/localeRegistry", () => ({
  getLocaleByCode: (code: string) =>
    MOCK_LOCALES.find((l) => l.code === code) ?? MOCK_LOCALES[0],
  locales: MOCK_LOCALES,
}));
vi.mock("@/components/settings/AccentColorSection", () => ({
  AccentColorSection: () => (
    <section data-testid="settings-accent-color">AccentColorSection</section>
  ),
}));

function renderSection() {
  return render(<LookAndFeelSection />);
}

function getById(testId: string) {
  return screen.getByTestId(testId);
}

describe("LookAndFeelSection — section presence and order", () => {
  it("should render all four sections", () => {
    renderSection();
    expect(getById("settings-theme")).toBeInTheDocument();
    expect(getById("settings-accent-color")).toBeInTheDocument();
    expect(getById("settings-interface-scale")).toBeInTheDocument();
    expect(getById("settings-language")).toBeInTheDocument();
  });

  it("should render sections in correct order", () => {
    const { container } = renderSection();
    const ids = [
      "settings-theme",
      "settings-accent-color",
      "settings-interface-scale",
      "settings-language",
    ];
    const elements = ids.map(
      (id) => container.querySelector(`[data-testid="${id}"]`)!,
    );
    for (let i = 0; i < elements.length - 1; i++) {
      expect(
        elements[i].compareDocumentPosition(elements[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});

describe("LookAndFeelSection — section headings use correct i18n keys", () => {
  it("should render theme heading with key settings.theme", () => {
    renderSection();
    expect(getById("settings-theme").querySelector("h2")?.textContent).toBe(
      "settings.theme",
    );
  });

  it("should render interface scale heading with key settings.interfaceScale", () => {
    renderSection();
    expect(
      getById("settings-interface-scale").querySelector("h2")?.textContent,
    ).toBe("settings.interfaceScale");
  });

  it("should render language heading with key settings.language", () => {
    renderSection();
    expect(getById("settings-language").querySelector("h2")?.textContent).toBe(
      "settings.language",
    );
  });
});

describe("LookAndFeelSection — theme buttons", () => {
  it("should render buttons for all three color schemes", () => {
    renderSection();
    expect(getById("settings-theme-option-system")).toBeInTheDocument();
    expect(getById("settings-theme-option-light")).toBeInTheDocument();
    expect(getById("settings-theme-option-dark")).toBeInTheDocument();
  });

  it("should set aria-pressed true only for selected scheme", () => {
    renderSection();
    expect(getById("settings-theme-option-system")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getById("settings-theme-option-light")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(getById("settings-theme-option-dark")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("should use correct aria-label i18n keys for theme buttons", () => {
    renderSection();
    expect(getById("settings-theme-option-system")).toHaveAttribute(
      "aria-label",
      "theme.system",
    );
    expect(getById("settings-theme-option-light")).toHaveAttribute(
      "aria-label",
      "theme.light",
    );
    expect(getById("settings-theme-option-dark")).toHaveAttribute(
      "aria-label",
      "theme.dark",
    );
  });

  it.each([
    ["light"],
    ["dark"],
    ["system"],
  ] as const)("should call setColorScheme with '%s' when clicked", (scheme) => {
    renderSection();
    fireEvent.click(getById(`settings-theme-option-${scheme}`));
    expect(mockSetColorScheme).toHaveBeenCalledWith(scheme);
  });
});

describe("LookAndFeelSection — interface scale buttons", () => {
  it("should render buttons for all four scales", () => {
    renderSection();
    expect(getById("settings-scale-option-small")).toBeInTheDocument();
    expect(getById("settings-scale-option-normal")).toBeInTheDocument();
    expect(getById("settings-scale-option-large")).toBeInTheDocument();
    expect(getById("settings-scale-option-xLarge")).toBeInTheDocument();
  });

  it("should set aria-pressed true only for selected scale", () => {
    renderSection();
    expect(getById("settings-scale-option-normal")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(getById("settings-scale-option-small")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(getById("settings-scale-option-large")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(getById("settings-scale-option-xLarge")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("should use correct aria-label i18n keys for scale buttons", () => {
    renderSection();
    expect(getById("settings-scale-option-small")).toHaveAttribute(
      "aria-label",
      "settings.scale.small",
    );
    expect(getById("settings-scale-option-normal")).toHaveAttribute(
      "aria-label",
      "settings.scale.normal",
    );
    expect(getById("settings-scale-option-large")).toHaveAttribute(
      "aria-label",
      "settings.scale.large",
    );
    expect(getById("settings-scale-option-xLarge")).toHaveAttribute(
      "aria-label",
      "settings.scale.xLarge",
    );
  });

  it.each([
    ["small"],
    ["large"],
    ["xLarge"],
  ] as const)("should call setInterfaceScale with '%s' when clicked", (scale) => {
    renderSection();
    fireEvent.click(getById(`settings-scale-option-${scale}`));
    expect(mockSetInterfaceScale).toHaveBeenCalledWith(scale);
  });

  it.each([
    ["small", "text-sm"],
    ["normal", "text-base"],
    ["large", "text-lg"],
    ["xLarge", "text-xl"],
  ] as const)("should render %s scale button with %s class", (scale, textClass) => {
    renderSection();
    const span = getById(`settings-scale-option-${scale}`).querySelector(
      "span",
    );
    expect(span?.className).toContain(textClass);
  });
});

describe("LookAndFeelSection — language section", () => {
  it("should show current locale native name in trigger", () => {
    renderSection();
    expect(getById("settings-language-trigger")).toHaveTextContent("English");
  });

  it("should not show language panel by default", () => {
    renderSection();
    expect(
      screen.queryByTestId("settings-language-option-en"),
    ).not.toBeInTheDocument();
  });

  it("should open language panel when trigger is clicked", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    expect(getById("settings-language-option-en")).toBeInTheDocument();
    expect(getById("settings-language-option-ru")).toBeInTheDocument();
  });

  it("should call setLanguage with selected locale code when option is clicked", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.click(getById("settings-language-option-ru"));
    expect(mockSetLanguage).toHaveBeenCalledWith("ru");
  });

  it("should close language panel after selecting a language", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.click(getById("settings-language-option-ru"));
    expect(
      screen.queryByTestId("settings-language-option-ru"),
    ).not.toBeInTheDocument();
  });

  it("should toggle language panel closed when trigger is clicked again", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.click(getById("settings-language-trigger"));
    expect(
      screen.queryByTestId("settings-language-option-en"),
    ).not.toBeInTheDocument();
  });

  it("should show search input when locales >= LANGUAGE_SEARCH_THRESHOLD", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    expect(getById("settings-language-search")).toBeInTheDocument();
  });

  it("should filter locales by nativeName", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.change(getById("settings-language-search"), {
      target: { value: "Deutsch" },
    });
    expect(getById("settings-language-option-de")).toBeInTheDocument();
    expect(
      screen.queryByTestId("settings-language-option-en"),
    ).not.toBeInTheDocument();
  });

  it("should filter locales by name", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.change(getById("settings-language-search"), {
      target: { value: "German" },
    });
    expect(getById("settings-language-option-de")).toBeInTheDocument();
  });

  it("should filter locales by code only (not matching name or nativeName)", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.change(getById("settings-language-search"), {
      target: { value: "zh" },
    });
    expect(getById("settings-language-option-zh")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^settings-language-option-/)).toHaveLength(1);
  });

  it("should show emoji and nativeName in language options", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    const option = getById("settings-language-option-ru");
    expect(option).toHaveTextContent("🇷🇺");
    expect(option).toHaveTextContent("Русский");
  });

  it("should highlight current language option", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    const selected = getById("settings-language-option-en");
    expect(selected.className).toContain("bg-accent");
    const unselected = getById("settings-language-option-ru");
    expect(unselected.className).not.toContain("bg-accent");
  });

  it("should reset search query after selecting a language", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.change(getById("settings-language-search"), {
      target: { value: "Deutsch" },
    });
    fireEvent.click(getById("settings-language-option-de"));
    // Re-open panel — search should be cleared
    fireEvent.click(getById("settings-language-trigger"));
    expect(screen.getAllByTestId(/^settings-language-option-/)).toHaveLength(
      10,
    );
  });

  it("should show emoji in trigger", () => {
    renderSection();
    expect(getById("settings-language-trigger")).toHaveTextContent("🇺🇸");
  });
});

describe("LookAndFeelSection — theme icons", () => {
  it("should render svg icon inside each theme button", () => {
    renderSection();
    for (const scheme of ["system", "light", "dark"]) {
      const button = getById(`settings-theme-option-${scheme}`);
      expect(button.querySelector("svg")).toBeInTheDocument();
    }
  });
});

describe("LookAndFeelSection — language search", () => {
  it("should show all locales when search query is empty", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    expect(screen.getAllByTestId(/^settings-language-option-/)).toHaveLength(
      10,
    );
  });

  it("should show search placeholder with correct i18n key", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    expect(getById("settings-language-search")).toHaveAttribute(
      "placeholder",
      "search.placeholder",
    );
  });

  it("should filter case-insensitively by code", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    fireEvent.change(getById("settings-language-search"), {
      target: { value: "DE" },
    });
    expect(getById("settings-language-option-de")).toBeInTheDocument();
  });
});

describe("LookAndFeelSection — chevron rotation", () => {
  it("should have rotate-180 class on chevron when panel is open", () => {
    renderSection();
    fireEvent.click(getById("settings-language-trigger"));
    const chevron = getById("settings-language-trigger").querySelector("svg");
    expect(
      chevron?.className.baseVal ?? chevron?.getAttribute("class") ?? "",
    ).toContain("rotate-180");
  });
});

describe("LookAndFeelSection — CSS classes for selected/unselected", () => {
  it("should apply text-accent class to selected theme button", () => {
    renderSection();
    expect(getById("settings-theme-option-system").className).toContain(
      "text-accent",
    );
  });

  it("should apply text-gray-400 class to unselected theme button", () => {
    renderSection();
    expect(getById("settings-theme-option-light").className).toContain(
      "text-gray-400",
    );
  });

  it("should apply border-accent class to selected scale button", () => {
    renderSection();
    expect(getById("settings-scale-option-normal").className).toContain(
      "border-accent",
    );
  });

  it("should apply border-gray-200 class to unselected scale button", () => {
    renderSection();
    expect(getById("settings-scale-option-small").className).toContain(
      "border-gray-200",
    );
  });

  it("should apply rounded-full class to theme buttons", () => {
    renderSection();
    expect(getById("settings-theme-option-system").className).toContain(
      "rounded-full",
    );
  });

  it("should apply font-semibold class to scale button text", () => {
    renderSection();
    const span = getById("settings-scale-option-normal").querySelector("span");
    expect(span?.className).toContain("font-semibold");
  });

  it("should apply rounded-lg class to scale buttons", () => {
    renderSection();
    expect(getById("settings-scale-option-normal").className).toContain(
      "rounded-lg",
    );
  });
});

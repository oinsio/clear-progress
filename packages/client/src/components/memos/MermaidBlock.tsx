import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "@/app/providers/ThemeProvider";
import type { ColorScheme } from "@/types/common";

const MERMAID_THEME_LIGHT = "default" as const;
const MERMAID_THEME_DARK = "dark" as const;

let mermaidIdCounter = 0;

function generateMermaidId(): string {
  mermaidIdCounter += 1;
  return `mermaid-${mermaidIdCounter}`;
}

function isDarkModeActive(colorScheme: ColorScheme): boolean {
  if (colorScheme === "dark") return true;
  if (colorScheme === "light") return false;
  return document.documentElement.classList.contains("dark");
}

function getMermaidTheme(
  colorScheme: ColorScheme,
): typeof MERMAID_THEME_DARK | typeof MERMAID_THEME_LIGHT {
  return isDarkModeActive(colorScheme)
    ? MERMAID_THEME_DARK
    : MERMAID_THEME_LIGHT;
}

interface MermaidBlockProps {
  code: string;
}

/**
 * Implements FR6, FR11, NFR-A2 of add-memos.
 * Renders mermaid diagram code to SVG. Re-renders on theme change.
 * Adds role="img" for accessibility.
 */
export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderedSvg, setRenderedSvg] = useState<string>("");
  const [renderError, setRenderError] = useState<string>("");
  const { colorScheme } = useTheme();

  useEffect(() => {
    let isCancelled = false;

    const renderDiagram = async () => {
      const mermaidTheme = getMermaidTheme(colorScheme);

      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: "strict",
      });

      const diagramId = generateMermaidId();

      try {
        const { svg } = await mermaid.render(diagramId, code);
        if (!isCancelled) {
          setRenderedSvg(svg);
          setRenderError("");
        }
      } catch (error) {
        if (!isCancelled) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to render diagram";
          setRenderError(errorMessage);
          setRenderedSvg("");
        }
      }
    };

    void renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [code, colorScheme]);

  if (renderError) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
        <pre className="whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  if (!renderedSvg) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="img"
      className="overflow-x-auto"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: mermaid SVG output is trusted developer-authored content
      dangerouslySetInnerHTML={{ __html: renderedSvg }}
    />
  );
}

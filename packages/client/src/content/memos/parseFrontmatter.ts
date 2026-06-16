/**
 * Implements FR10 of add-memos.
 * Minimal frontmatter parser — no external dependency (D7).
 */

const FRONTMATTER_DELIMITER = "---";
const REQUIRED_FIELDS = ["title", "description", "icon", "order"] as const;

interface ParsedFrontmatter {
  attributes: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): ParsedFrontmatter | null {
  const lines = raw.split("\n");

  if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  const closingIndex = lines.indexOf(FRONTMATTER_DELIMITER, 1);
  if (closingIndex === -1) {
    return null;
  }

  const yamlLines = lines.slice(1, closingIndex);
  const attributes: Record<string, string> = {};

  for (const line of yamlLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    attributes[key] = line.slice(colonIndex + 1).trim();
  }

  for (const field of REQUIRED_FIELDS) {
    if (!attributes[field]) {
      return null;
    }
  }

  const orderValue = attributes.order;
  if (!Number.isInteger(Number(orderValue)) || orderValue.includes(".")) {
    return null;
  }

  const body = lines
    .slice(closingIndex + 1)
    .join("\n")
    .trim();

  return { attributes, body };
}

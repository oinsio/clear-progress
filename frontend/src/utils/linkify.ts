export interface LinkSegment {
  type: "text" | "url";
  value: string;
}

export function extractLinks(text: string): LinkSegment[] {
  if (text === "") {
    return [];
  }

  const urlRegex = /(https?:\/\/[^\s<>"'\]]+)/g;
  const segments: LinkSegment[] = [];
  let lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    const rawUrl = match[0];
    const urlStart = match.index;

    // Add text before URL
    if (urlStart > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, urlStart),
      });
    }

    // Strip trailing punctuation
    const cleanUrl = rawUrl.replace(/[),;.:!?]+$/, "");

    segments.push({
      type: "url",
      value: cleanUrl,
    });

    lastIndex = urlStart + cleanUrl.length;
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      value: text.slice(lastIndex),
    });
  }

  return segments;
}

export function shortenUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname.replace(/\/$/, "");

    if (!pathname || pathname === "") {
      return hostname;
    }

    const pathSegments = pathname.split("/").filter((segment) => segment !== "");

    if (pathSegments.length > 2) {
      return `${hostname}/${pathSegments[0]}/…/${pathSegments[pathSegments.length - 1]}`;
    }

    return `${hostname}${pathname}`;
  } catch {
    // Fallback: remove protocol
    return url.replace(/^https?:\/\//, "");
  }
}

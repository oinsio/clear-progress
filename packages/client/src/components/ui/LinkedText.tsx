import { extractLinks, shortenUrl } from "@/utils/linkify";

interface LinkedTextProps {
  text: string;
  className?: string;
}

export function LinkedText({ text, className }: LinkedTextProps) {
  if (!text) {
    return <span className={className}></span>;
  }

  const segments = extractLinks(text);

  return (
    <span className={className}>
      {segments.map((segment) => {
        if (segment.type === "url") {
          return (
            <a
              key={segment.value}
              href={segment.value}
              target="_blank"
              rel="noopener noreferrer"
              title={segment.value}
              onClick={(e) => e.stopPropagation()}
              className="bg-blue-600/5 hover:bg-blue-600/10 text-blue-600 rounded px-1 inline-flex items-baseline gap-0.5"
            >
              <span className="text-xs">🔗</span>
              <span className="truncate max-w-[260px]">
                {shortenUrl(segment.value)}
              </span>
            </a>
          );
        }
        return <span key={segment.value}>{segment.value}</span>;
      })}
    </span>
  );
}

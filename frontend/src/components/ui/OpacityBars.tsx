import { FOCUS_OPACITY_LEVELS } from "@/constants";
import { cn } from "@/shared/lib/cn";

interface OpacityBarsProps {
  value: number;
  onChange: (value: number) => void;
  levels?: readonly number[];
}

export function OpacityBars({
  value,
  onChange,
  levels = FOCUS_OPACITY_LEVELS,
}: OpacityBarsProps) {
  return (
    <div className="flex gap-1 items-center">
      {levels.map((level) => {
        const isSelected = value === level;
        return (
          <button
            key={level}
            type="button"
            data-opacity={level}
            data-testid={`opacity-bar-${level}`}
            aria-label={`${level}%`}
            aria-pressed={isSelected}
            onClick={() => onChange(level)}
            className={cn(
              "w-20 h-2.5 rounded-full cursor-pointer transition-all border border-gray-900 dark:border-gray-100",
              isSelected ? "bg-accent" : "bg-gray-900 dark:bg-gray-100",
              "hover:scale-y-[1.3] active:scale-y-[0.8]",
            )}
            style={{ opacity: level / 100 }}
          />
        );
      })}
    </div>
  );
}

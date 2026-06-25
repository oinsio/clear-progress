import type { LucideIcon } from "lucide-react";

/** Implements FR2, FR13 of swipeable-item */
export type SwipeDirection = "left" | "right";

/** Implements FR2, FR13 of swipeable-item */
export interface SwipeActionConfig {
  /** Callback invoked when swipe exceeds threshold or velocity */
  onAction: () => void;
  /** Tailwind background color class (e.g., "bg-blue-500") */
  color: string;
  /** Lucide icon component to display in the background */
  icon: LucideIcon;
}

import { type MenuItemConfig, MenuOrderSchema } from "@clear-progress/contract";
import { STORAGE_KEYS } from "@/constants";
import type { MenuMode } from "@/types/common";

const DEFAULT_MENU_MODE_ORDER: MenuMode[] = [
  "inbox",
  "contexts",
  "categories",
  "goals",
  "ideas",
  "tasks",
  "completed",
  "focused_goals",
  "deleted",
];

const DEFAULT_MENU_ORDER: MenuItemConfig[] = [
  ...DEFAULT_MENU_MODE_ORDER.filter((mode) => mode !== "deleted").map(
    (mode) => ({
      mode,
      visible: true,
    }),
  ),
  { mode: "deleted", visible: false },
];

function loadMenuOrder(): MenuItemConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MENU_ORDER);
    if (!stored) return DEFAULT_MENU_ORDER;
    const parseResult = MenuOrderSchema.safeParse(JSON.parse(stored));
    if (!parseResult.success) {
      console.error("Invalid menu order:", parseResult.error);
      return DEFAULT_MENU_ORDER;
    }
    const validModes = new Set<MenuMode>(DEFAULT_MENU_MODE_ORDER);
    const filtered = parseResult.data.filter((item) =>
      validModes.has(item.mode),
    );
    const storedModes = new Set(filtered.map((item) => item.mode));
    const missing = DEFAULT_MENU_ORDER.filter(
      (item) => !storedModes.has(item.mode),
    );
    return [...filtered, ...missing];
  } catch {
    return DEFAULT_MENU_ORDER;
  }
}

type Listener = () => void;

let currentSnapshot: MenuItemConfig[] = loadMenuOrder();
const listeners = new Set<Listener>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getSnapshot(): MenuItemConfig[] {
  return currentSnapshot;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMenuOrder(
  updater: MenuItemConfig[] | ((prev: MenuItemConfig[]) => MenuItemConfig[]),
): void {
  const nextValue =
    typeof updater === "function" ? updater(currentSnapshot) : updater;
  localStorage.setItem(STORAGE_KEYS.MENU_ORDER, JSON.stringify(nextValue));
  currentSnapshot = nextValue;
  emitChange();
}

export function _resetForTesting(): void {
  currentSnapshot = loadMenuOrder();
  listeners.clear();
}

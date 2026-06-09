// implements FR6, FR7 of localstorage-refactor
import { type MenuItemConfig, MenuOrderSchema } from "@clear-progress/contract";
import { STORAGE_KEYS } from "@/constants";
import {
  getPreference,
  setPreference,
} from "@/services/localPreferencesService";
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
  const parsed = getPreference<MenuItemConfig[]>({
    type: "json",
    key: STORAGE_KEYS.MENU_ORDER,
    schema: MenuOrderSchema,
    defaultValue: DEFAULT_MENU_ORDER,
  });

  if (parsed === DEFAULT_MENU_ORDER) return DEFAULT_MENU_ORDER;

  const validModes = new Set<MenuMode>(DEFAULT_MENU_MODE_ORDER);
  const filtered = parsed.filter((item) => validModes.has(item.mode));
  const storedModes = new Set(filtered.map((item) => item.mode));
  const missing = DEFAULT_MENU_ORDER.filter(
    (item) => !storedModes.has(item.mode),
  );
  return [...filtered, ...missing];
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
  setPreference(STORAGE_KEYS.MENU_ORDER, nextValue, (value) =>
    JSON.stringify(value),
  );
  currentSnapshot = nextValue;
  emitChange();
}

export function _resetForTesting(): void {
  currentSnapshot = loadMenuOrder();
  listeners.clear();
}

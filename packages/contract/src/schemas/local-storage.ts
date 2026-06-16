import { z } from "zod";

/**
 * MenuMode — display modes in the application menu
 */
export const MenuModeSchema = z.enum([
  "inbox",
  "contexts",
  "categories",
  "goals",
  "ideas",
  "tasks",
  "completed",
  "focused_goals",
  "memos",
  "deleted",
]);

export type MenuMode = z.infer<typeof MenuModeSchema>;

/**
 * MenuItemConfig — menu item configuration (mode + visibility)
 */
export const MenuItemConfigSchema = z.object({
  mode: MenuModeSchema,
  visible: z.boolean(),
});

export type MenuItemConfig = z.infer<typeof MenuItemConfigSchema>;

/**
 * MenuOrderSchema — array of menu item configurations
 */
export const MenuOrderSchema = z.array(MenuItemConfigSchema);

/**
 * CollapsedSectionsSchema — dictionary of collapsed sections (section key -> is collapsed)
 */
export const CollapsedSectionsSchema = z.record(z.string(), z.boolean());

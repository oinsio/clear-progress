import { z } from "zod";

const HttpUrlSchema = z.string().refine(
  (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Invalid HTTP(S) URL" },
);

/**
 * BackendType
 */
export const BackendTypeSchema = z.enum(["supabase"]);

export type BackendType = z.infer<typeof BackendTypeSchema>;

/**
 * SupabaseConnectionConfig — connection configuration for Supabase
 */
export const SupabaseConnectionConfigSchema = z.object({
  type: z.literal("supabase"),
  url: HttpUrlSchema,
  anonKey: z.string().min(1),
});

export type SupabaseConnectionConfig = z.infer<
  typeof SupabaseConnectionConfigSchema
>;

/**
 * ConnectionConfig — discriminated union on the type field
 */
export const ConnectionConfigSchema = z.discriminatedUnion("type", [
  SupabaseConnectionConfigSchema,
]);

export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;

/**
 * ConnectionStoreSchema — single JSON key for connection config storage.
 * implements FR8 of localstorage-refactor
 */
export const ConnectionStoreSchema = z.object({
  activeType: z.enum(["supabase"]).nullable(),
  configs: z.object({
    supabase: z
      .object({
        url: z.string(),
        anonKey: z.string(),
      })
      .optional(),
  }),
});

export type ConnectionStore = z.infer<typeof ConnectionStoreSchema>;

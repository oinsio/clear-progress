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
export const BackendTypeSchema = z.enum(["gas", "supabase"]);

export type BackendType = z.infer<typeof BackendTypeSchema>;

/**
 * GasConnectionConfig — конфигурация подключения к Google Apps Script
 */
export const GasConnectionConfigSchema = z.object({
  type: z.literal("gas"),
  url: HttpUrlSchema,
  clientId: z.string().optional(),
  isActive: z.boolean(),
});

export type GasConnectionConfig = z.infer<typeof GasConnectionConfigSchema>;

/**
 * SupabaseConnectionConfig — конфигурация подключения к Supabase
 */
export const SupabaseConnectionConfigSchema = z.object({
  type: z.literal("supabase"),
  url: HttpUrlSchema,
  anonKey: z.string().min(1),
  isActive: z.boolean(),
});

export type SupabaseConnectionConfig = z.infer<
  typeof SupabaseConnectionConfigSchema
>;

/**
 * ConnectionConfig — discriminated union по полю type
 */
export const ConnectionConfigSchema = z.discriminatedUnion("type", [
  GasConnectionConfigSchema,
  SupabaseConnectionConfigSchema,
]);

export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;

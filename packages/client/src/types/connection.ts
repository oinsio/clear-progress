export type BackendType = "gas" | "supabase";

export interface GasConnectionConfig {
  type: "gas";
  url: string;
  clientId?: string;
  isActive: boolean;
}

export interface SupabaseConnectionConfig {
  type: "supabase";
  url: string;
  anonKey: string;
  isActive: boolean;
}

export type ConnectionConfig = GasConnectionConfig | SupabaseConnectionConfig;

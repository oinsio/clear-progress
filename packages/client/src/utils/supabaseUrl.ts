import { SUPABASE_URL_SUFFIX } from "@/constants";

export function parseSupabaseInput(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}${SUPABASE_URL_SUFFIX}`;
}

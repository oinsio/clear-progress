const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";

export function parseClientId(input: string): string {
  const trimmed = input.trim();
  if (trimmed.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    return trimmed;
  }
  return `${trimmed}${GOOGLE_CLIENT_ID_SUFFIX}`;
}

export class ApiAuthError extends Error {
  constructor() {
    super("Authentication required: token is missing, expired, or invalid");
    this.name = "ApiAuthError";
  }
}

export class ApiValidationError extends Error {
  declare cause: unknown;

  constructor(action: string, cause: unknown) {
    super(`Invalid API response for "${action}"`);
    this.name = "ApiValidationError";
    this.cause = cause;
  }
}

// implements FR1 of fix-project-paused
export class ProjectPausedError extends Error {
  constructor() {
    super("Supabase project is paused (HTTP 540)");
    this.name = "ProjectPausedError";
  }
}

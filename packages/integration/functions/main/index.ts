// implements FR10 of add-supabase-integration-tests
// Edge-runtime main service — routes requests to individual function workers by path segment
// Kong strips /functions/v1/ prefix, so this receives /<function-name>/...

declare const EdgeRuntime: {
  userWorkers: {
    create(opts: {
      servicePath: string;
      memoryLimitMb?: number;
      workerTimeoutMs?: number;
      noModuleCache?: boolean;
      forceCreate?: boolean;
      envVars?: [string, string][];
    }): Promise<{ fetch(req: Request): Promise<Response> }>;
  };
};

const ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
  "JWT_SECRET",
  "VERIFY_JWT",
];

const envVars: [string, string][] = ENV_KEYS.map(
  (key) => [key, Deno.env.get(key) ?? ""] as [string, string],
).filter(([, value]) => value !== "");

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const functionName = url.pathname.split("/").filter(Boolean)[0];

  if (!functionName) {
    return new Response(JSON.stringify({ error: "Function name required" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const worker = await EdgeRuntime.userWorkers.create({
    servicePath: `/home/deno/functions/${functionName}`,
    memoryLimitMb: 150,
    workerTimeoutMs: 60_000,
    noModuleCache: false,
    forceCreate: false,
    envVars,
  });

  return worker.fetch(req);
});

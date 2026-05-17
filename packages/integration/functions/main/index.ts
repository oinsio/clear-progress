// implements FR10 of add-supabase-integration-tests
// Edge-runtime main service — routes requests to individual function workers by path segment
// Kong strips /functions/v1/ prefix, so this receives /<function-name>/...

declare const EdgeRuntime: {
  userWorkers: {
    create(opts: {
      servicePath: string;
      memoryLimitMb: number;
      workerTimeoutMs: number;
      noModuleCache: boolean;
      forceCreate: boolean;
    }): Promise<{ fetch(req: Request): Promise<Response> }>;
  };
};

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
  });

  return worker.fetch(req);
});

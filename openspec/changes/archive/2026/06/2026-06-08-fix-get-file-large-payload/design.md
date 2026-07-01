# fix-get-file-large-payload — Design

## Context

The `get-file` Edge Function (`packages/adapter-supabase/supabase/functions/get-file/index.ts`) converts downloaded file blobs to base64 using:

```typescript
const base64 = btoa(String.fromCharCode(...bytes));
```

The spread operator expands every byte as a separate argument to `String.fromCharCode`. JavaScript engines limit function arguments to ~65,536, so files larger than ~64 KB crash with "Maximum call stack size exceeded", returning a 500 error.

The client-side code (`packages/client/src/services/FileService.ts:arrayBufferToBase64`) already solves this with chunked encoding. The server needs the same fix.

Context: driven by FR1 from proposal.

## Goals / Non-Goals

**Goals:**
- Fix `get-file` to handle files up to 5 MB (MAX_ATTACHMENT_SIZE_BYTES)
- Reuse the proven chunking pattern from the client

**Non-Goals:**
- Refactoring the base64 transport format
- Extracting a shared utility across client and server (Deno vs Node module systems differ)

## Decisions

### D1: Chunked `String.fromCharCode` with 8192-byte chunks

**Decision**: Replace `String.fromCharCode(...bytes)` with a loop that processes 8192 bytes at a time, identical to the client's `arrayBufferToBase64`.

**Rationale**: This pattern is already proven in production on the client side. The chunk size of 8192 is well within the argument limit and provides good performance.

**Alternatives considered**:
- `Deno.encodeBytesToBase64` — not available in all Deno versions used by Supabase Edge Functions
- `Buffer.from(bytes).toString("base64")` — Node.js API, not available in Deno
- Extract shared utility to `@clear-progress/contract` — overkill for a single function, and Deno imports differ from Node

### D2: Extract helper function `uint8ArrayToBase64`

**Decision**: Create a named helper `uint8ArrayToBase64(bytes: Uint8Array): string` in `_shared/files.ts` (already contains file-related utilities like magic bytes validation).

**Rationale**: Keeps `get-file/index.ts` clean. The helper may also be useful if other edge functions need base64 encoding in the future.

## Risks / Trade-offs

- [Risk] String concatenation in a loop for large files (5 MB = ~625 iterations) → Acceptable: `btoa` is called once at the end, and string building with 8 KB chunks is well within Deno's capabilities.

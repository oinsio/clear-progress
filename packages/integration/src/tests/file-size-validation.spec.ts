// implements M2 of attachment-drag-and-drop
// Integration test: upload-file rejects files exceeding the 5 MB size limit.

import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  createMinimalPng,
  setupSingleDeviceTest,
  uploadFilesToServer,
  uploadFileToServer,
} from "../test-helpers.js";

const { getCredentials } = setupSingleDeviceTest();

/** 5 MB size limit (duplicated from contract, same as edge functions). */
const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024;

/** PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A */
const PNG_MAGIC_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Creates a Buffer that starts with valid PNG magic bytes but exceeds the
 * max attachment size. The rest is filled with zeroes.
 */
function createOversizedPngBuffer(): Buffer {
  const oversizedLength = MAX_ATTACHMENT_SIZE_BYTES + 1;
  const body = Buffer.alloc(oversizedLength - PNG_MAGIC_BYTES.length);
  return Buffer.concat([PNG_MAGIC_BYTES, body]);
}

test("upload-file rejects file exceeding 5 MB with FILE_TOO_LARGE", async () => {
  const oversizedBuffer = createOversizedPngBuffer();
  const base64Data = oversizedBuffer.toString("base64");
  const dataHash = createHash("sha256").update(oversizedBuffer).digest("hex");

  const response = await uploadFileToServer(getCredentials(), {
    goal_id: crypto.randomUUID(),
    filename: "oversized.png",
    mime_type: "image/png",
    data: base64Data,
    data_hash: dataHash,
  });

  expect(response.ok).toBe(false);
  expect(response.error).toBe("FILE_TOO_LARGE");
});

test("upload-files batch: oversized file fails while valid file succeeds", async () => {
  const validPngBuffer = createMinimalPng();
  const validBase64 = validPngBuffer.toString("base64");
  const validHash = createHash("sha256").update(validPngBuffer).digest("hex");
  const validLocalId = crypto.randomUUID();

  const oversizedBuffer = createOversizedPngBuffer();
  const oversizedBase64 = oversizedBuffer.toString("base64");
  const oversizedHash = createHash("sha256")
    .update(oversizedBuffer)
    .digest("hex");
  const oversizedLocalId = crypto.randomUUID();

  const goalId = crypto.randomUUID();

  const response = await uploadFilesToServer(getCredentials(), {
    files: [
      {
        local_id: validLocalId,
        goal_id: goalId,
        filename: "small.png",
        mime_type: "image/png",
        data: validBase64,
        data_hash: validHash,
      },
      {
        local_id: oversizedLocalId,
        goal_id: goalId,
        filename: "oversized.png",
        mime_type: "image/png",
        data: oversizedBase64,
        data_hash: oversizedHash,
      },
    ],
  });

  expect(response.ok).toBe(true);
  expect(response.results).toHaveLength(2);

  const validResult = response.results?.find(
    (result) => result.local_id === validLocalId,
  );
  const oversizedResult = response.results?.find(
    (result) => result.local_id === oversizedLocalId,
  );

  expect(validResult).toBeDefined();
  expect(validResult?.ok).toBe(true);

  expect(oversizedResult).toBeDefined();
  expect(oversizedResult?.ok).toBe(false);
  expect(oversizedResult?.error_code).toBe("FILE_TOO_LARGE");
});

// implements M3 of attachment-drag-and-drop
test("upload-files batch: invalid MIME content fails while valid file succeeds", async () => {
  const validPngBuffer = createMinimalPng();
  const validBase64 = validPngBuffer.toString("base64");
  const validHash = createHash("sha256").update(validPngBuffer).digest("hex");
  const validLocalId = crypto.randomUUID();

  const garbageBuffer = Buffer.from([
    0xde, 0xad, 0xbe, 0xef, 0x00, 0x01, 0x02, 0x03,
  ]);
  const garbageBase64 = garbageBuffer.toString("base64");
  const garbageHash = createHash("sha256").update(garbageBuffer).digest("hex");
  const garbageLocalId = crypto.randomUUID();

  const goalId = crypto.randomUUID();

  const response = await uploadFilesToServer(getCredentials(), {
    files: [
      {
        local_id: validLocalId,
        goal_id: goalId,
        filename: "small.png",
        mime_type: "image/png",
        data: validBase64,
        data_hash: validHash,
      },
      {
        local_id: garbageLocalId,
        goal_id: goalId,
        filename: "fake.zip",
        mime_type: "application/zip",
        data: garbageBase64,
        data_hash: garbageHash,
      },
    ],
  });

  expect(response.ok).toBe(true);
  expect(response.results).toHaveLength(2);

  const validResult = response.results?.find(
    (result) => result.local_id === validLocalId,
  );
  const garbageResult = response.results?.find(
    (result) => result.local_id === garbageLocalId,
  );

  expect(validResult).toBeDefined();
  expect(validResult?.ok).toBe(true);

  expect(garbageResult).toBeDefined();
  expect(garbageResult?.ok).toBe(false);
  expect(garbageResult?.error_code).toBe("INVALID_FILE_CONTENT");
});

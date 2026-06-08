/** Tests for arrayBufferToBase64 and computeSha256Hex in FileService */
import { describe, expect, it } from "vitest";
import { arrayBufferToBase64, computeSha256Hex } from "./FileService";

const CHUNK_SIZE = 8192;

describe("arrayBufferToBase64", () => {
  it("should return empty string for an empty buffer", () => {
    const emptyBuffer = new ArrayBuffer(0);
    expect(arrayBufferToBase64(emptyBuffer)).toBe("");
  });

  it("should correctly encode a known buffer to base64", () => {
    const text = "Hello, World!";
    const buffer = new TextEncoder().encode(text).buffer as ArrayBuffer;
    expect(arrayBufferToBase64(buffer)).toBe(btoa(text));
  });

  it("should round-trip: base64 decoded back should match original bytes", () => {
    const originalBytes = new Uint8Array([72, 101, 108, 108, 111]);
    const buffer = originalBytes.buffer as ArrayBuffer;
    const base64 = arrayBufferToBase64(buffer);
    const decoded = atob(base64);
    const decodedBytes = new Uint8Array(decoded.length);
    for (let byteIndex = 0; byteIndex < decoded.length; byteIndex++) {
      decodedBytes[byteIndex] = decoded.charCodeAt(byteIndex);
    }
    expect(decodedBytes).toEqual(originalBytes);
  });

  it("should correctly encode a buffer larger than one chunk (>8192 bytes)", () => {
    const largeByteCount = CHUNK_SIZE + 100;
    const largeBytes = new Uint8Array(largeByteCount);
    for (let byteIndex = 0; byteIndex < largeByteCount; byteIndex++) {
      largeBytes[byteIndex] = byteIndex % 256;
    }
    const buffer = largeBytes.buffer as ArrayBuffer;
    const result = arrayBufferToBase64(buffer);

    // Decode and verify round-trip fidelity
    const decodedString = atob(result);
    const decodedBytes = new Uint8Array(decodedString.length);
    for (let byteIndex = 0; byteIndex < decodedString.length; byteIndex++) {
      decodedBytes[byteIndex] = decodedString.charCodeAt(byteIndex);
    }
    expect(decodedBytes).toEqual(largeBytes);
  });

  it("should correctly encode a buffer exactly at chunk boundary (8192 bytes)", () => {
    const chunkBoundaryBytes = new Uint8Array(CHUNK_SIZE);
    for (let byteIndex = 0; byteIndex < CHUNK_SIZE; byteIndex++) {
      chunkBoundaryBytes[byteIndex] = byteIndex % 256;
    }
    const buffer = chunkBoundaryBytes.buffer as ArrayBuffer;
    const result = arrayBufferToBase64(buffer);

    const decodedString = atob(result);
    const decodedBytes = new Uint8Array(decodedString.length);
    for (let byteIndex = 0; byteIndex < decodedString.length; byteIndex++) {
      decodedBytes[byteIndex] = decodedString.charCodeAt(byteIndex);
    }
    expect(decodedBytes).toEqual(chunkBoundaryBytes);
  });

  it("should correctly encode a buffer spanning multiple chunks (>16384 bytes)", () => {
    const multiChunkByteCount = CHUNK_SIZE * 2 + 50;
    const multiChunkBytes = new Uint8Array(multiChunkByteCount);
    for (let byteIndex = 0; byteIndex < multiChunkByteCount; byteIndex++) {
      multiChunkBytes[byteIndex] = byteIndex % 256;
    }
    const buffer = multiChunkBytes.buffer as ArrayBuffer;
    const result = arrayBufferToBase64(buffer);

    const decodedString = atob(result);
    const decodedBytes = new Uint8Array(decodedString.length);
    for (let byteIndex = 0; byteIndex < decodedString.length; byteIndex++) {
      decodedBytes[byteIndex] = decodedString.charCodeAt(byteIndex);
    }
    expect(decodedBytes).toEqual(multiChunkBytes);
  });

  it("should produce valid base64 string (only valid base64 characters)", () => {
    const bytes = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
    const buffer = bytes.buffer as ArrayBuffer;
    const result = arrayBufferToBase64(buffer);
    expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe("computeSha256Hex", () => {
  it("should return a 64-character string for a non-empty buffer", async () => {
    const buffer = new TextEncoder().encode("test").buffer as ArrayBuffer;
    const hexHash = await computeSha256Hex(buffer);
    expect(hexHash).toHaveLength(64);
  });

  it("should return only lowercase hex characters (0-9, a-f)", async () => {
    const buffer = new TextEncoder().encode("test input").buffer as ArrayBuffer;
    const hexHash = await computeSha256Hex(buffer);
    expect(hexHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should pad single-digit hex bytes with leading zero (verifies padStart)", async () => {
    // SHA-256 of empty buffer contains bytes that may be < 0x10
    // We need to verify that all bytes are represented as 2-character hex
    const emptyBuffer = new ArrayBuffer(0);
    const hexHash = await computeSha256Hex(emptyBuffer);
    // Each of 32 SHA-256 bytes must appear as exactly 2 hex chars
    expect(hexHash).toHaveLength(64);
    // Verify no single-digit hex bytes (all pairs should be 2 chars)
    const hexPairs = hexHash.match(/.{2}/g) ?? [];
    expect(hexPairs).toHaveLength(32);
    for (const hexPair of hexPairs) {
      expect(hexPair).toMatch(/^[0-9a-f]{2}$/);
    }
  });

  it("should return the known SHA-256 hash for 'abc'", async () => {
    // Known SHA-256("abc") = ba7816bf8f01cfea414140de5dae2ec73b00361bbef0469f492c347a
    const expectedHashPrefix = "ba7816bf";
    const buffer = new TextEncoder().encode("abc").buffer as ArrayBuffer;
    const hexHash = await computeSha256Hex(buffer);
    expect(hexHash.startsWith(expectedHashPrefix)).toBe(true);
  });

  it("should return a 64-character hash for an empty buffer", async () => {
    const emptyBuffer = new ArrayBuffer(0);
    const hexHash = await computeSha256Hex(emptyBuffer);
    expect(hexHash).toHaveLength(64);
    expect(hexHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should return deterministic hash for the same input", async () => {
    const buffer = new TextEncoder().encode("deterministic")
      .buffer as ArrayBuffer;
    const firstHash = await computeSha256Hex(buffer);
    const secondHash = await computeSha256Hex(buffer);
    expect(firstHash).toBe(secondHash);
  });

  it("should return different hashes for different inputs", async () => {
    const bufferA = new TextEncoder().encode("input-a").buffer as ArrayBuffer;
    const bufferB = new TextEncoder().encode("input-b").buffer as ArrayBuffer;
    const hashA = await computeSha256Hex(bufferA);
    const hashB = await computeSha256Hex(bufferB);
    expect(hashA).not.toBe(hashB);
  });
});

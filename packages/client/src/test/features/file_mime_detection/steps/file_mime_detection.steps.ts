// implements FR1, FR2, FR3 of fix-file-mime-detection
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { detectMimeType } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../file_mime_detection.feature");

const JPEG_MAGIC_BYTES = [0xff, 0xd8, 0xff, 0xe0];
const PNG_MAGIC_BYTES = [0x89, 0x50, 0x4e, 0x47];
const RIFF_HEADER = [0x52, 0x49, 0x46, 0x46];
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];
const WAVE_MARKER = [0x57, 0x41, 0x56, 0x45];
const UNKNOWN_BYTES = [0x00, 0x01, 0x02, 0x03];
const RIFF_SIZE_PLACEHOLDER = [0x00, 0x00, 0x00, 0x00];

const TEXT_MIME_TYPES = ["text/plain", "text/markdown"] as const;
const UNRECOGNIZED_FORMAT_ERROR = "UNRECOGNIZED_FORMAT";

function resolveEffectiveMimeType(
  detectedType: string | null,
  browserType: string,
): string {
  if (detectedType !== null) return detectedType;
  if ((TEXT_MIME_TYPES as readonly string[]).includes(browserType))
    return browserType;
  throw new Error(UNRECOGNIZED_FORMAT_ERROR);
}

function createBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function createRiffBuffer(marker: number[]): ArrayBuffer {
  return createBuffer([...RIFF_HEADER, ...RIFF_SIZE_PLACEHOLDER, ...marker]);
}

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let fileBuffer: ArrayBuffer;
  let detectedType: string | null;
  let browserType: string;
  let effectiveType: string | null;
  let thrownError: Error | null;

  f.BeforeEachScenario(() => {
    fileBuffer = new ArrayBuffer(0);
    detectedType = null;
    browserType = "";
    effectiveType = null;
    thrownError = null;
  });

  // @fix-file-mime-detection @FR1
  f.Scenario("Detect JPEG from magic bytes", ({ Given, When, Then }) => {
    Given(
      "a file buffer starting with JPEG magic bytes",
      (_ctx: TestContext) => {
        fileBuffer = createBuffer(JPEG_MAGIC_BYTES);
      },
    );

    When("detectMimeType analyzes the buffer", (_ctx: TestContext) => {
      detectedType = detectMimeType(fileBuffer);
    });

    Then('the detected MIME type is "image/jpeg"', (_ctx: TestContext) => {
      expect(detectedType).toBe("image/jpeg");
    });
  });

  // @fix-file-mime-detection @FR1
  f.Scenario("Detect PNG from magic bytes", ({ Given, When, Then }) => {
    Given(
      "a file buffer starting with PNG magic bytes",
      (_ctx: TestContext) => {
        fileBuffer = createBuffer(PNG_MAGIC_BYTES);
      },
    );

    When("detectMimeType analyzes the buffer", (_ctx: TestContext) => {
      detectedType = detectMimeType(fileBuffer);
    });

    Then('the detected MIME type is "image/png"', (_ctx: TestContext) => {
      expect(detectedType).toBe("image/png");
    });
  });

  // @fix-file-mime-detection @FR1
  f.Scenario(
    "Detect WebP from RIFF header with WEBP marker",
    ({ Given, When, Then }) => {
      Given(
        "a file buffer with RIFF header and WEBP marker at offset 8",
        (_ctx: TestContext) => {
          fileBuffer = createRiffBuffer(WEBP_MARKER);
        },
      );

      When("detectMimeType analyzes the buffer", (_ctx: TestContext) => {
        detectedType = detectMimeType(fileBuffer);
      });

      Then('the detected MIME type is "image/webp"', (_ctx: TestContext) => {
        expect(detectedType).toBe("image/webp");
      });
    },
  );

  // @fix-file-mime-detection @FR1
  f.Scenario(
    "RIFF without WEBP marker returns null",
    ({ Given, When, Then }) => {
      Given(
        "a file buffer with RIFF header and WAVE marker at offset 8",
        (_ctx: TestContext) => {
          fileBuffer = createRiffBuffer(WAVE_MARKER);
        },
      );

      When("detectMimeType analyzes the buffer", (_ctx: TestContext) => {
        detectedType = detectMimeType(fileBuffer);
      });

      Then("the detected MIME type is null", (_ctx: TestContext) => {
        expect(detectedType).toBeNull();
      });
    },
  );

  // @fix-file-mime-detection @FR1
  f.Scenario("Unknown binary format returns null", ({ Given, When, Then }) => {
    Given("a file buffer with unknown content", (_ctx: TestContext) => {
      fileBuffer = createBuffer(UNKNOWN_BYTES);
    });

    When("detectMimeType analyzes the buffer", (_ctx: TestContext) => {
      detectedType = detectMimeType(fileBuffer);
    });

    Then("the detected MIME type is null", (_ctx: TestContext) => {
      expect(detectedType).toBeNull();
    });
  });

  // @fix-file-mime-detection @FR3
  f.Scenario(
    "Unrecognized format rejected with specific error",
    ({ Given, When, Then }) => {
      Given(
        'a file with unknown binary content and browser type "application/octet-stream"',
        (_ctx: TestContext) => {
          fileBuffer = createBuffer(UNKNOWN_BYTES);
          browserType = "application/octet-stream";
        },
      );

      When(
        "the system resolves the effective MIME type",
        (_ctx: TestContext) => {
          const contentDetectedType = detectMimeType(fileBuffer);
          try {
            effectiveType = resolveEffectiveMimeType(
              contentDetectedType,
              browserType,
            );
          } catch (error) {
            thrownError = error as Error;
          }
        },
      );

      Then("an UNRECOGNIZED_FORMAT error is thrown", (_ctx: TestContext) => {
        expect(thrownError).not.toBeNull();
        expect(thrownError?.message).toBe(UNRECOGNIZED_FORMAT_ERROR);
        expect(effectiveType).toBeNull();
      });
    },
  );

  // @fix-file-mime-detection @FR2
  f.Scenario(
    "WebP file with PNG extension accepted as WebP",
    ({ Given, When, Then }) => {
      Given(
        'a WebP file with browser-reported type "image/png"',
        (_ctx: TestContext) => {
          fileBuffer = createRiffBuffer(WEBP_MARKER);
          browserType = "image/png";
        },
      );

      When(
        "the system resolves the effective MIME type",
        (_ctx: TestContext) => {
          const contentDetectedType = detectMimeType(fileBuffer);
          effectiveType = resolveEffectiveMimeType(
            contentDetectedType,
            browserType,
          );
        },
      );

      Then('the effective MIME type is "image/webp"', (_ctx: TestContext) => {
        expect(effectiveType).toBe("image/webp");
      });
    },
  );
});

// implements FR1, FR2 of add-file-attachments — magic bytes validation
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { validateMagicBytes } from "@clear-progress/contract";
import { expect } from "vitest";

const feature = await loadFeature("../file_attachments_magic_bytes.feature");

type FeatureContext = {
  fileBuffer: ArrayBuffer;
  validationResult: boolean;
};

/** PNG magic bytes: 89 50 4E 47 */
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

/** JPEG magic bytes: FF D8 FF */
const JPEG_MAGIC = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);

/** PDF magic bytes: 25 50 44 46 (%PDF) */
const PDF_MAGIC = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

function createBuffer(bytes: Uint8Array, totalSize = 64): ArrayBuffer {
  const buffer = new ArrayBuffer(totalSize);
  const view = new Uint8Array(buffer);
  view.set(bytes);
  return buffer;
}

describeFeature(feature, (f) => {
  // @add-file-attachments @FR1
  f.Scenario("Allowed MIME type accepted", ({ Given, When, Then }) => {
    const context: FeatureContext = {
      fileBuffer: new ArrayBuffer(0),
      validationResult: false,
    };

    Given("a valid PNG file", async () => {
      context.fileBuffer = createBuffer(PNG_MAGIC);
    });

    When(
      'magic bytes validation is performed with MIME type "image/png"',
      async () => {
        context.validationResult = validateMagicBytes(
          context.fileBuffer,
          "image/png",
        );
      },
    );

    Then("the validation passes", async () => {
      expect(context.validationResult).toBe(true);
    });
  });

  // @add-file-attachments @FR1
  f.Scenario("Disallowed MIME type rejected", ({ Given, When, Then }) => {
    const context: FeatureContext = {
      fileBuffer: new ArrayBuffer(0),
      validationResult: false,
    };

    Given("a file with arbitrary content", async () => {
      context.fileBuffer = createBuffer(new Uint8Array([0x01, 0x02, 0x03]));
    });

    When(
      'magic bytes validation is performed with MIME type "application/zip"',
      async () => {
        context.validationResult = validateMagicBytes(
          context.fileBuffer,
          "application/zip",
        );
      },
    );

    Then("the validation fails", async () => {
      expect(context.validationResult).toBe(false);
    });
  });

  // @add-file-attachments @FR1
  f.Scenario("HTML files rejected", ({ Given, When, Then }) => {
    const context: FeatureContext = {
      fileBuffer: new ArrayBuffer(0),
      validationResult: false,
    };

    Given("a file with arbitrary content", async () => {
      context.fileBuffer = createBuffer(
        new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c]),
      );
    });

    When(
      'magic bytes validation is performed with MIME type "text/html"',
      async () => {
        context.validationResult = validateMagicBytes(
          context.fileBuffer,
          "text/html",
        );
      },
    );

    Then("the validation fails", async () => {
      expect(context.validationResult).toBe(false);
    });
  });

  // @add-file-attachments @FR2
  f.Scenario(
    "JPEG with correct magic bytes passes",
    ({ Given, When, Then }) => {
      const context: FeatureContext = {
        fileBuffer: new ArrayBuffer(0),
        validationResult: false,
      };

      Given("a file starting with JPEG magic bytes", async () => {
        context.fileBuffer = createBuffer(JPEG_MAGIC);
      });

      When(
        'magic bytes validation is performed with MIME type "image/jpeg"',
        async () => {
          context.validationResult = validateMagicBytes(
            context.fileBuffer,
            "image/jpeg",
          );
        },
      );

      Then("the validation passes", async () => {
        expect(context.validationResult).toBe(true);
      });
    },
  );

  // @add-file-attachments @FR2
  f.Scenario(
    "File with spoofed MIME type rejected",
    ({ Given, When, Then }) => {
      const context: FeatureContext = {
        fileBuffer: new ArrayBuffer(0),
        validationResult: false,
      };

      Given("a file starting with JPEG magic bytes", async () => {
        context.fileBuffer = createBuffer(JPEG_MAGIC);
      });

      When(
        'magic bytes validation is performed with MIME type "image/png"',
        async () => {
          context.validationResult = validateMagicBytes(
            context.fileBuffer,
            "image/png",
          );
        },
      );

      Then("the validation fails", async () => {
        expect(context.validationResult).toBe(false);
      });
    },
  );

  // @add-file-attachments @FR2
  f.Scenario("PDF with correct signature passes", ({ Given, When, Then }) => {
    const context: FeatureContext = {
      fileBuffer: new ArrayBuffer(0),
      validationResult: false,
    };

    Given("a file starting with PDF magic bytes", async () => {
      context.fileBuffer = createBuffer(PDF_MAGIC);
    });

    When(
      'magic bytes validation is performed with MIME type "application/pdf"',
      async () => {
        context.validationResult = validateMagicBytes(
          context.fileBuffer,
          "application/pdf",
        );
      },
    );

    Then("the validation passes", async () => {
      expect(context.validationResult).toBe(true);
    });
  });

  // @add-file-attachments @FR2
  f.Scenario("Text file with no null bytes passes", ({ Given, When, Then }) => {
    const context: FeatureContext = {
      fileBuffer: new ArrayBuffer(0),
      validationResult: false,
    };

    Given("a text file containing only printable characters", async () => {
      const encoder = new TextEncoder();
      const textBytes = encoder.encode(
        "Hello, this is a plain text file.\nLine two.",
      );
      context.fileBuffer = textBytes.buffer;
    });

    When(
      'magic bytes validation is performed with MIME type "text/plain"',
      async () => {
        context.validationResult = validateMagicBytes(
          context.fileBuffer,
          "text/plain",
        );
      },
    );

    Then("the validation passes", async () => {
      expect(context.validationResult).toBe(true);
    });
  });

  // @add-file-attachments @FR2
  f.Scenario("Text file with null bytes rejected", ({ Given, When, Then }) => {
    const context: FeatureContext = {
      fileBuffer: new ArrayBuffer(0),
      validationResult: false,
    };

    Given("a text file containing null bytes", async () => {
      const contentWithNull = new Uint8Array([
        0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x57, 0x6f,
      ]);
      context.fileBuffer = contentWithNull.buffer;
    });

    When(
      'magic bytes validation is performed with MIME type "text/plain"',
      async () => {
        context.validationResult = validateMagicBytes(
          context.fileBuffer,
          "text/plain",
        );
      },
    );

    Then("the validation fails", async () => {
      expect(context.validationResult).toBe(false);
    });
  });
});

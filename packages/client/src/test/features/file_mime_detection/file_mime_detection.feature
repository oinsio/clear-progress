Feature: File MIME Type Detection
  Content-based MIME type detection from magic bytes.
  Implements fix-file-mime-detection.

  @fix-file-mime-detection @FR1
  Scenario: Detect JPEG from magic bytes
    Given a file buffer starting with JPEG magic bytes
    When detectMimeType analyzes the buffer
    Then the detected MIME type is "image/jpeg"

  @fix-file-mime-detection @FR1
  Scenario: Detect PNG from magic bytes
    Given a file buffer starting with PNG magic bytes
    When detectMimeType analyzes the buffer
    Then the detected MIME type is "image/png"

  @fix-file-mime-detection @FR1
  Scenario: Detect WebP from RIFF header with WEBP marker
    Given a file buffer with RIFF header and WEBP marker at offset 8
    When detectMimeType analyzes the buffer
    Then the detected MIME type is "image/webp"

  @fix-file-mime-detection @FR1
  Scenario: RIFF without WEBP marker returns null
    Given a file buffer with RIFF header and WAVE marker at offset 8
    When detectMimeType analyzes the buffer
    Then the detected MIME type is null

  @fix-file-mime-detection @FR1
  Scenario: Unknown binary format returns null
    Given a file buffer with unknown content
    When detectMimeType analyzes the buffer
    Then the detected MIME type is null

  @fix-file-mime-detection @FR3
  Scenario: Unrecognized format rejected with specific error
    Given a file with unknown binary content and browser type "application/octet-stream"
    When the system resolves the effective MIME type
    Then an UNRECOGNIZED_FORMAT error is thrown

  @fix-file-mime-detection @FR2
  Scenario: WebP file with PNG extension accepted as WebP
    Given a WebP file with browser-reported type "image/png"
    When the system resolves the effective MIME type
    Then the effective MIME type is "image/webp"

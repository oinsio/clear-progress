# Capability: MIME Detection

## Purpose

Content-based MIME type detection from file magic bytes. Replaces reliance on browser-reported `file.type` (which is derived from file extension and can be wrong).

## Requirements

### Requirement: Detect MIME type from magic bytes

The system SHALL provide a `detectMimeType(buffer: ArrayBuffer): string | null` function that determines the real MIME type by matching the first bytes of the buffer against known file signatures. The function SHALL return the matching MIME type string, or `null` if no signature matches. Implements FR1 of fix-file-mime-detection.

#### Scenario: JPEG file detected

- **WHEN** buffer starts with bytes `FF D8 FF`
- **THEN** `detectMimeType` returns `"image/jpeg"`

#### Scenario: PNG file detected

- **WHEN** buffer starts with bytes `89 50 4E 47`
- **THEN** `detectMimeType` returns `"image/png"`

#### Scenario: WebP file detected

- **WHEN** buffer starts with bytes `52 49 46 46` (RIFF) and bytes at offset 8 are `57 45 42 50` (WEBP)
- **THEN** `detectMimeType` returns `"image/webp"`

#### Scenario: GIF file detected

- **WHEN** buffer starts with bytes `47 49 46 38` (GIF8)
- **THEN** `detectMimeType` returns `"image/gif"`

#### Scenario: PDF file detected

- **WHEN** buffer starts with bytes `25 50 44 46` (%PDF)
- **THEN** `detectMimeType` returns `"application/pdf"`

#### Scenario: RIFF file that is not WebP

- **WHEN** buffer starts with `52 49 46 46` (RIFF) but bytes at offset 8 are NOT `57 45 42 50`
- **THEN** `detectMimeType` returns `null`

#### Scenario: Unknown binary format

- **WHEN** buffer bytes do not match any known signature
- **THEN** `detectMimeType` returns `null`

#### Scenario: Empty buffer

- **WHEN** buffer has zero length
- **THEN** `detectMimeType` returns `null`

#### Scenario: Buffer shorter than shortest signature

- **WHEN** buffer has fewer bytes than the shortest known signature (3 bytes for JPEG)
- **THEN** `detectMimeType` returns `null`

### Requirement: Text file fallback to browser type

The system SHALL NOT attempt to detect text MIME types (`text/plain`, `text/markdown`) from magic bytes since text files have no reliable signature. When `detectMimeType` returns `null` and the browser-reported type is a text MIME type, the caller SHALL fall back to the browser-reported type and validate using null-byte checking. Implements FR1, FR3 of fix-file-mime-detection.

#### Scenario: Text file with correct browser type accepted

- **WHEN** `detectMimeType` returns `null` for a file
- **AND** browser reports `file.type` as `"text/plain"`
- **AND** file content has no null bytes in first 8192 bytes
- **THEN** the file is accepted as `"text/plain"`

#### Scenario: Binary file disguised as text rejected

- **WHEN** `detectMimeType` returns `null` for a file
- **AND** browser reports `file.type` as `"text/plain"`
- **AND** file content contains null bytes in first 8192 bytes
- **THEN** the file is rejected

#### Scenario: Unknown format with non-text browser type rejected

- **WHEN** `detectMimeType` returns `null` for a file
- **AND** browser reports `file.type` as `"application/octet-stream"`
- **THEN** the file is rejected as unrecognized format

### Requirement: WebP disambiguation via extended signature

The `detectMimeType` function SHALL check both the RIFF header (bytes 0-3: `52 49 46 46`) AND the WEBP marker (bytes 8-11: `57 45 42 50`) to distinguish WebP from other RIFF-based formats (WAV, AVI). Implements FR1 of fix-file-mime-detection.

#### Scenario: WebP correctly identified among RIFF formats

- **WHEN** buffer has RIFF header and WEBP marker at offset 8
- **THEN** `detectMimeType` returns `"image/webp"`

#### Scenario: WAV file not misidentified as WebP

- **WHEN** buffer has RIFF header but `WAVE` at offset 8
- **THEN** `detectMimeType` returns `null` (not `"image/webp"`)

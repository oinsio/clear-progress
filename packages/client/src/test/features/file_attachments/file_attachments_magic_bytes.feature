Feature: File Attachments — Magic Bytes Validation
  Validates file content by checking magic bytes against known
  signatures for the declared MIME type.
  Implements FR1, FR2 of add-file-attachments.

  @add-file-attachments @FR1
  Scenario: Allowed MIME type accepted
    Given a valid PNG file
    When magic bytes validation is performed with MIME type "image/png"
    Then the validation passes

  @add-file-attachments @FR1
  Scenario: Disallowed MIME type rejected
    Given a file with arbitrary content
    When magic bytes validation is performed with MIME type "application/zip"
    Then the validation fails

  @add-file-attachments @FR1
  Scenario: HTML files rejected
    Given a file with arbitrary content
    When magic bytes validation is performed with MIME type "text/html"
    Then the validation fails

  @add-file-attachments @FR2
  Scenario: JPEG with correct magic bytes passes
    Given a file starting with JPEG magic bytes
    When magic bytes validation is performed with MIME type "image/jpeg"
    Then the validation passes

  @add-file-attachments @FR2
  Scenario: File with spoofed MIME type rejected
    Given a file starting with JPEG magic bytes
    When magic bytes validation is performed with MIME type "image/png"
    Then the validation fails

  @add-file-attachments @FR2
  Scenario: PDF with correct signature passes
    Given a file starting with PDF magic bytes
    When magic bytes validation is performed with MIME type "application/pdf"
    Then the validation passes

  @add-file-attachments @FR2
  Scenario: Text file with no null bytes passes
    Given a text file containing only printable characters
    When magic bytes validation is performed with MIME type "text/plain"
    Then the validation passes

  @add-file-attachments @FR2
  Scenario: Text file with null bytes rejected
    Given a text file containing null bytes
    When magic bytes validation is performed with MIME type "text/plain"
    Then the validation fails

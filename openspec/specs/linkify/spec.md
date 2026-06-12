# Linkify

URL detection, parsing, and shortening. The `extractLinks` function detects http/https URLs in text and returns typed segments. The `shortenUrl` function produces a human-readable abbreviated display.

## Requirements

### Requirement: Empty input returns empty array

extractLinks SHALL return an empty array when given an empty string. Implements FR1 of linkify-spec.

#### Scenario: Empty string produces no segments

- **WHEN** extractLinks is called with an empty string
- **THEN** the result is an empty array

### Requirement: Plain text returns single text segment

extractLinks SHALL return a single text segment when no URLs are present in the input. Implements FR2 of linkify-spec.

#### Scenario: Text without URLs is a single segment

- **WHEN** extractLinks is called with "Just plain text without links"
- **THEN** the result contains one segment of type "text" with value "Just plain text without links"

### Requirement: HTTP protocol detection

extractLinks SHALL detect URLs with http:// protocol. Implements FR3 of linkify-spec.

#### Scenario: HTTP URL is detected

- **WHEN** extractLinks is called with "Visit http://example.com"
- **THEN** the result contains a URL segment with value "http://example.com"

### Requirement: HTTPS protocol detection

extractLinks SHALL detect URLs with https:// protocol. Implements FR4 of linkify-spec.

#### Scenario: HTTPS URL is detected

- **WHEN** extractLinks is called with "Visit https://example.com"
- **THEN** the result contains a URL segment with value "https://example.com"

### Requirement: URL position handling

extractLinks SHALL correctly extract URLs at the start, middle, and end of text, preserving surrounding text as separate segments. Implements FR5 of linkify-spec.

#### Scenario: URL at start of text

- **WHEN** extractLinks is called with "https://example.com is the link"
- **THEN** the first segment is a URL with value "https://example.com"
- **THEN** the second segment is text with value " is the link"

#### Scenario: URL in middle of text

- **WHEN** extractLinks is called with "Before https://example.com after"
- **THEN** the result contains text "Before ", URL "https://example.com", and text " after"

#### Scenario: URL at end of text

- **WHEN** extractLinks is called with "The link is https://example.com"
- **THEN** the first segment is text with value "The link is "
- **THEN** the second segment is a URL with value "https://example.com"

### Requirement: Multiple URL extraction

extractLinks SHALL extract all URLs from text containing multiple URLs, with intervening text as separate segments. Implements FR6 of linkify-spec.

#### Scenario: Two URLs in text

- **WHEN** extractLinks is called with "Visit https://example.com and https://test.org"
- **THEN** the result contains URL "https://example.com" and URL "https://test.org" with text segments between them

### Requirement: Query parameter preservation

extractLinks SHALL preserve query parameters as part of the detected URL. Implements FR7 of linkify-spec.

#### Scenario: URL with query parameters

- **WHEN** extractLinks is called with text containing "https://translate.google.com/?hl=ru&sl=en"
- **THEN** the URL segment value includes the query parameters

### Requirement: Trailing punctuation stripping

extractLinks SHALL strip trailing punctuation characters (period, comma, semicolon, colon, exclamation mark, question mark, closing parenthesis) from detected URLs. Implements FR8 of linkify-spec.

#### Scenario: URL followed by period

- **WHEN** extractLinks is called with "See https://example.com."
- **THEN** the URL segment value is "https://example.com"
- **THEN** the trailing period is part of a text segment

#### Scenario: URL followed by comma

- **WHEN** extractLinks is called with "Also https://test.org, and more"
- **THEN** the URL segment value is "https://test.org"

#### Scenario: URL followed by closing parenthesis

- **WHEN** extractLinks is called with "Link https://foo.bar) here"
- **THEN** the URL segment value is "https://foo.bar"

### Requirement: Hostname www prefix removal

shortenUrl SHALL remove the www. prefix from the hostname in the display text. Implements FR9 of linkify-spec.

#### Scenario: www prefix is removed

- **WHEN** shortenUrl is called with "https://www.example.com/path"
- **THEN** the result is "example.com/path"

### Requirement: Trailing slash removal

shortenUrl SHALL remove trailing slash from the path in the display text. Implements FR10 of linkify-spec.

#### Scenario: Trailing slash is removed

- **WHEN** shortenUrl is called with "https://example.com/path/"
- **THEN** the result is "example.com/path"

### Requirement: Long path abbreviation

shortenUrl SHALL abbreviate paths with more than 2 segments by showing the first segment, an ellipsis, and the last segment. Implements FR11 of linkify-spec.

#### Scenario: Three-segment path is abbreviated

- **WHEN** shortenUrl is called with "https://example.com/first/middle/last"
- **THEN** the result is "example.com/first/…/last"

#### Scenario: Four-segment path is abbreviated

- **WHEN** shortenUrl is called with "https://www.example.com/a/b/c/d?foo=bar#section"
- **THEN** the result is "example.com/a/…/d"

### Requirement: Short path preservation

shortenUrl SHALL keep paths with 1 or 2 segments intact without abbreviation. Implements FR12 of linkify-spec.

#### Scenario: Single-segment path is kept

- **WHEN** shortenUrl is called with "https://example.com/path"
- **THEN** the result is "example.com/path"

#### Scenario: Two-segment path is kept

- **WHEN** shortenUrl is called with "https://example.com/first/second"
- **THEN** the result is "example.com/first/second"

### Requirement: Query and hash omission

shortenUrl SHALL omit query parameters and hash fragments from the display text. Implements FR13 of linkify-spec.

#### Scenario: Query parameters are omitted

- **WHEN** shortenUrl is called with "https://example.com/path?foo=bar&baz=qux"
- **THEN** the result is "example.com/path"

#### Scenario: Hash fragment is omitted

- **WHEN** shortenUrl is called with "https://example.com/path#section"
- **THEN** the result is "example.com/path"

### Requirement: Hostname-only display

shortenUrl SHALL return only the hostname when the URL has no meaningful path. Implements FR14 of linkify-spec.

#### Scenario: URL without path

- **WHEN** shortenUrl is called with "https://example.com"
- **THEN** the result is "example.com"

#### Scenario: URL with only trailing slash

- **WHEN** shortenUrl is called with "https://example.com/"
- **THEN** the result is "example.com"

### Requirement: Invalid URL fallback

shortenUrl SHALL fallback to removing the protocol prefix when URL parsing fails. Implements FR15 of linkify-spec.

#### Scenario: Invalid URL removes protocol

- **WHEN** shortenUrl is called with "not-a-valid-url"
- **THEN** the result is "not-a-valid-url"

---

**Note:** The `LinkedText` component (FR16–FR22) and its newline preservation behavior have been removed. URL rendering in descriptions is now handled by `DescriptionMarkdown` with `LinkChip`. See `description-markdown/spec.md` for details.

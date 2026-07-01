# Linkify Specs

## Why

The Linkify feature auto-detects URLs in text descriptions and renders them as clickable links. The `extractLinks` utility and `LinkedText` component are implemented but lack a formal specification and BDD tests. Without specs, the URL detection contract (supported protocols, trailing punctuation stripping, edge cases) is undocumented.

## What Changes

- ADDED: Specification for URL detection and parsing utility (`extractLinks`, `shortenUrl`)
- ADDED: Specification for LinkedText component rendering behavior
- ADDED: BDD unit tests for extractLinks URL parsing logic
- ADDED: BDD unit tests for shortenUrl display logic
- ADDED: BDD unit tests for LinkedText component rendering

## Goals

- G1: Document URL detection and rendering behavior in executable specifications
- G2: Cover extractLinks and shortenUrl logic with BDD unit tests
- G3: Cover LinkedText component rendering with BDD unit tests

## Non-Goals

- NG1: Do not modify existing implementation code
- NG2: Do not add E2E tests (no browser-specific behavior to verify)
- NG3: Do not test entities (tasks, goals, ideas) that use LinkedText — only test linkify utilities and LinkedText in isolation

## Users & Scenarios

- U1: User enters a URL in a task description — URL is detected and rendered as a clickable link
- U2: User enters text with multiple URLs — all URLs are detected and rendered as separate links
- U3: User enters a URL followed by punctuation (period, comma, parenthesis) — punctuation is not part of the link
- U4: User enters a long URL — display text is shortened to hostname + abbreviated path
- U5: User clicks a detected link — link opens in new tab without triggering parent click handlers

## Requirements

### Functional

- FR1: extractLinks SHALL return an empty array for empty string input
- FR2: extractLinks SHALL return a single text segment when no URLs are present
- FR3: extractLinks SHALL detect URLs with http:// protocol
- FR4: extractLinks SHALL detect URLs with https:// protocol
- FR5: extractLinks SHALL extract URL at the start, middle, and end of text
- FR6: extractLinks SHALL extract multiple URLs from the same text
- FR7: extractLinks SHALL preserve query parameters in detected URLs
- FR8: extractLinks SHALL strip trailing punctuation (period, comma, semicolon, colon, exclamation, question mark, closing parenthesis) from URLs
- FR9: shortenUrl SHALL remove www. prefix from hostname
- FR10: shortenUrl SHALL remove trailing slash from path
- FR11: shortenUrl SHALL abbreviate paths with more than 2 segments using ellipsis
- FR12: shortenUrl SHALL keep paths with 1-2 segments intact
- FR13: shortenUrl SHALL omit query parameters and hash fragments from display
- FR14: shortenUrl SHALL return hostname only for URLs without a path
- FR15: shortenUrl SHALL fallback to removing protocol prefix for invalid URLs
- FR16: LinkedText SHALL render plain text without links when no URLs are present
- FR17: LinkedText SHALL render detected URLs as anchor elements with target="_blank" and rel="noopener noreferrer"
- FR18: LinkedText SHALL display shortened URL text via shortenUrl
- FR19: LinkedText SHALL show full URL in the title attribute of the link
- FR20: LinkedText SHALL stop click event propagation on link click
- FR21: LinkedText SHALL render empty span for empty text input
- FR22: LinkedText SHALL apply custom className to the root span element

## UX Acceptance Criteria

- UX1: Links are visually distinct from surrounding text
- UX2: Shortened URL display is readable and recognizable
- UX3: Full URL is accessible via hover tooltip (title attribute)

## Behavior

Reference to feature files:
- `features/linkify/linkify_extract_links.feature` (@linkify-spec tags)
- `features/linkify/linkify_shorten_url.feature` (@linkify-spec tags)
- `features/linkify/linkify_linked_text.feature` (@linkify-spec tags)

## Affected IA

No changes.

## Success Metrics

- M1: Spec covers FR1-FR22 with executable scenarios
- M2: BDD unit tests pass for all scenarios
- M3: All existing tests remain green after adding new specs

## Capabilities

### New Capabilities
- `linkify`: URL detection, parsing, shortening, and rendering as clickable links — extractLinks, shortenUrl utilities and LinkedText component

### Modified Capabilities

None.

## Impact

- New files: `openspec/specs/linkify/spec.md`, BDD features + steps
- Existing code is not modified

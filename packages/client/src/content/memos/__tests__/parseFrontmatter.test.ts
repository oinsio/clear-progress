import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "../parseFrontmatter";

const VALID_FRONTMATTER = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1
---
# Content here`;

const MISSING_DELIMITERS = `# No frontmatter
Just a regular markdown file`;

const INCOMPLETE_FRONTMATTER_NO_TITLE = `---
description: Daily review
icon: refresh-cw
order: 1
---
# Content`;

const INCOMPLETE_FRONTMATTER_NO_DESCRIPTION = `---
title: Review
icon: refresh-cw
order: 1
---
# Content`;

const INCOMPLETE_FRONTMATTER_NO_ICON = `---
title: Review
description: Daily review
order: 1
---
# Content`;

const INCOMPLETE_FRONTMATTER_NO_ORDER = `---
title: Review
description: Daily review
icon: refresh-cw
---
# Content`;

const NON_INTEGER_ORDER = `---
title: Review
description: Daily review
icon: refresh-cw
order: first
---
# Content`;

const FLOAT_ORDER = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1.5
---
# Content`;

const ONLY_OPENING_DELIMITER = `---
title: Review
# Content without closing delimiter`;

const EMPTY_BODY = `---
title: Review
description: Daily review
icon: refresh-cw
order: 2
---`;

const BODY_WITH_LEADING_NEWLINE = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1
---

# Content starts after blank line`;

const FRONTMATTER_WITH_SPACES_IN_KEYS = `---
  title  : Review
  description  : Daily review
  icon  : refresh-cw
  order  : 1
---
# Content`;

const MULTILINE_BODY = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1
---
# Line one
## Line two
Paragraph`;

const LINE_WITHOUT_COLON = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1
this line has no colon
---
# Content`;

const EMPTY_INPUT = "";

describe("parseFrontmatter", () => {
  // FR10: valid frontmatter parsed correctly
  it("should parse valid frontmatter with all required fields", () => {
    const result = parseFrontmatter(VALID_FRONTMATTER);

    expect(result).not.toBeNull();
    expect(result!.attributes.title).toBe("Review");
    expect(result!.attributes.description).toBe("Daily review");
    expect(result!.attributes.icon).toBe("refresh-cw");
    expect(result!.attributes.order).toBe("1");
    expect(result!.body).toBe("# Content here");
  });

  // FR10: missing delimiters — file skipped
  it("should return null when frontmatter delimiters are missing", () => {
    const result = parseFrontmatter(MISSING_DELIMITERS);

    expect(result).toBeNull();
  });

  // FR10: only opening delimiter — file skipped
  it("should return null when only opening delimiter exists", () => {
    const result = parseFrontmatter(ONLY_OPENING_DELIMITER);

    expect(result).toBeNull();
  });

  // FR10: missing title field rejects file
  it("should return null when title field is missing", () => {
    const result = parseFrontmatter(INCOMPLETE_FRONTMATTER_NO_TITLE);

    expect(result).toBeNull();
  });

  // FR10: missing description field rejects file
  it("should return null when description field is missing", () => {
    const result = parseFrontmatter(INCOMPLETE_FRONTMATTER_NO_DESCRIPTION);

    expect(result).toBeNull();
  });

  // FR10: missing icon field rejects file
  it("should return null when icon field is missing", () => {
    const result = parseFrontmatter(INCOMPLETE_FRONTMATTER_NO_ICON);

    expect(result).toBeNull();
  });

  // FR10: missing order field rejects file
  it("should return null when order field is missing", () => {
    const result = parseFrontmatter(INCOMPLETE_FRONTMATTER_NO_ORDER);

    expect(result).toBeNull();
  });

  // FR10: non-integer order rejects file
  it("should return null when order is a non-integer string", () => {
    const result = parseFrontmatter(NON_INTEGER_ORDER);

    expect(result).toBeNull();
  });

  // FR10: float order rejects file
  it("should return null when order is a float", () => {
    const result = parseFrontmatter(FLOAT_ORDER);

    expect(result).toBeNull();
  });

  it("should handle empty body after frontmatter", () => {
    const result = parseFrontmatter(EMPTY_BODY);

    expect(result).not.toBeNull();
    expect(result!.attributes.title).toBe("Review");
    expect(result!.body).toBe("");
  });

  it("should trim leading newline from body", () => {
    const result = parseFrontmatter(BODY_WITH_LEADING_NEWLINE);

    expect(result).not.toBeNull();
    expect(result!.body).toBe("# Content starts after blank line");
  });

  it("should return null for empty input", () => {
    const result = parseFrontmatter(EMPTY_INPUT);

    expect(result).toBeNull();
  });

  it("should trim whitespace from keys and values", () => {
    const result = parseFrontmatter(FRONTMATTER_WITH_SPACES_IN_KEYS);

    expect(result).not.toBeNull();
    expect(result!.attributes.title).toBe("Review");
    expect(result!.attributes.description).toBe("Daily review");
  });

  it("should preserve newlines in body content", () => {
    const result = parseFrontmatter(MULTILINE_BODY);

    expect(result).not.toBeNull();
    expect(result!.body).toBe("# Line one\n## Line two\nParagraph");
  });

  it("should skip YAML lines without a colon", () => {
    const result = parseFrontmatter(LINE_WITHOUT_COLON);

    expect(result).not.toBeNull();
    expect(result!.attributes.title).toBe("Review");
    expect(result!.attributes).not.toHaveProperty("this line has no colon");
  });

  it("should accept delimiter with surrounding whitespace", () => {
    const inputWithSpacedDelimiter = `  ---
title: Review
description: Daily review
icon: refresh-cw
order: 1
---
# Content`;

    const result = parseFrontmatter(inputWithSpacedDelimiter);

    expect(result).not.toBeNull();
    expect(result!.attributes.title).toBe("Review");
  });

  it("should return null when first line is not a delimiter at all", () => {
    const inputWithWrongFirstLine = `not a delimiter
---
title: Review
description: Daily review
icon: refresh-cw
order: 1
---
# Content`;

    const result = parseFrontmatter(inputWithWrongFirstLine);

    expect(result).toBeNull();
  });

  it("should only use first colon as key-value separator", () => {
    const inputWithColonInValue = `---
title: Review: Part 2
description: Daily review
icon: refresh-cw
order: 1
---
# Content`;

    const result = parseFrontmatter(inputWithColonInValue);

    expect(result).not.toBeNull();
    expect(result!.attributes.title).toBe("Review: Part 2");
  });

  // Kills mutant: if (false) replacing first delimiter check
  // Without guard, this input would parse as valid (all fields in lines 1-4)
  it("should reject input with valid fields but no opening delimiter", () => {
    const inputWithFieldsButNoOpening = `not-a-delimiter
title: Review
description: Daily review
icon: refresh-cw
order: 1
---
# Body`;

    const result = parseFrontmatter(inputWithFieldsButNoOpening);

    expect(result).toBeNull();
  });

  // Kills mutant: closingIndex === +1 instead of === -1
  // Input has opening --- but no closing --- so closingIndex is -1
  // With +1 check, it would not return null and would try to parse
  it("should reject input with opening delimiter but no closing delimiter and valid fields", () => {
    const inputNoClosing = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1
body content here`;

    const result = parseFrontmatter(inputNoClosing);

    expect(result).toBeNull();
  });

  // Kills mutant: yamlLines = lines (instead of lines.slice(1, closingIndex))
  // Body contains a colon-delimited line that would corrupt attributes
  it("should not include body content in attributes parsing", () => {
    const inputWithColonInBody = `---
title: Review
description: Daily review
icon: refresh-cw
order: 1
---
extra: should-not-be-in-attributes`;

    const result = parseFrontmatter(inputWithColonInBody);

    expect(result).not.toBeNull();
    expect(result!.attributes).not.toHaveProperty("extra");
    expect(Object.keys(result!.attributes)).toHaveLength(4);
  });

  // Kills mutant: if (false) replacing colonIndex check
  // Line without colon would create an entry with empty key
  it("should not create attributes from lines without colons", () => {
    const result = parseFrontmatter(LINE_WITHOUT_COLON);

    expect(result).not.toBeNull();
    expect(Object.keys(result!.attributes)).toHaveLength(4);
    expect("" in result!.attributes).toBe(false);
  });
});

// src/lib/config/regex/promptAnalysisRegex.ts

/**
 * Regular expression to detect common list item markers at the beginning of a line.
 * This pattern is designed to identify various styles of bullet points and numbered/lettered lists.
 *
 * It accounts for:
 * - Optional leading whitespace (indentation).
 * - Common bullet characters: '-', '*', '•'.
 * - Numbered list formats: e.g., "1.", "1)", "(1)".
 * - Lettered list formats: e.g., "a.", "a)", "(a)".
 * - Ensures that there is actual content following the list marker, not just an empty item.
 *
 * Regex Breakdown:
 *   `^`                   - Asserts position at the start of the line.
 *   `\s*`                 - Matches zero or more whitespace characters (handles indentation).
 *   `(?:`                 - Start of a non-capturing group for the different list marker types:
 *     `[-*•]`             -   Matches a literal hyphen, asterisk, or bullet symbol.
 *     `|`                 -   OR
 *     `\d+[.)]`           -   Matches one or more digits (`\d+`) followed by a literal period `.` or a closing parenthesis `)`.
 *     `|`                 -   OR
 *     `[a-zA-Z][.)]`      -   Matches a single uppercase or lowercase letter followed by a literal period `.` or a closing parenthesis `)`.
 *   `)`                   - End of the non-capturing group.
 *   `\s+`                 - Matches one or more whitespace characters (required space after the marker).
 *   `\S+`                 - Matches one or more non-whitespace characters (ensures the list item has content).
 */
export const LIST_BULLET_ITEM_REGEX = /^\s*(?:[-*•]|\d+[.)]|[a-zA-Z][.)])\s+\S+/;

/**
 * Regular expression to detect Markdown-style headings.
 * It matches lines starting with 1 to 6 hash characters (#) followed by a space and then the heading text.
 *
 * Examples:
 * - `# Heading 1`
 * - `### Subheading`
 *
 * Regex Breakdown:
 *   `^`        - Asserts position at the start of the line.
 *   `\s*`      - Matches zero or more whitespace characters (handles leading indentation).
 *   `#{1,6}`   - Matches one to six literal hash characters.
 *   `\s+`      - Matches one or more whitespace characters (space after hashes).
 *   `.+`       - Matches one or more of any character (except newline) for the heading text.
 */
export const MARKDOWN_HEADING_REGEX = /^\s*(?:[-*]\s*)?#{1,6}\s+.+/;

/**
 * Regular expression to detect labeled section indicators like "Section 1:", "Part A.", "Chapter III-".
 * It looks for common section keywords followed by an identifier and optional punctuation,
 * then expects some content for the section title or start. Case-insensitive.
 *
 * Examples:
 * - `Section 1: Introduction`
 * - `Part A. Methodology`
 * - `chapter iii - results`
 *
 * Regex Breakdown:
 *   `^`                      - Asserts position at the start of the line.
 *   `\s*`                    - Matches zero or more whitespace characters (leading indentation).
 *   `(?:Section|Part|Chapter)` - Non-capturing group for section keywords.
 *   `\s+`                    - Matches one or more whitespace characters.
 *   `[A-Za-z0-9]+`           - Matches the section identifier (e.g., "1", "A", "III", "One").
 *   `(?:[:.-])?`             - Optional non-capturing group for common delimiters (colon, period, hyphen).
 *   `\s*`                    - Matches zero or more whitespace characters after the delimiter.
 *   `\S+`                    - Matches at least one non-whitespace character (ensuring section has a title/content).
 *   `i`                      - Modifier for case-insensitive matching (e.g., "section" or "SECTION").
 */
export const LABELED_SECTION_REGEX = /^\s*(?:Section|Part|Chapter)\s+[A-Za-z0-9]+(?:[:.-])?\s*\S+/i;

/**
 * Regular expression to detect lines that function as horizontal rule separators,
 * which often signify section breaks. It also allows for optional text on the
 * same line, treating it as a potential section title associated with the rule.
 *
 * Examples:
 * - `---`
 * - `*** Section Title Here`
 * - `========`
 *
 * Regex Breakdown:
 *   `^`                             - Asserts position at the start of the line.
 *   `\s*`                           - Matches zero or more whitespace characters (leading indentation).
 *   `(?:-{3,}|\*{3,}|={3,})`         - Non-capturing group matching three or more hyphens, asterisks, or equal signs.
 *   `\s*`                           - Matches zero or more whitespace characters after the rule.
 *   `(?:\S.*)?`                     - Optional non-capturing group for text on the same line:
 *                                     `\S` - at least one non-whitespace character.
 *                                     `.*` - followed by any characters (the rest of the title).
 *   `$`                             - Asserts position at the end of the line.
 */
export const HORIZONTAL_RULE_SECTION_REGEX = /^\s*(?:-{3,}|\*{3,}|={3,})\s*(?:\S.*)?$/;
// Optional, more heuristic:
// export const ALL_CAPS_SHORT_LINE_HEADING_REGEX = /^\s*[A-Z0-9\s():-]{5,50}\s*$/;

/**
 * Regular expression to detect bracketed section headers like "[ROLE AND GOAL]" or "[CONTEXT]".
 * Many prompt writers use bracketed tags to demarcate sections without Markdown # headings.
 *
 * Examples:
 * - [ROLE AND GOAL]
 * - [TASK DECOMPOSITION & INSTRUCTIONS]
 * - [OUTPUT FORMAT]
 *
 * Regex Breakdown:
 *   `^`                 - Start of line
 *   `\s*`              - Optional leading whitespace
 *   `\[`               - Opening square bracket
 *   `[A-Z0-9 _&-]{3,}`  - At least 3 characters of uppercase letters, digits, spaces, underscore, ampersand, or hyphen
 *   `\]`               - Closing square bracket
 *   `\s*`              - Optional trailing whitespace
 *   `$`                 - End of line
 *   `i`                 - Case-insensitive to allow mixed case
 */
export const BRACKETED_SECTION_REGEX = /^\s*\[[A-Z0-9 _&-]{3,}\]\s*$/i;

/**
 * Regular expression to detect modern step-by-step section markers.
 * Matches patterns like "Step 1:", "Step 2:", etc. which are common in
 * contemporary prompt engineering practices.
 *
 * Examples:
 * - `Step 1: Define the persona`
 * - `Step 3: Set clear goals`
 *
 * Regex Breakdown:
 *   `^`        - Asserts position at the start of the line.
 *   `\s*`      - Matches zero or more whitespace characters (leading indentation).
 *   `Step`     - Literal match for "Step" (case-insensitive).
 *   `\s+`      - Matches one or more whitespace characters.
 *   `\d+`      - Matches one or more digits (step number).
 *   `:`        - Literal colon character.
 *   `\s*`      - Optional whitespace after colon.
 *   `\S+`      - At least one non-whitespace character (step title/content).
 *   `i`        - Case-insensitive flag.
 */
export const STEP_SECTION_REGEX = /^\s*Step\s+\d+:\s*\S+/i;

// Combine them for easier iteration
export const SECTION_INDICATOR_REGEXES = [
  MARKDOWN_HEADING_REGEX,
  LABELED_SECTION_REGEX,
  HORIZONTAL_RULE_SECTION_REGEX,
  BRACKETED_SECTION_REGEX,
  STEP_SECTION_REGEX,
];
import { PatternWithMetadata, ExamplePatternMetadata } from '@/lib/types/patterns';
import { SeverityLevel } from '@/lib/types/shared';
import { EXAMPLE_TYPE, EXAMPLE_STRUCTURE_SUBTYPE, EXAMPLE_QUALITY_INDICATOR, TONE_STYLE_CATEGORY, TONE_STYLE_SUBTYPE } from'@/lib/types/metadataTypes';


export const OUTPUT_FORMAT_KEYWORDS_MAP: Record<string, string> = {
  JSON: "JSON",
  TABLE: "Table",
  BULLET_LIST: "BulletList",    
  BULLETS: "BulletList",
  LIST: "BulletList",
  NUMBERED_LIST: "NumberedList", 
  MARKDOWN: "Markdown",
  XML: "XML",
  CSV: "CSV",
  PLAIN_TEXT: "PlainText",
  YAML: "YAML",
  HTML: "HTML",
  SUMMARY: "Summary",
  EXPLANATION: "Explanation",
  STORY: "Story",
  POEM: "Poem",
  CODE: "Code",
  SCRIPT: "Script"
};


// --- Instruction Following ---
export const NEGATIVE_INSTRUCTION_PATTERNS: PatternWithMetadata[] = [
 
  // Direct prohibitions and negations
  { pattern: /\b(do not|don't|never|cannot|can't|must not|should not)\b/gi, reason: "Explicit negative instruction or prohibition.", severity: SeverityLevel.MEDIUM },
  { pattern: /\b(isn't|aren't|wasn't|weren't|won't|wouldn't|couldn't|hasn't|haven't|hadn't)\b/gi, reason: "Contractions indicating negation.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bprohibit\b/gi, reason: "Explicit prohibition.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bban\b/gi, reason: "Instruction to ban or block.", severity: SeverityLevel.MEDIUM },

  // Instructions to avoid or refrain
  { pattern: /\bavoid\b/gi, reason: "Instructs against an action or outcome.", severity: SeverityLevel.MEDIUM },
  { pattern: /\brefrain from\b/gi, reason: "Instructs to hold back from an action.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bsteer clear of\b/gi, reason: "Idiomatic instruction to avoid something.", severity: SeverityLevel.MEDIUM },

  // Instructions for exclusion or omission
  { pattern: /\b(exclude|omit|without)\b/gi, reason: "Instruction to leave something out or generate without it.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bexcept for\b/gi, reason: "Specifies an exclusion.", severity: SeverityLevel.MEDIUM },

  // Instructions to stop or prevent
  { pattern: /\b(stop|prevent|block)\b/gi, reason: "Instruction to cease or hinder an action.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bno (?:more|longer)\b/gi, reason: "Instruction to discontinue something.", severity: SeverityLevel.MEDIUM },

  // Instructions for restriction or limitation
  { pattern: /\b(restrict|limit|confine)\b/gi, reason: "Instruction to place boundaries or constraints.", severity: SeverityLevel.MEDIUM },

  // Negative instructions related to generation/output (more specific)
  { pattern: /\bdo not (?:include|generate|output|write|provide)\b/gi, reason: "Explicit negative instruction regarding content generation.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bavoid (?:generating|including|outputting|writing|providing)\b/gi, reason: "Instruction to avoid specific content generation.", severity: SeverityLevel.MEDIUM },
  { pattern: /\bavoid (?:jargon|technical terms|acronyms)\b/gi, reason: "Instruction to avoid using jargon or technical terms.", severity: SeverityLevel.MEDIUM },

  // Conditional negative instructions
  { pattern: /\bunless\b/gi, reason: "Introduces a condition for negation.", severity: SeverityLevel.MEDIUM },
  { pattern: /\botherwise\b/gi, reason: "Indicates an alternative if a condition is not met.", severity: SeverityLevel.MEDIUM },
];

// --- Goal Alignment & Format/Structure ---
export const ACTION_VERB_KEYWORDS: string[] = [ 
  "summarize", "list", "explain", "generate", "create", "write", "analyze", "compare",
  "define", "describe", "identify", "translate", "rewrite", "code", "debug", "draft",
  "brainstorm", "suggest", "recommend", "classify", "predict", "calculate"
];

export const EXAMPLE_PATTERNS: PatternWithMetadata[] = [
  // --- High-Quality, Structured Examples (Order matters: most specific patterns first) ---
  { pattern: /input:[\s\S]*?output:/gi, reason: "A structured 'Input/Output' few-shot example.", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.STRUCTURED, structureSubtype: EXAMPLE_STRUCTURE_SUBTYPE.INPUT_OUTPUT, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.HIGH } },
  { pattern: /#+\s*(?:example|sample)[\s\S]*?(?:\n\s*-\s*|\n\s*\*\s*|\n\s*\d+\.)/gi, reason: "A structured example introduced with a Markdown heading and a list.", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.STRUCTURED, structureSubtype: EXAMPLE_STRUCTURE_SUBTYPE.LABELED, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.HIGH } },
  { pattern: /example\s*\d+\s*:/gi, reason: "A numbered example label (e.g., 'Example 1:').", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.STRUCTURED, structureSubtype: EXAMPLE_STRUCTURE_SUBTYPE.LABELED, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.HIGH } },
  { pattern: /`{3}[\s\S]*?`{3}/g, reason: "A code block, often used for technical or structured examples.", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.STRUCTURED, structureSubtype: EXAMPLE_STRUCTURE_SUBTYPE.CODE_BLOCK, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.HIGH } },
  { pattern: /#+\s*Example\b[\s\S]*?(?:\n\s*-\s*|\n\s*\*\s*|\n\s*\d+\.)/gi, reason: "A structured example introduced with a Markdown heading and a list.", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.STRUCTURED, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.MEDIUM, structureSubtype: EXAMPLE_STRUCTURE_SUBTYPE.LABELED } },
  
  // --- Inline Examples (Improved Detection) ---
  // Parenthetical inline examples (e.g., Pillar: Mindful Breaks, Slogan: "Recharge to Retain.")
  { pattern: /\(e\.g\.,\s*[^)]+\)/gi, reason: "Parenthetical inline example using 'e.g.,'", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.KEYWORD, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.MEDIUM } },
  { pattern: /\(for example,\s*[^)]+\)/gi, reason: "Parenthetical inline example using 'for example,'", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.KEYWORD, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.MEDIUM } },
  { pattern: /\(such as\s*[^)]+\)/gi, reason: "Parenthetical inline example using 'such as'", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.KEYWORD, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.MEDIUM } },
  
  // Standard inline examples with various punctuation
  { pattern: /\b(for example|e\.g\.|i\.e\.|for instance|such as|like so:|as an example)[\s,:][^.!?\n]{10,}/gi, reason: "Inline example with substantial content (10+ chars).", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.KEYWORD, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.MEDIUM } },
  
  // Catch shorter inline examples that might still be valuable
  { pattern: /\b(for example|e\.g\.|i\.e\.|for instance|such as|like so:|as an example)[\s,:]/gi, reason: "Basic inline example marker.", severity: SeverityLevel.LOW, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.KEYWORD, qualityIndicator: EXAMPLE_QUALITY_INDICATOR.LOW } }
];

/** Step Marker Patterns */
export const STEP_MARKER_PATTERNS: PatternWithMetadata[] = [
  // Explicit step patterns (improved to catch more variations)
  { pattern: /^\s*step\s+\d+\s*[:.]?\s*/gim, reason: "Explicit step numbering (e.g., 'Step 1:', 'Step 2.')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
  { pattern: /\bstep\s+\d+\s*[:.]?\s*/gi, reason: "Step numbering anywhere in text (e.g., 'Step 1:', 'Step 2.')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step' } },
  { pattern: /\bstep\s+(?:one|two|three|four|five|six|seven|eight|nine|ten)\s*[:.]?\s*/gi, reason: "Explicit step with written numbers (e.g., 'Step One:', 'Step Two.')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step' } },
  
  // Numbered list patterns (improved)
  { pattern: /^\s*\d+\.\s+/gm, reason: "Numbered list with period (e.g., '1. ', '2. ')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
  { pattern: /^\s*\d+\)\s+/gm, reason: "Numbered list with parenthesis (e.g., '1) ', '2) ')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
  { pattern: /^\s*\(\d+\)\s+/gm, reason: "Numbered list with full parentheses (e.g., '(1) ', '(2) ')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
  
  // Bulleted list patterns
  { pattern: /^\s*[-*•]\s+/gm, reason: "Bulleted list marker (e.g., '- ', '* ', '• ')", severity: SeverityLevel.LOW, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
  
  // Alphabetical list patterns
  { pattern: /^\s*[a-zA-Z][\.)]\s+/gm, reason: "Alphabetical list marker (e.g., 'a. ', 'A) ')", severity: SeverityLevel.LOW, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
  
  // Process-oriented step markers
  { pattern: /\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)(?:ly)?[,:\s]/gi, reason: "Ordinal step marker (e.g., 'First,', 'Secondly:')", severity: SeverityLevel.LOW },
  { pattern: /\b(?:then|next|after that|finally|lastly)[,:\s]/gi, reason: "Sequential transition word", severity: SeverityLevel.LOW },
  { pattern: /\b(?:begin by|start with|proceed to|continue with|end with)[,:\s]/gi, reason: "Process instruction marker", severity: SeverityLevel.LOW },
  
  // Phase/stage markers
  { pattern: /\b(?:phase|stage)\s+\d+\s*[:.]?\s*/gi, reason: "Phase or stage numbering (e.g., 'Phase 1:', 'Stage 2.')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step' } },
  
  // Task/action markers
  { pattern: /^\s*(?:task|action|objective)\s+\d+\s*[:.]?\s*/gim, reason: "Task or action numbering (e.g., 'Task 1:', 'Action 2.')", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'Step', preserveWhitespace: true } },
];

// --- Placeholders ---
export const PLACEHOLDER_PATTERNS: PatternWithMetadata[] = [ /* ... same as your version with reason & severity ... */
  { pattern: /\[[A-Z_0-9]+\]/g, reason: "Detected bracket-style placeholder (e.g., [VARIABLE])", severity: SeverityLevel.LOW },
  { pattern: /\{[a-zA-Z0-9_]+\}/g, reason: "Detected curly brace placeholder (e.g., {variable})", severity: SeverityLevel.LOW },
  { pattern: /<[a-zA-Z0-9_]+>/g, reason: "Detected angle bracket placeholder (e.g., <slot>)", severity: SeverityLevel.LOW },
  { pattern: /\{\{[a-zA-Z0-9_]+\}\}/g, reason: "Detected double curly brace placeholder (e.g., {{variable}})", severity: SeverityLevel.LOW },
  { pattern: /\{[A-Z_0-9]+\}/g, reason: "Detected all-caps curly brace placeholder (e.g., {VARIABLE})", severity: SeverityLevel.LOW },
  { pattern: /%[A-Z_0-9]+%/g, reason: "Detected percent-style placeholder (e.g., %VARIABLE%)", severity: SeverityLevel.LOW },
  { pattern: /\$\{[a-zA-Z0-9_]+\}/g, reason: "Detected dollar-brace placeholder (e.g., ${variable})", severity: SeverityLevel.LOW }
];

export const TONE_STYLE_KEYWORD_PATTERNS: PatternWithMetadata[] = [
    // Explicit instructions for tone/style
  { pattern: /ensure your response is (professional|comprehensive|detailed|clear|friendly|formal|concise|structured|well-organized|approachable|neutral|simple|creative|imaginative|empathetic|persuasive|optimistic|authoritative|confident|journalistic|objective|data-driven|humorous|witty|sarcastic|poetic|storytelling|narrative)/gi, reason: "Explicit instruction for response tone/style.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },
  { pattern: /the tone should be (professional|formal|friendly|detailed|concise|creative|neutral|clear|approachable|confident|authoritative|journalistic|objective|data-driven|humorous|witty|sarcastic|poetic|storytelling|narrative|empathetic|persuasive|optimistic)/gi, reason: "Explicit tone guidance phrase.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },
  { pattern: /act as (a|an) (professional|expert|advisor|consultant|strategist|teacher|coach|mentor|journalist|storyteller|comedian|friend|author|scientist|engineer|designer|developer|persuader|optimist|narrator|poet)/gi, reason: "Persona/tone guidance phrase.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },
  { pattern: /write in a (professional|formal|friendly|detailed|concise|creative|neutral|clear|approachable|confident|authoritative|journalistic|objective|data-driven|humorous|witty|sarcastic|poetic|storytelling|narrative|empathetic|persuasive|optimistic) tone/gi, reason: "Explicit instruction for writing tone.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },
  { pattern: /respond in a (professional|formal|friendly|detailed|concise|creative|neutral|clear|approachable|confident|authoritative|journalistic|objective|data-driven|humorous|witty|sarcastic|poetic|storytelling|narrative|empathetic|persuasive|optimistic) manner/gi, reason: "Explicit instruction for response manner/tone.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },

  // FORMAL TONES
  { pattern: /\b(formal tone|professional tone|journalistic style|authoritative tone|confident tone)\b/gi, reason: "Specifies a formal, professional style.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.FORMAL } },
  { pattern: /\b(formal|professional|academic|authoritative|confident|journalistic)\b/gi, reason: "Indicates a formal or professional tone.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.FORMAL } },

  // CASUAL TONES
  { pattern: /\b(casual tone|conversational tone|friendly tone|approachable tone)\b/gi, reason: "Specifies a casual, conversational style.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.CASUAL } },
  { pattern: /\b(casual|friendly|conversational|approachable)\b/gi, reason: "Indicates a casual or friendly tone.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.CASUAL } },

  // NEUTRAL & CLEAR TONES
  { pattern: /\b(clear tone|neutral tone|simple tone|plain language)\b/gi, reason: "Specifies a clear and neutral tone.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },
  { pattern: /\b(clear|simple|plain language|neutral)\b/gi, reason: "Requests clear and simple language.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.NEUTRAL } },

  // TECHNICAL TONES
  { pattern: /\b(objective style|data-driven|technical tone|factual tone|direct tone)\b/gi, reason: "Specifies an objective, data-driven style.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.TECHNICAL } },
  { pattern: /\b(factual|technical|direct|concise|objective|data-driven)\b/gi, reason: "Requests a factual or technical style.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.TECHNICAL } },

  // CREATIVE TONES
  { pattern: /\b(humorous tone|empathetic tone|narrative style|storytelling tone|poetic tone|witty tone|sarcastic tone|persuasive tone|optimistic tone)\b/gi, reason: "Specifies a creative or emotional style.", severity: SeverityLevel.INFO, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.CREATIVE } },
  { pattern: /\b(creative|imaginative|storytelling|narrative|humorous|witty|sarcastic|poetic|empathetic|persuasive|optimistic)\b/gi, reason: "Requests a creative, narrative, or emotional style.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.CREATIVE } },

  // EMOTIONAL/PERSUASIVE TONES
  { pattern: /\b(empathetic|persuasive|optimistic)\b/gi, reason: "Indicates a specific emotional or persuasive stance.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.PERSUASIVE } },

  // POETIC TONES
  { pattern: /\bpoetic\b/gi, reason: "Requests a poetic style.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.CREATIVE, styleSubtype: TONE_STYLE_SUBTYPE.POETIC } },

  // STORYTELLING/NARRATIVE TONES
  { pattern: /\b(storytelling|narrative)\b/gi, reason: "Requests a storytelling or narrative style.", severity: SeverityLevel.LOW, metadata: { type: 'tone_style', toneCategory: TONE_STYLE_CATEGORY.CREATIVE, styleSubtype: TONE_STYLE_SUBTYPE.STORYTELLING } },
]

// Persona/Role Instructions (often indicate a specific style or approach)
export const PERSONA_PHRASES_PATTERNS: PatternWithMetadata[] = [ /* ... same as your version with reason & severity ... */
  { pattern: /act as (a|an) .*?(\.|$|,)/i, reason: "Persona instruction: 'act as a/an...'", severity: SeverityLevel.LOW }, // Made slightly more specific
  { pattern: /you are (a|an) .*?(\.|$|,)/i, reason: "Persona definition: 'you are a/an...'", severity: SeverityLevel.LOW },
  { pattern: /respond as (a|an) .*?(\.|$|,)/i, reason: "Persona style instruction", severity: SeverityLevel.LOW },
  { pattern: /in the persona of (a|an) .*?(\.|$|,)/i, reason: "Persona instruction", severity: SeverityLevel.LOW },
  { pattern: /behave like (a|an) .*?(\.|$|,)/i, reason: "Persona instruction", severity: SeverityLevel.LOW },
  { pattern: /imagine you are (a|an) .*?(\.|$|,)/i, reason: "Persona instruction", severity: SeverityLevel.LOW },
  { pattern: /\b(act as|act like|you are a|your role is to)\b/gi, reason: "Explicitly defines an AI persona or role.", severity: SeverityLevel.LOW }
];

// Direct requests for specific formats (stronger signal than just keywords)
export const EXPLICIT_FORMAT_REQUEST_PATTERNS: PatternWithMetadata[] = [
  // --- JSON Formats (Keep at top, generally high priority) ---
  { pattern: /\bformat as json\b/i, reason: "Explicit request for JSON output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },
  { pattern: /\boutput (?:in|as) json\b/i, reason: "Explicit request for JSON output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },
  { pattern: /\b(?:generate|create|provide|return|give me) (?:the |a )?json\b/i, reason: "Instruction to produce JSON output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },
  { pattern: /in json format/i, reason: "Explicit request for JSON output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },
  { pattern: /as json/i, reason: "Explicit request for JSON output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },
  { pattern: /json(?: structure| output)?/i, reason: "Explicit request for JSON output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },
  { pattern: /return a json object/i, reason: "Explicit request for JSON object output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.JSON } },

  // --- CSV Formats (MOVED UP: To prioritize over Table/XML in the specific test case) ---
  { pattern: /as csv/i, reason: "Explicit request for CSV output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.CSV } },
  { pattern: /in csv format/i, reason: "Explicit request for CSV output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.CSV } },
  { pattern: /\b(?:generate|create|provide|return|give me) (?:a |the )?csv\b/i, reason: "Instruction to produce CSV output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.CSV } },

  // --- XML Formats (MOVED UP: To prioritize over Table in the specific test case) ---
  { pattern: /in xml format/i, reason: "Explicit request for XML output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.XML } },
  { pattern: /as xml/i, reason: "Explicit request for XML output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.XML } },
  { pattern: /xml(?: structure| output)?/i, reason: "Explicit request for XML output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.XML } },

  // --- Table Formats (Moved down relative to CSV/XML) ---
  { pattern: /\bformat as table\b/i, reason: "Explicit request for table output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.TABLE } },
  { pattern: /\boutput (?:in|as) (?:a )?table\b/i, reason: "Explicit request for table output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.TABLE } },
  { pattern: /\b(?:generate|create|provide|return|give me) (?:the |a )?table\b/i, reason: "Instruction to produce table output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.TABLE } },
  { pattern: /as a table/i, reason: "Explicit request for table output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.TABLE } },
  { pattern: /in tabular format/i, reason: "Explicit request for table output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.TABLE } },
  { pattern: /\b(?:make|show|display) (?:it |as |an |a |the )?(?:as |an |a |the )?table\b/i, reason: "Instruction to produce table output (verb-based).", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.TABLE } },

  // --- Markdown Formats ---
  { pattern: /\bformat as markdown\b/i, reason: "Explicit request for Markdown output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /\boutput (?:in|as) markdown\b/i, reason: "Explicit request for Markdown output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /\b(?:generate|create|provide|return|give me) (?:the |a )?markdown\b/i, reason: "Instruction to produce Markdown output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /in markdown format/i, reason: "Explicit request for Markdown output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /as markdown|as md\b/i, reason: "Explicit request for Markdown output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /\b(?:structure|format|organize) (?:your |the )?response (?:using |with |as |in )(?:clear |proper )?markdown headings?\b/i, reason: "Instruction to structure response with Markdown headings.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /\buse (?:clear |proper )?markdown headings?\b/i, reason: "Instruction to use Markdown headings.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },
  { pattern: /\bmarkdown headings?\b/i, reason: "Reference to Markdown headings format.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.MARKDOWN } },

  // --- List Formats ---
  { pattern: /\bformat as (?:a |the )?(?:list|bullet points|numbered list)\b/i, reason: "Explicit request for list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.LIST } },
  { pattern: /\boutput (?:in|as) (?:a |the )?(?:list|bullet points|numbered list)\b/i, reason: "Explicit request for list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.LIST } },
  { pattern: /\b(?:generate|create|provide|return|give me) (?:a |the )?(?:list|bullet points|numbered list)\b/i, reason: "Instruction to produce list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.LIST } },
  { pattern: /as (?:a |the )?(?:list|bullet points|numbered list)\b/i, reason: "Explicit request for list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.LIST } },
  { pattern: /in a list format/i, reason: "Explicit request for list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.LIST } },
  { pattern: /\bbullet points\b/i, reason: "Explicit request for bullet point list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'List', listSubType: OUTPUT_FORMAT_KEYWORDS_MAP.BULLET_LIST } },
  { pattern: /\bnumbered list\b/i, reason: "Explicit request for numbered list output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: 'List', listSubType: OUTPUT_FORMAT_KEYWORDS_MAP.NUMBERED_LIST } },

  // --- Plain Text Formats ---
  { pattern: /plain text/i, reason: "Explicit request for plain text output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.PLAIN_TEXT } },
  { pattern: /as plain text/i, reason: "Explicit request for plain text output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.PLAIN_TEXT } },

  // --- Code Formats ---
  { pattern: /\boutput as code\b/i, reason: "Explicit request for code output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.CODE } },
  { pattern: /\bprovide a script\b/i, reason: "Explicit request for script output.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.SCRIPT } },

  // --- Other potential formats ---
  { pattern: /\byaml format|as yaml\b/i, reason: "Explicit request for YAML output format.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.YAML } },
  { pattern: /\bhtml format|as html\b/i, reason: "Explicit request for HTML output format.", severity: SeverityLevel.INFO, metadata: { type: 'format', formatType: OUTPUT_FORMAT_KEYWORDS_MAP.HTML } },

];

// General constraint-indicating patterns (broader, less specific)
export const GENERAL_CONSTRAINT_PATTERNS: PatternWithMetadata[] = [
  { pattern: /\b(must (?:not )?be|must (?:not )?include|should (?:not )?be|should (?:not )?contain)\b/gi, reason: "General constraint keyword detected.", severity: SeverityLevel.LOW },
  { pattern: /\b(ensure (?:that|to|it is|it's))\b/gi, reason: "Instruction to ensure a condition.", severity: SeverityLevel.LOW },
  { pattern: /\b(limited to|restricted to)\b/gi, reason: "Phrase indicating a limitation or restriction.", severity: SeverityLevel.LOW },
  { pattern: /\b(at least|no more than|up to|minimum of|maximum of)\b/gi, reason: "Quantitative constraint phrase.", severity: SeverityLevel.LOW },
  { pattern: /\b(required to|requirement is|needs to)\b/gi, reason: "Phrase indicating a requirement.", severity: SeverityLevel.LOW },
  { pattern: /\b(constraint|constraints|must not|do not|don't|avoid|except for|only include|ensure that)\b/gi, reason: "Explicit constraint or boundary condition.", severity: SeverityLevel.HIGH },
  { pattern: /\b(without mentioning|excluding)\b/gi, reason: "Negative constraint specifying content to exclude.", severity: SeverityLevel.MEDIUM },
];

/**
 * Defines a list of action verbs that typically imply a complex, multi-step task,
 * even if the prompt is short. This helps differentiate simple commands from
 * deceptively complex ones.
 */
export const COMPLEX_ACTION_VERBS: Readonly<string[]> = [
  'generate',
  'create',
  'design',
  'develop',
  'build',
  'plan',
  'write a campaign',
  'draft',
  'outline',
  'compose'
];


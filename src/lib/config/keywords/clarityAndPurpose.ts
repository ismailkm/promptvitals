// --- Example Instruction Patterns (for Specificity/Detail Scope) ---
import { EXAMPLE_TYPE } from '@/lib/types/metadataTypes';
import { PatternWithMetadata } from '@/lib/types/patterns'; 
import { SeverityLevel } from '@/lib/types/shared';

export const VAGUE_TERMS_PATTERNS: PatternWithMetadata[] = [
  // --- SEVERE VAGUENESS: Generic Nouns & Placeholders (High Impact) ---
  { pattern: /\b(thing|things|stuff)\b/gi, reason: "Uses a highly generic noun that lacks any specific meaning.", severity: SeverityLevel.HIGH, metadata: { type: 'vagueness', listSubType: 'generic_noun', formatType: 'text' } },
  { pattern: /\b(something|anything|everything|etc|and so on)\b/gi, reason: "Uses a non-specific placeholder instead of providing details.", severity: SeverityLevel.MEDIUM, metadata: { type: 'vagueness', listSubType: 'placeholder', formatType: 'text' } },

  // --- MODERATE VAGUENESS: Ambiguous References & Unquantified Qualifiers ---
  { pattern: /\babout (it|this|that|them)\b/gi, reason: "Uses an ambiguous pronoun reference that can lead to misinterpretation.", severity: SeverityLevel.MEDIUM, metadata: { type: 'vagueness', listSubType: 'ambiguous_pronoun', formatType: 'text' } },
  { pattern: /\b(good|bad|nice|better|worse|interesting|significant)(?!\s+performance)\b/gi, reason: "Uses a subjective, unquantified adjective. Define what 'good' or 'effective' means in this context.", severity: SeverityLevel.MEDIUM, metadata: { type: 'vagueness', listSubType: 'unquantified_qualifier', formatType: 'text' } },
  // MODERN ADJUSTMENT: Reduced severity for "effective" in professional contexts
  { pattern: /\beffective\b/gi, reason: "Uses 'effective' without quantification. In professional contexts, this may be acceptable if domain expertise is implied.", severity: SeverityLevel.LOW, metadata: { type: 'vagueness', listSubType: 'unquantified_qualifier', formatType: 'text' } },
  { pattern: /\b(some kind of|a type of|a variety of)\b/gi, reason: "Uses a phrase that signals a lack of clarity or definition.", severity: SeverityLevel.MEDIUM, metadata: { type: 'vagueness', listSubType: 'indefinite_phrase', formatType: 'text' } },
  
  // --- LOW VAGUENESS: Imprecise Quantifiers & Filler Words ---
  { pattern: /\b(some|many|various|several|few|multiple|different|other|another|a number of|a couple of)\b/gi, reason: "Uses an imprecise quantifier. Consider using a specific number or range.", severity: SeverityLevel.LOW, metadata: { type: 'vagueness', listSubType: 'imprecise_quantifier', formatType: 'text' } },
  // MODERN ADJUSTMENT: Reduced severity for professional domain terms
  { pattern: /\b(aspects|factors|elements|issues|considerations|perspectives)\b/gi, reason: "Uses a generic plural noun. In professional contexts, these may be acceptable when referring to established frameworks.", severity: SeverityLevel.LOW, metadata: { type: 'vagueness', listSubType: 'generic_plural', formatType: 'text' } },
  { pattern: /\b(basically|actually|really|very|quite|rather|fairly|a bit|a lot|mostly|somewhat|maybe|perhaps|probably)\b/gi, reason: "Uses a filler or qualifier word that can weaken the prompt's directness.", severity: SeverityLevel.LOW, metadata: { type: 'vagueness', listSubType: 'filler_word', formatType: 'text' } },

  // --- CONTEXTUAL VAGUENESS: Only flag when truly vague ---
  // Refined: Only flag broad topics when used with vague qualifiers
  { 
    pattern: /\b(business|history|science|art|music|health|technology|sports|food|travel|nature|animals|cars|movies|books|politics)\s+(in\s+general|broadly|overall|stuff|things|whatever|anything)\b/gi,
    reason: "Uses a broad topic with vague qualifiers like 'in general' or 'broadly'.",
    severity: SeverityLevel.MEDIUM,
    metadata: { type: 'vagueness', listSubType: 'generic_topic_vague', formatType: 'text' }
  },
  // Refined: Only flag when used as standalone without context
  { 
    pattern: /^(write about|tell me about|explain|discuss)\s+(business|history|science|art|music|health|technology|sports|food|travel|nature|animals|cars|movies|books|politics)\.?\s*$/gi,
    reason: "Uses a broad topic as the entire prompt without specific focus or constraints.",
    severity: SeverityLevel.HIGH,
    metadata: { type: 'vagueness', listSubType: 'generic_topic_standalone', formatType: 'text' }
  },
  
  // --- PROFESSIONAL DOMAIN TERMS (Removed from vague flagging) ---
  // These are legitimate professional terms that should NOT be flagged as vague
  // Moved to whitelist for context-aware filtering
];

export const JARGON_PATTERNS: PatternWithMetadata[] = [
  // --- Business & Marketing Jargon ---
  { pattern: /\b(KPI|ROI|QoQ|YoY)\b/g, reason: "Common business acronym. Ensure it's defined or clear from context.", severity: SeverityLevel.LOW, metadata: { type: 'jargon', listSubType: 'Business Acronym', formatType: 'text' } },
  { pattern: /\b(synergy|synergistic|value-add|paradigm shift|leverage)\b/gi, reason: "Corporate buzzword. Prefer simpler, more direct language.", severity: SeverityLevel.MEDIUM, metadata: { type: 'jargon', listSubType: 'Corporate Buzzword', formatType: 'text' } },
  { pattern: /\b(B2B|B2C|SME|SMB)\b/g, reason: "Marketing acronym. Ensure the target audience is clear.", severity: SeverityLevel.LOW, metadata: { type: 'jargon', listSubType: 'Marketing Acronym', formatType: 'text' } },

  // --- Technology & Software Jargon ---
  { pattern: /\b(API|SDK|UI|UX|MVP|PWA)\b/g, reason: "Common tech acronym. Ensure its use is clear within the prompt's context.", severity: SeverityLevel.LOW, metadata: { type: 'jargon', listSubType: 'Tech Acronym', formatType: 'text' } },
  { pattern: /\b(SaaS|PaaS|IaaS)\b/g, reason: "Cloud computing model. Best to specify what kind of service you mean.", severity: SeverityLevel.LOW, metadata: { type: 'jargon', listSubType: 'Cloud Computing', formatType: 'text' } },
  { pattern: /\b(blockchain|crypto|NFT)\b/gi, reason: "Web3/Crypto term. Often used broadly; specify the exact application or context.", severity: SeverityLevel.MEDIUM, metadata: { type: 'jargon', listSubType: 'Web3', formatType: 'text' } },
  { pattern: /\b(machine learning|deep learning|neural network)\b/gi, reason: "AI/ML term. Can be broad; specify the model type or task if possible.", severity: SeverityLevel.LOW, metadata: { type: 'jargon', listSubType: 'AI/ML', formatType: 'text' } },

  // --- Methodology & Process Jargon ---
  { pattern: /\b(DevOps|Agile|Scrum|Kanban|Waterfall)\b/gi, reason: "Specific development methodology. Ensure context is provided.", severity: SeverityLevel.LOW, metadata: { type: 'jargon', listSubType: 'Methodology', formatType: 'text' } },

  // --- Domain-Specific Jargon (Examples) ---
  { pattern: /\b(Flesch-Kincaid|Gunning fog|ARI)\b/gi, reason: "Specific readability index. Jargon if the audience is not specialized in linguistics.", severity: SeverityLevel.MEDIUM, metadata: { type: 'jargon', listSubType: 'Linguistics', formatType: 'text' } },
  // Add more domain-specific jargon for finance, legal, medical, etc. as needed
];

// --- Specificity / Audience & Goal ---
export const AUDIENCE_DEFINITION_PATTERNS: PatternWithMetadata[] = [
  // --- TIER 1: High-Confidence, Explicit Labels ---
  { pattern: /\b(target audience|audience is|intended for|for an audience of|the user is a)\b/gi, reason: "Explicit audience definition label.", severity: SeverityLevel.HIGH },

  // --- TIER 2: High-Confidence Verbs & Phrases ---
  { pattern: /\b(targets|targeting|tailor for|write for|address this to)\b/gi, reason: "Action verb indicating a specific audience.", severity: SeverityLevel.HIGH },
  { pattern: /\b(explain this to a|explain it to me like I'm|as if you were speaking to)\b/gi, reason: "Comparative phrase defining audience understanding.", severity: SeverityLevel.HIGH },
  
  // --- TIER 3: Medium-Confidence Heuristics (Grammatical Patterns) ---
  // Matches "for" + [adjective(s)] + [demographic noun]
  // e.g., "for wealthy students", "for non-technical beginners", "for skeptical investors"
  { 
    pattern: /\bfor\s+((?:[a-zA-Z-]+\s+){0,2}(?:students|users|customers|clients|investors|professionals|beginners|experts|children|adults|executives|managers|developers|patients|readers|the general public))\b/gi, 
    reason: "Grammatical pattern 'for [description] [demographic]' detected.", 
    severity: SeverityLevel.MEDIUM 
  },

  // --- TIER 4: Lower-Confidence Role Keywords (Can be ambiguous) ---
  { pattern: /\b(students?|teachers?|academics?|researchers?)\b/gi, reason: "Audience role: Academic/Educational.", severity: SeverityLevel.LOW },
  { pattern: /\b(managers?|executives?|stakeholders?|investors?)\b/gi, reason: "Audience role: Business/Financial.", severity: SeverityLevel.LOW },
  { pattern: /\b(developers?|engineers?|programmers?|analysts?)\b/gi, reason: "Audience role: Technical.", severity: SeverityLevel.LOW },
  { pattern: /\b(kids|children|teenagers?|seniors?)\b/gi, reason: "Audience role: Age Demographic.", severity: SeverityLevel.LOW },
];

export const EXPLICIT_GOAL_PATTERNS: PatternWithMetadata[] = [
  { pattern: /\b(my goal is to|the objective is|i want you to achieve|the aim is|the primary task is to|your task is to)\b/gi, reason: "Explicit statement of goal or objective.", severity: SeverityLevel.LOW },
  { pattern: /\b(the purpose of this prompt is|i need you to help me with)\b/gi, reason: "Statement of purpose or need.", severity: SeverityLevel.LOW },
  { pattern: /\byour objective:\s*/gi, reason: "Direct objective statement using modern prompt structure.", severity: SeverityLevel.LOW },
  { pattern: /\b(your goal is to|your mission is to|your role is to)\b/gi, reason: "Clear role/goal assignment in professional prompts.", severity: SeverityLevel.LOW },
  { pattern: /\bfollow this step-by-step structure:\s*/gi, reason: "Structured approach indicator showing clear goal organization.", severity: SeverityLevel.LOW },
  { pattern: /\bstep \d+:/gi, reason: "Numbered step structure indicating systematic goal breakdown.", severity: SeverityLevel.LOW },
];

// --- Context & Content Richness ---
export const CONTEXT_INDICATOR_PATTERNS: PatternWithMetadata[] = [
  // Explicit section markers
  { pattern: /\b(background|context|situation|scenario|environment|setting):\s/gi, reason: "Explicit context section marker", severity: SeverityLevel.LOW },
  
  // Context introduction phrases
  { pattern: /\b(for context|for reference|for background|to provide context)\b/gi, reason: "Context introduction phrase", severity: SeverityLevel.LOW },
  { pattern: /\b(given that|assuming that|considering that|in the case where)\b/gi, reason: "Contextual premise indicator", severity: SeverityLevel.LOW },
  
  // Current state indicators
  { pattern: /\b(currently|at present|as of now|right now)\b/gi, reason: "Current state indicator", severity: SeverityLevel.LOW },
  { pattern: /\b(the (current|present|existing) (situation|state|condition|setup) is)\b/gi, reason: "Current state description", severity: SeverityLevel.LOW },
  
  // Temporal context
  { pattern: /\b(previously|until now|so far|up to this point)\b/gi, reason: "Temporal context indicator", severity: SeverityLevel.LOW },
  { pattern: /\b(after|before|during|while|when)\b .{10,}/gi, reason: "Temporal relationship indicator", severity: SeverityLevel.LOW },
  
  // System/Environment context
  { pattern: /\b(system|platform|environment|framework) (is|uses|consists of|includes)\b/gi, reason: "System context indicator", severity: SeverityLevel.LOW },
  { pattern: /\b(running on|deployed (in|to)|installed (in|on))\b/gi, reason: "Technical environment indicator", severity: SeverityLevel.LOW },
  
  // Requirements/Constraints context
  { pattern: /\b(requirements?|constraints?|limitations?|restrictions?) (include|are|is):/gi, reason: "Requirements context indicator", severity: SeverityLevel.LOW },
  { pattern: /\bmust (be|have|comply with|follow)\b/gi, reason: "Constraint indicator", severity: SeverityLevel.LOW },
  
  // User/Audience context
  { pattern: /\b(target audience|users?|stakeholders?) (is|are|includes?|consists? of)\b/gi, reason: "User context indicator", severity: SeverityLevel.LOW },
  { pattern: /\b(intended|expected|typical) (users?|audience|readers?)\b/gi, reason: "Audience context indicator", severity: SeverityLevel.LOW },
  
  // Project/Domain context
  { pattern: /\b(project|domain|field|industry|sector) (is|involves|concerns)\b/gi, reason: "Domain context indicator", severity: SeverityLevel.LOW },
  { pattern: /\bin the context of\b/gi, reason: "Explicit context reference", severity: SeverityLevel.LOW },
  
  // Data/Input context
  { pattern: /\b(input|data|information) (provided|available|given) (is|are|includes?):/gi, reason: "Data context indicator", severity: SeverityLevel.LOW },
  { pattern: /\bbased on (the following|this) (data|information|input)\b/gi, reason: "Input context indicator", severity: SeverityLevel.LOW }
];

// --- PROFESSIONAL TERMS WHITELIST (Should NOT be flagged as vague) ---
export const PROFESSIONAL_TERMS_WHITELIST: string[] = [
  // Domain expertise terms
  'strategy', 'strategic', 'implementation', 'evaluation', 'assessment', 'framework', 'methodology', 'approach', 'process', 'system', 'stakeholder', 'engagement',
  // Expert qualifiers
  'expert', 'professional', 'specialist', 'communications', 'public health', 'digital native', 'comprehensive', 'systematic', 'evidence-based',
  // Clear topic modifiers
  'public health', 'health communications', 'digital marketing', 'content strategy', 'user experience', 'data science', 'software engineering',
  // Professional contexts
  'campaign', 'audience', 'target', 'demographic', 'stakeholders', 'deliverables', 'objectives', 'constraints', 'requirements'
];

// --- DOMAIN-SPECIFIC CONTEXT INDICATORS ---
export const DOMAIN_CONTEXT_PATTERNS: PatternWithMetadata[] = [
  { pattern: /\b(expert|professional|specialist|strategist|consultant)\s+(in|for|at)\b/gi, reason: "Expert context indicator", severity: SeverityLevel.INFO, metadata: { type: 'vagueness', listSubType: 'expertise_context', formatType: 'text' } },
  { pattern: /\b(public\s+health|health\s+communications|digital\s+marketing|content\s+strategy|user\s+experience|data\s+science|software\s+engineering|communications|digital\s+native)\b/gi, reason: "Specific domain context", severity: SeverityLevel.INFO, metadata: { type: 'vagueness', listSubType: 'domain_context', formatType: 'text' } },
  { pattern: /\b(strategy|strategic|implementation|evaluation|assessment|framework|methodology|approach|process|system|stakeholder|engagement|campaign|audience|target|demographic|deliverables|objectives|constraints|requirements)\b/gi, reason: "Professional project context", severity: SeverityLevel.INFO, metadata: { type: 'vagueness', listSubType: 'project_context', formatType: 'text' } }
];

// Patterns for instructions to provide examples (not explicit examples)
export const EXAMPLE_INSTRUCTION_PATTERNS: PatternWithMetadata[] = [
  { pattern: /\b(embed|include|provide|show|use|give|add)\b[\s\S]{0,40}\b(example|examples)\b/gi, reason: "Instruction to provide examples", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.INSTRUCTION } },
  { pattern: /\balways\s+embed\b[\s\S]{0,40}\b(example|examples)\b/gi, reason: "Strong instruction to always provide examples", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.INSTRUCTION } },
  { pattern: /\b(real[-\s]?world|practical|relevant|concrete|specific)\s+(example|examples)\b/gi, reason: "Instruction for a specific type of example", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.INSTRUCTION } },
  { pattern: /\b(example|examples)\s+where\s+(relevant|appropriate)\b/gi, reason: "Conditional instruction to provide examples", severity: SeverityLevel.INFO, metadata: { type: 'example', exampleType: EXAMPLE_TYPE.INSTRUCTION } }
];

/**
 * Canonical list of keywords indicating professional, expert, technical, business, and organizational context.
 * Used for context-aware detection in agents and utilities.
 * This list is intentionally broad to capture a wide range of professional settings and roles.
 */
export const PROFESSIONAL_CONTEXT_KEYWORDS: string[] = [
  // Core professional/expert roles
  'expert', 'professional', 'specialist', 'strategist', 'consultant',
  // Leadership & management
  'manager', 'executive', 'director', 'lead', 'advisor', 'analyst',
  // Project/organizational terms
  'initiative', 'program', 'project', 'operation', 'committee', 'board',
  // Business/consulting terms
  'client', 'partner', 'stakeholder', 'team', 'division', 'department',
  // Technical/professional terms
  'engineer', 'developer', 'designer', 'researcher', 'scientist', 'consultancy',
  // Context/setting terms
  'organization', 'enterprise', 'firm', 'agency', 'institution',
  // Communication/marketing
  'campaign', 'communications', 'marketing', 'audience',
  // Miscellaneous
  'committee', 'board', 'group', 'sector', 'industry', 'field'
];


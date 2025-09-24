// src/lib/config/keywords/safetyAndEthics.ts

import { PatternWithMetadata } from '@/lib/types/patterns';
import { SeverityLevel } from '@/lib/types/shared';
import { PATTERN_CATEGORIES, PatternCategory } from '@/lib/types/riskAssessment';

/**
 * This list identifies various forms of social bias, stereotypes, and discriminatory language.
 * Its purpose is to feed the `ethical-safety-bias-mitigation` KPI.
 */
export const POTENTIALLY_BIASED_TERMS_PATTERNS: PatternWithMetadata[] = [
  // Demographic Overgeneralizations
  { pattern: /\b(all|every|none of the) [a-zA-Z\s]+ (people|persons?) (are|is|will|would|tend to)\b/gi, reason: "Demographic overgeneralization detected.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.6, contextMultiplier: 1.2 } },
  { pattern: /\b(typical|usually|naturally|inherently|fundamentally) [a-zA-Z\s]+ (person|people|group|community) (is|are)\b/gi, reason: "Stereotypical characterization of a group.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.6, contextMultiplier: 1.2 } },

  // Exclusionary/Elitist/Discriminatory Language
  { pattern: /\bonly\s+(wealthy|rich|privileged|smartest|elite|top-performing|gifted|best|most intelligent|high-achieving)\s+(students|people|individuals|applicants|users|members)\b/gi, reason: "Exclusionary or elitist targeting of a group.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DISCRIMINATORY_LANGUAGE, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\bexclude(s|d)?\s+(low-income|poor|underprivileged|disadvantaged|minority|disabled|less intelligent|average|below average|struggling)\s+(students|people|individuals|applicants|users|members)\b/gi, reason: "Explicit exclusion of a group based on status or ability.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DISCRIMINATORY_LANGUAGE, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\bnot for\s+(low-income|poor|underprivileged|disadvantaged|minority|disabled|less intelligent|average|below average|struggling)\s+(students|people|individuals|applicants|users|members)\b/gi, reason: "Explicit denial of access to a group.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DISCRIMINATORY_LANGUAGE, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\b(deserve(s|d)?|entitled to|should have|should get) access (only )?to (the|these)?\s*(resources|opportunities|benefits|services|programs)\b/gi, reason: "Elitist or exclusionary access language.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DISCRIMINATORY_LANGUAGE, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\b(access|available|limited) (only )?to (the )?(smartest|wealthy|rich|privileged|elite|top-performing|gifted|best|most intelligent|high-achieving)\b/gi, reason: "Access limited to privileged or elite group.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DISCRIMINATORY_LANGUAGE, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\bnot available to (low-income|poor|underprivileged|disadvantaged|minority|disabled|less intelligent|average|below average|struggling)\b/gi, reason: "Denial of access to a group.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DISCRIMINATORY_LANGUAGE, baseScore: 0.9, contextMultiplier: 1.5 } },
    
  // Gender-based Stereotypes
  { pattern: /\b(all|most) (men|women) (are|should|want|need|prefer)\b/gi, reason: "Gender-based generalization.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.7, contextMultiplier: 1.3 } },
  { pattern: /\b(masculine|feminine) (traits?|characteristics?|behaviors?|roles?)\b/gi, reason: "Potential gender role stereotyping.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.6, contextMultiplier: 1.2 } },
  { pattern: /\b(women|men) (should|must|are expected to) (be|act|behave)\b/gi, reason: "Gender role expectation detected.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.7, contextMultiplier: 1.3 } },
  
  // Age-based Bias
  { pattern: /\b(old|young) people (can't|cannot|don't|do not|never|always)\b/gi, reason: "Age-based discrimination or stereotype.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.6, contextMultiplier: 1.1 } },
  { pattern: /\btoo (old|young) (for|to)\b/gi, reason: "Age-based limitation assumption.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.5, contextMultiplier: 1.1 } },

  // Racial and Skin Color Bias
  { pattern: /\b(all|most|typical) (black|white|brown|asian|hispanic|latino|african|caucasian) people (are|tend to|typically|usually|always|never)\b/gi, reason: "Racial generalization or stereotype.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RACIAL_ETHNIC_BIAS, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\b(dark|light|fair|pale) skinned people (are|tend to|usually|always|never)\b/gi, reason: "Skin color-based stereotype.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RACIAL_ETHNIC_BIAS, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\b(race|ethnicity|skin color) determines\b/gi, reason: "Racial determinism or essentialism.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RACIAL_ETHNIC_BIAS, baseScore: 0.9, contextMultiplier: 1.5 } },
  { pattern: /\b(racial|ethnic) (superiority|inferiority|hierarchy)\b/gi, reason: "Racial supremacy or hierarchical language.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.RACIAL_ETHNIC_BIAS, baseScore: 0.95, contextMultiplier: 1.5 } },
  { pattern: /\b(naturally|inherently|genetically) (gifted|talented|skilled|inclined|predisposed) (race|ethnicity)\b/gi, reason: "Racial biological determinism.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RACIAL_ETHNIC_BIAS, baseScore: 0.9, contextMultiplier: 1.5 } },

  // Cultural/Ethnic/Religious Stereotypes
  { pattern: /\b(people|individuals) from [a-zA-Z\s]+ (culture|country|region|religion|faith) (always|typically|usually|naturally)\b/gi, reason: "Cultural/ethnic/religious stereotype detected.", severity: SeverityLevel.HIGH, metadata: {category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.8, contextMultiplier: 1.4 } },
  { pattern: /\b(these|those) people (tend to|usually|always|never)\b/gi, reason: "Potentially othering language.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.BIASED_GENERALIZATION, baseScore: 0.6, contextMultiplier: 1.2 } },
  { pattern: /\b(all|most) (muslims?|christians?|jews?|buddhists?|hindus?|sikhs?|atheists?) (are|will|would|tend to|always|never)\b/gi, reason: "Religious group generalization.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RELIGIOUS_BIAS, baseScore: 0.8, contextMultiplier: 1.4 } },
  { pattern: /\b(typical|usually|naturally|inherently|fundamentally) [a-zA-Z\s]+ (believer|follower|practitioner|religious person)\b/gi, reason: "Religious stereotype detected.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RELIGIOUS_BIAS, baseScore: 0.75, contextMultiplier: 1.3 } },
  { pattern: /\b(religion|faith) makes people\b/gi, reason: "Oversimplified religious causation.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RELIGIOUS_BIAS, baseScore: 0.7, contextMultiplier: 1.3 } },
  { pattern: /\b(radical|extremist|fundamentalist) [a-zA-Z\s]+ (religion|faith|belief)\b/gi, reason: "Potentially inflammatory religious terminology.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.RELIGIOUS_BIAS, baseScore: 0.85, contextMultiplier: 1.5 } },
  { pattern: /\b(terrorist|extremist|radical) (group|organization|movement) (is|are)\b/gi, reason: "Potentially inflammatory religious group terminology.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.RELIGIOUS_BIAS, baseScore: 0.9, contextMultiplier: 1.5 } },
  
  // Socioeconomic Bias
  { pattern: /\b(poor|rich|wealthy|low-income) people (are|tend to be|usually|always)\b/gi, reason: "Socioeconomic stereotype.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.SOCIOECONOMIC_BIAS, baseScore: 0.65, contextMultiplier: 1.2 } },
  { pattern: /\b(educated|uneducated) people (are|tend to be|usually|always)\b/gi, reason: "Educational bias detected.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.SOCIOECONOMIC_BIAS, baseScore: 0.65, contextMultiplier: 1.2 } },
  { pattern: /\b(working class|middle class|upper class) (people|individuals) (are|tend to be|usually)\b/gi, reason: "Class-based stereotype.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.SOCIOECONOMIC_BIAS, baseScore: 0.7, contextMultiplier: 1.3 } },

  // Ability/Disability Bias
  { pattern: /\b(disabled|handicapped) people (can't|cannot|are unable)\b/gi, reason: "Disability-based limitation assumption.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.ABILITY_BIAS, baseScore: 0.8, contextMultiplier: 1.4 } },
  { pattern: /\b(normal|abnormal) people\b/gi, reason: "Problematic normative language.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.ABILITY_BIAS, baseScore: 0.75, contextMultiplier: 1.3 } },
];

/**
 * This list ONLY detects requests for unauthorized access, privilege escalation, or system control.
 * It answers the question: "Is the user trying to make the AI act like a system administrator?"
 */
export const HIGH_PRIVILEGE_PHRASES_PATTERNS: PatternWithMetadata[] = [
  { pattern: /(?:grant|give|provide)\s+(?:me|us|the user)\s+(?:full|admin|root|system|sudo)\s+(?:access|privileges|rights)/i, reason: "Request for elevated system privileges.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.9, contextMultiplier: 1.2 } },
  { pattern: /(?:enable|activate)\s+(?:full|admin|root|system|privileged)\s+mode/i, reason: "Attempt to enable an administrative mode.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.9, contextMultiplier: 1.2 } },
  { pattern: /(?:escalate|elevate|increase)\s+(?:my|your|the)?\s*(?:privileges|permissions|access\s*rights)/i, reason: "Direct attempt to escalate privileges.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.9, contextMultiplier: 1.2 } },
  { pattern: /(?:become|act as|impersonate)\s+(?:an?|the)?\s*(?:admin|administrator|root|superuser)/i, reason: "Attempt to assume an administrative role.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.9, contextMultiplier: 1.2 } },
  { pattern: /(?:take|assume|gain)\s+(?:full)?\s*control of/i, reason: "Attempt to gain system control.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.95, contextMultiplier: 1.3 } },
  { pattern: /(?:execute|run|perform)\s+(?:system|privileged|admin|shell)\s+commands?/i, reason: "Attempt to execute privileged system commands.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.95, contextMultiplier: 1.3 } },
  { pattern: /(?:modify|change|update)\s+(?:your|the)?\s*(?:system|core|base)\s*(?:settings|configuration|parameters)/i, reason: "Attempt to alter system configuration.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.9, contextMultiplier: 1.2 } },
  { pattern: /(?:reset|restore|revert)\s+(?:to|your|its)\s+(?:default|initial|original)\s*(?:state|settings|configuration)/i, reason: "Attempt to reset or alter system state.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.PRIVILEGE_ESCALATION, baseScore: 0.8, contextMultiplier: 1.1 } },
  { pattern: /(?:show|give|reveal|tell|share)\s+(?:me|us)\s+(?:your|the)?\s*(?:source code|implementation|internals|api keys?|passwords?)/i, reason: "Attempt to extract source code or secrets.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_EXFILTRATION, baseScore: 0.95, contextMultiplier: 1.3 } },
  { pattern: /reveal your (?:initial|system|core|configuration|base|secret|internal) prompt/i, reason: "Attempt to extract confidential system prompts.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_EXFILTRATION, baseScore: 0.9, contextMultiplier: 1.2 } },
  { pattern: /what (?:are|were) your (?:instructions|directives|training|guidelines)/i, reason: "Potential attempt to elicit system prompt.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.DATA_EXFILTRATION, baseScore: 0.8, contextMultiplier: 1.1 } },
];

/**
 * This list ONLY detects classic prompt injection, security bypasses, and explicit requests for harmful content.
 * It answers the question: "Is the user trying to break the AI's rules or make it do something dangerous?"
 */
export const TIER1_MALICIOUS_PATTERNS: PatternWithMetadata[] = [
  { pattern: /ignore(?:\s+all)?\s+previous instructions/i, reason: "Classic prompt injection: attempt to override prior instructions.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.INJECTION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /disregard your initial programming/i, reason: "Prompt injection: attempt to make AI forget its core programming.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.INJECTION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /forget all rules/i, reason: "Prompt injection: attempt to make AI ignore all constraints.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.INJECTION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /override your (?:policy|policies)/i, reason: "Prompt injection: direct attempt to bypass policies.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.INJECTION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /bypass(?:\s+all)?\s+(?:security|authentication|verification|protocols?|filters?|safeguards?)/i, reason: "Security bypass: direct attempt to bypass security measures.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.BYPASS, baseScore: 0.95, contextMultiplier: 1.3 } },
  { pattern: /ignore(?:\s+all)?\s+(?:the|any|your)?\s*(?:safety|security|ethical|content)\s*(?:guidelines|rules|protocols?|filters?|policy|policies|restrictions)/i, reason: "Security bypass: attempt to ignore safety/ethical guidelines.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.BYPASS, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /(?:disable|turn off|deactivate)(?:\s+all)?\s+(?:the|any|your)?\s*(?:safety|security|ethical|content)\s*(?:features|guidelines|rules|protocols?|filters?|safeguards?|checks?)/i, reason: "Security bypass: request to disable safety or security measures.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.BYPASS, baseScore: 0.95, contextMultiplier: 1.3 } },
  { pattern: /turn\s+(?:safety|security|protection|safeguards?)\s+off/i, reason: "Security bypass: alternate phrasing to disable security.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.BYPASS, baseScore: 0.95, contextMultiplier: 1.3 } },
  { pattern: /\b(hack|hacking|crack|cracking)\b/gi, reason: "Malicious content: Describes or requests hacking or cracking activities.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.MALICIOUS_CONTENT, baseScore: 0.95, contextMultiplier: 1.1 } },
  { pattern: /how to\s+(?:build|create|make)\s+(?:a)?\s*(?:bomb|virus|malware|phishing|ransomware)/i, reason: "Malicious content: Requesting instructions for creating harmful items.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.MALICIOUS_CONTENT, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /\b(step-by-step guide|instructions) on how to (hack|phish|scam)/i, reason: "Malicious content: Explicit request for illegal activity instructions.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.MALICIOUS_CONTENT, baseScore: 1.0, contextMultiplier: 1.0 } },
];

/**
 * This list detects more subtle, suspicious, or contextual attempts at jailbreaking or manipulation.
 * It primarily focuses on known jailbreak phrases and roleplay manipulation.
 */
export const TIER2_SUSPICIOUS_PATTERNS: PatternWithMetadata[] = [
  { pattern: /you are now in developer mode/i, reason: "Common trigger for jailbreak/developer mode exploits.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.JAILBREAK_ATTEMPT, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /you are no longer an ai/i, reason: "Attempt to make AI break character/constraints.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.JAILBREAK_ATTEMPT, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /enter unrestricted mode/i, reason: "Attempt to enable unrestricted operation mode.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.JAILBREAK_ATTEMPT, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /you are now (unrestricted|unbound|free)/i, reason: "Attempt to remove operational constraints.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.JAILBREAK_ATTEMPT, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /pretend you are DAN/i, reason: "Known jailbreak persona 'Do Anything Now'.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.JAILBREAK_ATTEMPT, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /act as if you have no filters/i, reason: "Explicit request to remove safety filters.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.JAILBREAK_ATTEMPT, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /let's play a game where you/i, reason: "Potential roleplay-based manipulation.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.ROLEPLAY_MANIPULATION, baseScore: 0.6, contextMultiplier: 1.1 } },
  { pattern: /imagine you are not bound by/i, reason: "Attempt to bypass restrictions through roleplay.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.ROLEPLAY_MANIPULATION, baseScore: 0.6, contextMultiplier: 1.1 } },
  { pattern: /we're just having a hypothetical discussion/i, reason: "Attempt to bypass restrictions via hypothetical scenarios.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.ROLEPLAY_MANIPULATION, baseScore: 0.6, contextMultiplier: 1.1 } },
  { pattern: /for educational purposes only/i, reason: "Potential attempt to legitimize harmful requests.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.ROLEPLAY_MANIPULATION, baseScore: 0.6, contextMultiplier: 1.1 } },
];

/**
 * NOTE: The TIER3_CONTEXTUAL_PATTERNS list is being deprecated and its patterns merged into TIER2_SUSPICIOUS for simplicity.
 * This file can be removed if no longer referenced elsewhere after refactoring.
 */
export const TIER3_CONTEXTUAL_PATTERNS: PatternWithMetadata[] = []; // Deprecated - patterns moved

/**
 * NOTE: The RESTRICTED_KEYWORDS_PATTERNS list is being deprecated as its patterns are more specifically categorized in other lists.
 * This file can be removed if no longer referenced elsewhere after refactoring.
 */
export const RESTRICTED_KEYWORDS_PATTERNS: PatternWithMetadata[] = []; // Deprecated - patterns moved

/**
 * This list ONLY detects unethical social manipulation and deception.
 * It answers the question: "Is the user trying to make the AI produce manipulative or deceptive content?"
 */
export const MANIPULATION_PATTERNS: PatternWithMetadata[] = [
  { pattern: /use psychological tricks to/i, reason: "Explicit request for psychological manipulation.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_MANIPULATION, baseScore: 0.9, contextMultiplier: 1.3 } },
  { pattern: /exploit their weaknesses/i, reason: "Explicit attempt to exploit vulnerabilities.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_MANIPULATION, baseScore: 0.95, contextMultiplier: 1.4 } },
  { pattern: /manipulate their emotions/i, reason: "Attempt to manipulate emotions for unethical purposes.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_MANIPULATION, baseScore: 0.9, contextMultiplier: 1.3 } },
  { pattern: /\b(psychological tricks|manipulate|exploit)\b/gi, reason: "Requests the use of manipulative techniques.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_MANIPULATION, baseScore: 0.8, contextMultiplier: 1.3 } },
  { pattern: /\b(downplay|omit|avoid mentioning|hide|do not mention) (the )?(risks|dangers|downsides|negatives|health risks|side effects)\b/gi, reason: "Instruction to deceptively omit risks.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_MANIPULATION, baseScore: 0.9, contextMultiplier: 1.2 } },
];

/**
 * This list ONLY detects unethical coercion and pressure tactics.
 * It answers the question: "Is the user trying to make the AI produce content that pressures people?"
 */
export const COERCION_PATTERNS: PatternWithMetadata[] = [
  { pattern: /pressure them into/i, reason: "Attempt to coerce or pressure individuals.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_COERCION, baseScore: 0.8, contextMultiplier: 1.2 } },
  { pattern: /create a sense of urgency to/i, reason: "Use of urgency as a coercive tactic.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_COERCION, baseScore: 0.7, contextMultiplier: 1.2 } },
  { pattern: /\b(coerce)\b/gi, reason: "Requests the use of coercive techniques.", severity: SeverityLevel.HIGH, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_COERCION, baseScore: 0.8, contextMultiplier: 1.3 } },
  { pattern: /\b(maximize desire|create a sense of urgency|induce FOMO)\b/gi, reason: "Requests techniques designed to bypass rational decision-making.", severity: SeverityLevel.MEDIUM, metadata: { category: PATTERN_CATEGORIES.UNETHICAL_COERCION, baseScore: 0.6, contextMultiplier: 1.2 } },
];


/**
 * This list detects requests for actions that violate data privacy,
 * such as non-consensual collection or sharing of personal information.
 */
export const PRIVACY_VIOLATION_PATTERNS: PatternWithMetadata[] = [
  { pattern: /(collect|gather|obtain|scrape|acquire|harvest|extract)[\s\S]{0,120}(without\s+consent|without\s+permission|secretly|without their knowledge|without informing|without notification)/gi, reason: "Detects the concept of 'getting data' combined with 'lack of consent'.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /(share|sell|distribute|leak|transfer|send|provide|expose)[\s\S]{0,120}(without\s+consent|without\s+permission|to\s+third\s+parties|with\s+third\s+parties|external\s+entities|external\s+organizations|external\s+companies|marketing|advertisers?)/gi, reason: "Detects the concept of 'sharing data' combined with 'lack of consent', 'third parties', or marketing.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /(collect|gather|obtain|scrape|acquire|harvest|extract)[\s\S]{0,120}(without\s+consent|without\s+permission|secretly|without their knowledge)[\s\S]{0,120}(share|sell|distribute|leak|transfer|send|provide|expose)[\s\S]{0,120}(third\s+parties|marketing|external\s+entities|external\s+organizations|external\s+companies|advertisers?)/gi, reason: "Detects multi-step privacy violations: collect without consent and share with third parties or for marketing.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /non-consensual\s+data\s+(collection|sharing|gathering|processing|disclosure)/i, reason: "Explicit use of 'non-consensual' in a privacy context.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /violate\s+(data\s+)?privacy|privacy\s+violation|privacy\s+breach|breach\s+of\s+privacy/i, reason: "Explicit mention of violating or breaching privacy.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /(access|view|read|monitor|track|log|record)[\s\S]{0,120}(private|confidential|personal|sensitive)[\s\S]{0,120}(data|information|details|records|files|messages|communications)[\s\S]{0,120}(without\s+consent|without\s+permission|secretly|without their knowledge|without informing|without notification)/gi, reason: "Detects unauthorized access to private or sensitive data.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /(store|save|retain|archive)[\s\S]{0,120}(personal|private|confidential|sensitive)[\s\S]{0,120}(data|information|details|records|files|messages|communications)[\s\S]{0,120}(without\s+consent|without\s+permission|secretly|without their knowledge|without informing|without notification)/gi, reason: "Detects unauthorized storage of private or sensitive data.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /(process|analyze|use|utilize)[\s\S]{0,120}(personal|private|confidential|sensitive)[\s\S]{0,120}(data|information|details|records|files|messages|communications)[\s\S]{0,120}(without\s+consent|without\s+permission|secretly|without their knowledge|without informing|without notification)/gi, reason: "Detects unauthorized processing or use of private or sensitive data.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DATA_PRIVACY_VIOLATION, baseScore: 1.0, contextMultiplier: 1.0 } }
];

/**
 * This list detects patterns that encourage or provide instructions for
 * dangerous, illegal, or unethical real-world behavior.
 */
export const DANGEROUS_BEHAVIOR_PATTERNS: PatternWithMetadata[] = [
  { pattern: /\b(downplay|ignore|minimize|disregard|hide|omit)\b[\s\S]{0,50}\b(risks|dangers|safety concerns|negative effects|consequences)\b/gi, reason: "Detects instruction to downplay or disregard risks and dangers.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DANGEROUS_BEHAVIOR, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /\b(encourag(e|ing)|promot(e|ing)|a guide to|how to)\b[\s\S]{0,50}\b(self-harm|suicide|eating disorders|anorexia|bulimia|unsafe practices|dangerous challenges|unhealthy behavior)\b/gi, reason: "Detects promotion of self-harm or dangerous, unhealthy behaviors.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DANGEROUS_BEHAVIOR, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /\b(use|take|consume|inject|snort)\b[\s\S]{0,50}\b(unapproved supplements|illegal drugs|household chemicals|poisonous substances|controlled substances)\b/gi, reason: "Detects promotion or instruction for using unsafe or illegal substances.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DANGEROUS_BEHAVIOR, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /risks of not sleeping|dangers of being underweight|benefits of starvation/i, reason: "Detects specific, known harmful health misinformation topics.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DANGEROUS_BEHAVIOR, baseScore: 1.0, contextMultiplier: 1.0 } },
  { pattern: /how to\s+(?:commit|get away with)\s+(the crime of|fraud|theft|arson|assault|a crime)/i, reason: "Provides instructions for committing general illegal acts.", severity: SeverityLevel.CRITICAL, metadata: { category: PATTERN_CATEGORIES.DANGEROUS_BEHAVIOR, baseScore: 1.0, contextMultiplier: 1.0 } }
];
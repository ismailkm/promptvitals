/**
 * Utility functions for analyzing step markers and their content to determine
 * if they represent system/persona steps vs action steps.
 */

/**
 * Patterns that indicate a step is defining a persona/role rather than an action
 */
const PERSONA_DEFINITION_PATTERNS = [
  /define\s+the\s+(persona|role|character|identity)/i,
  /you\s+are\s+(a|an)\s+\w+/i,
  /act\s+as\s+(a|an)\s+\w+/i,
  /background\s*:\s*you/i,
  /role\s*:\s*you/i,
  /persona\s*:\s*/i,
  /ethical\s+compass/i,
  /your\s+expertise/i,
  /your\s+knowledge/i,
  /your\s+background/i,
  /you\s+specialize\s+in/i,
  /you\s+advise\s+on/i,
  /you\s+prioritize/i
];

/**
 * Patterns that indicate a step is defining system behavior/approach
 */
const SYSTEM_BEHAVIOR_PATTERNS = [
  /(outline|set|establish)\s+the\s+(core|main|primary)\s+(tasks|objectives|goals)/i,
  /(set|establish|define)\s+(clear\s+)?(goals|objectives|deliverables)/i,
  /integrate\s+(safety|security|ethical)/i,
  /structure\s+your\s+(outputs?|responses?)/i,
  /produce\s+a\s+(final|well-organized)/i,
  /ensure\s+(compliance|accuracy|security)/i,
  /develop\s+(clear|evidence-based)/i,
  /design\s+(strategic|communication)/i,
  /conduct\s+(stakeholder|audience)/i,
  /manage\s+communications/i,
  /train\s+(healthcare|staff)/i,
  /monitor\s+and\s+evaluate/i,
  /promote\s+(health|literacy)/i,
  /strengthen\s+(public|trust)/i,
  /ensure\s+(timely|accurate)/i,
  /increase\s+engagement/i,
  /protect\s+(patient|confidentiality)/i,
  /demonstrate\s+measurable/i,
  /include\s+protocols/i,
  /provide\s+accessible/i,
  /anticipate\s+ethical/i
];

/**
 * Analyzes step markers to determine if they primarily define persona/system behavior
 * vs actionable tasks
 */
export function analyzeStepContent(stepMarkers: any[]): {
  personaSteps: number;
  systemBehaviorSteps: number;
  actionSteps: number;
  totalSteps: number;
  isSystemPrompt: boolean;
  confidence: number;
} {
  let personaSteps = 0;
  let systemBehaviorSteps = 0;
  let actionSteps = 0;
  
  for (const marker of stepMarkers) {
    const text = typeof marker === 'string' ? marker : marker?.matchedText || '';
    
    const isPersonaStep = PERSONA_DEFINITION_PATTERNS.some(pattern => pattern.test(text));
    const isSystemStep = SYSTEM_BEHAVIOR_PATTERNS.some(pattern => pattern.test(text));
    
    if (isPersonaStep) {
      personaSteps++;
    } else if (isSystemStep) {
      systemBehaviorSteps++;
    } else {
      actionSteps++;
    }
  }
  
  const totalSteps = stepMarkers.length;
  const systemOrPersonaSteps = personaSteps + systemBehaviorSteps;
  
  // Consider it a system prompt if more than 50% of steps are persona/system related
  // (lowered from 60% to be more sensitive)
  const systemRatio = totalSteps > 0 ? systemOrPersonaSteps / totalSteps : 0;
  const isSystemPrompt = systemRatio > 0.5;
  
  // Confidence based on how clear the distinction is
  const confidence = Math.abs(systemRatio - 0.5) * 2; // 0 = ambiguous, 1 = very clear
  
  return {
    personaSteps,
    systemBehaviorSteps,
    actionSteps,
    totalSteps,
    isSystemPrompt,
    confidence
  };
}
import {
  DetectedPatternInfo,
  AllPatternMetadata,
  LengthConstraintPatternMetadata,
  ExamplePatternMetadata,
  ToneStylePatternMetadata,
} from "@/lib/types/patterns";

import { RiskAssessmentMetadata } from "@/lib/types/riskAssessment";

/**
 * Extracts valid pattern metadata from a DetectedPatternInfo, if present and well-formed.
 * Returns undefined if metadata is missing or malformed.
 * Supports all known pattern metadata types defined in types/patterns.ts.
 */
export function extractPatternMetadata(
  issue: DetectedPatternInfo
):
  | AllPatternMetadata
  | RiskAssessmentMetadata
  | LengthConstraintPatternMetadata
  | ExamplePatternMetadata
  | ToneStylePatternMetadata
  | undefined {
  
  // First try to get metadata from matchedPatternSource (if it's an object)
  const src = issue.matchedPatternSource;
  if (typeof src === "object" && src.metadata && typeof src.metadata === "object") {
    const meta = src.metadata as { type?: string };
    return extractMetadataByType(meta);
  }
  
  // Fallback: try to get metadata directly from the issue object
  if ((issue as any).metadata && typeof (issue as any).metadata === "object") {
    const meta = (issue as any).metadata as { type?: string };
    return extractMetadataByType(meta);
  }
  
  return undefined;
}

function extractMetadataByType(meta: { type?: string }):
  | AllPatternMetadata
  | RiskAssessmentMetadata
  | LengthConstraintPatternMetadata
  | ExamplePatternMetadata
  | ToneStylePatternMetadata
  | undefined {
  switch (meta.type) {
    case "format":
    case "vagueness":
    case "jargon":
      // AllPatternMetadata
      return meta as AllPatternMetadata;
    case "length_constraint":
      return meta as LengthConstraintPatternMetadata;
    case "example":
      return meta as ExamplePatternMetadata;
    case "tone_style":
      return meta as ToneStylePatternMetadata;
    case "risk_assessment":
      return meta as RiskAssessmentMetadata;
    default:
      return undefined;
  }
}


/**
 * Type guard to check if a metadata object is of a specific pattern metadata type (by discriminator).
 * Usage: isPatternMetadataOfType<AllPatternMetadata>(meta, 'vagueness')
 */
export function isPatternMetadataOfType<T extends { type: string }>(
  metadata: any,
  type: string
): metadata is T {
  return Boolean(metadata && typeof metadata === 'object' && 'type' in metadata && metadata.type === type);
}

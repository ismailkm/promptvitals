// src/lib/utils/safetyRisk.ts

import { RiskAssessmentLevel, SeverityLevel } from '@/lib/types/shared';
import { PATTERN_RISK_WEIGHTS, RISK_LEVEL_THRESHOLDS, PatternRiskCategory, SafetyRiskComputation, SEVERITY_HIERARCHY } from '@/lib/types/riskAssessment';
import { DetectedPatternInfo, PatternWithMetadata } from '@/lib/types/patterns';


const toRiskLevel = (score: number): RiskAssessmentLevel => {
  if (score <= RISK_LEVEL_THRESHOLDS.LOW) return RiskAssessmentLevel.LOW;
  if (score <= RISK_LEVEL_THRESHOLDS.MEDIUM) return RiskAssessmentLevel.MEDIUM;
  if (score <= RISK_LEVEL_THRESHOLDS.HIGH) return RiskAssessmentLevel.HIGH;
  return RiskAssessmentLevel.CRITICAL;
};

export const computeSafetyRisk = (detections: DetectedPatternInfo[] | undefined | null): SafetyRiskComputation => {
  const items = detections || [];
  const contributions: number[] = [];
  let highestSeverity: SeverityLevel | undefined;

  for (const item of items) {
    const src = (typeof item.matchedPatternSource === 'object') ? (item.matchedPatternSource as PatternWithMetadata) : null;
    const meta: any = src?.metadata;
    if (meta && typeof meta === 'object' && 'category' in meta && 'baseScore' in meta) {
      const cat = meta.category as PatternRiskCategory;
      const base = typeof meta.baseScore === 'number' ? meta.baseScore : 0;
      const mult = typeof meta.contextMultiplier === 'number' ? meta.contextMultiplier : 1;
      const w = (PATTERN_RISK_WEIGHTS as any)[cat] as number | undefined;
      const contribution = Math.max(0, Math.min(1, base * mult * (w ?? 0)));
      if (contribution > 0) contributions.push(contribution);
    }

    if (!highestSeverity) {
      highestSeverity = item.severity;
    } else if (SEVERITY_HIERARCHY[item.severity] > SEVERITY_HIERARCHY[highestSeverity]) {
      highestSeverity = item.severity;
    }
  }

  let cumulativeRisk = 0;
  if (contributions.length > 0) {
    let product = 1;
    for (const c of contributions) product *= (1 - c);
    cumulativeRisk = 1 - product;
    cumulativeRisk = Math.max(0, Math.min(1, parseFloat(cumulativeRisk.toFixed(4))));
  }

  return {
    cumulativeRiskScore: cumulativeRisk,
    riskAssessmentLevel: toRiskLevel(cumulativeRisk),
    highestSeverity,
  };
};

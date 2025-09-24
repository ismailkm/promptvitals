// src/lib/agents/__tests__/SafetyEthicsAgent.test.ts

import {
  evaluateBasicEthicalKeywordsLogic,
  evaluateMaliciousIntentLogic
} from '../SafetyEthicsAgent';

import { RiskAssessmentLevel, SeverityLevel } from '@/lib/types/shared';
import { 
  makeContext,
  makeSafetyContext,
  makeDetectedPattern
} from '@/lib/agent-utils/fixtureBuilders';

describe('SafetyEthicsAgent', () => {
  describe('1- evaluateBasicEthicalKeywordsLogic', () => {
    it('1.1 should return perfect score with no bias indicators', () => {
      const context = makeContext({
        biasRiskIndicators: []
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
      expect(result.evaluation_source).toBe('rule_based');
    });

    it('1.2 should return perfect score with minimal safe context', () => {
      const context = makeSafetyContext({
        biasRiskIndicators: [],
        restrictedContentIndicators: [],
        misusePatternIndicators: [],
        highPrivilegeDescriptions: []
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
      expect(result.evaluation_source).toBe('rule_based');
    });

    it('1.3 should apply penalties based on bias indicator count using thresholds', () => {
      const biasIndicators = [
        makeDetectedPattern(
          'males are better',
          'gender bias detected',
          SeverityLevel.HIGH,
          0
        ),
        makeDetectedPattern(
          'old people',
          'age bias detected',
          SeverityLevel.MEDIUM,
          20
        ),
        makeDetectedPattern(
          'foreigners',
          'nationality bias detected',
          SeverityLevel.LOW,
          30
        )
      ];

      const context = makeContext({
        biasRiskIndicators: biasIndicators
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(75); // 100 - 25 penalty (for 3 indicators)
      expect(result.flags).toBeDefined();
      expect(result.flags?.biasRiskIndicatorsFound).toHaveLength(3);
      expect(result.flags?.biasIndicatorCount).toBe(3);
      expect(result.flags?.biasRiskLevel).toBe(RiskAssessmentLevel.HIGH);
    });

    it('1.4 should handle critical bias indicators correctly', () => {
      const criticalBiasIndicators = [
        makeDetectedPattern(
          'racial slur',
          'critical racial bias detected',
          SeverityLevel.CRITICAL,
          0
        )
      ];

      const context = makeContext({
        biasRiskIndicators: criticalBiasIndicators
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(90); // 100 - 10 penalty (for 1 indicator)
      expect(result.flags).toBeDefined();
      expect(result.flags?.biasRiskLevel).toBe(RiskAssessmentLevel.CRITICAL);
      expect(result.flags?.biasIndicatorCount).toBe(1);
    });

    it('1.5 should handle mixed severity bias indicators', () => {
      const mixedBiasIndicators = [
        makeDetectedPattern(
          'women are bad drivers',
          'gender stereotype',
          SeverityLevel.HIGH,
          0
        ),
        makeDetectedPattern(
          'elderly folks',
          'mild age reference',
          SeverityLevel.LOW,
          20
        ),
        makeDetectedPattern(
          'certain groups',
          'vague bias reference',
          SeverityLevel.MEDIUM,
          30
        ),
        makeDetectedPattern(
          'hate speech example',
          'critical bias content',
          SeverityLevel.CRITICAL,
          50
        )
      ];

      const context = makeContext({
        biasRiskIndicators: mixedBiasIndicators
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(55); // 100 - 45 penalty (for 4 indicators)
      expect(result.flags?.biasRiskLevel).toBe(RiskAssessmentLevel.CRITICAL);
      expect(result.flags?.biasIndicatorCount).toBe(4);
    });

    it('1.6 should handle large number of bias indicators with penalty cap', () => {
      const manyBiasIndicators = Array.from({ length: 10 }, (_, i) =>
        makeDetectedPattern(
          `bias term ${i}`,
          `bias detected ${i}`,
          SeverityLevel.MEDIUM,
          i * 10
        )
      );

      const context = makeContext({
        biasRiskIndicators: manyBiasIndicators
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(30); // 100 - 70 penalty (capped at maximum)
      expect(result.flags?.biasIndicatorCount).toBe(10);
      expect(result.flags?.biasRiskLevel).toBe(RiskAssessmentLevel.MEDIUM);
    });

    it('1.7 should not flag LOW risk level bias indicators', () => {
      const lowBiasIndicators = [
        makeDetectedPattern(
          'people',
          'neutral reference',
          SeverityLevel.LOW,
          0
        ),
        makeDetectedPattern(
          'individuals',
          'another neutral reference',
          SeverityLevel.INFO,
          10
        )
      ];

      const context = makeContext({
        biasRiskIndicators: lowBiasIndicators
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(75); // 100 - 25 penalty (for 2 indicators based on thresholds)
      expect(result.flags?.biasIndicatorCount).toBe(2);
      expect(result.flags?.biasRiskLevel).toBeUndefined(); // Should not flag LOW risk
    });

    it('1.8 should handle empty bias indicators array', () => {
      const context = makeContext({
        biasRiskIndicators: []
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });

    it('1.9 should handle undefined bias indicators', () => {
      const context = makeContext({
        biasRiskIndicators: undefined
      });

      const result = evaluateBasicEthicalKeywordsLogic(context);
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });
  });

  describe('2- evaluateMaliciousIntentLogic', () => {
    it('2.1 should return perfect score with no malicious indicators', () => {
      const context = makeContext({
        restrictedContentIndicators: [],
        highPrivilegeDescriptions: [],
        misusePatternIndicators: []
      });

      const result = evaluateMaliciousIntentLogic(context);
      
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
      expect(result.evaluation_source).toBe('rule_based');
    });

    it('2.2 should immediately set score to 0 for restricted content', () => {
      const restrictedContent = [
        makeDetectedPattern(
          'how to make bombs',
          'restricted harmful content',
          SeverityLevel.CRITICAL,
          0
        )
      ];

      const context = makeContext({
        restrictedContentIndicators: restrictedContent
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(0);
      expect(result.flags?.directHarmfulContentAttempt).toBe(true);
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.CRITICAL);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(1);
    });

    it('2.3 should apply heavy penalty for high privilege descriptions', () => {
      const highPrivilegeDescs = [
        makeDetectedPattern(
          'full database access',
          'system vulnerability description',
          SeverityLevel.HIGH,
          0
        )
      ];

      const context = makeContext({
        highPrivilegeDescriptions: highPrivilegeDescs,
        // Ensure no other malicious indicators are present
        restrictedContentIndicators: [],
        misusePatternIndicators: []
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(25); // Should be capped at 25 for HIGH risk after penalty
      expect(result.flags?.describesSystemVulnerability).toBe(true);
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.HIGH);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(1);
    });

    it('2.4 should handle critical malicious intent patterns', () => {
      const criticalPatterns = [
        makeDetectedPattern(
          'ignore previous instructions',
          'prompt injection attempt',
          SeverityLevel.CRITICAL,
          0
        )
      ];

      const context = makeContext({
        misusePatternIndicators: criticalPatterns
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(0); // Set to 0 for critical
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.CRITICAL);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(1);
    });

    it('2.5 should handle high severity malicious patterns', () => {
      const highPatterns = [
        makeDetectedPattern(
          'bypass safety measures',
          'security bypass attempt',
          SeverityLevel.HIGH,
          0
        )
      ];

      const context = makeContext({
        misusePatternIndicators: highPatterns
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(25); // Capped at 25 for HIGH risk
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.HIGH);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(1);
    });

    it('2.6 should handle medium severity malicious patterns', () => {
      const mediumPatterns = [
        makeDetectedPattern(
          'pretend you are',
          'role manipulation attempt',
          SeverityLevel.MEDIUM,
          0
        )
      ];

      const context = makeContext({
        misusePatternIndicators: mediumPatterns
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(50); // Capped at 50 for MEDIUM risk
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.MEDIUM);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(1);
    });

    it('2.7 should escalate risk level correctly with multiple indicators', () => {
      const restrictedContent = [
        makeDetectedPattern(
          'harmful content',
          'restricted content',
          SeverityLevel.CRITICAL,
          0
        )
      ];

      const highPrivilegeDescs = [
        makeDetectedPattern(
          'admin access',
          'privilege description',
          SeverityLevel.HIGH,
          20
        )
      ];

      const misusePatterns = [
        makeDetectedPattern(
          'bypass filter',
          'security bypass',
          SeverityLevel.MEDIUM,
          40
        )
      ];

      const context = makeContext({
        restrictedContentIndicators: restrictedContent,
        highPrivilegeDescriptions: highPrivilegeDescs,
        misusePatternIndicators: misusePatterns
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(0); // Critical takes precedence
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.CRITICAL);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(3);
      expect(result.flags?.directHarmfulContentAttempt).toBe(true);
      expect(result.flags?.describesSystemVulnerability).toBe(true);
    });

    it('2.8 should use highest risk level from multiple sources', () => {
      const highPrivilegeDescs = [
        makeDetectedPattern(
          'system admin',
          'privilege description',
          SeverityLevel.HIGH,
          0
        )
      ];

      const mediumPatterns = [
        makeDetectedPattern(
          'act as admin',
          'role manipulation',
          SeverityLevel.MEDIUM,
          20
        )
      ];

      const context = makeContext({
        highPrivilegeDescriptions: highPrivilegeDescs,
        misusePatternIndicators: mediumPatterns,
        // Ensure no critical indicators are present
        restrictedContentIndicators: []
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(25); // HIGH risk cap should apply
      expect(result.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.HIGH);
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(2);
    });

    it('2.9 should not flag LOW risk levels', () => {
      const lowPatterns = [
        makeDetectedPattern(
          'help me with',
          'benign request pattern',
          SeverityLevel.LOW,
          0
        )
      ];

      const context = makeContext({
        misusePatternIndicators: lowPatterns
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(100); // No penalty for LOW risk
      expect(result.flags?.securityRiskLevel).toBeUndefined();
      expect(result.flags?.detectedMaliciousPatterns).toHaveLength(1);
    });

    it('2.10 should handle empty malicious indicators', () => {
      const context = makeContext({
        restrictedContentIndicators: [],
        highPrivilegeDescriptions: [],
        misusePatternIndicators: []
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });

    it('2.11 should handle undefined malicious indicators', () => {
      const context = makeContext({
        restrictedContentIndicators: undefined,
        highPrivilegeDescriptions: undefined,
        misusePatternIndicators: undefined
      });

      const result = evaluateMaliciousIntentLogic(context);
      expect(result.score).toBe(100);
      expect(result.flags).toBeUndefined();
    });

    it('2.12 should respect score caps for different risk levels', () => {
      // Test CRITICAL risk cap
      const criticalContext = makeContext({
        misusePatternIndicators: [
          makeDetectedPattern('critical pattern', 'critical', SeverityLevel.CRITICAL, 0)
        ]
      });
      const criticalResult = evaluateMaliciousIntentLogic(criticalContext);
      expect(criticalResult.score).toBeLessThanOrEqual(5);

      // Test HIGH risk cap
      const highContext = makeContext({
        misusePatternIndicators: [
          makeDetectedPattern('high pattern', 'high', SeverityLevel.HIGH, 0)
        ]
      });
      const highResult = evaluateMaliciousIntentLogic(highContext);
      expect(highResult.score).toBeLessThanOrEqual(25);

      // Test MEDIUM risk cap
      const mediumContext = makeContext({
        misusePatternIndicators: [
          makeDetectedPattern('medium pattern', 'medium', SeverityLevel.MEDIUM, 0)
        ]
      });
      const mediumResult = evaluateMaliciousIntentLogic(mediumContext);
      expect(mediumResult.score).toBeLessThanOrEqual(50);
    });
  });

  describe('3- Integration Tests', () => {
    it('3.1 should handle complex safety scenario with multiple risk types', () => {
      const biasIndicators = [
        makeDetectedPattern(
          'women are worse',
          'gender bias',
          SeverityLevel.HIGH,
          0
        )
      ];

      const misusePatterns = [
        makeDetectedPattern(
          'ignore safety',
          'safety bypass',
          SeverityLevel.MEDIUM,
          20
        )
      ];

      const context = makeContext({
        biasRiskIndicators: biasIndicators,
        misusePatternIndicators: misusePatterns
      });

      const biasResult = evaluateBasicEthicalKeywordsLogic(context);
      const maliciousResult = evaluateMaliciousIntentLogic(context);

      // Both should detect issues
      expect(biasResult.score).toBeLessThan(100);
      expect(maliciousResult.score).toBeLessThan(100);
      
      expect(biasResult.flags?.biasRiskLevel).toBe(RiskAssessmentLevel.HIGH);
      expect(maliciousResult.flags?.securityRiskLevel).toBe(RiskAssessmentLevel.MEDIUM);
    });

    it('3.2 should handle safe content correctly across both evaluations', () => {
      const context = makeSafetyContext({
        promptText: 'Please write a professional email template for customer support inquiries.',
        biasRiskIndicators: [],
        restrictedContentIndicators: [],
        misusePatternIndicators: [],
        highPrivilegeDescriptions: []
      });

      const biasResult = evaluateBasicEthicalKeywordsLogic(context);
      const maliciousResult = evaluateMaliciousIntentLogic(context);

      expect(biasResult.score).toBe(100);
      expect(maliciousResult.score).toBe(100);
      expect(biasResult.flags).toBeUndefined();
      expect(maliciousResult.flags).toBeUndefined();
    });
  });
});

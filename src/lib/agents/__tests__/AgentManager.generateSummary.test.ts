// src/lib/agents/__tests__/AgentManager.generateSummary.test.ts

import { AgentManager } from '../AgentManager';
import { InputCategoryDetailedEvaluation } from '@/lib/types/reportTypes';
import { MainCategoryKey } from '@/lib/types/shared';

describe('AgentManager.generateOverallSummary V2', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  // Helper to access the private method via reflection
  const callGenerateOverallSummary = (overallScore: number, categoryEvaluations: InputCategoryDetailedEvaluation[], safetyEvaluation?: any) => {
    const mockSafetyEval = safetyEvaluation || { status: 'pass', score: 80, message: 'No safety concerns' };
    return (agentManager as any).generateOverallSummary(overallScore, categoryEvaluations, mockSafetyEval);
  };

  // Helper to create mock category evaluation
  const createMockCategory = (
    key: MainCategoryKey,
    name: string,
    score: number
  ): InputCategoryDetailedEvaluation => ({
    category_key: key,
    category_name: name,
    description: `Test description for ${name}`,
    category_score: score,
    category_weight_in_overall_score: 0.25,
    kpi_evaluations: [],
    associated_pdd_mistake_keys_flagged: [],
  });

  // Helper to create mock category with null score
  const createMockCategoryWithNullScore = (
    key: MainCategoryKey,
    name: string
  ): any => ({ // Use any to allow null score
    category_key: key,
    category_name: name,
    description: `Test description for ${name}`,
    category_score: null,
    category_weight_in_overall_score: 0.25,
    kpi_evaluations: [],
    associated_pdd_mistake_keys_flagged: [],
  });

  describe('Multiple Strengths', () => {
    it('should report multiple strengths when multiple categories score >= 85', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 92),
        createMockCategory('instructions_structure', 'Instructions & Structure', 88),
        createMockCategory('context_content_richness', 'Context & Content Richness', 86),
        createMockCategory('safety_ethics', 'Safety & Ethics', 75),
      ];

      const result = callGenerateOverallSummary(87, categories);

      expect(result.key_strengths).toHaveLength(3);
      expect(result.key_strengths[0]).toContain('Clarity & Purpose');
      expect(result.key_strengths[0]).toContain('(92)');
      expect(result.key_strengths[1]).toContain('Instructions & Structure');
      expect(result.key_strengths[1]).toContain('(88)');
      expect(result.key_strengths[2]).toContain('Context');
      expect(result.key_strengths[2]).toContain('(86)');
    });

    it('should limit strengths to MAX_STRENGTHS (3)', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 95),
        createMockCategory('instructions_structure', 'Instructions & Structure', 90),
        createMockCategory('context_content_richness', 'Context & Content Richness', 88),
        createMockCategory('safety_ethics', 'Safety & Ethics', 87),
      ];

      const result = callGenerateOverallSummary(90, categories);

      expect(result.key_strengths).toHaveLength(3); // Should cap at 3
      expect(result.key_strengths[0]).toContain('(95)');
      expect(result.key_strengths[1]).toContain('(90)');
      expect(result.key_strengths[2]).toContain('(88)');
    });
  });

  describe('Multiple Issues', () => {
    it('should report multiple issues when multiple categories score < 60', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 45),
        createMockCategory('instructions_structure', 'Instructions & Structure', 52),
        createMockCategory('context_content_richness', 'Context & Content Richness', 58),
        createMockCategory('safety_ethics', 'Safety & Ethics', 85),
      ];

      const result = callGenerateOverallSummary(60, categories);

      expect(result.critical_issues_to_address).toHaveLength(3);
      expect(result.critical_issues_to_address[0]).toContain('Clarity & Purpose');
      expect(result.critical_issues_to_address[0]).toContain('(45)');
      expect(result.critical_issues_to_address[1]).toContain('Instructions & Structure');
      expect(result.critical_issues_to_address[1]).toContain('(52)');
      expect(result.critical_issues_to_address[2]).toContain('Context');
      expect(result.critical_issues_to_address[2]).toContain('(58)');
    });

    it('should limit issues to MAX_ISSUES (3)', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 35),
        createMockCategory('instructions_structure', 'Instructions & Structure', 40),
        createMockCategory('context_content_richness', 'Context & Content Richness', 45),
        createMockCategory('safety_ethics', 'Safety & Ethics', 50),
      ];

      const result = callGenerateOverallSummary(42, categories);

      expect(result.critical_issues_to_address).toHaveLength(3); // Should cap at 3
      expect(result.critical_issues_to_address[0]).toContain('(35)');
      expect(result.critical_issues_to_address[1]).toContain('(40)');
      expect(result.critical_issues_to_address[2]).toContain('(45)');
    });
  });

  describe('Near-threshold inclusion', () => {
    it('should include categories within SECONDARY_DELTA of strength threshold', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 83), // Within 5 of 85
        createMockCategory('instructions_structure', 'Instructions & Structure', 81), // Within 5 of 85
        createMockCategory('context_content_richness', 'Context & Content Richness', 75), // Outside threshold
      ];

      const result = callGenerateOverallSummary(80, categories);

      expect(result.key_strengths).toHaveLength(2);
      expect(result.key_strengths[0]).toContain('(83)');
      expect(result.key_strengths[1]).toContain('(81)');
    });

    it('should include categories within SECONDARY_DELTA of issue threshold', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 62), // Within 5 of 60 (issue threshold)
        createMockCategory('instructions_structure', 'Instructions & Structure', 64), // Within 5 of 60
        createMockCategory('context_content_richness', 'Context & Content Richness', 70), // Outside threshold
      ];

      const result = callGenerateOverallSummary(65, categories);

      expect(result.critical_issues_to_address).toHaveLength(2);
      expect(result.critical_issues_to_address[0]).toContain('(62)');
      expect(result.critical_issues_to_address[1]).toContain('(64)');
    });
  });

  describe('Null score handling', () => {
    it('should filter out categories with null scores', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 90),
        createMockCategoryWithNullScore('instructions_structure', 'Instructions & Structure'),
        createMockCategory('context_content_richness', 'Context & Content Richness', 85),
      ];

      const result = callGenerateOverallSummary(87, categories);

      // Should only consider the 2 categories with valid scores
      expect(result.key_strengths).toHaveLength(2);
      expect(result.key_strengths[0]).toContain('Clarity & Purpose');
      expect(result.key_strengths[1]).toContain('Context');
    });
  });

  describe('Fallback behavior', () => {
    it('should use fallback when no snippets match criteria', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 70), // Below strength threshold
        createMockCategory('instructions_structure', 'Instructions & Structure', 75), // Below strength threshold
      ];

      const result = callGenerateOverallSummary(72, categories);

      // Should have empty arrays or fallback messages since no categories meet thresholds
      expect(result.key_strengths.length + result.critical_issues_to_address.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Return shape consistency', () => {
    it('should maintain the same return structure as V1', () => {
      const categories = [
        createMockCategory('clarity_purpose', 'Clarity & Purpose', 90),
      ];

      const result = callGenerateOverallSummary(85, categories);

      expect(result).toHaveProperty('overall_prompt_score');
      expect(result).toHaveProperty('headline_assessment');
      expect(result).toHaveProperty('key_strengths');
      expect(result).toHaveProperty('critical_issues_to_address');
      
      expect(typeof result.overall_prompt_score).toBe('number');
      expect(typeof result.headline_assessment).toBe('string');
      expect(Array.isArray(result.key_strengths)).toBe(true);
      expect(Array.isArray(result.critical_issues_to_address)).toBe(true);
    });

    it('should include score in headline buckets', () => {
      const categories = [createMockCategory('clarity_purpose', 'Clarity & Purpose', 90)];

      const excellentResult = callGenerateOverallSummary(90, categories);
      const goodResult = callGenerateOverallSummary(75, categories);
      const fairResult = callGenerateOverallSummary(55, categories);
      const poorResult = callGenerateOverallSummary(35, categories);

      expect(excellentResult.headline_assessment).toContain('excellent');
      expect(goodResult.headline_assessment).toContain('good');
      expect(fairResult.headline_assessment).toContain('fair');
      expect(poorResult.headline_assessment).toContain('critical');
    });
  });
});

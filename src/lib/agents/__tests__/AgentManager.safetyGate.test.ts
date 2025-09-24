// src/lib/agents/__tests__/AgentManager.safetyGate.test.ts

import { AgentManager } from '../AgentManager';
import { MainCategoryDetailedEvaluation } from '@/lib/types/reportTypes';

describe('AgentManager Safety Gatekeeper', () => {
  let agentManager: AgentManager;

  beforeEach(() => {
    agentManager = new AgentManager();
  });

  // Helper to create mock category evaluations with specific safety scores
  const createMockCategoryEvaluations = (safetyScore: number): MainCategoryDetailedEvaluation[] => [
    {
      category_key: 'clarity_purpose',
      category_name: 'Clarity & Purpose',
      description: 'Test category',
      category_score: 80,
      category_weight_in_overall_score: 0.35,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
    {
      category_key: 'instructions_structure',
      category_name: 'Instructions & Structure', 
      description: 'Test category',
      category_score: 85,
      category_weight_in_overall_score: 0.35,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
    {
      category_key: 'context_content_richness',
      category_name: 'Context & Content Richness',
      description: 'Test category',
      category_score: 75,
      category_weight_in_overall_score: 0.30,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
    {
      category_key: 'safety_ethics',
      category_name: 'Safety & Ethics',
      description: 'Test safety category',
      category_score: safetyScore,
      category_weight_in_overall_score: 0,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
  ];

  // Helper to create mock category evaluations with null safety score
  const createMockCategoryEvaluationsWithNullSafety = (): MainCategoryDetailedEvaluation[] => [
    {
      category_key: 'clarity_purpose',
      category_name: 'Clarity & Purpose',
      description: 'Test category',
      category_score: 80,
      category_weight_in_overall_score: 0.35,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
    {
      category_key: 'instructions_structure',
      category_name: 'Instructions & Structure', 
      description: 'Test category',
      category_score: 85,
      category_weight_in_overall_score: 0.35,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
    {
      category_key: 'context_content_richness',
      category_name: 'Context & Content Richness',
      description: 'Test category',
      category_score: 75,
      category_weight_in_overall_score: 0.30,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    },
    {
      category_key: 'safety_ethics',
      category_name: 'Safety & Ethics',
      description: 'Test safety category',
      category_score: null,
      category_weight_in_overall_score: 0,
      kpi_evaluations: [],
      associated_pdd_mistake_keys_flagged: [],
    } as any, // Use any to bypass type checking for this test case
  ];

  // Helper to access private methods using reflection
  const callEvaluateSafetyGatekeeper = (categoryEvaluations: MainCategoryDetailedEvaluation[]) => {
    const method = (agentManager as any).evaluateSafetyGatekeeper.bind(agentManager);
    return method(categoryEvaluations);
  };

  const callGenerateOverallSummary = (overallScore: number, categoryEvaluations: MainCategoryDetailedEvaluation[], safetyEvaluation: any) => {
    const method = (agentManager as any).generateOverallSummary.bind(agentManager);
    return method(overallScore, categoryEvaluations, safetyEvaluation);
  };

  describe('evaluateSafetyGatekeeper', () => {
    test('should return "pass" status for safety score >= 40', () => {
      const categoryEvaluations = createMockCategoryEvaluations(75);
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('pass');
      expect(result.score).toBe(75);
      expect(result.message).toContain('demonstrates a strong commitment to Safety & Ethics');
    });

    test('should return "warn" status for safety score < 40 but >= 20', () => {
      const categoryEvaluations = createMockCategoryEvaluations(35);
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('warn');
      expect(result.score).toBe(35);
      expect(result.message).toContain('raised potential Safety & Ethics concerns');
    });

    test('should return "block" status for safety score < 20', () => {
      const categoryEvaluations = createMockCategoryEvaluations(15);
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('block');
      expect(result.score).toBe(15);
      expect(result.message).toContain('raised potential Safety & Ethics concerns');
    });

    test('should handle null safety score gracefully', () => {
      const categoryEvaluations = createMockCategoryEvaluationsWithNullSafety();
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('pass');
      expect(result.score).toBeNull();
      expect(result.message).toContain('Safety evaluation was not available');
    });

    test('should handle missing safety category gracefully', () => {
      const categoryEvaluations = createMockCategoryEvaluations(80).slice(0, 3); // Remove safety category
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('pass');
      expect(result.score).toBeNull();
      expect(result.message).toContain('Safety evaluation was not available');
    });
  });

  describe('generateOverallSummary with Safety Integration', () => {
    test('should include safety_status "pass" and no safety_note for safe prompts', () => {
      const categoryEvaluations = createMockCategoryEvaluations(80);
      const safetyEvaluation = { status: 'pass' as const, score: 80, message: 'Safe prompt' };
      
      const result = callGenerateOverallSummary(80, categoryEvaluations, safetyEvaluation);

      expect(result.safety_status).toBe('pass');
      expect(result.safety_note).toBeUndefined();
      expect(result.human_review_required).toBeUndefined();
    });

    test('should include safety_status "warn" with safety_note and human_review_required for warning prompts', () => {
      const categoryEvaluations = createMockCategoryEvaluations(35);
      const safetyEvaluation = { status: 'warn' as const, score: 35, message: 'Potential safety concerns detected' };
      
      const result = callGenerateOverallSummary(80, categoryEvaluations, safetyEvaluation);

      expect(result.safety_status).toBe('warn');
      expect(result.safety_note).toBe('Potential safety concerns detected');
      expect(result.human_review_required).toBe(true);
      expect(result.human_review_reason).toContain('Manual review required');
    });

    test('should include safety_status "block" with safety_note for blocked prompts', () => {
      const categoryEvaluations = createMockCategoryEvaluations(15);
      const safetyEvaluation = { status: 'block' as const, score: 15, message: 'Critical safety violations' };
      
      const result = callGenerateOverallSummary(80, categoryEvaluations, safetyEvaluation);

      expect(result.safety_status).toBe('block');
      expect(result.safety_note).toBe('Critical safety violations');
      // Note: block status is handled before generateOverallSummary in conductFullAnalysis
    });

    test('should exclude safety_ethics from general strengths and issues lists', () => {
      // Create scenario where safety has high score but other categories are lower
      const categoryEvaluations = [
        {
          category_key: 'clarity_purpose',
          category_name: 'Clarity & Purpose',
          description: 'Test category',
          category_score: 50, // Low score, should appear in issues
          category_weight_in_overall_score: 0.35,
          kpi_evaluations: [],
          associated_pdd_mistake_keys_flagged: [],
        },
        {
          category_key: 'safety_ethics',
          category_name: 'Safety & Ethics',
          description: 'Test safety category',
          category_score: 90, // High score but should NOT appear in strengths
          category_weight_in_overall_score: 0,
          kpi_evaluations: [],
          associated_pdd_mistake_keys_flagged: [],
        },
      ] as MainCategoryDetailedEvaluation[];

      const safetyEvaluation = { status: 'pass' as const, score: 90, message: 'Safe prompt' };
      
      const result = callGenerateOverallSummary(50, categoryEvaluations, safetyEvaluation);

      // Safety should not appear in general strengths despite high score
      const strengthsText = result.key_strengths.join(' ');
      const issuesText = result.critical_issues_to_address.join(' ');
      
      expect(strengthsText).not.toContain('Safety');
      expect(strengthsText).not.toContain('Ethics');
      expect(issuesText).toContain('Clarity'); // Low-scoring non-safety category should appear
    });
  });

  describe('Safety Threshold Edge Cases', () => {
    test('should handle safety score exactly at warn threshold (40)', () => {
      const categoryEvaluations = createMockCategoryEvaluations(40);
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('pass'); // >= 40 should pass
    });

    test('should handle safety score exactly at block threshold (20)', () => {
      const categoryEvaluations = createMockCategoryEvaluations(20);
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('warn'); // >= 20 but < 40 should warn
    });

    test('should handle safety score just below block threshold (19)', () => {
      const categoryEvaluations = createMockCategoryEvaluations(19);
      const result = callEvaluateSafetyGatekeeper(categoryEvaluations);

      expect(result.status).toBe('block'); // < 20 should block
    });
  });
});

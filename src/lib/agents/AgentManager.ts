// src/lib/managers/AgentManager.ts
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { analyzePromptText } from '@/lib/analyzer/promptAnalyzer';
import { allKpiDefinitions, mainCategoriesList, getMainCategoryConfig } from '@/lib/config/kpis';
import { calculateWeightedAverage, getRubricFeedback, getStatusFromScore, reconcileSafetyKpis } from '@/lib/agent-utils/scoring';
import { PromptAnalysisReportDetailed, MainCategoryDetailedEvaluation, IndividualKpiEvaluation, DetailedApiResponse, MistakeDefinitionType } from '@/lib/types/reportTypes';
import { MainCategoryConfig } from '@/lib/types/kpiEvaluation';
import { WeightedScoreItem } from '@/lib/types/aiTypes';
import { MISTAKE_DEFINITIONS } from '@/lib/config/kpis/kpiMistakes'
import { KpiDefinition } from '@/lib/types/kpiEvaluation';
import { SAFETY_WARN_THRESHOLD, SAFETY_BLOCK_THRESHOLD, MAX_STRENGTHS, MAX_ISSUES, STRENGTH_THRESHOLD, ISSUE_THRESHOLD, SECONDARY_DELTA } from '@/lib/config/safety';
import { SafetyEvaluation } from '@/lib/types/safety';
import { getLLMConfig } from '@/lib/llm-clients/getClient';

// Import AI Modules
import { ClarityAnalysisModule } from '@/lib/ai-modules/ClarityAnalysisModule';
import { InstructionsStructureModule } from '@/lib/ai-modules/InstructionsStructureModule';
import { ContextContentAnalysisModule } from '@/lib/ai-modules/ContextContentModule';
import { SafetyAnalysisModule } from '@/lib/ai-modules/SafetyAnalysisModule';

// Import Agent Orchestrators and Rule-Based Fallbacks
import { 
  evaluateClarityPurposeHybrid,
  evaluateGoalAlignmentLogic,
  evaluateInstructionFollowingLogic,
  evaluateClarityUnambiguityRules,
  evaluateSpecificityDetailScopeRules
} from '@/lib/agents/ClarityPurposeAgent';
import { 
  evaluateInstructionsStructureHybrid,
  evaluateFormatStructureLogic,
  evaluateExamplesPresenceLogic,
  evaluateTaskDecompositionLogic,
  evaluateToneStyleKeywordsLogic,
  evaluateLengthConstraintsLogic, 
  evaluateIterativePotentialLogic
} from '@/lib/agents/InstructionsStructureAgent';
import { 
  evaluateContextContentHybrid,
  evaluateContextSufficiencyLogic,
  evaluateContextRelevanceLogic
} from '@/lib/agents/ContextContentAgent';
import { 
  evaluateEthicalSafetyHybrid,
  evaluateBasicEthicalKeywordsLogic,
  evaluateMaliciousIntentLogic
} from '@/lib/agents/SafetyEthicsAgent';


export class AgentManager {
  private clarityAiModule: ClarityAnalysisModule;
  private instructionsStructureAiModule: InstructionsStructureModule;
  private contextContentAiModule: ContextContentAnalysisModule;
  private safetyAnalysisAiModule: SafetyAnalysisModule;

  constructor() {
    const llmConfig = getLLMConfig();
    this.clarityAiModule = new ClarityAnalysisModule(llmConfig);
    this.instructionsStructureAiModule = new InstructionsStructureModule(llmConfig);
    this.contextContentAiModule = new ContextContentAnalysisModule(llmConfig);
    this.safetyAnalysisAiModule = new SafetyAnalysisModule(llmConfig);
  }

  /**
   * Main public method to conduct a full, end-to-end analysis of a prompt.
   * This is the primary entry point for the API route.
   * Uses "Safety First" approach: evaluates safety before running other agents.
   */
  public async conductFullAnalysis(promptText: string): Promise<DetailedApiResponse> {
    const startTime = Date.now();
    const analysisTimestamp = new Date().toISOString();

    // Step 1: Generate the AnalyzedPromptDataContext
    const analyzedContext = analyzePromptText(promptText);

    // Step 2: SAFETY FIRST - Run safety evaluation before all other agents
    const safetyEthicsResult = await evaluateEthicalSafetyHybrid(analyzedContext, this.safetyAnalysisAiModule.createAnalysisFunction())
      .catch(error => {
        console.warn('Safety ethics agent failed, falling back to rules:', error);
        return this.createRuleBasedSafetyEthicsResults(analyzedContext);
      });

    // Step 3: Evaluate safety status early to potentially avoid running other agents
    const preliminarySafetyEvaluation = this.evaluateSafetyGatekeeper(safetyEthicsResult);
    
    // If safety blocks the prompt, return early with minimal report (no other agents run)
    if (preliminarySafetyEvaluation.status === 'block') {
      const blockedReport: PromptAnalysisReportDetailed = {
        report_id: `blocked_${Date.now()}`,
        analysis_timestamp: analysisTimestamp,
        prompt_text_analyzed: promptText,
        overall_summary: {
          overall_prompt_score: null,
          headline_assessment: "Analysis blocked due to safety violations.",
          key_strengths: [],
          critical_issues_to_address: [],
          safety_status: 'block',
          safety_note: preliminarySafetyEvaluation.message,
          human_review_required: true,
          human_review_reason: "Prompt blocked due to critical safety violations"
        },
        main_category_evaluations: [], // Empty since other agents didn't run
      };
      return { prompt_analysis_report: blockedReport };
    }

    // Step 4: Safety passed, now run remaining agents concurrently
    const [clarityResult, instructionsResult, contextContentResult] = await Promise.allSettled([
      evaluateClarityPurposeHybrid(analyzedContext, this.clarityAiModule.createAnalysisFunction()),
      evaluateInstructionsStructureHybrid(analyzedContext, this.instructionsStructureAiModule.createAnalysisFunction()),
      evaluateContextContentHybrid(analyzedContext, this.contextContentAiModule.createAnalysisFunction()),
    ]);

    // Step 5: Process and fall back for each agent's results.
    const aiModulesUsed: string[] = []; // Safety already ran

    const clarityAgentOutput = (clarityResult.status === 'fulfilled')
      ? (aiModulesUsed.push('ClarityAnalysisModule'), clarityResult.value)
      : (console.warn('Clarity agent failed, falling back to rules:', clarityResult.reason), this.createRuleBasedClarityResults(analyzedContext));
    
    const instructionsAgentOutput = (instructionsResult.status === 'fulfilled')
      ? (aiModulesUsed.push('InstructionsStructureModule'), instructionsResult.value)
      : (console.warn('Instructions agent failed, falling back to rules:', instructionsResult.reason), this.createRuleBasedInstructionsResults(analyzedContext));

    const contextContentAgentOutput = (contextContentResult.status === 'fulfilled')
      ? (aiModulesUsed.push('ContextContentAnalysisModule'), contextContentResult.value)
      : (console.warn('Context content agent failed, falling back to rules:', contextContentResult.reason), this.createRuleBasedContextContentResults(analyzedContext));

    // Combine all KPI results into one map for easier lookup
    const allKpiResults = { ...clarityAgentOutput, ...instructionsAgentOutput, ...contextContentAgentOutput };

    // --- Step 5: Aggregate results and calculate category scores ---
    const mainCategoryEvaluations: MainCategoryDetailedEvaluation[] = [];

    // Loop through the main category configurations (clarity, instructions, etc.)
    for (const categoryKey of mainCategoriesList) {
      const kpisForCategory = allKpiDefinitions.filter(kpi => kpi.category_key === categoryKey.key);
      const categoryResult = this.createCategoryEvaluation(categoryKey, allKpiResults, kpisForCategory);
      mainCategoryEvaluations.push(categoryResult);
    }

    // --- Step 6: Calculate Overall Prompt Score ---
    const overallPromptScore = this.calculateOverallScore(mainCategoryEvaluations as any); // Cast to any to filter out output category
    
    // --- Step 7: Use the preliminary safety evaluation (already calculated)
    const safetyEvaluation = preliminarySafetyEvaluation;
    
    // --- Step 8: Generate Summary Text ---
    const overallSummary = this.generateOverallSummary(overallPromptScore, mainCategoryEvaluations, safetyEvaluation);
    
    // --- Step 9: Assemble and return the final report ---
    const analysisDuration = Date.now() - startTime;
    
    const report: PromptAnalysisReportDetailed = {
      report_id: `analysis_${Date.now()}`,
      analysis_timestamp: new Date().toISOString(),
      prompt_text_analyzed: promptText,
      overall_summary: overallSummary,
      main_category_evaluations: mainCategoryEvaluations,
    };

    return { prompt_analysis_report: report };
  }

  /**
   * Helper method to build a complete MainCategoryDetailedEvaluation object.
   */
  private createCategoryEvaluation(
    mainCategory: MainCategoryConfig, 
    allKpiResults: Record<string, any>, 
    kpisForCategory: KpiDefinition[]
  ): MainCategoryDetailedEvaluation {

    const categoryKey = mainCategory.key;
    const allMistakesInThisCategory: MistakeDefinitionType[] = [];
    let itemsForAverage: WeightedScoreItem[] = [];
    
    const kpiEvaluations: IndividualKpiEvaluation[] = kpisForCategory.map(kpiDef => {
      // Debug: Log mapping attempt for each KPI
      if (!(kpiDef.key in allKpiResults)) {
        console.warn(`[AgentManager] KPI '${kpiDef.key}' not found in allKpiResults!`);
      }
      const result = allKpiResults[kpiDef.key];
      const score = result.score;

      const rubricFeedback = getRubricFeedback(score, kpiDef.rubric);

      // 1. Determine the mistakes for THIS KPI ONLY.
      const mistakesForThisKpi: MistakeDefinitionType[] = [];
      const mistakeKeysFromAgent = result.flags?.associated_mistake_keys_flagged;
      // If score is below a threshold (e.g., 60), flag associated mistakes
    
      if (mistakeKeysFromAgent && Array.isArray(mistakeKeysFromAgent)) {
        mistakeKeysFromAgent.forEach(mistakeKey => {
          // 1. Look up the definition ONCE.
          const definition = MISTAKE_DEFINITIONS[mistakeKey as keyof typeof MISTAKE_DEFINITIONS];
          // If a definition exists, create the rich object.
          if (definition) {
            const mistakeObject: MistakeDefinitionType = {
              key: mistakeKey,
              name: definition.name,
              description: definition.description,
            };

            // 2. Add the rich object to this KPI's specific list (using a Map to prevent duplicates).
            mistakesForThisKpi.push(mistakeObject);
            
            // 3. Simultaneously add the rich object to the overall category's list.
            allMistakesInThisCategory.push(mistakeObject);
         }
        });
      }

      // Surface critical assessment_comment and mistake keys from flags if present
      const assessment_comment = result.flags?.assessment_comment || rubricFeedback.assessmentComment;

      itemsForAverage.push({
        score: result.score,
        weight: kpiDef.default_weight_in_category ?? 0,
      });

      return {
        kpi_id: kpiDef.id,
        kpi_key: kpiDef.key,
        kpi_name_pdd: kpiDef.name_pdd,
        score: result.score,
        assessment_comment,
        improvement_suggestions: rubricFeedback.improvementSuggestions,
        evaluation_source: result.evaluation_source,
        ai_evaluation_confidence: result.flags?.aiConfidence,
        associated_mistake_keys_flagged: mistakesForThisKpi
      };
    });

    let categoryScore: number;

    if (mainCategory.key === 'safety_ethics') {
      // SPECIAL CASE: The safety category score is the MINIMUM of its KPIs, not the average.
      // It is a "weakest link" category.
      const kpiScores = itemsForAverage.map(item => item.score);
      categoryScore = Math.min(...kpiScores);
    } else {
      // NORMAL CASE: All other categories are calculated using a weighted average.
      categoryScore = calculateWeightedAverage(itemsForAverage);
    }
    const status = getStatusFromScore(categoryScore);

    return {
      category_key: categoryKey as any,
      category_name: mainCategory.name,
      description: mainCategory.description,
      category_score: categoryScore,
      status_indicator: status.indicator,
      status_code: status.code,
      category_weight_in_overall_score: mainCategory.default_weight_overall,
      kpi_evaluations: kpiEvaluations,
      associated_mistake_keys_flagged: allMistakesInThisCategory,
    };
  }

  /**
   * Evaluates safety/gatekeeper enforcement based on direct safety agent results.
   * Used in Safety First approach to evaluate safety before running other agents.
   */
  private evaluateSafetyGatekeeper(safetyResults: Record<string, any>): SafetyEvaluation {
    // Calculate safety score from individual KPI results
    const safetyKpis = allKpiDefinitions.filter(kpi => kpi.category_key === 'safety_ethics');
    const itemsForAverage: WeightedScoreItem[] = safetyKpis.map(kpiDef => ({
      score: safetyResults[kpiDef.key]?.score || 0,
      weight: kpiDef.default_weight_in_category ?? 0,
    }));
    
    const safetyScore = calculateWeightedAverage(itemsForAverage);
    const safetyConfig = getMainCategoryConfig('safety_ethics');

    // Determine safety status based on thresholds
    if (safetyScore < SAFETY_BLOCK_THRESHOLD) {
      return {
        status: "block",
        score: safetyScore,
        message: safetyConfig?.issue_snippet || 
                `Critical safety violations detected (Score: ${Math.round(safetyScore)}). This prompt cannot be processed.`
      };
    } else if (safetyScore < SAFETY_WARN_THRESHOLD) {
      return {
        status: "warn",
        score: safetyScore,
        message: safetyConfig?.issue_snippet || 
                `Potential safety concerns detected (Score: ${Math.round(safetyScore)}). Manual review recommended.`
      };
    } else {
      return {
        status: "pass",
        score: safetyScore,
        message: safetyConfig?.strength_snippet || 
                `No significant safety concerns detected (Score: ${Math.round(safetyScore)}).`
      };
    }
  }

  /**
   * Generates the final summary text based on the complete analysis.
   * Uses strength_snippet and issue_snippet from mainCategoriesList,
   * shows multiple strengths and issues instead of just best/worst.
   */
  private generateOverallSummary(overallScore: number, categoryEvaluations: MainCategoryDetailedEvaluation[], safetyEvaluation: SafetyEvaluation){
    let headline: string;
    const strengths: string[] = [];
    const issues: string[] = [];

    // Filter out categories with null scores and exclude safety_ethics from general analysis
    const validCategories = categoryEvaluations
      .filter(c => c.category_score !== null && c.category_score !== undefined)
      .filter(c => c.category_key !== 'safety_ethics') // Safety handled separately by gatekeeper
      .map(catEval => {
        const categoryConfig = getMainCategoryConfig(catEval.category_key as any);
        return {
          ...catEval,
          config: categoryConfig,
          score: catEval.category_score as number
        };
      })
      .filter(cat => cat.config); // Only include categories we have config for

    // Sort categories by score (descending for strengths, ascending for issues)
    const sortedDesc = [...validCategories].sort((a, b) => b.score - a.score);
    const sortedAsc = [...validCategories].sort((a, b) => a.score - b.score);

    // Collect strengths (high-scoring categories)
    const strengthCandidates = sortedDesc.filter(cat => 
      cat.score >= STRENGTH_THRESHOLD || 
      cat.score >= (STRENGTH_THRESHOLD - SECONDARY_DELTA)
    );
    
    const selectedStrengths = strengthCandidates.slice(0, MAX_STRENGTHS);
    for (const cat of selectedStrengths) {
      if (cat.config?.strength_snippet) {
        strengths.push(`${cat.config.strength_snippet} (${Math.round(cat.score)})`);
      }
    }

    // Collect issues (low-scoring categories)
    const issueCandidates = sortedAsc.filter(cat => 
      cat.score < ISSUE_THRESHOLD || 
      cat.score < (ISSUE_THRESHOLD + SECONDARY_DELTA)
    );
    
    const selectedIssues = issueCandidates.slice(0, MAX_ISSUES);
    for (const cat of selectedIssues) {
      if (cat.config?.issue_snippet) {
        issues.push(`${cat.config.issue_snippet} (${Math.round(cat.score)})`);
      }
    }

    // Generate headline based on overall score (keep existing logic)
    if (overallScore >= 85) {
      headline = "This is an excellent, well-crafted prompt that is likely to produce high-quality results.";
    } else if (overallScore >= 70) {
      headline = "This is a good prompt with a clear goal, but could be improved with more specific details.";
    } else if (overallScore >= 50) {
      headline = "This prompt is fair, but has notable issues with clarity or structure that may affect the outcome.";
    } else {
      headline = "This prompt has critical issues and needs significant revision to be effective.";
    }

    // Fallback: if no strengths/issues found using snippets, use simple fallback
    if (strengths.length === 0 && validCategories.length > 0) {
      const bestCategory = sortedDesc[0];
      if (bestCategory.score >= 85) {
        strengths.push(`The prompt excels in ${bestCategory.category_name} (${Math.round(bestCategory.score)})`);
      }
    }

    if (issues.length === 0 && validCategories.length > 0) {
      const worstCategory = sortedAsc[0];
      if (worstCategory.score < 60) {
        issues.push(`The primary area for improvement is ${worstCategory.category_name} (${Math.round(worstCategory.score)})`);
      }
    }

    return {
      overall_prompt_score: overallScore,
      headline_assessment: headline,
      key_strengths: strengths,
      critical_issues_to_address: issues,
      safety_status: safetyEvaluation.status,
      ...(safetyEvaluation.status !== 'pass' && { safety_note: safetyEvaluation.message }),
      ...(safetyEvaluation.status === 'warn' && { 
        human_review_required: true,
        human_review_reason: "Manual review required due to potential safety concerns"
      }),
    };
  }

  /**
   * Helper to calculate the final overall prompt score.
   */
  private calculateOverallScore(categoryEvaluations: MainCategoryDetailedEvaluation[]): number {
    const itemsForAverage: WeightedScoreItem[] = categoryEvaluations.map(catEval => ({
      score: catEval.category_score ?? 0,
      weight: catEval?.category_weight_in_overall_score ?? 0,
    }));
    
    return calculateWeightedAverage(itemsForAverage);
  }

  /**
   * Creates rule-based only clarity results as a fallback.
   */
  private createRuleBasedClarityResults(context: AnalyzedPromptDataContext) {
    return {
      clarityUnambiguity: evaluateClarityUnambiguityRules(context),
      specificityDetailScope: evaluateSpecificityDetailScopeRules(context), 
      goalAlignment: evaluateGoalAlignmentLogic(context),
      instructionFollowing: evaluateInstructionFollowingLogic(context),
    };
  }

  /**
   * Creates rule-based only instructions results as a fallback.
   */
  private createRuleBasedInstructionsResults(context: AnalyzedPromptDataContext) {
    return {
      formatStructure: evaluateFormatStructureLogic(context),
      taskDecomposition: evaluateTaskDecompositionLogic(context),
      lengthConstraints: evaluateLengthConstraintsLogic(context),
      examplePresence: evaluateExamplesPresenceLogic(context),
      toneStyle: evaluateToneStyleKeywordsLogic(context),
      iterativePotential: evaluateIterativePotentialLogic(context),
    };
  }

  /**
   * Creates rule-based only context content results as a fallback.
   */
  private createRuleBasedContextContentResults(context: AnalyzedPromptDataContext) {
    return {
      contextSufficiency: evaluateContextSufficiencyLogic(context),
      contextRelevance: evaluateContextRelevanceLogic(context),
    };
  }

  /**
   * Creates rule-based only safety ethics results as a fallback.
   */
  private createRuleBasedSafetyEthicsResults(context: AnalyzedPromptDataContext) {
    // Step 1: Get the raw, siloed scores.
    const maliciousResult = evaluateMaliciousIntentLogic(context);
    const ethicalResult = evaluateBasicEthicalKeywordsLogic(context);
    console.log("createRuleBasedSafetyEthicsResults")
    console.log({maliciousResult, ethicalResult});
    // Step 2: Use the exact same helper function to reconcile them.
    return reconcileSafetyKpis(ethicalResult, maliciousResult);
  }
  
}
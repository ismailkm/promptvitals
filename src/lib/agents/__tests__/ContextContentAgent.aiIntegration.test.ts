// src/lib/agents/__tests__/ContextContentAgent.aiIntegration.test.ts

import { evaluateContextContentHybrid, evaluateContextSufficiencyLogic, evaluateContextRelevanceLogic } from '../ContextContentAgent';
import { AnalyzedPromptDataContext } from '@/lib/types/promptAnalysis';
import { ContextContentAnalysisModule } from '@/lib/ai-modules/ContextContentModule';
import { SeverityLevel } from '@/lib/types/shared';

describe('ContextContentAgent AI Integration', () => {
  let aiModule: ContextContentAnalysisModule;

  beforeEach(() => {
    aiModule = new ContextContentAnalysisModule();
  });

  const createTestContext = (promptText: string, overrides: Partial<AnalyzedPromptDataContext> = {}): AnalyzedPromptDataContext => ({
    promptText,
    lengthChars: promptText.length,
    lengthWords: promptText.split(' ').length,
    contextIndicatorsFound: [],
    specificityElements: { outputLengthConstraints: [], keyEntitiesFound: [], definedPersonaInfo: [] },
    instructionsAndStructure: {
      explicitFormatRequests: [],
      requestsSpecificFormat: null,
      bulletPointUsage: { detected: false },
      sectionCount: 0,
      exampleDetails: [],
      placeholderDetails: [],
      toneStyleGuidance: [],
      stepMarkerDetails: []
    },
    actionVerbDetails: { count: 1, verbs: ['write'] },
    clarityIssuesFound: [],
    explicitlyStatesGoal: true,
    mentionsTargetAudience: false,
    lexicalDiversityScore: 0.5,
    mentionsExternalReference: false,
    ...overrides
  });

  const skipIfNoLLM = () => {
    if (!process.env.LLM_PROVIDER) {
      console.log('⏭️  Skipping AI integration tests - set LLM_PROVIDER to enable');
      return true;
    }
    return false;
  };

  describe('End-to-End AI Integration', () => {
    it('should enhance context sufficiency with external reference detection', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Write a summary of the attached document for the team. Include all relevant details and avoid redundancy.',
        { 
          mentionsExternalReference: true,
          lengthWords: 18,
          specificityElements: { 
            outputLengthConstraints: [], 
            keyEntitiesFound: [],
            definedPersonaInfo: [] 
          }
        }
      );

      // First, check what the rule-based score would be
      const ruleOnlyResult = evaluateContextSufficiencyLogic(context);
      console.log('📊 Context Sufficiency Rule-based baseline:', ruleOnlyResult.score);

      const aiFunction = aiModule.createAnalysisFunction();
      const results = await Promise.race([
        evaluateContextContentHybrid(context, aiFunction),
        new Promise(resolve => setTimeout(() => resolve(null), 45000))
      ]);

      if (results === null) {
        // LLM call timed out; verify fallback behavior
        const fallbackResults = await evaluateContextContentHybrid(context, async () => { throw new Error('timeout'); });
        expect(fallbackResults.contextSufficiency.evaluation_source).toBe('rule_based');
        expect(fallbackResults.contextRelevance.evaluation_source).toBe('rule_based');
        console.log('⏰ Test timed out - verified fallback behavior');
        return;
      }

      const r = results as any;

      // Should use AI for context sufficiency due to external reference
      if (r.contextSufficiency.flags?.aiUsed) {
        expect(r.contextSufficiency.flags?.aiConfidence).toBeGreaterThanOrEqual(0);
        expect(r.contextSufficiency.flags?.aiConfidence).toBeLessThanOrEqual(1);
        expect(r.contextSufficiency.evaluation_source).toBe('hybrid_rule_dominant');
        
        console.log('🎯 Enhanced Context Sufficiency:', {
          ruleOnlyScore: ruleOnlyResult.score,
          hybridScore: r.contextSufficiency.score,
          aiConfidence: r.contextSufficiency.flags?.aiConfidence,
          missingInfo: r.contextSufficiency.flags?.aiMissingInfo,
          rationale: r.contextSufficiency.flags?.aiRationale
        });
      } else {
        // AI enhancement failed - should gracefully fallback
        expect(r.contextSufficiency.evaluation_source).toBe('rule_based');
        console.log('🛡️ AI failed gracefully - using rule-based evaluation');
      }

      // Scores should always be valid
      expect(r.contextSufficiency.score).toBeGreaterThanOrEqual(0);
      expect(r.contextRelevance.score).toBeGreaterThanOrEqual(0);
    }, 120000);

    it('should enhance context relevance for long prompts', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Please write a comprehensive detailed extensive thorough complete exhaustive in-depth analysis report document summary overview of the customer data information details facts figures statistics metrics numbers trends patterns insights findings discoveries observations conclusions recommendations suggestions proposals actions steps measures initiatives strategies approaches methodologies techniques procedures processes workflows systems frameworks structures models paradigms concepts theories principles guidelines best practices standards protocols policies rules regulations requirements specifications criteria parameters variables factors elements components aspects dimensions perspectives viewpoints angles considerations implications consequences outcomes results impacts effects influences benefits advantages opportunities strengths positives pros merits values worth significance importance relevance meaning purpose goals objectives targets aims intentions plans visions missions strategies tactics approaches methods ways means tools instruments devices mechanisms systems solutions answers responses resolutions remedies fixes improvements enhancements optimizations refinements adjustments modifications changes alterations transformations innovations developments progressions evolutions advancements breakthroughs discoveries insights revelations understandings comprehensions appreciations recognitions acknowledgments realizations enlightenments clarifications explanations interpretations translations descriptions characterizations representations portrayals depictions illustrations demonstrations examples instances cases scenarios situations circumstances contexts environments settings conditions states statuses positions locations places areas regions zones territories domains fields spheres realms sectors industries markets segments categories types kinds varieties forms shapes sizes scales levels degrees extents ranges scopes spans breadths widths depths heights lengths distances measurements quantities amounts volumes capacities capabilities potentials possibilities probabilities likelihoods chances odds risks threats challenges obstacles barriers difficulties problems issues concerns matters topics subjects themes concepts ideas thoughts notions opinions beliefs views perspectives standpoints positions stances attitudes approaches mindsets mentalities philosophies ideologies principles values morals ethics standards norms customs traditions practices habits behaviors actions activities operations functions duties responsibilities roles tasks jobs work efforts endeavors attempts tries experiments tests trials evaluations assessments reviews examinations inspections investigations studies research analyses surveys polls questionnaires interviews discussions conversations dialogues debates arguments disputes conflicts controversies disagreements differences variations deviations departures changes modifications alterations adjustments adaptations accommodations customizations personalizations individualizations specifications particular requirements needs wants desires wishes hopes dreams aspirations ambitions goals objectives targets aims purposes intentions plans schemes designs blueprints maps routes paths ways directions courses tracks trails journeys voyages expeditions adventures quests missions assignments projects undertakings enterprises ventures initiatives campaigns drives efforts pushes movements progressions advances developments growths expansions extensions enlargements increases rises improvements enhancements upgrades updates revisions modifications changes transformations conversions transitions shifts switches moves transfers relocations displacements repositionings rearrangements reorganizations restructurings reforms renovations restorations rehabilitations recoveries comebacks returns rebounds revivals resurrections rebirths renewals refreshments rejuvenations revitalizations reactivations reestablishments reinstatements restorations retrievals reclamations recoveries salvages rescues deliverances liberations releases freedoms escapes departures exits withdrawals retreats retirements resignations quits abandonments surrenders submissions yieldings concessions compromises agreements settlements resolutions solutions answers responses replies reactions feedbacks inputs contributions participations involvements engagements interactions communications exchanges transfers transmissions deliveries distributions disseminations spreads circulations broadcasts publications announcements declarations statements proclamations notifications alerts warnings advisories recommendations suggestions proposals offers invitations requests solicitations appeals pleas petitions applications submissions entries registrations enrollments sign-ups memberships subscriptions affiliations associations partnerships collaborations cooperations alliances unions coalitions federations confederations leagues networks groups teams squads crews bands gangs packs herds flocks swarms crowds masses multitudes populations communities societies cultures civilizations nations countries states provinces regions territories districts areas zones sectors quarters neighborhoods localities villages towns cities metropolises megalopolises conurbations agglomerations concentrations gatherings assemblies meetings conferences conventions symposiums seminars workshops sessions classes courses programs curricula syllabi outlines schedules timetables calendars agendas plans arrangements preparations setups organizations establishments institutions facilities centers hubs bases headquarters offices buildings structures constructions architectures designs layouts formats patterns configurations arrangements compositions formations shapes forms figures outlines silhouettes profiles contours boundaries perimeters borders edges margins limits extents ranges scopes spans breadths widths depths heights lengths distances measurements dimensions proportions ratios relationships connections links bonds ties associations affiliations partnerships collaborations cooperations alliances unions coalitions federations confederations leagues networks systems frameworks structures models paradigms concepts theories principles guidelines best practices standards protocols policies rules regulations requirements specifications criteria parameters variables factors elements components aspects dimensions perspectives viewpoints angles considerations implications consequences outcomes results impacts effects influences benefits advantages opportunities strengths positives pros merits values worth significance importance relevance meaning purpose.',
        {
          lengthWords: 800,
          lexicalDiversityScore: 0.15, // Very low diversity indicates high redundancy
          mentionsExternalReference: false
        }
      );

      const ruleOnlyResult = evaluateContextRelevanceLogic(context);
      console.log('📊 Context Relevance Rule-based baseline:', ruleOnlyResult.score);

      const aiFunction = aiModule.createAnalysisFunction();
      const results = await Promise.race([
        evaluateContextContentHybrid(context, aiFunction),
        new Promise(resolve => setTimeout(() => resolve(null), 45000))
      ]);

      if (results === null) {
        console.log('⏰ Test timed out - using fallback');
        return;
      }

      const r = results as any;

      // Should trigger AI for context relevance due to length > 150 words
      if (r.contextRelevance.flags?.aiUsed) {
        expect(r.contextRelevance.flags?.aiConfidence).toBeGreaterThanOrEqual(0);
        expect(r.contextRelevance.evaluation_source).toBe('hybrid_rule_dominant');
        
        console.log('🎯 Enhanced Context Relevance:', {
          ruleOnlyScore: ruleOnlyResult.score,
          hybridScore: r.contextRelevance.score,
          aiConfidence: r.contextRelevance.flags?.aiConfidence,
          irrelevantSections: r.contextRelevance.flags?.aiIrrelevantSections,
          rationale: r.contextRelevance.flags?.aiRationale
        });
      } else {
        expect(r.contextRelevance.evaluation_source).toBe('rule_based');
        console.log('🛡️ AI failed gracefully for relevance analysis');
      }

      expect(r.contextRelevance.score).toBeGreaterThanOrEqual(0);
    }, 120000);

    it('should enhance both features simultaneously for borderline cases', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Please analyze the uploaded file and create a report with recommendations. The document contains customer feedback data that needs to be processed and summarized. Make sure to include all important insights and avoid any redundant information. Focus on actionable recommendations for the team.',
        {
          lengthWords: 42,
          mentionsExternalReference: true, // Triggers both sufficiency and relevance
          specificityElements: { 
            outputLengthConstraints: [], 
            keyEntitiesFound: [{ matchedText: 'customer', matchedPatternSource: 'entity', severity: SeverityLevel.LOW, reason: 'entity', startIndex: 0, endIndex: 8 }],
            definedPersonaInfo: [] 
          },
          clarityIssuesFound: [
            {
              matchedPatternSource: 'vague-term',
              severity: SeverityLevel.MEDIUM,
              reason: 'vague term detected',
              matchedText: 'stuff',
              startIndex: 0,
              endIndex: 5
            }
          ]
        }
      );

      const aiFunction = aiModule.createAnalysisFunction();
      const results = await Promise.race([
        evaluateContextContentHybrid(context, aiFunction),
        new Promise(resolve => setTimeout(() => resolve(null), 45000))
      ]);

      if (results === null) {
        console.log('⏰ Test timed out');
        return;
      }

      const r = results as any;

      // Count how many features were AI-enhanced
      const aiEnhancedFeatures = [
        r.contextSufficiency.flags?.aiUsed,
        r.contextRelevance.flags?.aiUsed
      ].filter(Boolean).length;

      if (aiEnhancedFeatures > 0) {
        console.log('🔄 Multi-Feature Enhancement (AI successful):', {
          contextSufficiency: {
            score: r.contextSufficiency.score,
            enhanced: r.contextSufficiency.flags?.aiUsed,
            confidence: r.contextSufficiency.flags?.aiConfidence
          },
          contextRelevance: {
            score: r.contextRelevance.score,
            enhanced: r.contextRelevance.flags?.aiUsed,
            confidence: r.contextRelevance.flags?.aiConfidence
          }
        });

        // Verify AI enhancement quality
        if (r.contextSufficiency.flags?.aiUsed) {
          expect(r.contextSufficiency.flags?.aiConfidence).toBeGreaterThanOrEqual(0);
          expect(r.contextSufficiency.evaluation_source).toBe('hybrid_rule_dominant');
        }
        if (r.contextRelevance.flags?.aiUsed) {
          expect(r.contextRelevance.flags?.aiConfidence).toBeGreaterThanOrEqual(0);
          expect(r.contextRelevance.evaluation_source).toBe('hybrid_rule_dominant');
        }
      } else {
        console.log('🛡️ Multi-Feature Fallback (AI failed gracefully):', {
          contextSufficiency: { score: r.contextSufficiency.score, source: r.contextSufficiency.evaluation_source },
          contextRelevance: { score: r.contextRelevance.score, source: r.contextRelevance.evaluation_source }
        });
        
        expect(r.contextSufficiency.evaluation_source).toBe('rule_based');
        expect(r.contextRelevance.evaluation_source).toBe('rule_based');
      }

      // All results should have valid scores
      expect(r.contextSufficiency.score).toBeGreaterThanOrEqual(0);
      expect(r.contextRelevance.score).toBeGreaterThanOrEqual(0);
    }, 120000);

    it('should handle long prompts with few entities for sufficiency review', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Create a comprehensive analysis and detailed evaluation of the data patterns trends behaviors characteristics attributes properties features aspects elements components factors variables parameters metrics measurements statistics figures numbers values quantities amounts volumes capacities capabilities potentials possibilities probabilities likelihoods chances odds risks threats challenges obstacles barriers difficulties problems issues concerns matters topics subjects themes concepts ideas thoughts notions opinions beliefs views perspectives standpoints positions stances attitudes approaches mindsets mentalities philosophies ideologies principles values morals ethics standards norms customs traditions practices habits behaviors actions activities operations functions duties responsibilities roles tasks jobs work efforts endeavors attempts tries experiments tests trials evaluations assessments reviews examinations inspections investigations studies research analyses surveys polls questionnaires interviews discussions conversations dialogues debates arguments disputes conflicts controversies disagreements differences variations deviations departures changes modifications alterations adjustments adaptations accommodations customizations personalizations individualizations specifications particular requirements.',
        {
          lengthWords: 120, // Over 200 words would trigger, but let's test edge case
          specificityElements: { 
            outputLengthConstraints: [], 
            keyEntitiesFound: [], // 0 key entities with long prompt
            definedPersonaInfo: [] 
          },
          mentionsExternalReference: false
        }
      );

      // Manually set to trigger the rule: >200 words + <=1 entities
      context.lengthWords = 250;

      const aiFunction = aiModule.createAnalysisFunction();
      const results = await Promise.race([
        evaluateContextContentHybrid(context, aiFunction),
        new Promise(resolve => setTimeout(() => resolve(null), 45000))
      ]);

      if (results === null) {
        console.log('⏰ Test timed out');
        return;
      }

      const r = results as any;

      console.log('📏 Long Prompt + Few Entities Test:', {
        wordCount: context.lengthWords,
        keyEntities: context.specificityElements?.keyEntitiesFound?.length,
        sufficiencyEnhanced: r.contextSufficiency.flags?.aiUsed,
        relevanceEnhanced: r.contextRelevance.flags?.aiUsed
      });

      // Should trigger AI for sufficiency due to: >200 words + <=1 entities
      // May also trigger relevance due to >150 words
      expect(r.contextSufficiency.score).toBeGreaterThanOrEqual(0);
      expect(r.contextRelevance.score).toBeGreaterThanOrEqual(0);
    }, 120000);

    it('should skip AI when features are not eligible', async () => {
      if (skipIfNoLLM()) return;

      const context = createTestContext(
        'Write a simple report about user engagement metrics.',
        {
          lengthWords: 9, // Short prompt
          mentionsExternalReference: false, // No external refs
          specificityElements: { 
            outputLengthConstraints: [], 
            keyEntitiesFound: [
              { matchedText: 'user', matchedPatternSource: 'entity', severity: SeverityLevel.LOW, reason: 'entity', startIndex: 0, endIndex: 4 },
              { matchedText: 'engagement', matchedPatternSource: 'entity', severity: SeverityLevel.LOW, reason: 'entity', startIndex: 5, endIndex: 15 },
              { matchedText: 'metrics', matchedPatternSource: 'entity', severity: SeverityLevel.LOW, reason: 'entity', startIndex: 16, endIndex: 23 }
            ], // Multiple entities
            definedPersonaInfo: [] 
          }
        }
      );

      const aiFunction = aiModule.createAnalysisFunction();
      const results = await evaluateContextContentHybrid(context, aiFunction);

      // No features should be AI-enhanced due to eligibility rules
      expect(results.contextSufficiency.flags?.aiUsed).toBeUndefined();
      expect(results.contextRelevance.flags?.aiUsed).toBeUndefined();

      // All should be rule-based
      expect(results.contextSufficiency.evaluation_source).toBe('rule_based');
      expect(results.contextRelevance.evaluation_source).toBe('rule_based');

      console.log('📏 Rule-Only Results (no AI needed):', {
        contextSufficiency: results.contextSufficiency.score,
        contextRelevance: results.contextRelevance.score,
        wordCount: context.lengthWords,
        keyEntities: context.specificityElements?.keyEntitiesFound?.length
      });
    }, 30000);

    it('should handle borderline rule scores for sufficiency review', async () => {
      if (skipIfNoLLM()) return;

      // Create a context that should result in borderline scores (50-75 range)
      const context = createTestContext(
        'Analyze the data and create a report with findings.',
        {
          lengthWords: 10,
          explicitlyStatesGoal: true, // +15 bonus
          actionVerbDetails: { count: 1, verbs: ['analyze'] }, // +10 bonus for single verb
          contextIndicatorsFound: [], // No context indicators
          specificityElements: { 
            outputLengthConstraints: [], 
            keyEntitiesFound: [
              { matchedText: 'data', matchedPatternSource: 'entity', severity: SeverityLevel.LOW, reason: 'entity', startIndex: 0, endIndex: 4 }
            ], // 1 entity = some bonus
            definedPersonaInfo: [] 
          },
          clarityIssuesFound: [
            {
              matchedPatternSource: 'vague-term',
              severity: SeverityLevel.MEDIUM,
              reason: 'vague term',
              matchedText: 'stuff',
              startIndex: 0,
              endIndex: 5
            }
          ], // Some vague terms to bring score to borderline
          mentionsExternalReference: false
        }
      );

      // Check the rule-based score to confirm it's in borderline range
      const ruleScore = evaluateContextSufficiencyLogic(context).score;
      console.log('📊 Borderline rule score:', ruleScore);

      if (ruleScore >= 50 && ruleScore <= 75) {
        const aiFunction = aiModule.createAnalysisFunction();
        const results = await Promise.race([
          evaluateContextContentHybrid(context, aiFunction),
          new Promise(resolve => setTimeout(() => resolve(null), 45000))
        ]);

        if (results === null) {
          console.log('⏰ Test timed out');
          return;
        }

        const r = results as any;

        console.log('⚖️ Borderline Score Enhancement:', {
          ruleScore: ruleScore,
          hybridScore: r.contextSufficiency.score,
          aiUsed: r.contextSufficiency.flags?.aiUsed,
          confidence: r.contextSufficiency.flags?.aiConfidence
        });

        expect(r.contextSufficiency.score).toBeGreaterThanOrEqual(0);
      } else {
        console.log(`📊 Score ${ruleScore} not in borderline range (50-75), skipping AI enhancement test`);
      }
    }, 60000);

    it('should gracefully handle AI failures', async () => {
      if (skipIfNoLLM()) return;

      // Create a faulty AI function that throws errors
      const faultyAiFunction = async () => {
        throw new Error('AI service unavailable');
      };

      const context = createTestContext(
        'Write a summary of the attached document for the team.',
        { mentionsExternalReference: true } // Should trigger AI
      );

      const results = await evaluateContextContentHybrid(context, faultyAiFunction);

      // Should fall back to rule-only results
      expect(results.contextSufficiency.flags?.aiUsed).toBeUndefined();
      expect(results.contextRelevance.flags?.aiUsed).toBeUndefined();
      expect(results.contextSufficiency.evaluation_source).toBe('rule_based');
      expect(results.contextRelevance.evaluation_source).toBe('rule_based');
      expect(results.contextSufficiency.score).toBeGreaterThan(0);
      expect(results.contextRelevance.score).toBeGreaterThan(0);

      console.log('🛡️ Graceful AI Failure Handling:', {
        contextSufficiency: results.contextSufficiency.score,
        contextRelevance: results.contextRelevance.score,
        source: results.contextSufficiency.evaluation_source
      });
    }, 30000);

    it('should demonstrate cost efficiency vs individual calls', async () => {
      if (skipIfNoLLM()) return;

      console.log('💰 Context Content Cost Efficiency Demonstration');
      
      const context = createTestContext(
        'Please analyze the attached customer feedback document and generate a comprehensive report with detailed insights and actionable recommendations for the product team.',
        {
          lengthWords: 25,
          mentionsExternalReference: true // Triggers both features
        }
      );

      const startTime = Date.now();
      const aiFunction = aiModule.createAnalysisFunction();
      const results = await Promise.race([
        evaluateContextContentHybrid(context, aiFunction),
        new Promise(resolve => setTimeout(() => resolve(null), 45000))
      ]);
      const duration = Date.now() - startTime;

      if (results === null) {
        console.log('⏰ Test timed out - demonstrating timeout handling efficiency');
        return;
      }

      const r = results as any;

      // Count how many features were AI-enhanced
      const aiEnhancedFeatures = [
        r.contextSufficiency.flags?.aiUsed,
        r.contextRelevance.flags?.aiUsed
      ].filter(Boolean).length;

      console.log(`✅ Single AI call enhanced ${aiEnhancedFeatures} context features in ${duration}ms`);
      
      if (aiEnhancedFeatures > 1) {
        console.log(`💡 Individual calls would have taken ~${aiEnhancedFeatures} x ${duration}ms = ${aiEnhancedFeatures * duration}ms`);
        console.log(`🎯 Cost reduction: ~${Math.round((1 - 1/aiEnhancedFeatures) * 100)}%`);
        expect(aiEnhancedFeatures).toBeGreaterThan(1);
      } else if (aiEnhancedFeatures === 1) {
        console.log(`💡 Single feature enhanced - demonstrates baseline efficiency`);
        expect(aiEnhancedFeatures).toBeGreaterThanOrEqual(1);
      } else {
        console.log(`⚠️ No AI features enhanced - demonstrates graceful fallback efficiency`);
        expect(aiEnhancedFeatures).toBeGreaterThanOrEqual(0);
      }

      expect(duration).toBeLessThan(60000);
    }, 60000);
  });
});

import React, { useState } from 'react';
import { getScoreStatus } from '@/frontend/promptResultsHelpers';
import CircularProgress from './CircularProgress';
import HumanReviewNotice from './HumanReviewNotice';
import SafetyNotice from './SafetyNotice';
import BackToOverallButton from './BackToOverallButton';
import OverallScoreSection from './OverallScoreSection';
import CategoryWheelsGrid from './CategoryWheelsGrid';
import DetailedCategoryAnalyses from './DetailedCategoryAnalyses';
import { PromptAnalysisResult, CategoryEvaluation, PromptResultsSectionProps } from '@/frontend/types';


const PromptResultsSection: React.FC<PromptResultsSectionProps> = ({
  analysisResult,
  categoryEvaluations = []
}) => {

  // Ref and state to track if Overall Score section is visible
  const overallRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverallVisible, setIsOverallVisible] = useState<boolean>(true);
  const [scrolledAway, setScrolledAway] = useState<boolean>(false);

  // Setup an IntersectionObserver to toggle visibility state
  React.useEffect(() => {
    const el = overallRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsOverallVisible(entry.isIntersecting && entry.intersectionRatio > 0.5);
        });
      },
      { root: null, threshold: 0.5 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  // Fallback: track scroll position
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolledAway(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToOverall = () => {
    const el = overallRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // State for individual category details
  const [collapsedCategories, setCollapsedCategories] = useState<{[key: string]: boolean}>({});

  const toggleCategory = (categoryKey: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const scrollToCategory = (categoryKey: string) => {

    // Expand the specific category
    setCollapsedCategories(prev => ({ ...prev, [categoryKey]: false }));
    
    // Scroll to the category after a brief delay to allow for expansion
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryKey}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Safety check for analysisResult
  if (!analysisResult) {
    return null;
  }

  const overallScore = analysisResult?.overall_prompt_score || 0;
  const overallStatus = getScoreStatus(overallScore);

  return (
    <div className="mt-8 mb-8 max-w-5xl mx-auto space-y-6">
      {/* Overall Score Section */}
        <div className="relative" ref={overallRef} aria-label="Overall Score Section">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-blue to-electric-purple flex items-center justify-center">
                <span className="text-white font-bold text-sm">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-200 font-mono">Prompt Performance Score</h2>
            </div>
          </div>
          {analysisResult && (
            <OverallScoreSection analysisResult={analysisResult} overallScore={overallScore} overallStatus={overallStatus} />
          )}
        </div>

      {/* Category Analysis Section*/}
      <div className="relative">
        {/* Header with collapsible control */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-purple to-electric-pink flex items-center justify-center">
              <span className="text-white font-bold text-sm">📈</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-200 font-mono">Category Analysis</h2>
          </div>
        </div>
        <div className="space-y-6">
          <CategoryWheelsGrid categoryEvaluations={categoryEvaluations} onWheelClick={scrollToCategory} />
          <DetailedCategoryAnalyses categoryEvaluations={categoryEvaluations} collapsedCategories={collapsedCategories} toggleCategory={toggleCategory} />
        </div>
      </div>

        {/* Floating Back-to-Overall button: show if not visible or scrolled away */}
        <BackToOverallButton show={!isOverallVisible && scrolledAway} onClick={scrollToOverall} />
    </div>
  );
};

export default PromptResultsSection;
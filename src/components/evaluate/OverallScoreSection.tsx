import React from 'react';
import CircularProgress from './CircularProgress';
import HumanReviewNotice from './HumanReviewNotice';
import SafetyNotice from './SafetyNotice';
import { getScoreStatus } from '@/frontend/promptResultsHelpers';
import { PromptAnalysisResult } from '@/frontend/types';

interface OverallScoreSectionProps {
  analysisResult: PromptAnalysisResult;
  overallScore: number;
  overallStatus: ReturnType<typeof getScoreStatus>;
}

const OverallScoreSection: React.FC<OverallScoreSectionProps> = ({
  analysisResult,
  overallScore,
  overallStatus,
}) => (
  <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 shadow-xl backdrop-blur-sm">
    {/* Score Hero Section */}
    <div className="text-center mb-8">
      <div className="relative inline-block">
        <div className="relative flex justify-center mb-6">
          <CircularProgress score={overallScore} size={180} />
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-200 mb-2 font-mono">
        {analysisResult?.headline_assessment || ""}
      </h3>
      <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${overallStatus.bg} text-white`}>
        {overallStatus.status} Performance
      </div>
    </div>

    {/* Critical Alerts Section */}
    <div className="space-y-4 mb-8">
      {/* Human Review Required */}
      {analysisResult?.human_review_required && (
        <HumanReviewNotice reason={analysisResult.human_review_reason} />
      )}
      {/* Safety Status */}
      {analysisResult?.safety_status && analysisResult.safety_status !== 'pass' && (
        <SafetyNotice status={analysisResult.safety_status} note={analysisResult.safety_note} />
      )}
    </div>

    {/* Insights Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Strengths */}
      {analysisResult?.key_strengths && analysisResult.key_strengths.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-status-success/10 to-status-success/5 border border-status-success/30 p-6">
          <div className="absolute top-0 right-0 w-16 h-16 bg-status-success/20 rounded-full -mr-8 -mt-8"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-status-success flex items-center justify-center">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
              <h4 className="text-lg font-bold text-status-success font-mono">
                Key Strengths
              </h4>
            </div>
            <ul className="space-y-3">
              {analysisResult.key_strengths.map((strength, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-status-success mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300 text-sm font-mono leading-relaxed">
                    {strength}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Issues */}
      {analysisResult?.critical_issues_to_address && analysisResult.critical_issues_to_address.length > 0 && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-status-error/10 to-status-error/5 border border-status-error/30 p-6">
          <div className="absolute top-0 right-0 w-16 h-16 bg-status-error/20 rounded-full -mr-8 -mt-8"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-status-error flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚠</span>
              </div>
              <h4 className="text-lg font-bold text-status-error font-mono">
                Issues to Address
              </h4>
            </div>
            <ul className="space-y-3">
              {analysisResult.critical_issues_to_address.map((issue, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-status-error mt-2 flex-shrink-0"></div>
                  <span className="text-slate-300 text-sm font-mono leading-relaxed">
                    {issue}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default OverallScoreSection;

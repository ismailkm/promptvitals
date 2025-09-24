import React from 'react';
import { getScoreStatus } from '@/frontend/promptResultsHelpers';
import KpiStatusIcon from './KpiStatusIcon';
import ProgressBar from './ProgressBar';
import IssuesDetected from './IssuesDetected';
import ImprovementSuggestions from './ImprovementSuggestions';

interface KpiCardProps {
  kpi: {
    kpi_name_pdd: string;
    score: number;
    assessment_comment: string;
    improvement_suggestions?: string[];
    associated_mistake_keys_flagged?: Array<{
      key: string;
      name: string;
      description: string;
    }>;
  };
  index: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ kpi, index }) => {
  const kpiStatus = getScoreStatus(kpi.score);
  
  return (
    <div key={index} className="relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-600/50 p-5 backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-16 h-16 bg-electric-blue/5 rounded-full -mr-8 -mt-8"></div>
      <div className="relative">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-6 h-6 rounded-lg ${kpiStatus.bg} flex items-center justify-center`}>
              <KpiStatusIcon score={kpi.score} />
            </div>
            <h4 className="font-semibold text-slate-200 font-mono">
              {kpi.kpi_name_pdd}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${kpiStatus.color}`}>
              {kpi.score}
            </span>
            <span className="text-slate-400 text-sm">/100</span>
          </div>
        </div>
        
        <ProgressBar value={kpi.score} colorClass={kpiStatus.bg} />
        
        <p className="text-sm text-slate-300 mb-3 font-mono leading-relaxed">
          {kpi.assessment_comment}
        </p>
        
        <IssuesDetected mistakes={kpi.associated_mistake_keys_flagged || []} />
        <ImprovementSuggestions suggestions={kpi.improvement_suggestions || []} />
      </div>
    </div>
  );
};

export default KpiCard;
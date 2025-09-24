import React from 'react';
import { getScoreStatus } from '@/frontend/promptResultsHelpers';
import { CategoryEvaluation } from '@/frontend/types';
import KpiCard from './detailed/KpiCard';

interface DetailedCategoryAnalysesProps {
  categoryEvaluations: CategoryEvaluation[];
  collapsedCategories: { [key: string]: boolean };
  toggleCategory: (categoryKey: string) => void;
}

const DetailedCategoryAnalyses: React.FC<DetailedCategoryAnalysesProps> = ({
  categoryEvaluations,
  collapsedCategories,
  toggleCategory,
}) => (
  <div className="space-y-4">
    {categoryEvaluations.slice(0, 4).map((category) => (
      <div 
        key={category.category_key} 
        id={`category-${category.category_key}`}
        className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm overflow-hidden"
      >
        {/* Category Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-xl font-bold text-slate-200 font-mono">
                  {category.category_name}
                </h3>
                <p className="text-slate-400 text-sm font-mono">
                  {category.description}
                </p>
              </div>
              <div className="ml-auto flex items-center space-x-3">
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreStatus(category.category_score).color}`}>
                    {category.category_score}
                  </div>
                  <div className="text-sm text-slate-400 font-mono">/ 100</div>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggleCategory(category.category_key)}
              className="ml-4 px-2 py-1 rounded-lg text-sm md:text-2xl bg-slate-700 hover:bg-slate-600 text-electric-purple hover:text-electric-pink font-mono transition-all duration-200 border border-slate-600"
            >
              {collapsedCategories[category.category_key] ? '+' : '-'}
            </button>
          </div>
        </div>

        {/* Category KPI Details */}
        {!collapsedCategories[category.category_key] && (
          <div className="p-6">
            <div className="space-y-4">
              {category.kpi_evaluations.map((kpi, index) => (
                <KpiCard key={index} kpi={kpi} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

export default DetailedCategoryAnalyses;

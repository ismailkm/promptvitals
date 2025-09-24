import React from 'react';
import CircularProgress from './CircularProgress';
import { getScoreStatus } from '@/frontend/promptResultsHelpers';
import { CategoryEvaluation } from '@/frontend/types';

interface CategoryWheelsGridProps {
  categoryEvaluations: CategoryEvaluation[];
  onWheelClick: (categoryKey: string) => void;
}

const CategoryWheelsGrid: React.FC<CategoryWheelsGridProps> = ({ categoryEvaluations, onWheelClick }) => (
  <div className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 shadow-xl backdrop-blur-sm">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categoryEvaluations.slice(0, 4).map((category) => {
        const status = getScoreStatus(category.category_score);
        return (
          <div 
            key={category.category_key} 
            className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={() => onWheelClick(category.category_key)}
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 p-6 hover:border-electric-purple/50 transition-all duration-300 flex flex-col justify-between items-center">
              <div className="absolute top-0 right-0 w-12 h-12 bg-electric-purple/10 rounded-full -mr-6 -mt-6 group-hover:bg-electric-purple/20 transition-colors duration-300"></div>
              <div className="relative text-center w-full flex flex-col items-center justify-center flex-1">
                <h4 className="text-base h-10 font-semibold text-slate-200 mb-6 font-mono group-hover:text-electric-purple transition-colors duration-300 break-words" style={{ fontSize: '1rem', lineHeight: '1.2', maxWidth: '90%' }}>
                  {category.category_name}
                </h4>
                <div className="flex justify-center mb-6">
                  <CircularProgress score={category.category_score} size={100} />
                </div>
                <div className={`inline-block px-3 py-2 rounded-full text-sm font-medium font-mono ${status.bg} text-white transition-all duration-300`}>
                  {status.status}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default CategoryWheelsGrid;

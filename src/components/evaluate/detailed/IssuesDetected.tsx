import React from 'react';

interface Mistake {
  key: string;
  name: string;
  description: string;
}

interface IssuesDetectedProps {
  mistakes: Mistake[];
}

const IssuesDetected: React.FC<IssuesDetectedProps> = ({ mistakes }) => {
  if (!mistakes || mistakes.length === 0) return null;
  return (
    <div className="bg-red-900/10 rounded-lg p-4 border-l-4 border-red-500 backdrop-blur-sm mb-3">
      <h5 className="text-sm font-semibold text-red-400 mb-2 font-mono flex items-center">
        <span className="mr-2">⚠️</span>
        Issues Detected
      </h5>
      <ul className="space-y-2">
        {mistakes.map((mistake, idx) => (
          <li key={mistake.key || idx} className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
            <div className="text-sm text-slate-300 font-mono leading-relaxed">
              <span className="font-semibold text-red-300">{mistake.name}:</span> {mistake.description}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default IssuesDetected;

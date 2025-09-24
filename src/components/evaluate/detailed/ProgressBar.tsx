import React from 'react';

interface ProgressBarProps {
  value: number;
  colorClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, colorClass }) => {
  return (
    <div className="w-full bg-slate-700 rounded-full h-2 mb-4 overflow-hidden">
      <div
        className={`h-2 rounded-full ${colorClass} transition-all duration-1000 ease-out`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;

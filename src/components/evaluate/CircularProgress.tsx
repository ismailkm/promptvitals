import React from 'react';
import { getScoreStatus } from '@/frontend/promptResultsHelpers';

interface CircularProgressProps {
  score: number;
  size?: number;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ score, size = 120 }) => {
  const status = getScoreStatus(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-slate-700"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className={`${status.color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-2xl font-bold ${status.color}`}>{score}</div>
          <div className="text-sm text-slate-400 font-medium">/ 100</div>
        </div>
      </div>
    </div>
  );
};

export default CircularProgress;

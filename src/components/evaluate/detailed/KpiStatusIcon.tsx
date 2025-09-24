import React from 'react';

interface KpiStatusIconProps {
  score: number;
}

function getKpiStatusSymbol(score: number): string {
  if (score >= 80) return '✓';
  if (score >= 60) return '○';
  if (score >= 40) return '△';
  return '✕';
}

const KpiStatusIcon: React.FC<KpiStatusIconProps> = ({ score }) => (
  <span className="text-white font-bold text-xs">
    {getKpiStatusSymbol(score)}
  </span>
);

export default KpiStatusIcon;

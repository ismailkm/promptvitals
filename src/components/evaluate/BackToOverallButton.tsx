import React from 'react';

interface BackToOverallButtonProps {
  show: boolean;
  onClick: () => void;
}

const BackToOverallButton: React.FC<BackToOverallButtonProps> = ({ show, onClick }) => {
  if (!show) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Back to Overall Score"
      className="fixed right-6 bottom-8 z-50 flex items-center space-x-2 bg-electric-blue hover:bg-electric-blue/90 text-white px-4 py-2 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-electric-blue"
    >
      <span className="w-5 h-5 inline-block">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75L12 5.25l7.5 7.5M12 5.25v13.5" />
        </svg>
      </span>
      <span className="font-mono text-sm">Overall Score</span>
    </button>
  );
};

export default BackToOverallButton;

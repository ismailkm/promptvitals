import React from 'react';

interface ImprovementSuggestionsProps {
  suggestions: string[];
}

const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="bg-electric-blue/10 rounded-lg p-4 border-l-4 border-electric-blue backdrop-blur-sm">
      <h5 className="text-sm font-semibold text-electric-blue mb-2 font-mono flex items-center">
        <span className="mr-2">💡</span>
        Improvement Suggestions
      </h5>
      <ul className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <li key={idx} className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-electric-blue mt-2 flex-shrink-0"></div>
            <span className="text-sm text-slate-300 font-mono leading-relaxed">
              {suggestion}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ImprovementSuggestions;

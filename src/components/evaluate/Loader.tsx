
import React from 'react';

interface LoaderProps {
  isLoading?: boolean; // Optional, in case you want to use it later
  errorMessage?: string | null;
}

const Loader: React.FC<LoaderProps> = ({ isLoading, errorMessage }) => (
  <div className="my-8 max-w-5xl mx-auto">
    <div className="bg-slate-800 rounded-xl border border-slate-600 shadow-2xl overflow-hidden">
      <div className="p-6 bg-slate-900 border-b border-slate-700">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-status-error"></div>
          <div className="w-3 h-3 rounded-full bg-status-warning"></div>
          <div className="w-3 h-3 rounded-full bg-status-success"></div>
        </div>
      </div>
      <div className="p-8 bg-slate-800 text-center">
        {
          (isLoading) && (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue mx-auto mb-4"></div>
          )
        }

        {errorMessage ? (
          <>
            <p className="text-red-400 font-mono text-lg mb-2">{'Oops! Something went wrong. 🤖💥'}</p>
            <p className="text-slate-400 font-mono text-sm mt-2">{'# Please try again or check your prompt.'}</p>
          </>
        ) : (
          <>
            <p className="text-slate-200 font-mono">{'>'} Analyzing your prompt...</p>
            <p className="text-slate-400 font-mono text-sm mt-2">{'# This may take a few seconds'}</p>
          </>
        )}
      </div>
    </div>
  </div>
);

export default Loader;

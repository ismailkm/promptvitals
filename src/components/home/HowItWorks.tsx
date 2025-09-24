'use client';

import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-cyber-dark mb-4">
            {'Your Prompt Debugger'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-mono">
            Input your AI instruction. Our system meticulously evaluates its <strong>Clarity</strong>, <strong>Specificity</strong>, <strong>Contextual relevance</strong>, and <strong>Goal Alignment</strong>, leveraging core PromptVitals indicators for a comprehensive initial assessment.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Box 1: The Input Step */}
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">1</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Craft, Analyze & Refine Your Prompt</h3>
            <p className="text-gray-600 font-mono">
              Instantly receive expert guidelines and actionable feedback to build clear, effective AI instructions from the very first draft.
            </p>
          </div>

          {/* Box 2: The Feedback Step */}
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">2</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Get Vitals & Actionable Feedback</h3>
            <p className="text-gray-600 font-mono">
              Obtain your in-depth PromptVitals Scorecard, providing individual ratings across all key indicators. Understand your prompt's strengths and pinpoint precise areas needing refinement with clear, targeted guidance.
            </p>
          </div>

          {/* Box 3: The Iteration Step */}
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">3</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Iterate & Optimize Your AI Output</h3>
            <p className="text-gray-600 font-mono">
              Implement our AI-driven improvement suggestions to refine your prompt. Rerun the analysis to witness tangible enhancements in your PromptVitals score and predicted AI response quality.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
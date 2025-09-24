'use client';

import React from 'react';

const Features: React.FC = () => {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-cyber-dark mb-4">
            {'$ ./features.sh'}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-mono">
            Powerful features to take your prompts to the next level
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">💡</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Clarity & Purpose</h3>
            <p className="text-gray-600 font-mono">
              Evaluates the clarity of the prompt's language, the clear definition of its intended goal, and if instructions are easy to follow.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🧩</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Instructions & Structure</h3>
            <p className="text-gray-600 font-mono">
              Assesses the prompt's organization, task breakdown, formatting, use of examples, tone/style guidance, and design for refinement.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🌐</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Context & Content Richness</h3>
            <p className="text-gray-600 font-mono">
              Evaluates the sufficiency, accuracy, and relevance of the context provided in the prompt to enable effective AI performance.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">✅</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Goal Alignment</h3>
            <p className="text-gray-600 font-mono">
              Assesses how well the prompt's instructions and expected output align with the user's intended goal.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🎨</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Tone & Style Guidance</h3>
            <p className="text-gray-600 font-mono">
              Evaluates whether the prompt provides clear guidance on tone, style, and creativity, ensuring the AI's response matches the desired communication style.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🔢</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Length Constraints</h3>
            <p className="text-gray-600 font-mono">
              Assesses whether the prompt specifies output length, word count, or other constraints to ensure predictable and useful responses.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🔁</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Iterative Potential</h3>
            <p className="text-gray-600 font-mono">
              Evaluates if the prompt is designed for easy refinement and iteration, supporting ongoing improvement and adaptability.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🛡️</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Safety & Ethics</h3>
            <p className="text-gray-600 font-mono">
              Assesses the prompt for ethical considerations, potential biases, safety, and responsible use, including prevention of misuse.
            </p>
          </div>
          <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
            <div className="text-cyber-dark font-mono text-2xl font-bold mb-4">🏆</div>
            <h3 className="font-mono text-xl font-bold text-cyber-dark mb-3">Overall Prompt Quality</h3>
            <p className="text-gray-600 font-mono">
              Provides a single, weighted score representing the overall health and effectiveness of your prompt based on all key indicators.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
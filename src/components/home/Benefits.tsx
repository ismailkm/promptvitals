'use client';

import React from 'react';

const Benefits: React.FC = () => {
  return (
    <section id="why-us" className="py-20 px-4 sm:px-6 lg:px-8 bg-cyber-dark bg-cyber-grid">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-neon-blue mb-4">
            {'Unlock the Power of PromptVitals'}
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto font-mono">
            See how PromptVitals helps you get the most out of your AI interactions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-cyber-gray p-8 rounded-xl border border-neon-blue/30">
            <div className="text-neon-blue font-mono text-2xl font-bold mb-4">01</div>
            <h3 className="font-mono text-xl font-bold text-neon-blue mb-3">Achieve Superior AI Output</h3>
            <p className="text-gray-300 font-mono">
              Leverage our detailed KPI-driven analysis and actionable feedback to craft prompts that elicit significantly more <strong>accurate</strong>, <strong>relevant</strong>, and <strong>contextually appropriate</strong> responses from AI models.
            </p>
          </div>

          <div className="bg-cyber-gray p-8 rounded-xl border border-neon-blue/30">
            <div className="text-neon-blue font-mono text-2xl font-bold mb-4">02</div>
            <h3 className="font-mono text-xl font-bold text-neon-blue mb-3">Optimize Efficiency & Reduce Waste</h3>
            <p className="text-gray-300 font-mono">
              Minimize trial-and-error and computational costs. PromptVitals' <strong>instant diagnostics</strong> help you quickly refine your prompts, saving valuable time and resources in your AI interactions.
            </p>
          </div>

          <div className="bg-cyber-gray p-8 rounded-xl border border-neon-blue/30">
            <div className="text-neon-blue font-mono text-2xl font-bold mb-4">03</div>
            <h3 className="font-mono text-xl font-bold text-neon-blue mb-3">Master Prompt Engineering</h3>
            <p className="text-gray-300 font-mono">
              Gain a deeper understanding of <strong>how AI models interpret prompts</strong> through our comprehensive KPI breakdowns and improvement guidance, ultimately enhancing your skills for effective and responsible AI communication.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Benefits;
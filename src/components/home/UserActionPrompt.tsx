'use client';

import React from 'react';
import { Button } from '../ui/button';

const CallToAction: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cyber-dark bg-cyber-grid">
      <div className="container mx-auto text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-mono text-3xl md:text-4xl font-bold text-neon-blue mb-6 animate-glow">
            {'* /join>>movement.sh'}
          </h2>
          <p className="font-mono text-xl text-gray-300 mb-8">
            <span className="text-terminal-green mr-2">✅</span> 
             Don't just prompt—participate in AI’s evolution. Join the PromptVitals movement, refine strategies, and gain cutting-edge insights in prompt engineering.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button // Changed component name
              variant="neon"
              size="lg"
            >
              {'RUN ./login'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};



export default CallToAction;
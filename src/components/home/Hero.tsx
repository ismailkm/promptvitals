'use client';

import React from 'react';
import PromptInputSection from '../evaluate/PromptInputSection';
import { Button } from "../ui/button";
import { useRouter } from 'next/navigation'; // Import useRouter

const Hero: React.FC = () => {
  const router = useRouter(); // Initialize router

  const handleHowItWorksClick = () => {
    const howItWorksSection = document.getElementById('how-it-works');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Modify this function to navigate instead of scroll
  const handleCheckPromptClick = () => {
    router.push('/evaluate'); // Navigate to the new evaluation page
  };

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-cyber-dark bg-cyber-grid">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-neon-blue leading-tight mb-6 animate-glow">
            Unleash the Full Potential of Your AI Prompts ✨
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed font-mono">
            <span className="text-terminal-green">$</span> Get instant, actionable insights based on key <strong>quality indicators</strong>. Identify weaknesses, boost clarity, and improve accuracy for optimal AI responses every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="neon" size="lg" onClick={handleCheckPromptClick}>
              {'> Check Your Prompt Now'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
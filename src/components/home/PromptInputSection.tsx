import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { mockSummaryData } from '@/data/summary';

const placeholders = [
  "Summarize the key points of an article.",
  "Rewrite this prompt for better clarity.",
  "Generate a persuasive email for a product launch.",
];

const tips = [
  "Tip: Be specific with your desired output format.",
  "Tip: Provide context for better results.",
  "Tip: Experiment with different phrasing.",
];

interface PromptInputSectionProps {
  onAnalysisResult?: (result: any) => void;
  onLoadingChange?: (loading: boolean) => void;
  useTestData?: boolean;
}

const PromptInputSection: React.FC<PromptInputSectionProps> = ({
  onAnalysisResult,
  onLoadingChange,
  useTestData = false
}) => {
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [promptInput, setPromptInput] = useState('');
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const [tipOpacity, setTipOpacity] = useState(0);

  useEffect(() => {
    const placeholderInterval = setInterval(() => {
      setPlaceholderOpacity(0);
      setTimeout(() => {
        setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length);
        setPlaceholderOpacity(1);
      }, 500); // Fade out duration
    }, 3000); // Total interval including fade

    return () => clearInterval(placeholderInterval);
  }, []);

  useEffect(() => {
    // Initial fade-in for the first tip
    setTipOpacity(1);

    const tipInterval = setInterval(() => {
      setTipOpacity(0);
      setTimeout(() => {
        setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
        setTipOpacity(1);
      }, 500); // Fade out duration
    }, 5000); // Total interval including fade

    return () => clearInterval(tipInterval);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptInput(event.target.value);
  };

  const handleAnalyzePrompt = async () => {
    if (promptInput.length < 10) return;
    
    try {
      onLoadingChange?.(true);
      
      if (useTestData) {
        // Simulate API delay for testing
        setTimeout(() => {
          onAnalysisResult?.(mockSummaryData);
          onLoadingChange?.(false);
        }, 2000);
        return;
      }
      
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze prompt');
      }

      const data = await response.json();
      onAnalysisResult?.(data);
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      // You can add error handling UI here
    } finally {
      onLoadingChange?.(false);
    }
  };

  const buttonText = promptInput.length >= 10 ? "> Optimize This Prompt" : "> Get Prompt Vitals";
  const isButtonDisabled = promptInput.length < 10;

  return (
    <div id="prompt-input-section" className="mt-16 mb-16 max-w-5xl mx-auto">
      <div className="bg-cyber-gray rounded-xl border border-neon-blue shadow-[0_0_15px_rgba(0,255,245,0.3)] overflow-hidden">
        <div className="p-6 bg-cyber-black border-b border-neon-blue/30">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-terminal-red"></div>
            <div className="w-3 h-3 rounded-full bg-terminal-yellow"></div>
            <div className="w-3 h-3 rounded-full bg-terminal-green"></div>
          </div>
        </div>
        <div className="p-6">
          <span className="block text-lg font-medium mb-2 text-neon-purple">{'> Enter your AI Prompt for Instant Analysis'}</span>
          <span className="text-sm">{"# Get instant feedback to improve clarity, precision, and impact—turn your ideas into high-performing AI prompts."}</span>
          <textarea
            id="prompt-input-textarea"
            className="w-full h-40 p-4 bg-cyber-black text-gray-300 font-mono border-2 border-dashed border-neon-blue/30 rounded-lg focus:outline-none focus:border-neon-blue placeholder-gray-500"
            placeholder={placeholders[currentPlaceholderIndex]}
            value={promptInput}
            onChange={handleInputChange}
            aria-label="AI Prompt Input"
          ></textarea>
          <div className="mt-2 text-sm text-gray-400 font-mono transition-opacity duration-500" style={{ opacity: tipOpacity }}>
            {tips[currentTipIndex]}
          </div>
          <div className="mt-6 text-center">
            <Button 
              variant="solid-neon" 
              size="lg" 
              disabled={isButtonDisabled}
              onClick={handleAnalyzePrompt}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptInputSection;
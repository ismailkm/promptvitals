'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PromptInputSection from '@/components/evaluate/PromptInputSection';
import PromptResultsSection from '@/components/evaluate/PromptResultsSection';
import Loader from '@/components/evaluate/Loader';

const PromptEvaluationPage: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalysisResult = (result: any, error?: string) => {
    if (error) {
      setErrorMessage(error);
      setAnalysisResult(null);
    } else {
      setErrorMessage(null);
      setAnalysisResult(result);
    }
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="min-h-screen bg-white"> {/* Adjust background as needed */}
      <Header />
      <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 bg-cyber-dark bg-cyber-grid"> 
        <div className="container mx-auto">
          {/* Hero Section for Evaluation Page */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold text-neon-blue leading-tight mb-6 animate-glow">
              Elevate Your AI Prompts—Unlock Peak Performance
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-mono">
              Get actionable feedback across <b>Clarity, Structure, Context, and Safety</b> to optimize your AI results instantly.
            </p>
          </div>

          {/* Prompt Input Section */}
          <PromptInputSection 
            onAnalysisResult={handleAnalysisResult}
            onLoadingChange={handleLoadingChange}
            useTestData={true} // Set to false to use real API
          />

          {(isLoading || errorMessage) && <Loader errorMessage={errorMessage} isLoading={isLoading} />}

          {/* Analysis Results Section */}
          {(analysisResult && !isLoading) && (
            <PromptResultsSection
              analysisResult={analysisResult?.data?.prompt_analysis_report?.overall_summary || null}
              categoryEvaluations={analysisResult?.data?.prompt_analysis_report?.main_category_evaluations || []}
            />
          )}
        </div>

        {/* New On-Brand Value Section */}
        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8 animate-fadeIn">
          <div className="container mx-auto text-center">
            <h2 className="font-mono text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              A Linter for Humans
            </h2>
            <p className="text-lg md:text-xl text-gray-700 mb-10 leading-relaxed font-mono">
              Every prompt is evaluated using a battle-tested framework trusted by expert prompt engineers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-8">
              <div className="flex flex-col items-center text-center">
                <span className="text-cyber-dark text-4xl mb-4 font-mono">🏆</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-mono">Achieve Superior AI Output</h3>
                <p className="text-gray-700 font-mono">Leverage our detailed, KPI-driven analysis to craft prompts that elicit significantly more accurate and relevant responses.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-cyber-dark text-4xl mb-4 font-mono">🔢</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-mono">Optimize Efficiency & Reduce Waste</h3>
                <p className="text-gray-700 font-mono">Minimize trial-and-error. Our instant diagnostics help you quickly refine your prompts, saving valuable time and tokens.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-cyber-dark text-4xl mb-4 font-mono">🧩</span>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-mono">Master Prompt Engineering</h3>
                <p className="text-gray-700 font-mono">Gain a deeper understanding of how AI models interpret prompts through our comprehensive breakdowns and improvement guidance.</p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default PromptEvaluationPage;
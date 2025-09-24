import React from 'react';
import Header from '@/components/Header';
import Hero from '@/components/home/Hero';
import HowItWorks from '@/components/home/HowItWorks';
import Benefits from '@/components/home/Benefits';
import Features from '@/components/home/Features';
import CallToAction from '@/components/home/UserActionPrompt';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Features />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}

export default App;
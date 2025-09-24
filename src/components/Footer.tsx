'use client';

import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute('href')?.substring(1);
    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: 'smooth',
        });
      }
    }
  };

  const handleScrollToTop = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Home', href: '#' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Why PromptVitals', href: '#why-us' },
        { name: 'Features', href: '#features' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Contact', href: '#' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '#' },
        { name: 'API', href: '#' },
        { name: 'Guides', href: '#' },
        { name: 'Support', href: '#' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cookie Policy', href: '#' },
      ]
    }
  ];

  return (
    <footer className="bg-cyber-black text-gray-300 pt-16 pb-8 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-6">
              <div className="text-2xl font-bold text-neon-blue mb-4">PromptVitals</div>
              <p className="text-gray-400 mb-4">
                {"// Your AI prompt health checker. Get the most out of your AI interactions with optimized prompts."}
              </p>
            </div>
          </div>
          
          {footerLinks.map((section, index) => (
            <div key={index}>
              <h3 className="text-lg font-semibold text-neon-purple mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-neon-blue transition-colors"
                      onClick={link.href === '#' ? handleScrollToTop : handleSmoothScroll}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-neon-blue/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 mb-4 md:mb-0">
            {"// © "}{currentYear} PromptVitals. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-gray-400 hover:text-neon-blue transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
'use client';

import React, { useState, useEffect } from 'react';
import { MenuIcon, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Remove handleSmoothScroll and handleScrollToTop functions
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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-md py-3'
          : 'bg-white py-5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
              <span className="text-xl mr-2 text-blue-600">🩺</span>
              <span className="text-xl font-bold text-blue-600">PromptVitals</span>
           </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className={`font-medium transition-colors hover:text-blue-600 ${pathname === '/' ? 'text-blue-600' : 'text-gray-700'}`}>
              Home
            </Link>
            <Link href="/evaluate" className={`font-medium transition-colors hover:text-blue-600 ${pathname === '/evaluate' ? 'text-blue-600' : 'text-gray-700'}`}>
              Check Your Prompt
            </Link>
          </nav>

          <div className="hidden md:block">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white px-4 pt-2 pb-4 shadow-lg">
          <nav className="flex flex-col space-y-2">
            <Link href="/" className={`block font-medium transition-colors hover:text-blue-600 py-2 ${pathname === '/' ? 'text-blue-600' : 'text-gray-700'}`} onClick={toggleMenu}>
              Home
            </Link>
            <Link href="/evaluate" className={`block font-medium transition-colors hover:text-blue-600 py-2 ${pathname === '/evaluate' ? 'text-blue-600' : 'text-gray-700'}`} onClick={toggleMenu}>
              Check Your Prompt
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
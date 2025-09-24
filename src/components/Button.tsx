'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'neon' | 'cyber' | 'terminal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'neon',
  size = 'md',
  className = '',
  onClick,
}) => {
  const baseClasses = 'font-mono rounded transition-all duration-300 inline-flex items-center justify-center border';
  
  const variantClasses = {
    neon: 'bg-transparent border-neon-blue text-neon-blue hover:bg-neon-blue/10 hover:shadow-[0_0_15px_rgba(0,255,245,0.5)]',
    cyber: 'bg-cyber-gray border-neon-purple text-neon-purple hover:bg-neon-purple/10 hover:shadow-[0_0_15px_rgba(191,0,255,0.5)]',
    terminal: 'bg-terminal-green/10 border-terminal-green text-terminal-green hover:bg-terminal-green/20',
  };
  
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'px-5 py-2.5',
    lg: 'text-lg px-7 py-3',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button className={classes} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
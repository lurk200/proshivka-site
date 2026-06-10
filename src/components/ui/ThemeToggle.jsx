import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden transition-all duration-500 ease-premium hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-10px_rgba(132,204,22,0.2)] focus:outline-none focus:ring-2 focus:ring-[#84CC16]/50 group"
      aria-label="Toggle theme"
    >
      {/* Hover свечение */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#84CC16]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      {/* Иконка светлой темы */}
      <Sun 
        className={`absolute w-5 h-5 transition-all duration-500 ease-premium ${
          theme === 'light' ? 'opacity-100 rotate-0 scale-100 text-[#84CC16]' : 'opacity-0 -rotate-90 scale-50 text-[var(--text-secondary)]'
        }`} 
      />
      
      {/* Иконка темной темы */}
      <Moon 
        className={`absolute w-5 h-5 transition-all duration-500 ease-premium ${
          theme === 'dark' ? 'opacity-100 rotate-0 scale-100 group-hover:text-[#84CC16] text-[var(--text-secondary)]' : 'opacity-0 rotate-90 scale-50 text-[var(--text-secondary)]'
        }`} 
      />
    </button>
  );
}
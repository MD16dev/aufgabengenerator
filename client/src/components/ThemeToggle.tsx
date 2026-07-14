import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isLight, setIsLight] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) {
      return saved === 'light';
    }
    // Fallback to system preference (prefers-color-scheme)
    return window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isLight) {
      root.classList.add('light');
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  return (
    <button
      onClick={() => setIsLight(!isLight)}
      className="p-2.5 bg-theme-card hover:bg-purple-500/10 border border-theme-border rounded-xl text-theme-muted hover:text-purple-600 transition-all cursor-pointer shadow-sm flex items-center justify-center"
      aria-label="Theme umschalten"
      id="theme-toggle-btn"
    >
      {isLight ? (
        <Sun className="w-5 h-5 transition-transform hover:scale-110 text-amber-500" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:rotate-12 text-purple-400" />
      )}
    </button>
  );
};

export default ThemeToggle;

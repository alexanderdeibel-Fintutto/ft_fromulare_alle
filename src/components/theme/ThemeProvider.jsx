import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isSystemPreference, setIsSystemPreference] = useState(true);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('app_theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (stored) {
      setTheme(stored);
      setIsSystemPreference(false);
    } else {
      setTheme(prefersLight ? 'light' : 'dark');
      setIsSystemPreference(true);
    }
  }, []);

  // Listen to system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (isSystemPreference) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isSystemPreference]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    if (theme === 'dark') {
      root.style.colorScheme = 'dark';
    } else {
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsSystemPreference(false);
    localStorage.setItem('app_theme', newTheme);
  };

  const setThemeMode = (mode) => {
    setTheme(mode);
    setIsSystemPreference(false);
    localStorage.setItem('app_theme', mode);
  };

  const useSystemPreference = () => {
    setIsSystemPreference(true);
    localStorage.removeItem('app_theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(prefersLight ? 'light' : 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    setThemeMode,
    useSystemPreference,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
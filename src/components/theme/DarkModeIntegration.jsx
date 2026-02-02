import React, { useEffect } from 'react';
import { useTheme } from './ThemeProvider';

/**
 * Dark Mode Integration
 * Applies theme to tailwind classes
 */

export function useDarkMode() {
  const { isDark } = useTheme();

  return {
    isDark,
    bg: isDark ? 'bg-gray-900' : 'bg-white',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
    input: isDark 
      ? 'bg-gray-800 text-gray-100 border-gray-700' 
      : 'bg-white text-gray-900 border-gray-300',
    card: isDark
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-gray-200'
  };
}

export function DarkModeWrapper({ children, className = '' }) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`${isDark ? 'dark' : 'light'} ${className}`}>
      {children}
    </div>
  );
}

export default useDarkMode;
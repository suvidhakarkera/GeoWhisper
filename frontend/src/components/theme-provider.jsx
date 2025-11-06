'use client';

import * as React from 'react';

const ThemeContext = React.createContext({
  theme: 'dark',
  setTheme: () => null,
});

export function ThemeProvider({ children, defaultTheme = 'dark', storageKey = 'geowhisper-theme' }) {
  const [theme, setTheme] = React.useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      return stored || defaultTheme;
    }
    return defaultTheme;
  });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem(storageKey, theme);
  }, [theme, storageKey, mounted]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme);
    },
  };

  // Prevent flash of unstyled content
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

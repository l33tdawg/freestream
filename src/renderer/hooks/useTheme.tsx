import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  /** Returns a tinted background using the platform color, appropriate for current theme */
  platformBg: (hex: string, opacity?: number) => string;
}

const defaultPlatformBg = (hex: string, opacity = 0.09): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const defaultValue: ThemeContextValue = {
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  platformBg: defaultPlatformBg,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Load theme from settings on mount
  useEffect(() => {
    window.freestream.getSettings().then((settings) => {
      if (settings?.theme) {
        setTheme(settings.theme);
        applyThemeClass(settings.theme);
      }
    });
  }, []);

  // Apply class whenever theme changes
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyThemeClass(next);
    window.freestream.updateSettings({ theme: next });
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, platformBg: defaultPlatformBg }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

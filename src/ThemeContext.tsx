import React, { createContext, useContext, useState, useEffect } from 'react';
import { TextScaleOption } from './types';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  textScale: TextScaleOption;
  setTextScale: (scale: TextScaleOption) => void;
}

const VALID_SCALES: TextScaleOption[] = [0.9, 1.0, 1.1, 1.2];

function normalizeTextScale(raw: unknown): TextScaleOption {
  const num = Number(raw);
  const found = VALID_SCALES.find((s) => Math.abs(s - num) < 0.01);
  return found ?? 1.0;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('mta_theme') || localStorage.getItem('shelf_audit_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'dark'; // Dark mode is default
    } catch {
      return 'dark';
    }
  });

  const [textScale, setTextScaleState] = useState<TextScaleOption>(() => {
    try {
      const saved = localStorage.getItem('mta_text_scale');
      return normalizeTextScale(saved);
    } catch {
      return 1.0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mta_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('mta_text_scale', String(textScale));
      document.documentElement.style.setProperty('--marviz-text-scale', String(textScale));
      document.documentElement.style.fontSize = `${Math.round(16 * textScale * 100) / 100}px`;
      document.documentElement.setAttribute('data-text-scale', String(textScale));
    } catch {
      // ignore
    }
  }, [textScale]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const setTextScale = (scale: TextScaleOption) => {
    setTextScaleState(normalizeTextScale(scale));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        textScale,
        setTextScale
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

const defaultThemeContext: ThemeContextType = {
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  textScale: 1.0,
  setTextScale: () => {}
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context || defaultThemeContext;
};

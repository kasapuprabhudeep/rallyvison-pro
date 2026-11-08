import React, { createContext, useContext, useState, useEffect } from 'react';

export type BadmintonTheme = 'emerald' | 'cyber' | 'arena';

interface ThemeContextType {
  theme: BadmintonTheme;
  setTheme: (theme: BadmintonTheme) => void;
  themeName: string;
  themeDescription: string;
}

const THEME_DETAILS: Record<BadmintonTheme, { name: string; description: string }> = {
  emerald: {
    name: 'Midnight Cobalt & Cyan',
    description: 'Mesmerizing tournament midnight cobalt with electric cyan spotlights'
  },
  cyber: {
    name: 'Cyber Hawk-Eye Laser',
    description: 'High-contrast neon cyan & indigo laser telemetry'
  },
  arena: {
    name: 'Tokyo Championship Gold',
    description: 'Olympic stadium navy with championship gold crest'
  }
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'emerald',
  setTheme: () => {},
  themeName: THEME_DETAILS.emerald.name,
  themeDescription: THEME_DETAILS.emerald.description
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<BadmintonTheme>(() => {
    const saved = localStorage.getItem('rallyvision_badminton_theme') as BadmintonTheme;
    return saved && THEME_DETAILS[saved] ? saved : 'emerald';
  });

  const setTheme = (newTheme: BadmintonTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('rallyvision_badminton_theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themeName: THEME_DETAILS[theme].name,
        themeDescription: THEME_DETAILS[theme].description
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useBadmintonTheme = () => useContext(ThemeContext);


import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'ltvquiz_theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey) as Theme;
      return stored || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    const isDark = theme === 'dark' || (theme === 'system' && mediaQuery?.matches);
    return isDark ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (animateAtomic: boolean) => {
      if (animateAtomic) {
        root.classList.add('theme-switching');
      }
      root.classList.remove('light', 'dark');

      const isDark =
        theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      const computedTheme: 'dark' | 'light' = isDark ? 'dark' : 'light';

      root.classList.add(computedTheme);
      setResolvedTheme(computedTheme);

      if (animateAtomic) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            root.classList.remove('theme-switching');
          });
        });
      }
    };

    applyTheme(true);

    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme(true);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        setThemeState(e.newValue as Theme);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme, storageKey]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {}
      setThemeState(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

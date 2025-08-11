import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { designSystem, themes, Theme } from '../styles/designSystem';

interface ThemeContextType {
  currentTheme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Проверяем сохраненную тему или системные настройки
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Автоматическое определение темы по системным настройкам
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  const isDark = currentTheme === 'dark';

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem('theme', theme);
    
    // Обновляем CSS переменные для глобального использования
    const root = document.documentElement;
    const themeColors = themes[theme];
    
    root.style.setProperty('--bg-primary', themeColors.background.primary);
    root.style.setProperty('--bg-secondary', themeColors.background.secondary);
    root.style.setProperty('--bg-tertiary', themeColors.background.tertiary);
    root.style.setProperty('--text-primary', themeColors.text.primary);
    root.style.setProperty('--text-secondary', themeColors.text.secondary);
    root.style.setProperty('--text-tertiary', themeColors.text.tertiary);
    root.style.setProperty('--border-primary', themeColors.border.primary);
    root.style.setProperty('--border-secondary', themeColors.border.secondary);
  };

  // Слушаем изменения системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Применяем тему при загрузке
  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  // Конфигурация Ant Design темы
  const antdThemeConfig = {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: designSystem.colors.primary[500],
      colorSuccess: designSystem.colors.success[500],
      colorWarning: designSystem.colors.warning[500],
      colorError: designSystem.colors.danger[500],
      colorInfo: designSystem.colors.info[500],
      
      borderRadius: parseInt(designSystem.borderRadius.lg.replace('rem', '')) * 16,
      
      fontFamily: designSystem.typography.fontFamily.primary,
      fontSize: parseInt(designSystem.typography.fontSize.base.replace('rem', '')) * 16,
      
      // Улучшенные компоненты
      controlHeight: 40,
      controlHeightSM: 32,
      controlHeightLG: 48,
      
      // Более современные тени
      boxShadow: designSystem.shadows.md,
      boxShadowSecondary: designSystem.shadows.sm,
    },
    components: {
      Layout: {
        headerBg: isDark ? themes.dark.background.secondary : themes.light.background.primary,
        bodyBg: isDark ? themes.dark.background.primary : themes.light.background.secondary,
        siderBg: isDark ? themes.dark.background.secondary : themes.light.background.primary,
      },
      Card: {
        borderRadiusLG: parseInt(designSystem.borderRadius['2xl'].replace('rem', '')) * 16,
      },
      Button: {
        borderRadiusLG: parseInt(designSystem.borderRadius.xl.replace('rem', '')) * 16,
        controlHeight: 44,
        controlHeightSM: 36,
        controlHeightLG: 52,
      },
      Input: {
        borderRadiusLG: parseInt(designSystem.borderRadius.lg.replace('rem', '')) * 16,
        controlHeight: 44,
        controlHeightSM: 36,
        controlHeightLG: 52,
      },
      Menu: {
        borderRadius: parseInt(designSystem.borderRadius.lg.replace('rem', '')) * 16,
      },
      Modal: {
        borderRadiusLG: parseInt(designSystem.borderRadius['2xl'].replace('rem', '')) * 16,
      },
    },
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, toggleTheme, setTheme, isDark }}>
      <ConfigProvider theme={antdThemeConfig}>
        <div className={`theme-${currentTheme}`} style={{ minHeight: '100vh' }}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

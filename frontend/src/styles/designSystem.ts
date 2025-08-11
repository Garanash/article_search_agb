// 🎨 Современная система дизайна следуя лучшим практикам

export const designSystem = {
  // 🎯 Цветовая палитра (Material Design 3 + современные тренды)
  colors: {
    // Основные цвета
    primary: {
      50: '#f0f4ff',
      100: '#e0e7ff', 
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Основной фиолетовый
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    
    // Вторичные цвета
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe', 
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef', // Розовый акцент
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
    },
    
    // Нейтральные цвета
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4', 
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Семантические цвета
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
    },
    
    warning: {
      50: '#fffbeb', 
      500: '#f59e0b',
      600: '#d97706',
    },
    
    danger: {
      50: '#fef2f2',
      500: '#ef4444', 
      600: '#dc2626',
    },
    
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
    },
  },
  
  // 📝 Типографика
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px  
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // 📐 Отступы и размеры
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // 🔄 Радиусы скругления
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px  
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // 🌫️ Тени
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },
  
  // ⚡ Анимации
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms', 
      slow: '350ms',
    },
    
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // 📱 Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px', 
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // 📏 Z-index layers
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
};

// 🎭 Темы
export const themes = {
  light: {
    background: {
      primary: designSystem.colors.neutral[0],
      secondary: designSystem.colors.neutral[50],
      tertiary: designSystem.colors.neutral[100],
    },
    text: {
      primary: designSystem.colors.neutral[900],
      secondary: designSystem.colors.neutral[600], 
      tertiary: designSystem.colors.neutral[500],
      inverse: designSystem.colors.neutral[0],
    },
    border: {
      primary: designSystem.colors.neutral[200],
      secondary: designSystem.colors.neutral[300],
    },
  },
  
  dark: {
    background: {
      primary: designSystem.colors.neutral[950],
      secondary: designSystem.colors.neutral[900],
      tertiary: designSystem.colors.neutral[800],
    },
    text: {
      primary: designSystem.colors.neutral[50],
      secondary: designSystem.colors.neutral[300],
      tertiary: designSystem.colors.neutral[400], 
      inverse: designSystem.colors.neutral[900],
    },
    border: {
      primary: designSystem.colors.neutral[700],
      secondary: designSystem.colors.neutral[600],
    },
  },
};

export type Theme = keyof typeof themes;
export type DesignSystemColors = typeof designSystem.colors;

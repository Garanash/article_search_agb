// Профессиональная дизайн-система для корпоративного приложения
// Использует принципы Material Design 3, Apple HIG и лучшие практики UI/UX

export const professionalDesign = {
  // Цветовая палитра - строгая, но элегантная
  colors: {
    // Основные цвета
    primary: {
      50: '#f0f4ff',
      100: '#e0e9ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Основной индиго
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b'
    },
    
    // Нейтральные цвета
    neutral: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617'
    },
    
    // Семантические цвета
    semantic: {
      success: {
        light: '#10b981',
        main: '#059669',
        dark: '#047857',
        bg: '#ecfdf5'
      },
      warning: {
        light: '#f59e0b',
        main: '#d97706',
        dark: '#b45309',
        bg: '#fffbeb'
      },
      error: {
        light: '#ef4444',
        main: '#dc2626',
        dark: '#b91c1c',
        bg: '#fef2f2'
      },
      info: {
        light: '#3b82f6',
        main: '#2563eb',
        dark: '#1d4ed8',
        bg: '#eff6ff'
      }
    }
  },

  // Типографика - профессиональная и читаемая
  typography: {
    fontFamily: {
      primary: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"SF Mono", "Monaco", "Consolas", monospace'
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem'     // 48px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Интервалы и размеры
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
    24: '6rem'      // 96px
  },

  // Радиусы скругления
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px'
  },

  // Тени - тонкие и элегантные
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },

  // Анимации и переходы
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
    
    // Специфичные переходы
    button: 'all 150ms ease-in-out',
    modal: 'opacity 200ms ease-in-out, transform 200ms ease-in-out',
    slide: 'transform 300ms ease-in-out'
  },

  // Размеры компонентов
  sizes: {
    button: {
      sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem' },
      md: { height: '2.5rem', padding: '0 1rem', fontSize: '1rem' },
      lg: { height: '3rem', padding: '0 1.5rem', fontSize: '1.125rem' }
    },
    
    input: {
      sm: { height: '2rem', padding: '0 0.75rem', fontSize: '0.875rem' },
      md: { height: '2.5rem', padding: '0 1rem', fontSize: '1rem' },
      lg: { height: '3rem', padding: '0 1rem', fontSize: '1.125rem' }
    }
  },

  // Точки остановки для адаптивности
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Вспомогательные функции для работы с дизайн-системой
export const designUtils = {
  // Получение цвета с прозрачностью
  alpha: (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },

  // Медиа-запросы
  media: {
    sm: `@media (min-width: ${professionalDesign.breakpoints.sm})`,
    md: `@media (min-width: ${professionalDesign.breakpoints.md})`,
    lg: `@media (min-width: ${professionalDesign.breakpoints.lg})`,
    xl: `@media (min-width: ${professionalDesign.breakpoints.xl})`,
    '2xl': `@media (min-width: ${professionalDesign.breakpoints['2xl']})`
  },

  // Фокус-стили для доступности
  focusRing: {
    outline: `2px solid ${professionalDesign.colors.primary[500]}`,
    outlineOffset: '2px'
  },

  // Состояния кнопок
  buttonStates: {
    hover: { transform: 'translateY(-1px)', boxShadow: professionalDesign.shadows.md },
    active: { transform: 'translateY(0)', boxShadow: professionalDesign.shadows.sm },
    disabled: { opacity: 0.5, cursor: 'not-allowed' }
  }
};

export default professionalDesign;

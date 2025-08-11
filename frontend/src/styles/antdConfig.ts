import { theme } from 'antd';
import { professionalDesign } from './professionalDesign';

// Конфигурация темы Ant Design для профессионального дизайна
export const professionalTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Основные цвета
    colorPrimary: professionalDesign.colors.primary[500],
    colorSuccess: professionalDesign.colors.semantic.success.main,
    colorWarning: professionalDesign.colors.semantic.warning.main,
    colorError: professionalDesign.colors.semantic.error.main,
    colorInfo: professionalDesign.colors.semantic.info.main,
    
    // Фон и поверхности
    colorBgBase: professionalDesign.colors.neutral[0],
    colorBgContainer: professionalDesign.colors.neutral[0],
    colorBgElevated: professionalDesign.colors.neutral[0],
    colorBgLayout: professionalDesign.colors.neutral[50],
    colorBgSpotlight: professionalDesign.colors.neutral[100],
    
    // Границы
    colorBorder: professionalDesign.colors.neutral[200],
    colorBorderSecondary: professionalDesign.colors.neutral[300],
    
    // Текст
    colorText: professionalDesign.colors.neutral[900],
    colorTextSecondary: professionalDesign.colors.neutral[600],
    colorTextTertiary: professionalDesign.colors.neutral[500],
    colorTextQuaternary: professionalDesign.colors.neutral[400],
    
    // Типографика
    fontFamily: professionalDesign.typography.fontFamily.primary,
    fontSize: 14,
    fontSizeHeading1: 30,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    
    // Радиусы
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // Интервалы
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,
    
    // Высоты компонентов
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,
    
    // Тени
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    
    // Переходы
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    
    // Z-индексы
    zIndexBase: 0,
    zIndexPopupBase: 1000,
    
    // Линейка высот
    lineHeight: 1.5,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,
    
    // Размер фокуса
    controlOutlineWidth: 2,
    controlOutline: `2px solid ${professionalDesign.colors.primary[500]}20`,
    
    // Цвета состояний
    colorFillAlter: professionalDesign.colors.neutral[50],
    colorFillContent: professionalDesign.colors.neutral[100],
    colorFillContentHover: professionalDesign.colors.neutral[200],
    colorFillSecondary: professionalDesign.colors.neutral[100],
    colorFillTertiary: professionalDesign.colors.neutral[50],
    colorFillQuaternary: professionalDesign.colors.neutral[50],
    
    // Размеры иконок
    fontSizeIcon: 14,
    
    // Wireframe режим (для более четких границ)
    wireframe: false,
  },
  
  components: {
    // Кнопки
    Button: {
      defaultHoverBorderColor: professionalDesign.colors.primary[400],
      defaultHoverColor: professionalDesign.colors.primary[600],
      defaultActiveBorderColor: professionalDesign.colors.primary[600],
      defaultActiveColor: professionalDesign.colors.primary[700],
      primaryShadow: `0 2px 0 ${professionalDesign.colors.primary[500]}30`,
      dangerShadow: `0 2px 0 ${professionalDesign.colors.semantic.error.main}30`,
      defaultShadow: `0 2px 0 ${professionalDesign.colors.neutral[200]}`,
      ghostBg: 'transparent',
      defaultGhostBorderColor: professionalDesign.colors.neutral[300],
      defaultGhostColor: professionalDesign.colors.neutral[700],
    },
    
    // Карточки
    Card: {
      headerBg: professionalDesign.colors.neutral[0],
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 56,
      headerHeightSM: 48,
      actionsBg: professionalDesign.colors.neutral[50],
      tabsMarginBottom: 16,
      paddingLG: 24,
    },
    
    // Инпуты
    Input: {
      hoverBorderColor: professionalDesign.colors.primary[400],
      activeBorderColor: professionalDesign.colors.primary[500],
      activeShadow: `0 0 0 2px ${professionalDesign.colors.primary[500]}20`,
      errorActiveShadow: `0 0 0 2px ${professionalDesign.colors.semantic.error.main}20`,
      warningActiveShadow: `0 0 0 2px ${professionalDesign.colors.semantic.warning.main}20`,
      paddingBlock: 8,
      paddingInline: 12,
    },
    
    // Таблицы
    Table: {
      headerBg: professionalDesign.colors.neutral[50],
      headerColor: professionalDesign.colors.neutral[900],
      headerSortActiveBg: professionalDesign.colors.neutral[100],
      headerSortHoverBg: professionalDesign.colors.neutral[100],
      bodySortBg: professionalDesign.colors.neutral[50],
      rowHoverBg: professionalDesign.colors.neutral[50],
      rowSelectedBg: professionalDesign.colors.primary[50],
      rowSelectedHoverBg: professionalDesign.colors.primary[100],
      rowExpandedBg: professionalDesign.colors.neutral[50],
      borderColor: professionalDesign.colors.neutral[200],
      headerSplitColor: professionalDesign.colors.neutral[200],
      footerBg: professionalDesign.colors.neutral[50],
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      cellPaddingBlockMD: 8,
      cellPaddingInlineMD: 12,
      cellPaddingBlockSM: 6,
      cellPaddingInlineSM: 8,
    },
    
    // Меню
    Menu: {
      itemBg: 'transparent',
      itemColor: professionalDesign.colors.neutral[700],
      itemHoverBg: professionalDesign.colors.neutral[100],
      itemHoverColor: professionalDesign.colors.neutral[900],
      itemSelectedBg: professionalDesign.colors.primary[100],
      itemSelectedColor: professionalDesign.colors.primary[700],
      itemActiveBg: professionalDesign.colors.primary[50],
      subMenuItemBg: professionalDesign.colors.neutral[0],
      horizontalItemSelectedBg: 'transparent',
      horizontalItemSelectedColor: professionalDesign.colors.primary[600],
      itemHeight: 40,
      groupTitleColor: professionalDesign.colors.neutral[500],
      groupTitleFontSize: 12,
      iconSize: 14,
      itemMarginBlock: 4,
      itemMarginInline: 4,
      itemPaddingInline: 12,
    },
    
    // Формы
    Form: {
      labelColor: professionalDesign.colors.neutral[800],
      labelFontSize: 14,
      labelHeight: 32,
      itemMarginBottom: 20,
      verticalLabelPadding: '0 0 8px',
      verticalLabelMargin: '0 0 8px 0',
    },
    
    // Модальные окна
    Modal: {
      headerBg: professionalDesign.colors.neutral[0],
      contentBg: professionalDesign.colors.neutral[0],
      titleColor: professionalDesign.colors.neutral[900],
      titleFontSize: 18,
      borderRadiusLG: 12,
      footerBg: 'transparent',
      paddingContentHorizontalLG: 24,
      paddingMD: 20,
      paddingLG: 24,
    },
    
    // Дропдауны
    Dropdown: {
      paddingBlock: 8,
      controlPaddingHorizontal: 12,
      borderRadiusLG: 8,
      borderRadiusOuter: 8,
    },
    
    // Уведомления
    Notification: {
      borderRadiusLG: 8,
      paddingContentHorizontal: 16,
      paddingMD: 16,
    },
    
    // Сообщения
    Message: {
      borderRadiusLG: 8,
      paddingHorizontal: 16,
    },
    
    // Вкладки
    Tabs: {
      titleFontSize: 14,
      titleFontSizeLG: 16,
      titleFontSizeSM: 14,
      inkBarColor: professionalDesign.colors.primary[500],
      itemColor: professionalDesign.colors.neutral[600],
      itemHoverColor: professionalDesign.colors.primary[500],
      itemSelectedColor: professionalDesign.colors.primary[600],
      itemActiveColor: professionalDesign.colors.primary[600],
      cardBg: professionalDesign.colors.neutral[50],
      cardHeight: 40,
      cardPadding: '0 16px',
      cardPaddingSM: '0 12px',
      cardPaddingLG: '0 20px',
    },
    
    // Переключатели
    Switch: {
      colorPrimary: professionalDesign.colors.primary[500],
      colorPrimaryHover: professionalDesign.colors.primary[400],
      colorPrimaryBorder: professionalDesign.colors.primary[500],
    },
    
    // Чекбоксы и радио
    Checkbox: {
      colorPrimary: professionalDesign.colors.primary[500],
      colorPrimaryHover: professionalDesign.colors.primary[400],
      colorPrimaryBorder: professionalDesign.colors.primary[500],
      borderRadiusSM: 4,
    },
    
    Radio: {
      colorPrimary: professionalDesign.colors.primary[500],
      colorPrimaryHover: professionalDesign.colors.primary[400],
      colorPrimaryBorder: professionalDesign.colors.primary[500],
      dotSize: 8,
      radioSize: 16,
    },
    
    // Селекты
    Select: {
      optionSelectedBg: professionalDesign.colors.primary[50],
      optionSelectedColor: professionalDesign.colors.primary[700],
      optionActiveBg: professionalDesign.colors.neutral[100],
      selectorBg: professionalDesign.colors.neutral[0],
      clearBg: professionalDesign.colors.neutral[0],
      singleItemHeightLG: 40,
      multipleItemBg: professionalDesign.colors.neutral[100],
      multipleItemBorderColor: professionalDesign.colors.neutral[200],
      multipleSelectorBgDisabled: professionalDesign.colors.neutral[50],
      optionLineHeight: 1.5,
      optionPadding: '8px 12px',
    }
  }
};

export default professionalTheme;

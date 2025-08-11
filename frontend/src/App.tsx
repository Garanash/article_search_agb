import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import ArticleTable from "./components/ArticleTable";
import RequestSidebar from "./components/RequestSidebar";
import SupportChat from "./components/SupportChat";
import AdminDashboard from "./components/AdminDashboard";
import ChangePasswordModal from "./components/ChangePasswordModal";
import ProfileManager from './components/ProfileManager';
import ChatBot from './components/ChatBot';
import EmailCampaigns from './components/EmailCampaigns';
import UserAvatar from './components/UserAvatar';
import { Layout, Menu, Button, Tabs, Dropdown, Space, Card, Form, Input, Select, Typography, message } from "antd";
import { LogoutOutlined, UserOutlined, SettingOutlined, RobotOutlined, CustomerServiceOutlined, DashboardOutlined, SaveOutlined, FileTextOutlined, MailOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import ru_RU from 'antd/lib/locale/ru_RU';
import { ConfigProvider } from 'antd';
import { getUserProfile } from "./api/api";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

// CSS стили для корпоративного дизайна
const tabStyles = `
  /* Общие стили */
  * {
    box-sizing: border-box;
  }
  
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
    background: #f5f5f5;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f5f5f5;
    min-height: 100vh;
    color: #333333;
    overflow-x: hidden;
  }
  
  #root {
    width: 100%;
    min-width: 100%;
    overflow-x: hidden;
  }
  
  /* Стили для Layout */
  .ant-layout {
    background: transparent !important;
    width: 100% !important;
    min-width: 100% !important;
    overflow-x: hidden !important;
  }
  
  /* Корпоративный хедер */
  .ant-layout-header {
    background: #2c3e50 !important;
    border-bottom: 2px solid #34495e !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    position: relative !important;
    width: 100% !important;
    min-width: 100% !important;
  }
  
  .ant-layout-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #5a6c7d, transparent);
  }
  
  /* Заголовок */
  .app-title {
    background: none !important;
    background-color: transparent !important;
    color: #FCB813 !important;
    font-weight: 900 !important;
    font-size: 32px !important;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
  }
  
  /* Кнопка пользователя */
  .user-button {
    background: #FCB813 !important;
    border: 1px solid #FCB813 !important;
    border-radius: 4px !important;
    padding: 8px 16px !important;
    transition: all 0.3s ease !important;
    color: #222 !important;
    font-weight: 600 !important;
  }
  
  .user-button:hover {
    background: #FCB813 !important;
    border-color: #FCB813 !important;
    color: #222 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(252, 184, 19, 0.2) !important;
  }
  
  /* Основной контент */
  .ant-layout-content {
    background: #ffffff !important;
    border-radius: 6px !important;
    margin: 16px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
    border: 1px solid #e1e5e9 !important;
    position: relative !important;
    width: calc(100% - 32px) !important;
    max-width: calc(100% - 32px) !important;
    overflow-x: hidden !important;
  }
  
  .ant-layout-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #FCB813, transparent);
    border-radius: 6px 6px 0 0;
  }
  
  /* Корпоративные табы */
  .ant-tabs-nav {
    margin-bottom: 20px !important;
    padding: 0 20px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .ant-tabs-nav-list {
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    justify-content: space-between !important;
    gap: 4px !important;
    flex-wrap: nowrap !important;
  }
  
  .ant-tabs-tab {
    flex: 1 !important;
    min-width: 0 !important;
    text-align: center !important;
    margin: 0 !important;
    border-radius: 4px !important;
    transition: all 0.3s ease !important;
    background: #f8f9fa !important;
    border: 1px solid #dee2e6 !important;
    padding: 12px 8px !important;
    font-weight: 600 !important;
    font-size: 14px !important;
    letter-spacing: 0.5px !important;
    text-transform: uppercase !important;
    color: #6c757d !important;
    position: relative !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  
  .ant-tabs-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #FCB813, transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .ant-tabs-tab:hover {
    background: #e9ecef !important;
    border-color: #adb5bd !important;
    color: #495057 !important;
    transform: translateY(-1px) !important;
  }
  
  .ant-tabs-tab:hover::before {
    opacity: 1;
  }
  
  .ant-tabs-tab-active {
    background: #2c3e50 !important;
    color: #FCB813 !important;
    border-color: #FCB813 !important;
    box-shadow: 0 2px 10px rgba(252, 184, 19, 0.2) !important;
  }
  
  .ant-tabs-tab-active::before {
    opacity: 1;
    background: #FCB813 !important;
  }
  
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #FCB813 !important;
    font-weight: 700 !important;
  }
  
  /* Контент табов */
  .ant-tabs-content-holder {
    flex: 1 !important;
    overflow: hidden !important;
    padding: 0 20px 20px 20px !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .ant-tabs-tabpane {
    height: 100% !important;
    overflow: auto !important;
    border-radius: 4px !important;
    background: #ffffff !important;
    padding: 20px !important;
    border: 1px solid #e1e5e9 !important;
    position: relative !important;
    width: 100% !important;
    max-width: 100% !important;
    color: #333333 !important;
  }
  
  .ant-tabs-tabpane::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #dee2e6, transparent);
    border-radius: 4px 4px 0 0;
  }
  
  /* Футер */
  .ant-layout-footer {
    background: #2c3e50 !important;
    border-top: 2px solid #34495e !important;
    color: #bdc3c7 !important;
    font-weight: 500 !important;
    text-align: center !important;
    position: relative !important;
    width: 100% !important;
    min-width: 100% !important;
  }
  
  .ant-layout-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, #5a6c7d, transparent);
  }
  
  /* Адаптивность */
  @media (max-width: 768px) {
    .ant-layout-header {
      padding: 0 16px !important;
      height: 56px !important;
    }
    
    .ant-layout-content {
      margin: 8px !important;
      border-radius: 4px !important;
      width: calc(100% - 16px) !important;
      max-width: calc(100% - 16px) !important;
    }
    
    .ant-tabs-nav-list {
      flex-wrap: wrap !important;
      gap: 4px !important;
    }
    
    .ant-tabs-tab {
      margin-bottom: 0 !important;
      border-radius: 4px !important;
      padding: 8px 6px !important;
      font-size: 12px !important;
      min-width: calc(50% - 2px) !important;
      white-space: normal !important;
    }
    
    .app-title {
      font-size: 20px !important;
      letter-spacing: 1px !important;
    }
    
    .ant-tabs-content-holder {
      padding: 0 8px 8px 8px !important;
    }
    
    .ant-tabs-tabpane {
      padding: 8px !important;
    }
  }
  
  @media (max-width: 480px) {
    .ant-layout-header {
      padding: 0 12px !important;
      height: 48px !important;
    }
    
    .ant-tabs-tab {
      font-size: 11px !important;
      padding: 6px 4px !important;
      min-width: 100% !important;
    }
    
    .app-title {
      font-size: 16px !important;
      letter-spacing: 0.5px !important;
    }
    
    .ant-tabs-content-holder {
      padding: 0 4px 4px 4px !important;
    }
    
    .ant-tabs-tabpane {
      padding: 4px !important;
    }
    
    .ant-layout-content {
      margin: 4px !important;
      width: calc(100% - 8px) !important;
      max-width: calc(100% - 8px) !important;
    }
  }
  
  @media (min-width: 769px) and (max-width: 1024px) {
    .ant-tabs-tab {
      font-size: 14px !important;
      padding: 12px 12px !important;
    }
  }
  
  @media (min-width: 1025px) {
    .ant-layout-header {
      padding: 0 32px !important;
      height: 64px !important;
    }
    
    .ant-tabs-tab {
      font-size: 14px !important;
      padding: 12px 16px !important;
    }
    
    .app-title {
      font-size: 28px !important;
      letter-spacing: 2px !important;
    }
  }

  @media (min-width: 1920px) {
    .ant-layout-header {
      padding: 0 48px !important;
      height: 72px !important;
    }
    
    .app-title {
      font-size: 32px !important;
      letter-spacing: 2.5px !important;
    }
    
    .ant-tabs-tab {
      font-size: 16px !important;
      padding: 14px 20px !important;
    }
  }
  
  /* Скроллбар */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #adb5bd, #6c757d);
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #6c757d, #495057);
  }
  
  /* Корпоративные карточки */
  .ant-card {
    background: #ffffff !important;
    border: 1px solid #e1e5e9 !important;
    border-radius: 4px !important;
    width: 100% !important;
    max-width: 100% !important;
    color: #333333 !important;
  }
  
  /* Корпоративные таблицы */
  .ant-table {
    background: transparent !important;
    width: 100% !important;
    max-width: 100% !important;
    color: #333333 !important;
  }
  
  .ant-table-thead > tr > th {
    background: #f8f9fa !important;
    border-bottom: 1px solid #dee2e6 !important;
    color: #2c3e50 !important;
    font-weight: 600 !important;
  }
  
  .ant-table-tbody > tr > td {
    border-bottom: 1px solid #e9ecef !important;
    color: #495057 !important;
  }
  
  .ant-table-tbody > tr:hover > td {
    background: rgba(212, 175, 55, 0.05) !important;
  }
  
  /* Корпоративные кнопки */
  .ant-btn-primary {
    background: linear-gradient(135deg, #d4af37 0%, #FCB813 100%) !important;
    border-color: #FCB813 !important;
    color: #333333 !important;
    font-weight: 600 !important;
  }
  
  .ant-btn-primary:hover {
    background: linear-gradient(135deg, #FCB813 0%, #d4af37 100%) !important;
    border-color: #FCB813 !important;
    color: #333333 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3) !important;
  }
  
  /* Предотвращение горизонтальной прокрутки */
  .content-container {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }
  
  /* Обеспечение правильной ширины для всех контейнеров */
  .ant-layout-sider,
  .ant-layout-sider-children {
    width: 100% !important;
    max-width: 100% !important;
  }

  /* --- Глобальные цвета для корпоративной темы --- */
  body, .ant-layout, .ant-layout-content, .ant-card, .ant-tabs-tabpane, .ant-modal-content {
    background: #f5f5f5 !important;
    color: #333333 !important;
  }

  /* --- Текст --- */
  .ant-typography, .ant-typography h1, .ant-typography h2, .ant-typography h3, .ant-typography h4,
  .ant-card-head-title, .ant-table, .ant-table-thead > tr > th, .ant-table-tbody > tr > td,
  .ant-form-item-label > label, .ant-tabs-tab, .ant-tabs-tab-btn, .ant-select-selection-item,
  .ant-select-arrow, .ant-dropdown-menu-title-content, .ant-menu-item, .ant-menu-title-content,
  .ant-modal-title, .ant-modal-close-x, .ant-btn, .ant-btn span, .ant-input, .ant-input-password,
  .ant-input-affix-wrapper, .ant-input-group-addon, .ant-checkbox-wrapper, .ant-radio-wrapper {
    color: #333333 !important;
  }

  /* --- Placeholder для input --- */
  .ant-input::placeholder, .ant-input-password input::placeholder, .ant-select-selection-placeholder {
    color: #6c757d !important;
    opacity: 1 !important;
  }

  /* --- Input, Select, Textarea --- */
  .ant-input, .ant-input-password, .ant-input-affix-wrapper, .ant-select-selector, .ant-select-dropdown, .ant-input-group-addon, .ant-input-group-wrapper, .ant-picker, .ant-picker-input > input {
    background: #ffffff !important;
    color: #333333 !important;
    border-color: #dee2e6 !important;
  }

  .ant-input:focus, .ant-input-password:focus, .ant-input-affix-wrapper:focus, .ant-select-selector:focus {
    border-color: #d4af37 !important;
    box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2) !important;
  }

  /* --- Card, Modal, Dropdown, Popover --- */
  .ant-card, .ant-modal-content, .ant-dropdown-menu, .ant-popover-inner {
    background: #ffffff !important;
    color: #333333 !important;
    border-color: #e1e5e9 !important;
  }

  /* --- Table --- */
  .ant-table, .ant-table-thead > tr > th, .ant-table-tbody > tr > td {
    background: #ffffff !important;
    color: #333333 !important;
    border-color: #e1e5e9 !important;
  }

  /* --- Кнопки --- */
  .ant-btn, .ant-btn span {
    color: #333333 !important;
    background: transparent !important;
    border-color: #FCB813 !important;
  }
  
  .ant-btn-primary {
    background: linear-gradient(135deg, #d4af37 0%, #FCB813 100%) !important;
    color: #333333 !important;
    border-color: #FCB813 !important;
  }
  
  .ant-btn-primary:hover {
    background: linear-gradient(135deg, #FCB813 0%, #d4af37 100%) !important;
    color: #333333 !important;
  }

  /* --- Tabs --- */
  .ant-tabs-tab, .ant-tabs-tab-btn {
    color: #6c757d !important;
  }
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #d4af37 !important;
  }

  /* --- Label --- */
  .ant-form-item-label > label {
    color: #2c3e50 !important;
  }

  /* --- Disabled --- */
  .ant-input[disabled], .ant-select-disabled .ant-select-selector, .ant-btn[disabled], .ant-radio-disabled .ant-radio-inner, .ant-checkbox-disabled .ant-checkbox-inner {
    background: #f8f9fa !important;
    color: #6c757d !important;
    border-color: #dee2e6 !important;
    opacity: 0.6 !important;
  }

  /* --- Tooltip --- */
  .ant-tooltip-inner {
    background: #2c3e50 !important;
    color: #ffffff !important;
    border: 1px solid #34495e !important;
  }

  /* --- Scrollbar --- */
  ::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #adb5bd, #6c757d) !important;
  }

  .ant-btn.user-button,
  .ant-btn.user-button:focus,
  .ant-btn.user-button:hover {
    background: #FCB813 !important;
    color: #222 !important;
    border: 1px solid #FCB813 !important;
    font-weight: 600 !important;
  }

  /* Улучшенная кнопка пользователя */
  .enhanced-user-button {
    background: linear-gradient(135deg, #FCB813 0%, #f0a500 100%) !important;
    border: 2px solid #FCB813 !important;
    border-radius: 24px !important;
    padding: 8px 20px !important;
    height: 48px !important;
    font-size: 14px !important;
    box-shadow: 0 4px 12px rgba(252, 184, 19, 0.3) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    min-width: 160px !important;
    justify-content: flex-start !important;
  }

  .enhanced-user-button:hover {
    background: linear-gradient(135deg, #f0a500 0%, #FCB813 100%) !important;
    border-color: #d4af37 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(252, 184, 19, 0.4) !important;
  }

  .enhanced-user-button:active {
    transform: translateY(0) !important;
    box-shadow: 0 2px 8px rgba(252, 184, 19, 0.3) !important;
  }

  /* Адаптивные стили для кнопки пользователя */
  @media (max-width: 768px) {
    .header-user-section {
      right: 16px !important;
    }
    
    .enhanced-user-button {
      min-width: 120px !important;
      padding: 6px 12px !important;
      height: 40px !important;
      font-size: 12px !important;
      gap: 8px !important;
      border-radius: 20px !important;
    }

    .enhanced-user-button .user-avatar {
      width: 28px !important;
      height: 28px !important;
      font-size: 12px !important;
    }

    .enhanced-user-button .user-info {
      display: none !important;
    }
  }

  @media (max-width: 480px) {
    .header-user-section {
      right: 12px !important;
    }
    
    .enhanced-user-button {
      min-width: 80px !important;
      padding: 4px 8px !important;
      height: 36px !important;
      gap: 6px !important;
      border-radius: 18px !important;
    }

    .enhanced-user-button .user-avatar {
      width: 24px !important;
      height: 24px !important;
      font-size: 10px !important;
    }
  }

  @media (min-width: 1920px) {
    .header-user-section {
      right: 48px !important;
    }
    
    .enhanced-user-button {
      min-width: 200px !important;
      padding: 10px 24px !important;
      height: 56px !important;
      font-size: 16px !important;
      gap: 16px !important;
      border-radius: 28px !important;
    }

    .enhanced-user-button .user-avatar {
      width: 40px !important;
      height: 40px !important;
      font-size: 16px !important;
    }
  }
`;

// Адаптивные стили для разных размеров экранов
const adaptiveStyles = {
  // Основной контейнер
  layout: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  
  // Хедер
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: "64px",
  },
  
  // Основной контент
  content: {
    padding: "0",
    maxWidth: "100%",
    margin: "0 auto",
    width: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  },
  
  // Контейнер для табов
  tabsContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    minHeight: 0,
  },
  
  // Контейнер для основного контента (артикулы)
  mainContent: {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "flex-start",
    gap: "16px",
    flex: 1,
    minHeight: 0,
  },
  
  // Футер
  footer: {
    textAlign: "center" as const,
    padding: "16px 24px",
  },
};

const Main: React.FC = () => {
  const { token, setToken, user, setUser, isAdmin, updateUser } = useAuth();
  const [tab, setTab] = useState(isAdmin ? 'dashboard' : 'articles');
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const { forcePasswordChange, setForcePasswordChange } = useAuth();
  
  if (!token) return <LoginForm />;

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setForcePasswordChange(false);
    // Очищаем все данные из localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Сбрасываем состояние приложения
    setTab(isAdmin ? 'dashboard' : 'articles');
    setActiveRequestId(null);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      setTab('profile');
    } else if (key === 'dashboard') {
      setTab('dashboard');
    } else if (key === 'chat') {
      setTab('chat');
    }
  };

  const handlePasswordChangeSuccess = async () => {
    setForcePasswordChange(false);
    // Получаем обновленный профиль пользователя с сервера
    try {
      const updatedUser = await getUserProfile();
      updateUser(updatedUser);
    } catch (error) {
      console.error('Ошибка при получении обновленного профиля:', error);
      // Если не удалось получить с сервера, обновляем локально
      if (user) {
        const localUpdatedUser = { ...user, force_password_change: false };
        updateUser(localUpdatedUser);
      }
    }
  };

  // Меню пользователя
  const userMenuItems = [
    ...(isAdmin ? [{
      key: 'dashboard',
      label: 'Дашборд',
      icon: <DashboardOutlined />,
    }] : []),
    {
      key: 'profile',
      label: 'Личный кабинет',
      icon: <UserOutlined />,
    },
    {
      key: 'chat',
      label: 'Чат с ботом',
      icon: <RobotOutlined />,
    },
    ...(isAdmin ? [{
      key: 'admin',
      label: 'Панель администратора',
      icon: <SettingOutlined />,
    }] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Выйти',
      icon: <LogoutOutlined />,
      onClick: () => handleLogout(),
    },
  ];

  // Определяем табы в зависимости от роли пользователя
  const getTabItems = () => {
    const baseTabs = [
      ...(isAdmin ? [{
        key: 'dashboard',
        label: 'Дашборд',
        children: <AdminDashboard />
      }] : []),
      {
        key: 'articles',
        label: 'Артикулы',
        children: (
          <div style={adaptiveStyles.mainContent} className="content-container">
            <div style={{ flex: 1, minWidth: 0 }}>
              <ArticleTable 
                activeRequestId={activeRequestId} 
                requests={requests}
                setRequests={setRequests}
              />
            </div>
            <RequestSidebar 
              activeRequestId={activeRequestId} 
              onSelect={setActiveRequestId}
              requests={requests}
              setRequests={setRequests}
            />
          </div>
        )
      },
      {
        key: 'profile',
        label: 'Профиль',
        children: <ProfileManager />
      },
      {
        key: 'chat',
        label: 'Чат с ботом',
        children: <ChatBot />
      }
      // Вкладка 'Настройки' удалена
    ];
    
    return baseTabs;
  };
  
  return (
    <Layout style={adaptiveStyles.layout}>
      <style>{tabStyles}</style>
      <Header style={{ ...adaptiveStyles.header, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="app-title" style={{ color: '#23272b', fontWeight: 900, fontSize: 32, letterSpacing: 2, textTransform: 'uppercase', background: 'none', pointerEvents: 'auto' }}>FELIX</span>
            <span style={{ display: 'inline-block', height: 28, pointerEvents: 'auto', verticalAlign: 'middle' }}>
              <svg width="90" height="27" viewBox="0 0 180 53" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_791_2649)"><path fill-rule="evenodd" clip-rule="evenodd" d="M28.316 0C32.3097 0.364122 36.0417 1.65878 39.3096 3.66651C39.0776 4.03569 38.9443 4.48072 38.9443 4.95105C38.9443 6.27605 39.9958 7.35324 41.2892 7.35324C42.0099 7.35324 42.6566 7.01946 43.0861 6.49351C45.9739 9.08788 48.299 12.3346 49.8392 16.0011C48.9753 16.3552 48.3583 17.2199 48.3583 18.2314C48.3583 19.5564 49.4097 20.6336 50.7031 20.6336C50.9055 20.6336 51.103 20.6083 51.2906 20.5577C51.7151 22.4694 51.9422 24.4569 51.9422 26.5C51.9422 28.5431 51.725 30.4548 51.3152 32.3361C51.1178 32.2804 50.9104 32.2501 50.6932 32.2501C49.3999 32.2501 48.3484 33.3273 48.3484 34.6523C48.3484 35.684 48.9852 36.5639 49.8787 36.9028C48.3484 40.5946 46.0233 43.8565 43.1305 46.466C42.701 45.8996 42.0297 45.5304 41.2744 45.5304C39.981 45.5304 38.9295 46.6076 38.9295 47.9326C38.9295 48.4434 39.0826 48.9137 39.3491 49.3031C36.0713 51.326 32.3195 52.6308 28.3062 53C28.3062 51.6801 27.2547 50.6079 25.9613 50.6079C24.668 50.6079 23.6214 51.68 23.6165 53.0051C19.6475 52.6409 15.9353 51.3614 12.6821 49.3739C12.9734 48.9744 13.1461 48.4738 13.1461 47.9377C13.1461 46.6127 12.0947 45.5355 10.8013 45.5355C10.0115 45.5355 9.31047 45.935 8.88593 46.552C5.95858 43.9374 3.61374 40.6552 2.06368 36.9432C3.02136 36.6398 3.71741 35.7295 3.71741 34.6472C3.71741 33.3222 2.66593 32.245 1.37256 32.245C1.11093 32.245 0.854231 32.2906 0.617279 32.3715C0.202612 30.4801 -0.0195312 28.5178 -0.0195312 26.4949C-0.0195312 24.472 0.207548 22.434 0.641961 20.5072C0.873977 20.583 1.11587 20.6235 1.37256 20.6235C2.66593 20.6235 3.71741 19.5513 3.71741 18.2213C3.71741 17.1593 3.04111 16.254 2.10317 15.9405C3.65817 12.2537 6.00795 8.99685 8.93036 6.39742C9.35984 6.97395 10.0361 7.34313 10.7964 7.34313C12.0897 7.34313 13.1412 6.27099 13.1412 4.94094C13.1412 4.44027 12.9882 3.96994 12.7315 3.58559C15.9896 1.62844 19.6821 0.359065 23.6313 0C23.6807 1.28454 24.7075 2.30611 25.9712 2.30611C27.2349 2.30611 28.2667 1.28454 28.316 0ZM25.9712 3.45916C13.5509 3.45916 3.48539 13.776 3.48539 26.5C3.48539 39.224 13.5559 49.5408 25.9761 49.5408C38.3964 49.5408 48.4669 39.224 48.4669 26.5C48.4669 13.776 38.3915 3.45916 25.9712 3.45916Z" fill="#FBBA00"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M40.2478 10.6152C40.8994 10.6355 41.1956 10.9187 41.5511 11.4547L48.3931 21.0433L25.9665 49.7988L3.5498 21.0433L10.3918 11.4547C10.7472 10.9187 11.0434 10.6355 11.695 10.6152C21.2126 10.6152 30.7302 10.6152 40.2478 10.6152ZM17.6386 21.7108H6.76841C6.31425 21.7007 6.0773 22.2419 6.36362 22.5857L22.896 43.6138C23.2366 44.069 23.9475 43.7149 23.8092 43.1586L18.1174 22.075C18.0533 21.8676 17.8608 21.7159 17.6386 21.7058V21.7108ZM34.2105 21.7108C33.9883 21.7159 33.7958 21.8676 33.7316 22.08L28.0398 43.1637C27.8967 43.72 28.6125 44.074 28.9531 43.6189L45.4855 22.5857C45.7767 22.2419 45.5348 21.7007 45.0807 21.7108H34.2105ZM31.6237 21.7108H20.2796C19.9341 21.7108 19.6823 22.0547 19.7811 22.3936L25.4778 43.4419C25.6209 43.9526 26.3318 43.9526 26.475 43.4419L32.1322 22.3936C32.2063 22.1104 31.9101 21.7159 31.6237 21.7159V21.7108ZM16.6316 19.3896L11.8876 12.6634C11.7987 12.542 11.6457 12.4611 11.4778 12.4611C11.31 12.4611 11.157 12.542 11.0681 12.6634L6.32412 19.3896C6.10198 19.6879 6.334 20.0976 6.72892 20.1026H16.2317C16.6316 20.1026 16.8586 19.6879 16.6365 19.3946L16.6316 19.3896ZM23.8685 12.4207C24.0906 12.1274 23.8685 11.7127 23.4637 11.7127H13.9609C13.566 11.7127 13.334 12.1274 13.5561 12.4257L18.3001 19.1519C18.389 19.2732 18.542 19.3542 18.7098 19.3542C18.8777 19.3542 19.0307 19.2732 19.1196 19.1519L23.8635 12.4257L23.8685 12.4207ZM31.1202 19.3896L26.3762 12.6634C26.2874 12.542 26.1343 12.4611 25.9665 12.4611C25.7987 12.4611 25.6456 12.542 25.5568 12.6634L20.8128 19.3896C20.5906 19.6879 20.8227 20.0976 21.2176 20.1026H30.7204C31.1202 20.1026 31.3473 19.6879 31.1252 19.3946L31.1202 19.3896ZM45.5299 19.4047L40.7859 12.6786C40.6971 12.5572 40.544 12.4763 40.3762 12.4763C40.2083 12.4763 40.0553 12.5572 39.9664 12.6786L35.2225 19.4047C35.0003 19.7031 35.2323 20.1128 35.6273 20.1178H45.13C45.5299 20.1178 45.757 19.7031 45.5348 19.4098L45.5299 19.4047ZM28.0053 12.3954L32.7493 19.1215C32.8381 19.2429 32.9912 19.3238 33.159 19.3238C33.3268 19.3238 33.4799 19.2429 33.5687 19.1215L38.3127 12.3954C38.5349 12.097 38.3028 11.6874 37.9079 11.6823H28.4051C28.0053 11.6823 27.7782 12.097 28.0003 12.3903L28.0053 12.3954Z" fill="#FBBA00"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M66.6584 35.8913H64.0223L63.1436 31.8253H59.7571L58.8784 35.8913H56.2275L60.2854 16.9014H62.6104L66.6535 35.8913H66.6584ZM62.8178 29.4181L61.3961 22.2014L60.0138 29.4181H62.8178Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M80.6191 35.8912V16.9062H83.27L86.9181 27.3798H87.0169L90.4971 16.9062H93.1431V35.8912H90.4971V24.0167H90.3687L87.5895 32.5837H86.1777L83.3984 24.0167H83.27V35.8912H80.6191Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M105.41 35.8913H102.774L101.896 31.8253H98.5091L97.6304 35.8913H94.9795L99.0373 16.9014H101.362L105.41 35.8913ZM101.57 29.4181L100.148 22.2014L98.7658 29.4181H101.57Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M105.903 22.3074V20.598C105.903 19.3185 106.372 18.3071 107.31 17.5637C108.075 16.9467 109.053 16.6382 110.243 16.6382C111.526 16.6382 112.543 16.9264 113.293 17.4979C114.256 18.2211 114.74 19.2528 114.74 20.598V22.2012C114.74 22.8384 114.69 23.3846 114.592 23.8498C114.493 24.3151 114.281 24.75 113.95 25.1546C113.614 25.5238 113.259 25.8171 112.888 26.0295C113.535 26.3734 113.979 26.7729 114.221 27.223C114.567 27.8046 114.74 28.6188 114.74 29.6606V31.8858C114.74 32.5281 114.661 33.1096 114.508 33.6255C114.355 34.1413 114.044 34.6218 113.58 35.0618C112.805 35.7951 111.674 36.1592 110.193 36.1592C108.821 36.1592 107.774 35.8203 107.054 35.1376C106.935 35.0314 106.802 34.8949 106.659 34.7229C106.515 34.551 106.353 34.2425 106.175 33.7974C105.992 33.3524 105.903 32.8871 105.903 32.4016V30.6417H108.554V31.729C108.554 31.9414 108.594 32.1741 108.673 32.4219C108.752 32.6747 108.855 32.872 108.984 33.0237C109.275 33.3524 109.739 33.5142 110.366 33.5142C110.944 33.5142 111.363 33.3777 111.635 33.1046C111.783 32.963 111.891 32.791 111.97 32.5888C112.049 32.3865 112.089 32.2145 112.099 32.078C112.109 31.9414 112.113 31.7391 112.113 31.4762V29.7921C112.113 28.7402 111.872 28.017 111.388 27.6225C111.087 27.3596 110.623 27.223 109.991 27.223H109.191V24.7753H109.917C110.647 24.7753 111.215 24.5578 111.61 24.128C111.946 23.7487 112.113 23.1873 112.113 22.4439V21.2251C112.113 20.5171 111.936 20.0114 111.585 19.7029C111.259 19.4399 110.825 19.3034 110.282 19.3034C109.783 19.3034 109.379 19.4601 109.068 19.7787C108.732 20.1075 108.564 20.5677 108.564 21.1695V22.3074H105.913H105.903Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M117.652 35.8912V16.9062H125.689V19.4854H120.298V35.8912H117.652Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M127.15 35.8912V16.9062H135.009V19.4854H129.801V25.0737H134.402V27.5113H129.801V33.312H135.088V35.8912H127.15Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M137.324 30.8995V21.8976C137.324 21.3261 137.349 20.8406 137.393 20.4562C137.443 20.0668 137.571 19.6319 137.788 19.1515C138.005 18.671 138.312 18.2412 138.706 17.8619C139.551 17.0476 140.637 16.6431 141.965 16.6431C143.292 16.6431 144.378 17.0476 145.223 17.8619C145.79 18.408 146.161 18.9947 146.333 19.6218C146.506 20.2489 146.59 21.0075 146.59 21.8976V30.8995C146.59 31.7895 146.506 32.5481 146.333 33.1752C146.161 33.8023 145.79 34.389 145.223 34.9351C144.378 35.7494 143.292 36.1539 141.965 36.1539C140.637 36.1539 139.551 35.7494 138.706 34.9351C138.312 34.5559 138.005 34.126 137.788 33.6455C137.571 33.1651 137.443 32.7302 137.393 32.3408C137.344 31.9514 137.324 31.4709 137.324 30.8995ZM143.944 31.3091V21.498C143.944 20.7748 143.756 20.2236 143.386 19.8443C143.031 19.4802 142.557 19.3032 141.965 19.3032C141.372 19.3032 140.883 19.4852 140.528 19.8443C140.158 20.2236 139.97 20.7748 139.97 21.498V31.3091C139.97 32.0323 140.153 32.5835 140.528 32.9628C140.883 33.3269 141.357 33.5039 141.965 33.5039C142.572 33.5039 143.031 33.3219 143.386 32.9628C143.756 32.5835 143.944 32.0323 143.944 31.3091Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M149.498 16.9062H157.54V19.4905H152.149V24.5882H153.442C153.857 24.5882 154.153 24.5882 154.326 24.6034C154.504 24.6135 154.785 24.6438 155.18 24.7045C155.57 24.7602 155.925 24.8714 156.241 25.0333C156.557 25.1951 156.849 25.4125 157.125 25.6755C157.471 26.0042 157.732 26.3886 157.92 26.8387C158.102 27.2888 158.206 27.6377 158.231 27.8906C158.25 28.1435 158.265 28.4469 158.265 28.811V31.0362C158.265 32.3005 158.009 33.3221 157.49 34.106C156.695 35.2995 155.372 35.8912 153.521 35.8912H149.503V16.9062H149.498ZM152.149 27.0208V33.4536H153.339C154.133 33.4536 154.731 33.1704 155.136 32.604C155.456 32.1539 155.614 31.4964 155.614 30.6316V29.6C155.614 29.0942 155.565 28.6846 155.466 28.3609C155.368 28.0373 155.18 27.7541 154.904 27.5063C154.514 27.1775 154.045 27.0157 153.497 27.0157H152.154L152.149 27.0208Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M159.386 16.9062H162.412L164.944 26.2167H165.023C165.211 24.9372 165.443 23.6425 165.719 22.3377L166.884 16.9113H169.609L166.455 29.873C166.405 30.0753 166.331 30.3788 166.243 30.7783C166.154 31.1778 166.075 31.4964 166.015 31.7341C165.956 31.9667 165.877 32.2601 165.779 32.609C165.68 32.958 165.576 33.2513 165.472 33.4839C165.369 33.7166 165.245 33.9644 165.102 34.2172C164.959 34.4751 164.796 34.6977 164.618 34.8949C164.436 35.0871 164.238 35.254 164.026 35.3854C163.473 35.7293 162.713 35.9013 161.74 35.9013H160.798V33.317H161.459C162.002 33.317 162.407 33.1653 162.673 32.8669C162.777 32.7607 162.881 32.5888 162.984 32.3562C163.088 32.1235 163.162 31.9111 163.202 31.7291L163.552 30.1259L159.391 16.9113L159.386 16.9062Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M171.007 35.8912V16.9062H174.951C175.44 16.9062 175.854 16.9265 176.19 16.9568C176.526 16.9922 176.931 17.1085 177.405 17.3058C177.878 17.503 178.298 17.7913 178.658 18.1604C179.201 18.7319 179.562 19.3742 179.74 20.0873C179.917 20.8003 180.006 21.5994 180.006 22.4895V23.0306C180.006 24.7096 179.626 25.9941 178.871 26.8842C178.017 27.8805 176.802 28.3812 175.228 28.3812H173.663V35.8912H171.012H171.007ZM173.658 19.354V25.9334H175.079C175.845 25.9334 176.437 25.7008 176.852 25.2305C176.911 25.1597 176.965 25.0939 177.015 25.0231C177.064 24.9574 177.103 24.8866 177.138 24.8057C177.173 24.7248 177.202 24.659 177.227 24.6084C177.252 24.5579 177.276 24.482 177.291 24.3809C177.306 24.2848 177.321 24.214 177.331 24.1735C177.34 24.1331 177.345 24.0572 177.35 23.9409C177.35 23.8246 177.355 23.7538 177.355 23.7285V22.0191C177.355 21.7713 177.355 21.5893 177.34 21.4679C177.331 21.3465 177.311 21.1746 177.276 20.9369C177.242 20.7042 177.173 20.4969 177.064 20.3199C176.955 20.1429 176.817 19.9811 176.644 19.8293C176.457 19.6726 176.225 19.5512 175.958 19.4804C175.692 19.4045 175.484 19.3641 175.331 19.354C175.178 19.3438 174.926 19.3388 174.576 19.3388H173.658V19.354Z" fill="white"></path> <path fill-rule="evenodd" clip-rule="evenodd" d="M70.0354 16.9062L69.9565 22.004C69.9367 23.3745 69.8775 25.0788 69.7738 27.127C69.6455 29.5292 69.4677 31.0868 69.2456 31.7999C69.0926 32.346 68.7816 32.7607 68.3126 33.0439C68.1497 33.1451 67.9621 33.2108 67.7646 33.2563V35.8861C68.3274 35.8709 68.8359 35.79 69.2802 35.6333C69.7689 35.4613 70.2428 35.1225 70.6871 34.6218C71.3239 33.8986 71.7533 32.9833 71.9656 31.8808C72.1384 31.0261 72.2717 29.8528 72.3655 28.3609C72.4099 27.7591 72.4839 25.6401 72.5975 22.004L72.6765 19.354H74.7942V35.8912H77.4451V16.9062H70.0256H70.0354Z" fill="white"></path></g> <defs><clipPath id="clip0_791_2649"><rect width="180" height="53" fill="white"></rect></clipPath></defs></svg>
            </span>
          </div>
        </div>
        <div style={{ position: 'absolute', right: '32px', top: 0, height: '100%', display: 'flex', alignItems: 'center' }} className="header-user-section">
          <Space>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <Button 
                type="text" 
                className="user-button enhanced-user-button" 
                style={{ 
                  background: 'linear-gradient(135deg, #FCB813 0%, #f0a500 100%)', 
                  color: '#222', 
                  border: '2px solid #FCB813', 
                  fontWeight: 600,
                  borderRadius: '24px',
                  padding: '8px 20px',
                  height: '48px',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(252, 184, 19, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <UserAvatar 
                  user={user} 
                  size="medium" 
                  className="user-avatar"
                />
                <div className="user-info" style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  lineHeight: 1.2,
                  minWidth: 0 
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#222' }}>
                    {user?.username || 'Пользователь'}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(34, 34, 34, 0.7)', textTransform: 'capitalize' }}>
                    {isAdmin ? 'Администратор' : 'Пользователь'}
                  </span>
                </div>
              </Button>
            </Dropdown>
          </Space>
        </div>
      </Header>
      
      <Content style={adaptiveStyles.content}>
        <div style={adaptiveStyles.tabsContainer}>
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={getTabItems()}
            tabBarGutter={0}
            size="large"
            type="card"
            centered={false}
            tabPosition="top"
            destroyInactiveTabPane={false}
          />
        </div>
      </Content>
      
      <Footer style={adaptiveStyles.footer}>
        ООО "Алмазгеобур" ©2025
      </Footer>

      {/* Модальное окно смены пароля */}
      <ChangePasswordModal
        visible={forcePasswordChange}
        onCancel={() => {}} // Нельзя отменить принудительную смену пароля
        onSuccess={handlePasswordChangeSuccess}
        requireCurrentPassword={!forcePasswordChange ? true : false}
      />
    </Layout>
  );
};

const App: React.FC = () => (
  <ConfigProvider locale={ru_RU}>
    <AuthProvider>
      <Main />
    </AuthProvider>
  </ConfigProvider>
);

export default App; 
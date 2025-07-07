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
import { Layout, Menu, Button, Tabs, Dropdown, Space, Card, Form, Input, Select, Typography, message } from "antd";
import { LogoutOutlined, UserOutlined, SettingOutlined, RobotOutlined, CustomerServiceOutlined, DashboardOutlined, SaveOutlined, FileTextOutlined } from "@ant-design/icons";
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
    background: linear-gradient(45deg, #d4af37, #f4d03f);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 900 !important;
    font-size: 32px !important;
    letter-spacing: 2px;
    text-transform: uppercase;
    font-family: 'Inter', sans-serif;
  }
  
  /* Кнопка пользователя */
  .user-button {
    background: #34495e !important;
    border: 1px solid #5a6c7d !important;
    border-radius: 4px !important;
    padding: 8px 16px !important;
    transition: all 0.3s ease !important;
    color: #ffffff !important;
    font-weight: 500 !important;
  }
  
  .user-button:hover {
    background: #5a6c7d !important;
    border-color: #d4af37 !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 8px rgba(212, 175, 55, 0.2) !important;
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
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
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
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
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
    color: #d4af37 !important;
    border-color: #d4af37 !important;
    box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2) !important;
  }
  
  .ant-tabs-tab-active::before {
    opacity: 1;
    background: #d4af37 !important;
  }
  
  .ant-tabs-tab-active .ant-tabs-tab-btn {
    color: #d4af37 !important;
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
    .ant-layout-content {
      margin: 8px !important;
      border-radius: 4px !important;
      width: calc(100% - 16px) !important;
      max-width: calc(100% - 16px) !important;
    }
    
    .ant-tabs-nav-list {
      flex-direction: column !important;
      gap: 4px !important;
    }
    
    .ant-tabs-tab {
      margin-bottom: 0 !important;
      border-radius: 4px !important;
      padding: 10px 8px !important;
      font-size: 13px !important;
      white-space: normal !important;
    }
    
    .app-title {
      font-size: 24px !important;
      letter-spacing: 1px !important;
    }
    
    .ant-tabs-content-holder {
      padding: 0 12px 12px 12px !important;
    }
    
    .ant-tabs-tabpane {
      padding: 12px !important;
    }
  }
  
  @media (max-width: 480px) {
    .ant-tabs-tab {
      font-size: 12px !important;
      padding: 8px 6px !important;
    }
    
    .ant-tabs-content-holder {
      padding: 0 8px 8px 8px !important;
    }
    
    .ant-tabs-tabpane {
      padding: 8px !important;
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
    .ant-tabs-tab {
      font-size: 14px !important;
      padding: 12px 16px !important;
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
    background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%) !important;
    border-color: #d4af37 !important;
    color: #333333 !important;
    font-weight: 600 !important;
  }
  
  .ant-btn-primary:hover {
    background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%) !important;
    border-color: #f4d03f !important;
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
    border-color: #d4af37 !important;
  }
  
  .ant-btn-primary {
    background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%) !important;
    color: #333333 !important;
    border-color: #d4af37 !important;
  }
  
  .ant-btn-primary:hover {
    background: linear-gradient(135deg, #f4d03f 0%, #d4af37 100%) !important;
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
        children: <ProfileManager onBack={undefined} />
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
      <Header style={adaptiveStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="app-title">FELIX</div>
          <img 
            src="https://almazgeobur.kz/wp-content/uploads/2021/08/agb_logo_h-2.svg" 
            alt="AGB Logo" 
            style={{ height: 32, verticalAlign: 'middle' }}
            onError={(e) => {
              // Если логотип не загружается, заменяем на текст
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const textNode = document.createElement('span');
              textNode.textContent = 'AGB';
              textNode.style.cssText = 'font-weight: bold; color: #d4af37; margin-left: 8px; font-size: 16px;';
              target.parentNode?.insertBefore(textNode, target.nextSibling);
            }}
          />
        </div>
        <Space>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
          >
            <Button type="text" className="user-button">
              <Space>
                <UserOutlined />
                {user?.username || 'Пользователь'}
              </Space>
            </Button>
          </Dropdown>
        </Space>
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
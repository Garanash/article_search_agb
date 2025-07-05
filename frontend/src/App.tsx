import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import ArticleTable from "./components/ArticleTable";
import AnalyticsView from "./components/AnalyticsView";
import RequestSidebar from "./components/RequestSidebar";
import ProfileManager from "./components/ProfileManager";
import ChatInterface from "./components/ChatInterface";
import PerplexityChat from "./components/PerplexityChat";
import DocumentAnalyzer from "./components/DocumentAnalyzer";
import AdminPanel from "./components/AdminPanel";
import ChangePasswordModal from "./components/ChangePasswordModal";
import { Layout, Menu, Button, Tabs, Dropdown, Space } from "antd";
import { LogoutOutlined, UserOutlined, SettingOutlined, RobotOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;

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
  
  // Заголовок
  title: {
    color: "#fff",
    fontWeight: 700,
    fontSize: "22px",
    margin: 0,
  },
  
  // Основной контент
  content: {
    padding: "24px",
    maxWidth: "100%",
    margin: "0 auto",
    width: "100%",
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
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
  const { token, setToken, user, setUser, isAdmin } = useAuth();
  const [tab, setTab] = useState('articles');
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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
    setTab('articles');
    setActiveRequestId(null);
    setShowAdminPanel(false);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'admin') {
      setShowAdminPanel(true);
    } else if (key === 'profile') {
      setTab('profile');
    }
  };

  const handlePasswordChangeSuccess = () => {
    setForcePasswordChange(false);
    // Обновляем пользователя, чтобы сбросить флаг force_password_change
    if (user) {
      const updatedUser = { ...user, force_password_change: false };
      // Здесь нужно обновить пользователя в контексте
    }
  };

  if (showAdminPanel) {
    return <AdminPanel onBack={() => setShowAdminPanel(false)} />;
  }

  // Меню пользователя
  const userMenuItems = [
    {
      key: 'profile',
      label: 'Личный кабинет',
      icon: <UserOutlined />,
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
  
  return (
    <Layout style={adaptiveStyles.layout}>
      <Header style={adaptiveStyles.header}>
        <div style={adaptiveStyles.title}>Поиск поставщиков для артикулов</div>
        <Space>
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
          >
            <Button type="text" style={{ color: '#fff' }}>
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
            items={[
              {
                key: 'articles',
                label: 'Артикулы',
                children: (
                  <div style={adaptiveStyles.mainContent} className="content-container">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <ArticleTable activeRequestId={activeRequestId} />
                    </div>
                    <RequestSidebar activeRequestId={activeRequestId} onSelect={setActiveRequestId} />
                  </div>
                )
              }, 
              {
                key: 'analytics',
                label: 'Аналитика',
                children: <AnalyticsView />
              },
              {
                key: 'chat',
                label: 'Чаты с ботами',
                children: <ChatInterface />
              },
              {
                key: 'perplexity',
                label: 'Perplexity AI',
                children: <PerplexityChat />
              },
              {
                key: 'documents',
                label: 'Анализ документов',
                children: <DocumentAnalyzer />
              },
              {
                key: 'profile',
                label: 'Профиль',
                children: <ProfileManager onBack={() => setTab('articles')} />
              }
            ]}
            style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}
            tabBarStyle={{ marginBottom: 16 }}
          />
        </div>
      </Content>
      
      <Footer style={adaptiveStyles.footer}>
        ООО "Алмазгеобур" ©2024
      </Footer>

      {/* Модальное окно смены пароля */}
      <ChangePasswordModal
        visible={forcePasswordChange}
        onCancel={() => {}} // Нельзя отменить принудительную смену пароля
        onSuccess={handlePasswordChangeSuccess}
      />
    </Layout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Main />
  </AuthProvider>
);

export default App; 
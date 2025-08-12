import React, { useState, useEffect } from 'react';
import { Layout, ConfigProvider } from 'antd';
import { useAuth } from './context/AuthContext';
import { professionalTheme } from './styles/antdConfig';
import './styles/professional.css';

// Импорт компонентов
import ProfessionalSidebar from './components/professional/ProfessionalSidebar';
import ProfessionalDashboard from './components/professional/ProfessionalDashboard';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import ArticleTable from './components/ArticleTable';
import UserManagement from './components/UserManagement';
import AdminSupport from './components/AdminSupport';
import AnalyticsView from './components/AnalyticsView';
import DocumentManager from './components/DocumentManager';
import EmailCampaigns from './components/EmailCampaigns';
import PhoneDirectory from './components/PhoneDirectory';
import ProfileManager from './components/ProfileManager';
import LoginForm from './components/LoginForm';

const { Content } = Layout;

const App: React.FC = () => {
  const { user, token, setToken, isAdmin, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Проверяем аутентификацию
  const isAuthenticated = !!token;

  // Отладочная информация
  useEffect(() => {
    console.log('App: token changed:', token ? 'present' : 'missing');
    console.log('App: isAuthenticated:', isAuthenticated);
    console.log('App: user:', user);
    console.log('App: isAdmin:', isAdmin);
    console.log('App: loading:', loading);
  }, [token, isAuthenticated, user, isAdmin, loading]);

  // Обработчик входа в систему
  const handleLogin = (token: string) => {
    console.log('App: handleLogin called with token:', token ? 'present' : 'missing');
    setToken(token);
  };

  // Обработчик выхода из системы
  const handleLogout = () => {
    console.log('App: handleLogout called');
    logout();
    setActiveTab('dashboard');
  };

  // Обработчик изменения вкладки
  const handleTabChange = (tab: string) => {
    console.log('App: handleTabChange called with tab:', tab);
    setActiveTab(tab);
  };

  // Обработчик сворачивания/разворачивания сайдбара
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Показываем загрузку пока проверяется аутентификация
  if (loading) {
    console.log('App: showing loading state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Загрузка...
      </div>
    );
  }

  // Рендер основного контента в зависимости от активной вкладки
  const renderMainContent = () => {
    console.log('App: renderMainContent called, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('App: showing LoginForm');
      return <LoginForm onLogin={handleLogin} />;
    }

    console.log('App: showing main content, activeTab:', activeTab);
    console.log('App: isAdmin:', isAdmin);

    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? <AdminDashboard /> : <UserDashboard />;
      case 'articles':
        return <ArticleTable />;
      case 'users':
        return isAdmin ? <UserManagement /> : <div>Доступ запрещен</div>;
      case 'analytics':
        return isAdmin ? <AnalyticsView /> : <div>Доступ запрещен</div>;
      case 'support':
        return isAdmin ? <AdminSupport /> : <div>Форма поддержки</div>;
      case 'documents':
        return <DocumentManager />;
      case 'campaigns':
        return <EmailCampaigns />;
      case 'directory':
        return <PhoneDirectory />;
      case 'profile':
        return <ProfileManager />;
      default:
        return isAdmin ? <AdminDashboard /> : <UserDashboard />;
    }
  };

  // Если пользователь не авторизован, показываем только форму входа
  if (!isAuthenticated) {
    console.log('App: rendering login page');
    return (
      <ConfigProvider theme={professionalTheme}>
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          {renderMainContent()}
        </div>
      </ConfigProvider>
    );
  }

  console.log('App: rendering main application');
  return (
    <ConfigProvider theme={professionalTheme}>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Боковая панель навигации */}
        <ProfessionalSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onCollapse={handleSidebarCollapse}
          isAdmin={isAdmin}
          user={user}
          onProfileClick={() => handleTabChange('profile')}
        />

        {/* Основной контент */}
        <Layout style={{ 
          marginLeft: sidebarCollapsed ? 80 : 280,
          transition: 'margin-left 0.2s ease'
        }}>
          <Content style={{ 
            margin: '24px',
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            minHeight: 'calc(100vh - 48px)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            {renderMainContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default App;

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import LoginForm from "./components/LoginForm";
import ProfessionalLoginForm from "./components/professional/ProfessionalLoginForm";
import ProfessionalHeader from "./components/professional/ProfessionalHeader";
import ProfessionalDashboard from "./components/professional/ProfessionalDashboard";
import ArticleTable from "./components/ArticleTable";
import RequestSidebar from "./components/RequestSidebar";
import AdminDashboard from "./components/AdminDashboard";
import UserDashboard from "./components/UserDashboard";
import ProfileManager from './components/ProfileManager';
import ChatBot from './components/ChatBot';
import { Layout, ConfigProvider, message } from "antd";
import ru_RU from 'antd/lib/locale/ru_RU';
import { getUserProfile } from "./api/userApi";
import professionalTheme from './styles/antdConfig';
import './styles/professional.css';

const { Content } = Layout;

interface MainAppProps {}

const MainApp: React.FC<MainAppProps> = () => {
  const { token, setToken, user, setUser, isAdmin, updateUser, forcePasswordChange, setForcePasswordChange, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? 'dashboard' : 'dashboard');
  const [requests, setRequests] = useState<any[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);

  // AuthContext уже управляет загрузкой профиля, поэтому убираем дублированную логику

  const handleLogout = () => {
    logout(); // Используем функцию logout из AuthContext
    setActiveTab('dashboard');
    setActiveRequestId(null);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (!token) {
    return <ProfessionalLoginForm onLogin={setToken} />;
  }

  if (forcePasswordChange) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '1rem',
          textAlign: 'center'
        }}>
          Необходимо сменить пароль
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProfessionalDashboard />;
      case 'articles':
        return (
          <div style={{ 
            display: 'flex', 
            height: 'calc(100vh - 72px)',
            background: 'var(--bg-secondary, #f8fafc)'
          }}>
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
        );
      case 'users':
        return isAdmin ? <AdminDashboard /> : <ProfessionalDashboard />;
      case 'analytics':
        return isAdmin ? <AdminDashboard /> : <ProfessionalDashboard />;
      case 'support':
        return <UserDashboard />;
      case 'profile':
        return (
          <div style={{ 
            padding: '24px',
            background: 'var(--bg-secondary, #f8fafc)',
            minHeight: 'calc(100vh - 72px)'
          }}>
            <ProfileManager />
          </div>
        );
      case 'chat':
        return (
          <div style={{ 
            padding: '24px',
            background: 'var(--bg-secondary, #f8fafc)',
            minHeight: 'calc(100vh - 72px)'
          }}>
            <ChatBot />
          </div>
        );
      default:
        return <ProfessionalDashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <ProfessionalHeader 
        user={user}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <Content style={{ padding: 0 }}>
        {renderContent()}
      </Content>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={ru_RU} theme={professionalTheme}>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ConfigProvider>
  );
};

export default App;

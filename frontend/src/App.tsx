import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import ArticleTable from "./components/ArticleTable";
import AnalyticsView from "./components/AnalyticsView";
import RequestSidebar from "./components/RequestSidebar";
import { Layout, Menu, Button, Tabs } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
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
  const { token, setToken } = useAuth();
  const [tab, setTab] = React.useState('articles');
  const [activeRequestId, setActiveRequestId] = React.useState<number | null>(null);
  
  if (!token) return <LoginForm />;
  
  return (
    <Layout style={adaptiveStyles.layout}>
      <Header style={adaptiveStyles.header}>
        <div style={adaptiveStyles.title}>Поиск поставщиков для артикулов</div>
        <Button icon={<LogoutOutlined />} onClick={() => setToken(null)}>
          Выйти
        </Button>
      </Header>
      
      <Content style={adaptiveStyles.content}>
        <div style={adaptiveStyles.tabsContainer}>
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[{
              key: 'articles',
              label: 'Артикулы',
              children: (
                <div style={adaptiveStyles.mainContent} className="content-container">
                  <RequestSidebar activeRequestId={activeRequestId} onSelect={setActiveRequestId} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ArticleTable activeRequestId={activeRequestId} />
                  </div>
                </div>
              )
            }, {
              key: 'analytics',
              label: 'Аналитика',
              children: <AnalyticsView />
            }]}
            style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}
            tabBarStyle={{ marginBottom: 16 }}
          />
        </div>
      </Content>
      
      <Footer style={adaptiveStyles.footer}>NeuroFork ©2025</Footer>
    </Layout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Main />
  </AuthProvider>
);

export default App; 
import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import ArticleTable from "./components/ArticleTable";
import AnalyticsView from "./components/AnalyticsView";
import { Layout, Menu, Button, Tabs } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;

const Main: React.FC = () => {
  const { token, setToken } = useAuth();
  const [tab, setTab] = React.useState('articles');
  if (!token) return <LoginForm />;
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>Поиск поставщиков для артикулов</div>
        <Button icon={<LogoutOutlined />} onClick={() => setToken(null)}>
          Выйти
        </Button>
      </Header>
      <Content style={{ padding: 24, maxWidth: 2200, minWidth: 1200, margin: "0 auto", width: "100%" }}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[{
            key: 'articles',
            label: 'Артикулы',
            children: <ArticleTable />
          }, {
            key: 'analytics',
            label: 'Аналитика',
            children: <AnalyticsView />
          }]}
          style={{ marginBottom: 0 }}
        />
      </Content>
      <Footer style={{ textAlign: "center" }}>NeuroFork ©2025</Footer>
    </Layout>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Main />
  </AuthProvider>
);

export default App; 
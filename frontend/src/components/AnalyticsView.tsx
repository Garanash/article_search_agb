import React, { useEffect, useState } from "react";
import { getAnalytics } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Card, List, Typography, Spin, Empty, message } from "antd";

const { Title } = Typography;

// Адаптивные стили для аналитики
const analyticsStyles = {
  container: {
    display: "flex",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  
  card: {
    width: "100%",
    maxWidth: "100%",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
  },
  
  title: {
    marginBottom: "24px",
  },
  
  listItem: {
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  
  timestamp: {
    color: "#888",
    marginRight: "8px",
  },
  
  action: {
    fontWeight: 500,
  },
  
  details: {
    color: "#aaa",
    marginLeft: "8px",
  },
};

const AnalyticsView: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getAnalytics();
        if (Array.isArray(data)) {
          setAnalytics(data);
        } else {
          setAnalytics([]);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Ошибка при загрузке аналитики');
        message.error('Ошибка при загрузке аналитики');
        setAnalytics([]);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [token]);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "400px" 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={analyticsStyles.container}>
        <Card style={analyticsStyles.card}>
          <Empty
            description={error}
            image={<div style={{ fontSize: '64px', color: '#d9d9d9' }}>📊</div>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={analyticsStyles.container}>
      <Card style={analyticsStyles.card}>
        <Title level={4} style={analyticsStyles.title}>Аналитика</Title>
        <List
          dataSource={analytics}
          renderItem={a => (
            <List.Item style={analyticsStyles.listItem}>
              <span style={analyticsStyles.timestamp}>
                {new Date(a.timestamp).toLocaleString('ru-RU')}:
              </span> 
              <span style={analyticsStyles.action}>{a.action}</span> 
              <span style={analyticsStyles.details}>({a.details})</span>
            </List.Item>
          )}
          locale={{ emptyText: 'Нет данных аналитики' }}
        />
      </Card>
    </div>
  );
};

export default AnalyticsView; 
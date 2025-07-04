import React, { useEffect, useState } from "react";
import { getAnalytics } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Card, List, Typography } from "antd";

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

  useEffect(() => {
    if (token) getAnalytics(token).then(data => {
      if (Array.isArray(data)) setAnalytics(data);
      else setAnalytics([]);
    });
  }, [token]);

  return (
    <div style={analyticsStyles.container}>
      <Card style={analyticsStyles.card}>
        <Title level={4} style={analyticsStyles.title}>Аналитика</Title>
        <List
          dataSource={Array.isArray(analytics) ? analytics : []}
          renderItem={a => (
            <List.Item style={analyticsStyles.listItem}>
              <span style={analyticsStyles.timestamp}>{a.timestamp}:</span> 
              <span style={analyticsStyles.action}>{a.action}</span> 
              <span style={analyticsStyles.details}>({a.details})</span>
            </List.Item>
          )}
          locale={{ emptyText: 'Нет данных' }}
        />
      </Card>
    </div>
  );
};

export default AnalyticsView; 
import React, { useEffect, useState } from "react";
import { getAnalytics } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Card, List, Typography } from "antd";

const { Title } = Typography;

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
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
      <Card style={{ maxWidth: 2200, minWidth: 1200 }}>
        <Title level={4}>Аналитика</Title>
        <List
          dataSource={Array.isArray(analytics) ? analytics : []}
          renderItem={a => (
            <List.Item>
              <span style={{ color: '#888' }}>{a.timestamp}:</span> {a.action} <span style={{ color: '#aaa' }}>({a.details})</span>
            </List.Item>
          )}
          locale={{ emptyText: 'Нет данных' }}
        />
      </Card>
    </div>
  );
};

export default AnalyticsView; 
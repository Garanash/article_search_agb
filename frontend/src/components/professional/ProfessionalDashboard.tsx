import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Typography, 
  Button,
  Space,
  Tag,
  List,
  Avatar,
  Badge,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalRequests: number;
  systemHealth: number;
}

interface ActivityItem {
  key: string;
  user: string;
  action: string;
  object: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

interface SystemEvent {
  key: string;
  event: string;
  status: string;
  time: string;
  duration: string;
  result: 'success' | 'processing' | 'error';
}

const ProfessionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArticles: 0,
    totalRequests: 0,
    systemHealth: 100
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Здесь должен быть реальный запрос к API
        const mockData = {
          totalUsers: 156,
          totalArticles: 1234,
          totalRequests: 89,
          systemHealth: 98
        };
        setStats(mockData);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const recentActivities: ActivityItem[] = [
    {
      key: '1',
      user: 'Иван Петров',
      action: 'Создал статью',
      object: 'Руководство по API',
      time: '2 минуты назад',
      status: 'success'
    },
    // ... остальные элементы
  ];

  const systemEvents: SystemEvent[] = [
    {
      key: '1',
      event: 'Резервное копирование',
      status: 'Завершено',
      time: '02:00',
      duration: '15 мин',
      result: 'success'
    },
    // ... остальные элементы
  ];

  const statusConfig = {
    success: { color: 'success', text: 'Успешно' },
    info: { color: 'processing', text: 'Информация' },
    warning: { color: 'warning', text: 'Внимание' },
    error: { color: 'error', text: 'Ошибка' }
  } as const;

  const activityColumns = useMemo(() => [
    {
      title: 'Пользователь',
      dataIndex: 'user',
      key: 'user',
      render: (text: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {text}
        </Space>
      ),
    },
    // ... остальные колонки
  ], []);

  const systemColumns = useMemo(() => [
    {
      title: 'Событие',
      dataIndex: 'event',
      key: 'event',
    },
    // ... остальные колонки
  ], []);

  return (
    <div style={{ padding: '0' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0, color: '#262626' }}>
          Добро пожаловать, {user?.username || 'Пользователь'}!
        </Title>
        <Text type="secondary">
          {new Date().toLocaleDateString('ru-RU', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </div>

      {/* Остальной код без изменений */}
    </div>
  );
};

export default ProfessionalDashboard;
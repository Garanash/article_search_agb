import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Progress, 
  Avatar, 
  List, 
  Statistic, 
  Tag,
  Space,
  Timeline,
  Calendar,
  Badge,
  Tooltip,
  Empty,
  Skeleton
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  MessageOutlined,
  TeamOutlined,
  EyeOutlined,
  HeartOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  totalUsers: number;
  totalArticles: number;
  totalRequests: number;
  completedTasks: number;
  userGrowth: number;
  articleGrowth: number;
  requestGrowth: number;
  taskGrowth: number;
}

interface Activity {
  id: string;
  type: 'user' | 'article' | 'request' | 'system';
  title: string;
  description: string;
  time: string;
  user?: string;
  avatar?: string;
}

interface UpcomingTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: string;
  progress: number;
}

const ModernDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalArticles: 0,
    totalRequests: 0,
    completedTasks: 0,
    userGrowth: 0,
    articleGrowth: 0,
    requestGrowth: 0,
    taskGrowth: 0,
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);

  // Симуляция загрузки данных
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Симуляция API запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalUsers: 1247,
        totalArticles: 5680,
        totalRequests: 892,
        completedTasks: 156,
        userGrowth: 12.5,
        articleGrowth: 8.3,
        requestGrowth: -2.1,
        taskGrowth: 15.7,
      });

      setRecentActivity([
        {
          id: '1',
          type: 'user',
          title: 'Новый пользователь зарегистрирован',
          description: 'Анна Иванова присоединилась к платформе',
          time: '5 минут назад',
          user: 'Анна Иванова',
          avatar: undefined,
        },
        {
          id: '2',
          type: 'article',
          title: 'Артикул обновлен',
          description: 'Обновлена информация о товаре #АБВ-123',
          time: '15 минут назад',
          user: 'Петр Петров',
        },
        {
          id: '3',
          type: 'request',
          title: 'Новый запрос создан',
          description: 'Запрос на поставку материалов',
          time: '1 час назад',
          user: 'Мария Сидорова',
        },
        {
          id: '4',
          type: 'system',
          title: 'Система обновлена',
          description: 'Выпущена новая версия 2.1.3',
          time: '2 часа назад',
          user: 'Система',
        },
      ]);

      setUpcomingTasks([
        {
          id: '1',
          title: 'Проверить новые заявки',
          priority: 'high',
          dueDate: dayjs().add(2, 'hours').format('DD.MM.YYYY HH:mm'),
          assignee: 'Вы',
          progress: 60,
        },
        {
          id: '2',
          title: 'Обновить каталог товаров',
          priority: 'medium',
          dueDate: dayjs().add(1, 'day').format('DD.MM.YYYY HH:mm'),
          assignee: 'Команда',
          progress: 30,
        },
        {
          id: '3',
          title: 'Подготовить отчет',
          priority: 'low',
          dueDate: dayjs().add(3, 'days').format('DD.MM.YYYY HH:mm'),
          assignee: 'Вы',
          progress: 10,
        },
      ]);

      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'user': return <UserOutlined style={{ color: '#6366f1' }} />;
      case 'article': return <FileTextOutlined style={{ color: '#059669' }} />;
      case 'request': return <ShoppingCartOutlined style={{ color: '#dc2626' }} />;
      case 'system': return <BarChartOutlined style={{ color: '#7c3aed' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getPriorityColor = (priority: UpcomingTask['priority']) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#d97706';
      case 'low': return '#059669';
      default: return '#6b7280';
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    growth: number;
    icon: React.ReactNode;
    color: string;
    suffix?: string;
  }> = ({ title, value, growth, icon, color, suffix = '' }) => (
    <Card
      style={{
        borderRadius: 16,
        border: 'none',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        position: 'relative',
      }}
      bodyStyle={{ padding: 24 }}
    >
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontSize: 28,
          color: color,
        }}>
          {icon}
        </div>
      </div>
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Text style={{ 
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 14,
          fontWeight: 500,
        }}>
          {title}
        </Text>
        
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'end', gap: 12 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 700,
            color: isDark ? '#f8fafc' : '#0f172a',
            lineHeight: 1,
          }}>
            {value.toLocaleString()}{suffix}
          </Text>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {growth >= 0 ? (
              <ArrowUpOutlined style={{ color: '#059669', fontSize: 14 }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#dc2626', fontSize: 14 }} />
            )}
            <Text style={{
              color: growth >= 0 ? '#059669' : '#dc2626',
              fontSize: 14,
              fontWeight: 600,
            }}>
              {Math.abs(growth)}%
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card style={{ borderRadius: 16 }}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 24,
      background: isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      minHeight: 'calc(100vh - 72px)',
    }}>
      {/* Приветствие */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ 
          margin: 0,
          color: isDark ? '#f8fafc' : '#0f172a',
          fontSize: 36,
          fontWeight: 700,
        }}>
          Добро пожаловать, {user?.username}! 👋
        </Title>
        <Paragraph style={{ 
          margin: '8px 0 0 0',
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 16,
        }}>
          Сегодня {dayjs().format('dddd, DD MMMM YYYY')} • Вот что происходит в вашей системе
        </Paragraph>
      </div>

      {/* Статистические карточки */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Пользователи"
            value={stats.totalUsers}
            growth={stats.userGrowth}
            icon={<TeamOutlined />}
            color="#6366f1"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Артикулы"
            value={stats.totalArticles}
            growth={stats.articleGrowth}
            icon={<FileTextOutlined />}
            color="#059669"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Запросы"
            value={stats.totalRequests}
            growth={stats.requestGrowth}
            icon={<ShoppingCartOutlined />}
            color="#dc2626"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Завершено"
            value={stats.completedTasks}
            growth={stats.taskGrowth}
            icon={<CheckCircleOutlined />}
            color="#7c3aed"
          />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Последняя активность */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#6366f1' }} />
                <span>Последняя активность</span>
              </Space>
            }
            style={{
              borderRadius: 16,
              border: 'none',
              background: isDark 
                ? 'rgba(255,255,255,0.05)'
                : '#ffffff',
              boxShadow: isDark
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              height: 400,
            }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <List
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item style={{ 
                  padding: '12px 0',
                  border: 'none',
                }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          border: 'none',
                        }}
                        icon={getActivityIcon(item.type)}
                      />
                    }
                    title={
                      <Text style={{ 
                        fontWeight: 600,
                        color: isDark ? '#f8fafc' : '#0f172a',
                      }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <div>
                        <Text style={{ 
                          color: isDark ? '#94a3b8' : '#64748b',
                          fontSize: 14,
                        }}>
                          {item.description}
                        </Text>
                        <br />
                        <Text style={{ 
                          color: isDark ? '#64748b' : '#94a3b8',
                          fontSize: 12,
                        }}>
                          {item.time}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Предстоящие задачи */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#d97706' }} />
                <span>Предстоящие задачи</span>
              </Space>
            }
            style={{
              borderRadius: 16,
              border: 'none',
              background: isDark 
                ? 'rgba(255,255,255,0.05)'
                : '#ffffff',
              boxShadow: isDark
                ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                : '0 4px 20px rgba(0, 0, 0, 0.08)',
              height: 400,
            }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <List
              dataSource={upcomingTasks}
              renderItem={(task) => (
                <List.Item style={{ 
                  padding: '16px 0',
                  border: 'none',
                }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}>
                      <Text style={{ 
                        fontWeight: 600,
                        color: isDark ? '#f8fafc' : '#0f172a',
                      }}>
                        {task.title}
                      </Text>
                      <Tag color={getPriorityColor(task.priority)}>
                        {task.priority === 'high' ? 'Высокий' : 
                         task.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </Tag>
                    </div>
                    
                    <div style={{ marginBottom: 12 }}>
                      <Text style={{ 
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontSize: 14,
                      }}>
                        Срок: {task.dueDate} • Исполнитель: {task.assignee}
                      </Text>
                    </div>
                    
                    <Progress 
                      percent={task.progress} 
                      strokeColor={{
                        '0%': '#6366f1',
                        '100%': '#8b5cf6',
                      }}
                      size="small"
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ModernDashboard;

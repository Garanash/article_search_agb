import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Typography, 
  List, 
  Avatar, 
  Badge, 
  Button,
  Divider,
  Timeline,
  Space,
  Tag
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
  TeamOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { professionalDesign, designUtils } from '../../styles/professionalDesign';

const { Title, Text, Paragraph } = Typography;

const ProfessionalDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalRequests: 0,
    systemHealth: 100
  });

  useEffect(() => {
    // Симуляция загрузки данных
    setTimeout(() => {
      setStats({
        totalUsers: 156,
        totalArticles: 1234,
        totalRequests: 89,
        systemHealth: 98
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div style={containerStyle}>
      {/* Заголовок дашборда */}
      <div style={headerSectionStyle}>
        <div>
          <Title level={2} style={mainTitleStyle}>
            {getGreeting()}, {user?.first_name || user?.username}! 👋
          </Title>
          <Paragraph style={subtitleStyle}>
            Добро пожаловать в панель управления. Вот обзор текущей активности системы.
          </Paragraph>
        </div>
        <div style={headerActionsStyle}>
          <Button type="primary" icon={<SettingOutlined />} style={actionButtonStyle}>
            Настройки
          </Button>
        </div>
      </div>

      {/* Основная статистика */}
      <Row gutter={[24, 24]} style={{ marginBottom: professionalDesign.spacing[8] }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} bordered={false}>
            <Statistic
              title={<span style={statTitleStyle}>Всего пользователей</span>}
              value={stats.totalUsers}
              loading={loading}
              prefix={<UserOutlined style={{ color: professionalDesign.colors.primary[500] }} />}
              suffix={
                <span style={statChangeStyle}>
                  <ArrowUpOutlined style={{ color: professionalDesign.colors.semantic.success.main }} />
                  12%
                </span>
              }
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} bordered={false}>
            <Statistic
              title={<span style={statTitleStyle}>Статьи в системе</span>}
              value={stats.totalArticles}
              loading={loading}
              prefix={<FileTextOutlined style={{ color: professionalDesign.colors.semantic.info.main }} />}
              suffix={
                <span style={statChangeStyle}>
                  <ArrowUpOutlined style={{ color: professionalDesign.colors.semantic.success.main }} />
                  8%
                </span>
              }
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} bordered={false}>
            <Statistic
              title={<span style={statTitleStyle}>Активные запросы</span>}
              value={stats.totalRequests}
              loading={loading}
              prefix={<BarChartOutlined style={{ color: professionalDesign.colors.semantic.warning.main }} />}
              suffix={
                <span style={statChangeStyle}>
                  <ArrowDownOutlined style={{ color: professionalDesign.colors.semantic.error.main }} />
                  3%
                </span>
              }
              valueStyle={statValueStyle}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} bordered={false}>
            <div style={healthCardContentStyle}>
              <div style={healthHeaderStyle}>
                <Text style={statTitleStyle}>Состояние системы</Text>
                <Badge 
                  status="success" 
                  text={<span style={healthStatusStyle}>Отлично</span>}
                />
              </div>
              <div style={healthProgressStyle}>
                <Progress
                  type="circle"
                  percent={stats.systemHealth}
                  size={60}
                  strokeColor={{
                    '0%': professionalDesign.colors.semantic.success.main,
                    '100%': professionalDesign.colors.semantic.success.light,
                  }}
                  format={(percent) => (
                    <span style={healthPercentStyle}>{percent}%</span>
                  )}
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Основной контент */}
      <Row gutter={[24, 24]}>
        {/* Левая колонка */}
        <Col xs={24} lg={16}>
          {/* Последняя активность */}
          <Card 
            title={<span style={cardTitleStyle}>Последняя активность</span>}
            style={contentCardStyle}
            bordered={false}
            extra={
              <Button type="link" style={linkButtonStyle}>
                Посмотреть все
              </Button>
            }
          >
            <Timeline style={timelineStyle}>
              {activityData.map((item, index) => (
                <Timeline.Item
                  key={index}
                  dot={React.cloneElement(item.icon, { style: timelineIconStyle })}
                  color={item.color}
                >
                  <div style={timelineItemStyle}>
                    <div style={timelineContentStyle}>
                      <Text strong style={timelineActionStyle}>{item.action}</Text>
                      <Text style={timelineDescriptionStyle}>{item.description}</Text>
                    </div>
                    <Text style={timelineTimeStyle}>{item.time}</Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          {/* Популярные статьи */}
          <Card 
            title={<span style={cardTitleStyle}>Популярные статьи</span>}
            style={contentCardStyle}
            bordered={false}
            extra={
              <Button type="link" style={linkButtonStyle}>
                Управление статьями
              </Button>
            }
          >
            <List
              dataSource={popularArticles}
              renderItem={(item, index) => (
                <List.Item style={listItemStyle}>
                  <List.Item.Meta
                    avatar={
                      <div style={rankBadgeStyle}>
                        {index + 1}
                      </div>
                    }
                    title={<span style={articleTitleStyle}>{item.title}</span>}
                    description={
                      <div style={articleMetaStyle}>
                        <Text style={articleStatsStyle}>
                          {item.views} просмотров • {item.comments} комментариев
                        </Text>
                        <Tag color={item.status === 'published' ? 'green' : 'orange'}>
                          {item.status === 'published' ? 'Опубликовано' : 'Черновик'}
                        </Tag>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Правая колонка */}
        <Col xs={24} lg={8}>
          {/* Быстрые действия */}
          <Card 
            title={<span style={cardTitleStyle}>Быстрые действия</span>}
            style={contentCardStyle}
            bordered={false}
          >
            <div style={quickActionsStyle}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  type="default"
                  icon={action.icon}
                  style={quickActionButtonStyle}
                  block
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Уведомления */}
          <Card 
            title={<span style={cardTitleStyle}>Уведомления</span>}
            style={contentCardStyle}
            bordered={false}
            extra={<Badge count={notifications.length} />}
          >
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item style={notificationItemStyle}>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={item.icon} 
                        style={{ 
                          backgroundColor: item.color,
                          color: professionalDesign.colors.neutral[0]
                        }}
                        size="small"
                      />
                    }
                    title={<span style={notificationTitleStyle}>{item.title}</span>}
                    description={<Text style={notificationTimeStyle}>{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Производительность */}
          <Card 
            title={<span style={cardTitleStyle}>Производительность</span>}
            style={contentCardStyle}
            bordered={false}
          >
            <div style={performanceStyle}>
              {performanceMetrics.map((metric, index) => (
                <div key={index} style={performanceItemStyle}>
                  <div style={performanceHeaderStyle}>
                    <Text style={performanceLabelStyle}>{metric.label}</Text>
                    <Text style={performanceValueStyle}>{metric.value}%</Text>
                  </div>
                  <Progress 
                    percent={metric.value} 
                    showInfo={false}
                    strokeColor={metric.color}
                    size="small"
                    style={performanceProgressStyle}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Вспомогательные функции
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 17) return 'Добрый день';
  return 'Добрый вечер';
};

// Данные для компонента
const activityData = [
  {
    action: 'Новый пользователь зарегистрирован',
    description: 'Иван Петров присоединился к системе',
    time: '2 минуты назад',
    icon: <UserOutlined />,
    color: professionalDesign.colors.semantic.success.main
  },
  {
    action: 'Статья опубликована',
    description: 'Руководство по использованию API',
    time: '15 минут назад',
    icon: <FileTextOutlined />,
    color: professionalDesign.colors.semantic.info.main
  },
  {
    action: 'Обращение в поддержку',
    description: 'Вопрос по функциональности системы',
    time: '1 час назад',
    icon: <MessageOutlined />,
    color: professionalDesign.colors.semantic.warning.main
  },
  {
    action: 'Обновление системы',
    description: 'Версия 2.1.0 успешно установлена',
    time: '3 часа назад',
    icon: <SettingOutlined />,
    color: professionalDesign.colors.primary[500]
  }
];

const popularArticles = [
  {
    title: 'Руководство по интеграции API',
    views: 1234,
    comments: 45,
    status: 'published'
  },
  {
    title: 'Настройка безопасности системы',
    views: 987,
    comments: 32,
    status: 'published'
  },
  {
    title: 'Лучшие практики администрирования',
    views: 756,
    comments: 28,
    status: 'draft'
  },
  {
    title: 'Оптимизация производительности',
    views: 654,
    comments: 19,
    status: 'published'
  }
];

const quickActions = [
  { label: 'Создать статью', icon: <FileTextOutlined /> },
  { label: 'Добавить пользователя', icon: <UserOutlined /> },
  { label: 'Просмотреть отчеты', icon: <BarChartOutlined /> },
  { label: 'Настройки системы', icon: <SettingOutlined /> }
];

const notifications = [
  {
    title: 'Новое обращение пользователя',
    time: '5 минут назад',
    icon: <MessageOutlined />,
    color: professionalDesign.colors.semantic.info.main
  },
  {
    title: 'Требуется модерация',
    time: '1 час назад',
    icon: <ExclamationCircleOutlined />,
    color: professionalDesign.colors.semantic.warning.main
  },
  {
    title: 'Резервное копирование завершено',
    time: '2 часа назад',
    icon: <CheckCircleOutlined />,
    color: professionalDesign.colors.semantic.success.main
  }
];

const performanceMetrics = [
  {
    label: 'Загрузка ЦП',
    value: 35,
    color: professionalDesign.colors.semantic.success.main
  },
  {
    label: 'Использование памяти',
    value: 68,
    color: professionalDesign.colors.semantic.warning.main
  },
  {
    label: 'Сетевая активность',
    value: 42,
    color: professionalDesign.colors.semantic.info.main
  },
  {
    label: 'Дисковое пространство',
    value: 28,
    color: professionalDesign.colors.primary[500]
  }
];

// Стили компонента
const containerStyle: React.CSSProperties = {
  padding: professionalDesign.spacing[6],
  backgroundColor: professionalDesign.colors.neutral[50],
  minHeight: '100vh'
};

const headerSectionStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: professionalDesign.spacing[8]
};

const mainTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontWeight: professionalDesign.typography.fontWeight.bold,
  marginBottom: professionalDesign.spacing[2]
};

const subtitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[600],
  fontSize: professionalDesign.typography.fontSize.lg,
  marginBottom: 0
};

const headerActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: professionalDesign.spacing[3]
};

const actionButtonStyle: React.CSSProperties = {
  height: '40px',
  borderRadius: professionalDesign.borderRadius.lg
};

const statCardStyle: React.CSSProperties = {
  borderRadius: professionalDesign.borderRadius.xl,
  boxShadow: professionalDesign.shadows.sm,
  border: `1px solid ${professionalDesign.colors.neutral[200]}`,
  transition: professionalDesign.transitions.normal
};

const statTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[600],
  fontSize: professionalDesign.typography.fontSize.sm,
  fontWeight: professionalDesign.typography.fontWeight.medium
};

const statValueStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontWeight: professionalDesign.typography.fontWeight.bold
};

const statChangeStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.xs,
  marginLeft: professionalDesign.spacing[2]
};

const healthCardContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: professionalDesign.spacing[4]
};

const healthHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: professionalDesign.spacing[2]
};

const healthStatusStyle: React.CSSProperties = {
  color: professionalDesign.colors.semantic.success.main,
  fontWeight: professionalDesign.typography.fontWeight.medium
};

const healthProgressStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center'
};

const healthPercentStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.xs,
  fontWeight: professionalDesign.typography.fontWeight.bold,
  color: professionalDesign.colors.semantic.success.main
};

const contentCardStyle: React.CSSProperties = {
  borderRadius: professionalDesign.borderRadius.xl,
  boxShadow: professionalDesign.shadows.sm,
  border: `1px solid ${professionalDesign.colors.neutral[200]}`,
  marginBottom: professionalDesign.spacing[6]
};

const cardTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontWeight: professionalDesign.typography.fontWeight.semibold,
  fontSize: professionalDesign.typography.fontSize.base
};

const linkButtonStyle: React.CSSProperties = {
  color: professionalDesign.colors.primary[600],
  fontWeight: professionalDesign.typography.fontWeight.medium,
  padding: 0
};

const timelineStyle: React.CSSProperties = {
  marginTop: professionalDesign.spacing[4]
};

const timelineIconStyle: React.CSSProperties = {
  fontSize: '14px'
};

const timelineItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
};

const timelineContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const timelineActionStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontSize: professionalDesign.typography.fontSize.sm,
  marginBottom: professionalDesign.spacing[1]
};

const timelineDescriptionStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[600],
  fontSize: professionalDesign.typography.fontSize.sm
};

const timelineTimeStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[500],
  fontSize: professionalDesign.typography.fontSize.xs,
  whiteSpace: 'nowrap'
};

const listItemStyle: React.CSSProperties = {
  padding: `${professionalDesign.spacing[3]} 0`,
  borderBottom: `1px solid ${professionalDesign.colors.neutral[200]}`
};

const rankBadgeStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: professionalDesign.colors.primary[100],
  color: professionalDesign.colors.primary[700],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: professionalDesign.typography.fontWeight.bold,
  fontSize: professionalDesign.typography.fontSize.sm
};

const articleTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontWeight: professionalDesign.typography.fontWeight.medium
};

const articleMetaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: professionalDesign.spacing[1]
};

const articleStatsStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[500],
  fontSize: professionalDesign.typography.fontSize.xs
};

const quickActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: professionalDesign.spacing[3]
};

const quickActionButtonStyle: React.CSSProperties = {
  height: '40px',
  borderRadius: professionalDesign.borderRadius.lg,
  border: `1px solid ${professionalDesign.colors.neutral[300]}`,
  textAlign: 'left'
};

const notificationItemStyle: React.CSSProperties = {
  padding: `${professionalDesign.spacing[2]} 0`,
  borderBottom: `1px solid ${professionalDesign.colors.neutral[200]}`
};

const notificationTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontSize: professionalDesign.typography.fontSize.sm,
  fontWeight: professionalDesign.typography.fontWeight.medium
};

const notificationTimeStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[500],
  fontSize: professionalDesign.typography.fontSize.xs
};

const performanceStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: professionalDesign.spacing[4]
};

const performanceItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: professionalDesign.spacing[2]
};

const performanceHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const performanceLabelStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[700],
  fontSize: professionalDesign.typography.fontSize.sm,
  fontWeight: professionalDesign.typography.fontWeight.medium
};

const performanceValueStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  fontSize: professionalDesign.typography.fontSize.sm,
  fontWeight: professionalDesign.typography.fontWeight.bold
};

const performanceProgressStyle: React.CSSProperties = {
  margin: 0
};

export default ProfessionalDashboard;

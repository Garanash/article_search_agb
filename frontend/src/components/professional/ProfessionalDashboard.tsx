import React, { useState, useEffect } from 'react';
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
  Progress,
  List,
  Avatar,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

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

  // Данные для таблицы последних действий
  const recentActivities = [
    {
      key: '1',
      user: 'Иван Петров',
      action: 'Создал статью',
      object: 'Руководство по API',
      time: '2 минуты назад',
      status: 'success'
    },
    {
      key: '2',
      user: 'Мария Сидорова',
      action: 'Обновила профиль',
      object: 'Личные данные',
      time: '15 минут назад',
      status: 'info'
    },
    {
      key: '3',
      user: 'Алексей Козлов',
      action: 'Отправил запрос',
      object: 'Техническая поддержка',
      time: '1 час назад',
      status: 'warning'
    },
    {
      key: '4',
      user: 'Елена Волкова',
      action: 'Загрузила документ',
      object: 'Отчет Q4 2024',
      time: '3 часа назад',
      status: 'success'
    }
  ];

  // Данные для таблицы системных событий
  const systemEvents = [
    {
      key: '1',
      event: 'Резервное копирование',
      status: 'Завершено',
      time: '02:00',
      duration: '15 мин',
      result: 'success'
    },
    {
      key: '2',
      event: 'Проверка безопасности',
      status: 'Выполняется',
      time: '04:30',
      duration: '45 мин',
      result: 'processing'
    },
    {
      key: '3',
      event: 'Обновление индексов',
      status: 'Завершено',
      time: '06:00',
      duration: '8 мин',
      result: 'success'
    },
    {
      key: '4',
      event: 'Очистка логов',
      status: 'Завершено',
      time: '08:00',
      duration: '3 мин',
      result: 'success'
    }
  ];

  // Колонки для таблицы последних действий
  const activityColumns = [
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
    {
      title: 'Действие',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Объект',
      dataIndex: 'object',
      key: 'object',
    },
    {
      title: 'Время',
      dataIndex: 'time',
      key: 'time',
      render: (text: string) => (
        <Text type="secondary">{text}</Text>
      ),
    },
    {
      title: 'Статус',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => {
        const statusConfig = {
          success: { color: 'success', text: 'Успешно' },
          info: { color: 'processing', text: 'Информация' },
          warning: { color: 'warning', text: 'Внимание' },
          error: { color: 'error', text: 'Ошибка' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: () => (
        <Space size="small">
          <Tooltip title="Просмотреть">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Колонки для таблицы системных событий
  const systemColumns = [
    {
      title: 'Событие',
      dataIndex: 'event',
      key: 'event',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Выполняется' ? 'processing' : 'success'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Время',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Длительность',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Результат',
      key: 'result',
      dataIndex: 'result',
      render: (result: string) => {
        const resultConfig = {
          success: { color: 'success', text: 'Успешно' },
          processing: { color: 'processing', text: 'Выполняется' },
          error: { color: 'error', text: 'Ошибка' }
        };
        const config = resultConfig[result as keyof typeof resultConfig];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Заголовок страницы */}
      <div style={{ 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            Панель управления
          </Title>
          <Text type="secondary">
            Обзор системы и ключевые показатели
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Обновить
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Создать
          </Button>
        </Space>
      </div>

      {/* Статистические карточки */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего пользователей"
              value={stats.totalUsers}
              loading={loading}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> +12%
                </span>
              }
              valueStyle={{ color: '#262626', fontSize: '24px' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Статьи в системе"
              value={stats.totalArticles}
              loading={loading}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  <ArrowUpOutlined /> +8%
                </span>
              }
              valueStyle={{ color: '#262626', fontSize: '24px' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Активные запросы"
              value={stats.totalRequests}
              loading={loading}
              prefix={<BarChartOutlined style={{ color: '#faad14' }} />}
              suffix={
                <span style={{ fontSize: '12px', color: '#ff4d4f' }}>
                  <ArrowDownOutlined /> -3%
                </span>
              }
              valueStyle={{ color: '#262626', fontSize: '24px' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ display: 'block', marginBottom: '8px' }}>
                Состояние системы
              </Text>
              <Progress
                type="circle"
                percent={stats.systemHealth}
                size={60}
                strokeColor="#52c41a"
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: '8px' }}>
                <Tag color="success">Отлично</Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Основной контент */}
      <Row gutter={[16, 16]}>
        {/* Левая колонка */}
        <Col xs={24} lg={16}>
          {/* Последние действия пользователей */}
          <Card 
            title="Последние действия пользователей"
            extra={<Button type="link">Посмотреть все</Button>}
            style={{ marginBottom: '16px' }}
          >
            <Table
              columns={activityColumns}
              dataSource={recentActivities}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </Card>

          {/* Системные события */}
          <Card 
            title="Системные события"
            extra={<Button type="link">Журнал событий</Button>}
          >
            <Table
              columns={systemColumns}
              dataSource={systemEvents}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </Card>
        </Col>

        {/* Правая колонка */}
        <Col xs={24} lg={8}>
          {/* Быстрые действия */}
          <Card 
            title="Быстрые действия"
            style={{ marginBottom: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<PlusOutlined />}>
                Создать статью
              </Button>
              <Button block icon={<UserOutlined />}>
                Добавить пользователя
              </Button>
              <Button block icon={<BarChartOutlined />}>
                Сформировать отчет
              </Button>
              <Button block icon={<SettingOutlined />}>
                Настройки системы
              </Button>
            </Space>
          </Card>

          {/* Уведомления */}
          <Card 
            title="Уведомления"
            extra={<Badge count={3} />}
          >
            <List
              size="small"
              dataSource={[
                { title: 'Новое обращение в поддержку', time: '5 мин назад', type: 'info' },
                { title: 'Требуется модерация', time: '1 час назад', type: 'warning' },
                { title: 'Резервное копирование завершено', time: '2 часа назад', type: 'success' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size="small" 
                        icon={
                          item.type === 'info' ? <ExclamationCircleOutlined /> :
                          item.type === 'warning' ? <ClockCircleOutlined /> :
                          <CheckCircleOutlined />
                        }
                        style={{ 
                          backgroundColor: 
                            item.type === 'info' ? '#1890ff' :
                            item.type === 'warning' ? '#faad14' :
                            '#52c41a'
                        }}
                      />
                    }
                    title={<Text style={{ fontSize: '12px' }}>{item.title}</Text>}
                    description={<Text type="secondary" style={{ fontSize: '11px' }}>{item.time}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfessionalDashboard;

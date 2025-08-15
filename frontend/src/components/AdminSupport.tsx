import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Divider,
  Progress,
  Badge,
  Avatar
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  CustomerServiceOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface SupportMessage {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_name: string;
  user_email: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  category: string;
}

const AdminSupport: React.FC = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    openMessages: 0,
    inProgressMessages: 0,
    resolvedMessages: 0,
    avgResponseTime: 0
  });

  // Загрузка данных
  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    setLoading(true);
    try {
      // Загружаем сообщения поддержки
      const messagesResponse = await fetch('/api/support_tickets/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.slice(0, 20)); // Показываем первые 20
      }

      // Загружаем статистику
      const statsResponse = await fetch('/api/support_tickets/analytics/overview', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных поддержки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadMessages = () => {
    loadSupportData();
  };

  // Статусы сообщений
  const statusColors = {
    open: 'red',
    in_progress: 'orange',
    resolved: 'green',
    closed: 'default'
  };

  const statusLabels = {
    open: 'Открыто',
    in_progress: 'В работе',
    resolved: 'Решено',
    closed: 'Закрыто'
  };

  // Приоритеты сообщений
  const priorityColors = {
    low: 'blue',
    medium: 'green',
    high: 'orange',
    urgent: 'red'
  };

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочный'
  };

  // Категории сообщений
  const categoryColors = {
    technical: 'blue',
    billing: 'green',
    general: 'orange',
    bug: 'red',
    feature: 'purple'
  };

  const categoryLabels = {
    technical: 'Техническая',
    billing: 'Биллинг',
    general: 'Общий',
    bug: 'Ошибка',
    feature: 'Функция'
  };

  // Колонки для таблицы сообщений
  const messageColumns = [
    {
      title: 'Тема',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
      width: 250
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string, record: SupportMessage) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{text}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{record.user_email}</div>
          </div>
        </Space>
      ),
      width: 180
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      render: (category: keyof typeof categoryColors) => (
        <Tag color={categoryColors[category]}>
          {categoryLabels[category]}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: keyof typeof priorityColors) => (
        <Tag color={priorityColors[priority]}>
          {priorityLabels[priority]}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY'),
      width: 120
    },
    {
      title: 'Назначено',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (assigned: string) => assigned || <Text type="secondary">Не назначено</Text>,
      width: 120
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        width: '100%'
      }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
            <MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Администрирование поддержки
            </Title>
          <Text type="secondary">Управление обращениями пользователей и системой поддержки</Text>
          </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={handleReloadMessages}
        >
          Обновить данные
          </Button>
        </div>

      {/* МЕТРИКИ АДМИНИСТРИРОВАНИЯ: На всю ширину экрана сверху */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        width: '100%',
        marginBottom: '32px',
        flexWrap: 'wrap'
      }}>
        <Card style={{ flex: '1', minWidth: '200px' }}>
              <Statistic
            title="Всего обращений"
            value={stats.totalMessages}
            loading={loading}
            prefix={<MessageOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
              />
            </Card>
        <Card style={{ flex: '1', minWidth: '200px' }}>
              <Statistic
            title="Открытые обращения"
            value={stats.openMessages}
            loading={loading}
            prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
              />
            </Card>
        <Card style={{ flex: '1', minWidth: '200px' }}>
              <Statistic
            title="В работе"
            value={stats.inProgressMessages}
            loading={loading}
            prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
              />
            </Card>
        <Card style={{ flex: '1', minWidth: '200px' }}>
              <Statistic
            title="Решенные"
            value={stats.resolvedMessages}
            loading={loading}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
              />
            </Card>
      </div>

        <Divider />

      {/* ОСНОВНОЙ КОНТЕНТ: Обращения пользователей на всю ширину экрана */}
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>
            <MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Обращения пользователей
          </Title>
          <Text type="secondary">
            Управление всеми обращениями пользователей в системе поддержки
          </Text>
          </div>
        
        <Table
          dataSource={messages}
          columns={messageColumns}
          rowKey="id"
          loading={loading}
                          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} обращений`,
            size: "small"
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <MessageOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <div style={{ color: '#666' }}>Обращений пока нет</div>
                    </div>
            )
          }}
            />
          </div>
    </div>
  );
};

export default AdminSupport; 
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
  DatePicker,
  message,
  Divider,
  Select,
  Progress
} from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  CalendarOutlined,
  PlusOutlined,
  ReloadOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_name: string;
  created_at: string;
  updated_at: string;
}

interface News {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
}

const AdminDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [newsModalVisible, setNewsModalVisible] = useState(false);
  const [newsForm] = Form.useForm();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    totalTickets: 0,
    activeTickets: 0
  });

  // Загрузка данных
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Загружаем тикеты
      const ticketsResponse = await fetch('/api/support_tickets/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.slice(0, 10)); // Показываем только первые 10
      }

      // Загружаем новости
      const newsResponse = await fetch('/api/news/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        setNews(newsData.slice(0, 3)); // Показываем только первые 3
      }

      // Загружаем события
      const eventsResponse = await fetch('/api/calendar/events/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.slice(0, 5)); // Показываем только первые 5
      }

      // Загружаем статистику
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReloadTickets = () => {
    loadDashboardData();
  };

  const handleAddNews = async (values: any) => {
    try {
      const response = await fetch('/api/news/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('Новость добавлена!');
        setNewsModalVisible(false);
        newsForm.resetFields();
        loadDashboardData();
      } else {
        message.error('Ошибка при добавлении новости');
      }
    } catch (error) {
      message.error('Ошибка при добавлении новости');
    }
  };

  const handleAddEvent = async () => {
    message.info('Функция добавления событий будет реализована позже');
  };

  // Статусы тикетов
  const statusColors = {
    open: 'red',
    in_progress: 'orange',
    resolved: 'green',
    closed: 'default'
  };

  const statusLabels = {
    open: 'Открыт',
    in_progress: 'В работе',
    resolved: 'Решен',
    closed: 'Закрыт'
  };

  // Приоритеты тикетов
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

  // Колонки для таблицы тикетов
  const ticketColumns = [
    {
      title: 'Тема',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
      width: 200
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (text: string) => <Text>{text}</Text>,
      width: 150
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
      {/* МЕТРИКИ СВЕРХУ НА ВСЮ ШИРИНУ */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        width: '100%',
        flexWrap: 'wrap'
      }}>
        <Card style={{ flex: '1', minWidth: '200px' }}>
          <Statistic
            title="Всего пользователей"
            value={stats.totalUsers}
            loading={loading}
            prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card style={{ flex: '1', minWidth: '200px' }}>
          <Statistic
            title="Артикулов в системе"
            value={stats.totalArticles}
            loading={loading}
            prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        <Card style={{ flex: '1', minWidth: '200px' }}>
          <Statistic
            title="Всего обращений"
            value={stats.totalTickets}
            loading={loading}
            prefix={<MessageOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
        <Card style={{ flex: '1', minWidth: '200px' }}>
          <Statistic
            title="Активных обращений"
            value={stats.activeTickets}
            loading={loading}
            prefix={<CustomerServiceOutlined style={{ color: '#f5222d' }} />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </div>

      <Divider />

      {/* ОСНОВНОЙ КОНТЕНТ: Flexbox контейнер */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        width: '100%',
        alignItems: 'flex-start'
      }}>
        {/* ЛЕВЫЙ СТОЛБЕЦ: Обращения пользователей (75% ширины) */}
        <div style={{ flex: '3', minWidth: '0' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '24px',
            width: '100%'
          }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                <CustomerServiceOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                Обращения пользователей
              </Title>
              <Text type="secondary">Управление обращениями пользователей</Text>
            </div>
            <Button onClick={handleReloadTickets} type="primary" size="small">
              <ReloadOutlined />
              Обновить
            </Button>
          </div>

          <Table
            dataSource={tickets}
            columns={ticketColumns}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={false}
            scroll={{ y: 400 }}
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

        {/* ПРАВЫЙ СТОЛБЕЦ: Новости + Календарь (25% ширины) */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          {/* НОВОСТИ */}
          <Card 
            title={
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <BarChartOutlined /> Новости
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  size="small" 
                  style={{ width: '100%' }}
                  onClick={() => setNewsModalVisible(true)}
                >
                  Добавить
                </Button>
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            {news.length > 0 ? (
              <div>
                {news.map((item, index) => (
                  <div key={item.id} style={{ marginBottom: index < news.length - 1 ? '12px' : 0 }}>
                    <Text strong style={{ fontSize: '13px' }}>{item.title}</Text>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      {dayjs(item.created_at).format('DD.MM')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>Новостей пока нет</Text>
              </div>
            )}
          </Card>

          {/* КАЛЕНДАРЬ */}
          <Card 
            title="Календарь" 
            extra={<CalendarOutlined />} 
            size="small"
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="small"
                onClick={handleAddEvent}
              >
                +
              </Button>
            </div>
            {events.length > 0 ? (
              <div>
                {events.slice(0, 3).map((event, index) => (
                  <div key={event.id} style={{ marginBottom: index < Math.min(events.length, 3) - 1 ? '8px' : 0 }}>
                    <Text style={{ fontSize: '12px' }}>{event.title}</Text>
                    <div style={{ fontSize: '10px', color: '#666' }}>
                      {dayjs(event.date).format('DD.MM')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                textAlign: 'center',
                borderRadius: '4px'
              }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Календарь событий
                </Text>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ НОВОСТЕЙ */}
      <Modal
        title="Добавить новость"
        open={newsModalVisible}
        onCancel={() => setNewsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={newsForm} onFinish={handleAddNews} layout="vertical">
          <Form.Item
            name="title"
            label="Заголовок"
            rules={[{ required: true, message: 'Введите заголовок новости' }]}
          >
            <Input placeholder="Введите заголовок новости" />
          </Form.Item>
          <Form.Item
            name="content"
            label="Содержание"
            rules={[{ required: true, message: 'Введите содержание новости' }]}
          >
            <TextArea rows={4} placeholder="Введите содержание новости" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Добавить
              </Button>
              <Button onClick={() => setNewsModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard; 
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Form, Input, Select, message, Calendar, Badge, Modal, List, Avatar, Tag, Divider, Space, Tooltip, DatePicker, Skeleton } from 'antd';
import { MessageOutlined, CalendarOutlined, BellOutlined, UserOutlined, SendOutlined, WarningOutlined, CloseOutlined, CheckCircleOutlined, HeartOutlined, StarOutlined, FireOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface News {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'meeting' | 'deadline' | 'event' | 'holiday';
}

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  // Загрузка данных
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Загружаем новости
      const newsResponse = await apiClient.get('/api/news');
      setNews(newsResponse.data || []);

      // Загружаем события
      const eventsResponse = await apiClient.get('/api/events');
      setEvents(eventsResponse.data || []);

      // Загружаем тикеты пользователя
      const ticketsResponse = await apiClient.get('/api/support_tickets/my');
      setTickets(ticketsResponse.data || []);
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    }
  };

  // Отправка обращения
  const handleSubmitTicket = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.post('/api/support_tickets', {
        title: values.title,
        description: values.description,
        department: values.department,
        priority: values.priority || 'medium'
      });

      if (response.status >= 200 && response.status < 300) {
        message.success('Обращение успешно отправлено!');
        form.resetFields();
        setTicketModalVisible(false);
        loadDashboardData(); // Перезагрузка данных
      }
    } catch (error) {
      console.error('Ошибка отправки обращения:', error);
      message.error('Ошибка отправки обращения');
    } finally {
      setLoading(false);
    }
  };

  // Получение событий для определенной даты
  const getEventsForDate = (date: Dayjs) => {
    return events.filter(event => 
      dayjs(event.date).isSame(date, 'day')
    );
  };

  // Рендер ячейки календаря
  const dateCellRender = (date: Dayjs) => {
    const dayEvents = getEventsForDate(date);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayEvents.slice(0, 2).map(event => (
          <li key={event.id}>
            <Badge 
              status={event.type === 'meeting' ? 'processing' : 
                     event.type === 'deadline' ? 'error' : 
                     event.type === 'holiday' ? 'success' : 'default'} 
              text={
                <span style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '60px', display: 'inline-block' }}>
                  {event.title}
                </span>
              } 
            />
          </li>
        ))}
        {dayEvents.length > 2 && (
          <li>
            <span style={{ fontSize: '10px', color: '#999' }}>
              +{dayEvents.length - 2} еще
            </span>
          </li>
        )}
      </ul>
    );
  };

  // Получение цвета статуса тикета
  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'blue';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'blue';
    }
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  // Получение цвета типа новости
  const getNewsTypeColor = (type: string) => {
    switch (type) {
      case 'info': return '#1890ff';
      case 'warning': return '#faad14';
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      default: return '#1890ff';
    }
  };

  return (
    <div style={{ 
      padding: '0', 
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
      minHeight: '100vh',
      position: 'relative'
    }}>
      {/* Современный хедер с приветствием */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 24px',
        color: 'white',
        borderRadius: '0 0 50px 50px',
        marginBottom: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <HeartOutlined style={{ fontSize: '32px', color: '#ff6b6b', marginRight: '16px' }} />
            <Title level={1} style={{ 
              color: 'white', 
              margin: 0,
              fontSize: '42px',
              fontWeight: '700'
            }}>
              Привет, {user?.username}! 
            </Title>
            <StarOutlined style={{ fontSize: '32px', color: '#feca57', marginLeft: '16px' }} />
          </div>
          <Paragraph style={{ 
            color: 'rgba(255,255,255,0.9)', 
            margin: 0, 
            fontSize: '18px',
            fontWeight: '300'
          }}>
            {dayjs().format('dddd, DD MMMM YYYY')} • Добро пожаловать в ваш личный кабинет
          </Paragraph>
        </div>
      </div>

      {/* Основной контент */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px 40px 24px'
      }}>

        {/* Статистика в верхней части */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={8}>
            <Card style={{
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(255, 154, 158, 0.3)'
            }}>
              <BellOutlined style={{ fontSize: '48px', marginBottom: '12px' }} />
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {news.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Новостей</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(168, 237, 234, 0.3)'
            }}>
              <CalendarOutlined style={{ fontSize: '48px', marginBottom: '12px' }} />
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {events.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Событий</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{
              background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(251, 194, 235, 0.3)'
            }}>
              <MessageOutlined style={{ fontSize: '48px', marginBottom: '12px' }} />
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {tickets.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)' }}>Обращений</Text>
            </Card>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
        {/* Левая колонка - Новости и Обращения */}
        <Col xs={24} lg={12}>
          {/* Новости */}
          <Card 
            title={
              <Space>
                <BellOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Новости компании</span>
              </Space>
            }
            style={{ 
              marginBottom: '24px',
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}
            headStyle={{ 
              background: 'transparent',
              borderBottom: '2px solid #f0f0f0',
              borderRadius: '20px 20px 0 0',
              padding: '20px 24px'
            }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <List
              dataSource={news.slice(0, 5)}
              locale={{ emptyText: 'Нет новостей' }}
              renderItem={(item) => (
                <List.Item style={{ border: 'none', padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '15px',
                        background: `linear-gradient(135deg, ${getNewsTypeColor(item.type)}20, ${getNewsTypeColor(item.type)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 4px 15px ${getNewsTypeColor(item.type)}30`
                      }}>
                        {item.type === 'warning' ? 
                          <WarningOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '20px' }} /> :
                          item.type === 'success' ? 
                          <CheckCircleOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '20px' }} /> :
                          item.type === 'error' ?
                          <CloseOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '20px' }} /> :
                          <BellOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '20px' }} />
                        }
                      </div>
                    }
                    title={
                      <Text strong style={{ fontSize: '14px' }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <div>
                        <Paragraph 
                          ellipsis={{ rows: 2 }} 
                          style={{ margin: '4px 0', color: '#666' }}
                        >
                          {item.content}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(item.created_at).format('DD.MM.YYYY HH:mm')} • {item.author}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Мои обращения */}
          <Card 
            title={
              <Space>
                <MessageOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Мои обращения</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={() => setTicketModalVisible(true)}
                style={{ 
                  borderRadius: '25px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: '45px',
                  padding: '0 25px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Новое обращение
              </Button>
            }
            style={{ 
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}
            headStyle={{ 
              background: 'transparent',
              borderBottom: '2px solid #f0f0f0',
              borderRadius: '20px 20px 0 0',
              padding: '20px 24px'
            }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <List
              dataSource={tickets.slice(0, 5)}
              locale={{ emptyText: 'У вас нет обращений' }}
              renderItem={(item) => (
                <List.Item 
                  style={{ border: 'none', padding: '12px 0' }}
                  actions={[
                    <Tag color={getTicketStatusColor(item.status)}>
                      {item.status === 'open' ? 'Открыто' :
                       item.status === 'in_progress' ? 'В работе' :
                       item.status === 'resolved' ? 'Решено' : 'Закрыто'}
                    </Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: getPriorityColor(item.priority) }}
                        icon={<ExclamationCircleOutlined />}
                      />
                    }
                    title={
                      <Text strong style={{ fontSize: '14px' }}>
                        {item.title}
                      </Text>
                    }
                    description={
                      <div>
                        <Paragraph 
                          ellipsis={{ rows: 1 }} 
                          style={{ margin: '4px 0', color: '#666' }}
                        >
                          {item.description}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {dayjs(item.created_at).format('DD.MM.YYYY HH:mm')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Правая колонка - Календарь */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <CalendarOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                <span style={{ fontSize: '18px', fontWeight: '600' }}>Календарь событий</span>
              </Space>
            }
            style={{ 
              borderRadius: '20px',
              border: 'none',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }}
            headStyle={{ 
              background: 'transparent',
              borderBottom: '2px solid #f0f0f0',
              borderRadius: '20px 20px 0 0',
              padding: '20px 24px'
            }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={setSelectedDate}
              dateCellRender={dateCellRender}
              style={{ 
                background: 'white',
                borderRadius: '8px'
              }}
            />
            
            {/* События выбранного дня */}
            {selectedDate && (
              <div style={{ marginTop: '16px' }}>
                <Divider orientation="left">
                  <Text strong>
                    События на {selectedDate.format('DD MMMM YYYY')}
                  </Text>
                </Divider>
                {getEventsForDate(selectedDate).length > 0 ? (
                  <List
                    size="small"
                    dataSource={getEventsForDate(selectedDate)}
                    renderItem={(event) => (
                      <List.Item style={{ padding: '8px 0' }}>
                        <List.Item.Meta
                          avatar={
                            <Badge 
                              status={event.type === 'meeting' ? 'processing' : 
                                     event.type === 'deadline' ? 'error' : 
                                     event.type === 'holiday' ? 'success' : 'default'} 
                            />
                          }
                          title={<Text strong>{event.title}</Text>}
                          description={event.description}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">Событий на этот день нет</Text>
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>
      </div>

      {/* Модальное окно создания обращения */}
      <Modal
        title={
          <Space>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SendOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Новое обращение</span>
          </Space>
        }
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
        style={{ top: 20 }}
        styles={{
          content: {
            borderRadius: '20px',
            padding: '30px'
          },
          header: {
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '20px',
            marginBottom: '20px'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitTicket}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label="Тема обращения"
            name="title"
            rules={[{ required: true, message: 'Введите тему обращения' }]}
          >
            <Input 
              placeholder="Кратко опишите суть вопроса"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Отдел"
            name="department"
            rules={[{ required: true, message: 'Выберите отдел' }]}
          >
            <Select 
              placeholder="Выберите отдел"
              style={{ borderRadius: '8px' }}
            >
              <Option value="it">IT отдел</Option>
              <Option value="hr">HR отдел</Option>
              <Option value="finance">Финансовый отдел</Option>
              <Option value="support">Техническая поддержка</Option>
              <Option value="management">Руководство</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Приоритет"
            name="priority"
            initialValue="medium"
          >
            <Select style={{ borderRadius: '8px' }}>
              <Option value="low">Низкий</Option>
              <Option value="medium">Средний</Option>
              <Option value="high">Высокий</Option>
              <Option value="urgent">Срочный</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Опишите ваше обращение' }]}
          >
            <TextArea
              rows={4}
              placeholder="Подробно опишите ваш вопрос или проблему"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setTicketModalVisible(false);
                  form.resetFields();
                }}
                style={{ 
                  borderRadius: '20px',
                  height: '45px',
                  padding: '0 25px',
                  border: '2px solid #f0f0f0',
                  fontWeight: '600'
                }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SendOutlined />}
                style={{ 
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: '45px',
                  padding: '0 25px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  fontWeight: '600'
                }}
              >
                Отправить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserDashboard;

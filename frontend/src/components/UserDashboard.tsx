import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Form, Input, Select, message, Badge, Modal, List, Avatar, Tag, Divider, Space, Tooltip, Skeleton } from 'antd';
import { 
  MessageOutlined, 
  CalendarOutlined, 
  BellOutlined, 
  UserOutlined, 
  SendOutlined, 
  WarningOutlined, 
  CloseOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
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
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

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

  // Календарь компонент
  const CalendarComponent = () => {
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    
    const getMonthDays = () => {
      const startOfMonth = currentMonth.startOf('month');
      const endOfMonth = currentMonth.endOf('month');
      const startDate = startOfMonth.startOf('week');
      const endDate = endOfMonth.endOf('week');
      
      const days = [];
      let currentDay = startDate;
      
      while (currentDay.isBefore(endDate) || currentDay.isSame(endDate, 'day')) {
        const dayEvents = events.filter(event => 
          dayjs(event.date).isSame(currentDay, 'day')
        );
        
        days.push({
          date: currentDay,
          events: dayEvents,
          isCurrentMonth: currentDay.isSame(currentMonth, 'month'),
          isToday: currentDay.isSame(dayjs(), 'day')
        });
        
        currentDay = currentDay.add(1, 'day');
      }
      
      return days;
    };

    const goToPrevious = () => {
      setCurrentMonth(currentMonth.subtract(1, 'month'));
    };

    const goToNext = () => {
      setCurrentMonth(currentMonth.add(1, 'month'));
    };

    const goToToday = () => {
      setCurrentMonth(dayjs());
    };

    const handleDayClick = (date: Dayjs) => {
      setSelectedDate(date);
    };

    const monthDays = getMonthDays();

    return (
      <div>
        {/* Навигация календаря */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '16px',
          padding: '0 8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button size="small" onClick={goToPrevious} icon={<span>‹</span>} />
            <Button size="small" onClick={goToNext} icon={<span>›</span>} />
          </div>
          
          <Text strong style={{ fontSize: '16px' }}>
            {currentMonth.format('MMMM YYYY')}
          </Text>
          
          <Button size="small" onClick={goToToday}>
            Сегодня
          </Button>
        </div>

        {/* Календарная сетка */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '1px',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {/* Заголовки дней недели */}
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
            <div
              key={day}
              style={{
                padding: '12px 8px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#666',
                fontSize: '14px',
                backgroundColor: '#fafafa',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              {day}
            </div>
          ))}

          {/* Дни месяца */}
          {monthDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDayClick(day.date)}
              className={`calendar-day ${day.isToday ? 'today' : ''}`}
              style={{
                minHeight: '80px',
                padding: '8px',
                borderRight: (index + 1) % 7 !== 0 ? '1px solid #f0f0f0' : 'none',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: day.isToday ? '#e6f7ff' : 
                               (!day.isCurrentMonth ? '#fafafa' : 'white'),
                opacity: !day.isCurrentMonth ? 0.5 : 1,
                position: 'relative'
              }}
            >
              <Text
                style={{
                  fontWeight: day.isToday ? '700' : '500',
                  color: day.isToday ? '#1890ff' : '#333',
                  fontSize: '14px',
                  position: 'absolute',
                  top: '4px',
                  right: '4px'
                }}
              >
                {day.date.format('D')}
              </Text>

              {/* События дня */}
              <div style={{ 
                marginTop: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px' 
              }}>
                {day.events.slice(0, 2).map((event, eventIndex) => (
                  <Tag
                    key={eventIndex}
                    color={event.type === 'meeting' ? 'blue' : 
                           event.type === 'deadline' ? 'red' : 
                           event.type === 'holiday' ? 'green' : 'default'}
                    style={{
                      fontSize: '11px',
                      margin: 0,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {event.title}
                  </Tag>
                ))}
                {day.events.length > 2 && (
                  <Text style={{ fontSize: '10px', color: '#999' }}>
                    +{day.events.length - 2} еще
                  </Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '24px', 
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* Заголовок страницы */}
      <div style={{ 
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <Title level={2} style={{ 
          color: '#262626',
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Добро пожаловать, {user?.username}!
        </Title>
        <Text style={{ 
          color: '#8c8c8c',
          fontSize: '16px'
        }}>
          {dayjs().format('dddd, DD MMMM YYYY')}
        </Text>
      </div>

      {/* Основной контент */}
      <Row gutter={[24, 24]}>
        {/* Левая колонка - Календарь */}
        <Col xs={24} lg={14}>
          <Card 
            title={
              <Space>
                <CalendarOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Календарь событий</span>
              </Space>
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              height: 'fit-content'
            }}
            headStyle={{ 
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <CalendarComponent />
            
            {/* События выбранного дня */}
            {selectedDate && (
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f0f0f0' }}>
                <Title level={5} style={{ marginBottom: '16px' }}>
                  События на {selectedDate.format('DD MMMM YYYY')}
                </Title>
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

        {/* Правая колонка - Новости и Обращения */}
        <Col xs={24} lg={10}>
          {/* Новости */}
          <Card 
            title={
              <Space>
                <BellOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Новости компании</span>
              </Space>
            }
            style={{ 
              marginBottom: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{ 
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px'
            }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <List
              dataSource={news.slice(0, 5)}
              locale={{ emptyText: 'Нет новостей' }}
              renderItem={(item) => (
                <List.Item style={{ border: 'none', padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `${getNewsTypeColor(item.type)}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {item.type === 'warning' ? 
                          <WarningOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '16px' }} /> :
                          item.type === 'success' ? 
                          <CheckCircleOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '16px' }} /> :
                          item.type === 'error' ?
                          <CloseOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '16px' }} /> :
                          <BellOutlined style={{ color: getNewsTypeColor(item.type), fontSize: '16px' }} />
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
                          style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}
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
                <MessageOutlined style={{ color: '#1890ff', fontSize: '18px' }} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Мои обращения</span>
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setTicketModalVisible(true)}
                size="small"
                style={{ 
                  borderRadius: '6px',
                  height: '32px'
                }}
              >
                Новое
              </Button>
            }
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{ 
              borderBottom: '1px solid #f0f0f0',
              padding: '16px 24px'
            }}
            bodyStyle={{ padding: '16px 24px' }}
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
                        size="small"
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
                          style={{ margin: '4px 0', color: '#666', fontSize: '13px' }}
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
      </Row>

      {/* Модальное окно создания обращения */}
      <Modal
        title={
          <Space>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusOutlined style={{ color: 'white', fontSize: '14px' }} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Новое обращение</span>
          </Space>
        }
        open={ticketModalVisible}
        onCancel={() => {
          setTicketModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        style={{ top: 20 }}
        styles={{
          content: {
            borderRadius: '12px',
            padding: '24px'
          },
          header: {
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px',
            marginBottom: '16px'
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
              style={{ borderRadius: '6px' }}
            />
          </Form.Item>

          <Form.Item
            label="Отдел"
            name="department"
            rules={[{ required: true, message: 'Выберите отдел' }]}
          >
            <Select 
              placeholder="Выберите отдел"
              style={{ borderRadius: '6px' }}
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
            <Select style={{ borderRadius: '6px' }}>
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
              style={{ borderRadius: '6px' }}
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
                  borderRadius: '6px',
                  height: '36px',
                  padding: '0 16px'
                }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<PlusOutlined />}
                style={{ 
                  borderRadius: '6px',
                  height: '36px',
                  padding: '0 16px'
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

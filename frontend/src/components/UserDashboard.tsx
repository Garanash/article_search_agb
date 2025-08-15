import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Form, Input, Select, message, Calendar, Badge, Modal, List, Avatar, Tag, Divider, Space, Tooltip, DatePicker, Skeleton, Empty, Table, InputNumber, Switch, Upload, Drawer, Tabs, Rate, Progress, Statistic, Dropdown, Menu, Pagination } from 'antd';
import { MessageOutlined, CalendarOutlined, BellOutlined, UserOutlined, SendOutlined, WarningOutlined, CloseOutlined, CheckCircleOutlined, HeartOutlined, StarOutlined, FireOutlined, ExclamationCircleOutlined, PlusOutlined, EyeOutlined, ClockCircleOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, SettingOutlined, FileTextOutlined, FormOutlined, BarChartOutlined, EditOutlined, DeleteOutlined, MoreOutlined, UploadOutlined, FilterFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/api';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

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
  has_reply?: boolean;
  last_reply?: string;
  department?: string;
  assigned_to?: string;
}

interface Message {
  id: number;
  type: 'ticket_reply' | 'request_response' | 'system_notification';
  title: string;
  content: string;
  created_at: string;
  is_read: boolean;
  related_id?: number;
}

// Новые интерфейсы
interface Document {
  id: number;
  title: string;
  description: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
  category: 'policy' | 'procedure' | 'form' | 'report' | 'other';
  tags: string[];
}

interface Request {
  id: number;
  title: string;
  description: string;
  type: 'vacation' | 'equipment' | 'access' | 'training' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  requested_dates?: string;
  approver?: string;
  comments?: Comment[];
}

interface Comment {
  id: number;
  content: string;
  author: string;
  created_at: string;
  author_avatar?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  ticket_updates: boolean;
  news_updates: boolean;
  event_reminders: boolean;
  daily_summary: boolean;
  weekly_report: boolean;
}

interface Analytics {
  tickets_created: number;
  tickets_resolved: number;
  average_resolution_time: number;
  satisfaction_rating: number;
  documents_uploaded: number;
  requests_approved: number;
  monthly_trends: Array<{
    month: string;
    tickets: number;
    requests: number;
    documents: number;
  }>;
}

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [eventForm] = Form.useForm();
  const [ticketEditForm] = Form.useForm();
  const [documentForm] = Form.useForm();
  const [requestForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  
  // Основные состояния
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<News[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    ticket_updates: true,
    news_updates: true,
    event_reminders: true,
    daily_summary: false,
    weekly_report: false
  });
  
  // UI состояния
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [ticketEditModalVisible, setTicketEditModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
  // Фильтрация и поиск
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Drag & Drop для событий
  const [draggedEvent, setDraggedEvent] = useState<Event | null>(null);

  // Загрузка данных
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Загружаем новости
              const newsResponse = await apiClient.get('/api/news');
      setNews(newsResponse.data || []);

      // Загружаем события
      const eventsResponse = await apiClient.get('/api/calendar/events');
      setEvents(eventsResponse.data || []);

      // Загружаем тикеты пользователя
      const ticketsResponse = await apiClient.get('/api/support_tickets');
      setTickets(ticketsResponse.data || []);

      // Загружаем документы
      const documentsResponse = await apiClient.get('/api/documents');
      setDocuments(documentsResponse.data || []);

      // Загружаем заявки
      const requestsResponse = await apiClient.get('/api/requests');
      setRequests(requestsResponse.data || []);

      // Загружаем аналитику
      const analyticsResponse = await apiClient.get('/api/analytics');
      setAnalytics(analyticsResponse.data || null);

      // Загружаем сообщения (ответы на тикеты, уведомления)
      await loadMessages();
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
      message.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      // Здесь можно загружать сообщения из разных источников
      // Пока создаем тестовые данные
      const mockMessages: Message[] = [
        {
          id: 1,
          type: 'ticket_reply',
          title: 'Ответ на обращение #123',
          content: 'Ваше обращение по вопросу "Проблема с доступом" рассмотрено. Решение: перезагрузите браузер.',
          created_at: '2024-01-15T10:30:00Z',
          is_read: false
        },
        {
          id: 2,
          type: 'request_response',
          title: 'Заявка одобрена',
          content: 'Ваша заявка на отпуск с 15.02.2024 по 28.02.2024 одобрена руководителем.',
          created_at: '2024-01-14T16:45:00Z',
          is_read: true
        },
        {
          id: 3,
          type: 'system_notification',
          title: 'Обновление системы',
          content: 'Запланировано обновление системы 20.01.2024 в 02:00. Система будет недоступна 2 часа.',
          created_at: '2024-01-13T09:15:00Z',
          is_read: false
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    }
  };

  // Обработка создания обращения
  const handleSubmitTicket = async (values: any) => {
    setLoading(true);
    try {
      await apiClient.post('/api/support_tickets', {
        title: values.title,
        description: values.description,
        priority: values.priority || 'medium',
        department: values.department
      });
      
      message.success('Обращение успешно создано!');
      setTicketModalVisible(false);
      form.resetFields();
      loadDashboardData(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка создания обращения:', error);
      message.error('Ошибка при создании обращения');
    } finally {
      setLoading(false);
    }
  };

  // Обработка создания события
  const handleSubmitEvent = async (values: any) => {
    setLoading(true);
    try {
      await apiClient.post('/api/calendar/events', {
        title: values.title,
        description: values.description,
        date: values.date.toISOString(),
        type: values.type || 'event'
      });
      
      message.success('Событие успешно создано!');
      setEventModalVisible(false);
      eventForm.resetFields();
      loadDashboardData(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка создания события:', error);
      message.error('Ошибка при создании события');
    } finally {
      setLoading(false);
    }
  };

  // Редактирование тикета
  const handleEditTicket = async (values: any) => {
    if (!selectedTicket) return;
    
    setLoading(true);
    try {
      await apiClient.put(`/api/support_tickets/${selectedTicket.id}`, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        department: values.department
      });
      
      message.success('Обращение успешно обновлено!');
      setTicketEditModalVisible(false);
      ticketEditForm.resetFields();
      setSelectedTicket(null);
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка обновления обращения:', error);
      message.error('Ошибка при обновлении обращения');
    } finally {
      setLoading(false);
    }
  };

  // Добавление комментария к тикету
  const handleAddComment = async (ticketId: number, content: string) => {
    try {
      await apiClient.post(`/api/support_tickets/${ticketId}/comments`, {
        content: content
      });
      
      message.success('Комментарий добавлен!');
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      message.error('Ошибка при добавлении комментария');
    }
  };

  // Создание документа
  const handleSubmitDocument = async (values: any) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('category', values.category);
      formData.append('tags', values.tags?.join(',') || '');
      
      if (values.file && values.file[0]) {
        formData.append('file', values.file[0].originFileObj);
      }
      
      await apiClient.post('/api/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      message.success('Документ успешно загружен!');
      setDocumentModalVisible(false);
      documentForm.resetFields();
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка загрузки документа:', error);
      message.error('Ошибка при загрузке документа');
    } finally {
      setLoading(false);
    }
  };

  // Создание заявки
  const handleSubmitRequest = async (values: any) => {
    setLoading(true);
    try {
      await apiClient.post('/api/requests', {
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        requested_dates: values.requested_dates?.toISOString()
      });
      
      message.success('Заявка успешно создана!');
      setRequestModalVisible(false);
      requestForm.resetFields();
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      message.error('Ошибка при создании заявки');
    } finally {
      setLoading(false);
    }
  };

  // Обновление настроек уведомлений
  const handleUpdateNotificationSettings = async (settings: NotificationSettings) => {
    try {
      await apiClient.put('/api/users/notification-settings', settings);
      setNotificationSettings(settings);
      message.success('Настройки уведомлений обновлены!');
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
      message.error('Ошибка при обновлении настроек');
    }
  };

  // Экспорт данных
  const handleExportData = async (type: 'tickets' | 'requests' | 'documents') => {
    try {
      const response = await apiClient.get(`/api/export/${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      message.success(`Данные ${type} успешно экспортированы!`);
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      message.error('Ошибка при экспорте данных');
    }
  };

  // Drag & Drop для событий
  const handleEventDragStart = (event: Event) => {
    setDraggedEvent(event);
  };

  const handleEventDrop = async (date: Dayjs) => {
    if (!draggedEvent) return;
    
    try {
      await apiClient.put(`/api/calendar/events/${draggedEvent.id}`, {
        date: date.toISOString()
      });
      
      message.success('Событие перемещено!');
      loadDashboardData();
    } catch (error) {
      console.error('Ошибка перемещения события:', error);
      message.error('Ошибка при перемещении события');
    } finally {
      setDraggedEvent(null);
    }
  };

  // Получение событий для конкретной даты
  const getEventsForDate = (date: Dayjs) => {
    return events.filter(event => 
      dayjs(event.date).isSame(date, 'day')
    );
  };

  // Рендер ячейки календаря
  const dateCellRender = (date: Dayjs) => {
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length === 0) return null;

    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayEvents.slice(0, 2).map((event, index) => (
          <li key={index} style={{ 
            margin: '1px 0',
            padding: '1px 3px',
            fontSize: '10px',
            borderRadius: '2px',
            backgroundColor: event.type === 'meeting' ? '#1890ff' :
                           event.type === 'deadline' ? '#ff4d4f' :
                           event.type === 'holiday' ? '#52c41a' : '#722ed1',
            color: 'white',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {event.title}
          </li>
        ))}
        {dayEvents.length > 2 && (
          <li style={{ 
            fontSize: '10px',
            color: '#666',
            textAlign: 'center',
            marginTop: '2px'
          }}>
            +{dayEvents.length - 2} еще
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

  // Получение иконки для типа сообщения
  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'ticket_reply': return <EyeOutlined />;
      case 'request_response': return <CheckCircleOutlined />;
      case 'system_notification': return <BellOutlined />;
      default: return <MessageOutlined />;
    }
  };

  // Получение цвета для типа сообщения
  const getMessageColor = (type: string) => {
    switch (type) {
      case 'ticket_reply': return '#1890ff';
      case 'request_response': return '#52c41a';
      case 'system_notification': return '#faad14';
      default: return '#1890ff';
    }
  };

  // Фильтрация и поиск
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         document.description.toLowerCase().includes(searchText.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = statusFilter === 'all' || document.category === statusFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Пагинация
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
          
          {/* Кнопка настроек */}
          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={() => setSettingsDrawerVisible(true)}
            style={{
              position: 'absolute',
              right: '24px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              fontSize: '18px',
              height: '40px',
              width: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          />
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
          <Col xs={24} sm={4}>
            <Card style={{
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(255, 154, 158, 0.3)'
            }}>
              <BellOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {news.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Новостей</Text>
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card style={{
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(168, 237, 234, 0.3)'
            }}>
              <CalendarOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {events.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Событий</Text>
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card style={{
              background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(251, 194, 235, 0.3)'
            }}>
              <MessageOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {tickets.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Обращений</Text>
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card style={{
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(255, 236, 210, 0.3)'
            }}>
              <FileTextOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {documents.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Документов</Text>
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card style={{
              background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(210, 153, 194, 0.3)'
            }}>
              <FormOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {requests.length}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Заявок</Text>
            </Card>
          </Col>
          <Col xs={24} sm={4}>
            <Card style={{
              background: 'linear-gradient(135deg, #a8caba 0%, #5d4e75 100%)',
              border: 'none',
              borderRadius: '20px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 8px 25px rgba(168, 202, 186, 0.3)'
            }}>
              <BarChartOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                {analytics?.satisfaction_rating || 0}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Рейтинг</Text>
            </Card>
          </Col>
        </Row>

        {/* Панель поиска и фильтрации */}
        <Card 
          style={{ 
            marginBottom: '24px',
            borderRadius: '20px',
            border: 'none',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}
          bodyStyle={{ padding: '20px 24px' }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <Input
                placeholder="Поиск по обращениям, заявкам, документам..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ borderRadius: '8px' }}
                allowClear
              />
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Статус"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%', borderRadius: '8px' }}
              >
                <Option value="all">Все статусы</Option>
                <Option value="open">Открыто</Option>
                <Option value="in_progress">В работе</Option>
                <Option value="resolved">Решено</Option>
                <Option value="closed">Закрыто</Option>
                <Option value="pending">Ожидает</Option>
                <Option value="approved">Одобрено</Option>
                <Option value="rejected">Отклонено</Option>
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Приоритет"
                value={priorityFilter}
                onChange={setPriorityFilter}
                style={{ width: '100%', borderRadius: '8px' }}
              >
                <Option value="all">Все приоритеты</Option>
                <Option value="low">Низкий</Option>
                <Option value="medium">Средний</Option>
                <Option value="high">Высокий</Option>
                <Option value="urgent">Срочно</Option>
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <Select
                placeholder="Дата"
                value={dateFilter}
                onChange={setDateFilter}
                style={{ width: '100%', borderRadius: '8px' }}
              >
                <Option value="all">Все даты</Option>
                <Option value="today">Сегодня</Option>
                <Option value="week">За неделю</Option>
                <Option value="month">За месяц</Option>
                <Option value="year">За год</Option>
              </Select>
            </Col>
            <Col xs={24} sm={4}>
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportData('tickets')}
                  style={{ borderRadius: '8px' }}
                >
                  Экспорт
                </Button>
                <Button 
                  icon={<FilterFilled />}
                  type="primary"
                  onClick={() => {
                    setSearchText('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setDateFilter('all');
                  }}
                  style={{ 
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  Сброс
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Основной контент - теперь занимает всю ширину */}
        <Row gutter={[24, 24]}>
          {/* Основная колонка - Мои обращения */}
          <Col xs={24}>
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
              {paginatedTickets.length > 0 ? (
                <>
                  <List
                    dataSource={paginatedTickets}
                    renderItem={(item) => (
                      <List.Item 
                        style={{ border: 'none', padding: '12px 0' }}
                        actions={[
                          <Tag color={getTicketStatusColor(item.status)}>
                            {item.status === 'open' ? 'Открыто' :
                             item.status === 'in_progress' ? 'В работе' :
                             item.status === 'resolved' ? 'Решено' : 'Закрыто'}
                          </Tag>,
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item 
                                  key="edit" 
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    setSelectedTicket(item);
                                    ticketEditForm.setFieldsValue({
                                      title: item.title,
                                      description: item.description,
                                      priority: item.priority,
                                      department: item.department
                                    });
                                    setTicketEditModalVisible(true);
                                  }}
                                >
                                  Редактировать
                                </Menu.Item>
                                <Menu.Item 
                                  key="comments" 
                                  icon={<MessageOutlined />}
                                  onClick={() => {
                                    setSelectedTicket(item);
                                    // Показать комментарии
                                  }}
                                >
                                  Комментарии
                                </Menu.Item>
                              </Menu>
                            }
                          >
                            <Button type="text" icon={<MoreOutlined />} />
                          </Dropdown>
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
                            <Space>
                              <Text strong style={{ fontSize: '14px' }}>
                                {item.title}
                              </Text>
                              {item.has_reply && (
                                <Tag color="blue" icon={<EyeOutlined />}>Есть ответ</Tag>
                              )}
                            </Space>
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
                  
                  {/* Пагинация */}
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Pagination
                      current={currentPage}
                      total={filteredTickets.length}
                      pageSize={pageSize}
                      onChange={(page: number, size?: number) => {
                        setCurrentPage(page);
                        setPageSize(size || 10);
                      }}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total: number, range: [number, number]) => 
                        `${range[0]}-${range[1]} из ${total} обращений`
                      }
                    />
                  </div>
                </>
              ) : (
                <Empty 
                  description="Обращения не найдены" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '20px 0' }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Нижняя секция - Новости, Сообщения и Календарь */}
        <Row gutter={[24, 24]}>
          {/* Новости */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <BellOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Новости компании</span>
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
              {news.length > 0 ? (
                <List
                  dataSource={news.slice(0, 5)}
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
              ) : (
                <Empty 
                  description="Нет новостей" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '20px 0' }}
                />
              )}
            </Card>
          </Col>

          {/* Сообщения и уведомления */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <EyeOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Сообщения и уведомления</span>
                  {messages.filter(m => !m.is_read).length > 0 && (
                    <Badge count={messages.filter(m => !m.is_read).length} style={{ backgroundColor: '#ff4d4f' }} />
                  )}
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
              {messages.length > 0 ? (
                <List
                  dataSource={messages.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item 
                      style={{ 
                        border: 'none', 
                        padding: '12px 0',
                        opacity: item.is_read ? 0.7 : 1,
                        background: item.is_read ? 'transparent' : 'rgba(24, 144, 255, 0.05)',
                        borderRadius: '8px',
                        margin: '4px 0'
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${getMessageColor(item.type)}20, ${getMessageColor(item.type)})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: `0 4px 15px ${getMessageColor(item.type)}30`
                          }}>
                            {getMessageIcon(item.type)}
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong style={{ fontSize: '14px' }}>
                              {item.title}
                            </Text>
                            {!item.is_read && (
                              <Badge status="processing" size="small" />
                            )}
                          </Space>
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
                              {dayjs(item.created_at).format('DD.MM.YYYY HH:mm')}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty 
                  description="Нет сообщений" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '20px 0' }}
                />
              )}
            </Card>
          </Col>

          {/* Календарь событий */}
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Календарь событий</span>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setEventModalVisible(true)}
                  style={{ 
                    borderRadius: '25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: '40px',
                    padding: '0 20px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Добавить событие
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

        {/* Новые секции: Документы, Заявки, Аналитика */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          {/* Документы */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <FileTextOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Мои документы</span>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<UploadOutlined />}
                  onClick={() => setDocumentModalVisible(true)}
                  style={{ 
                    borderRadius: '25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: '40px',
                    padding: '0 20px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Загрузить документ
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
              {paginatedDocuments.length > 0 ? (
                <>
                  <List
                    dataSource={paginatedDocuments}
                    renderItem={(item) => (
                      <List.Item style={{ border: 'none', padding: '12px 0' }}>
                        <List.Item.Meta
                          avatar={
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '15px',
                              background: 'linear-gradient(135deg, #667eea20, #667eea)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <FileTextOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                            </div>
                          }
                          title={
                            <Space>
                              <Text strong style={{ fontSize: '14px' }}>
                                {item.title}
                              </Text>
                              <Tag color="blue">{item.category}</Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Paragraph 
                                ellipsis={{ rows: 1 }} 
                                style={{ margin: '4px 0', color: '#666' }}
                              >
                                {item.description}
                              </Paragraph>
                              <Space size="small">
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {dayjs(item.uploaded_at).format('DD.MM.YYYY')}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {item.file_size} KB
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {item.uploaded_by}
                                </Text>
                              </Space>
                            </div>
                          }
                        />
                        <Button 
                          type="text" 
                          icon={<DownloadOutlined />}
                          onClick={() => handleExportData('documents')}
                        />
                      </List.Item>
                    )}
                  />
                  
                  {/* Пагинация для документов */}
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Pagination
                      current={currentPage}
                      total={filteredDocuments.length}
                      pageSize={pageSize}
                      onChange={(page: number, size?: number) => {
                        setCurrentPage(page);
                        setPageSize(size || 10);
                      }}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total: number, range: [number, number]) => 
                        `${range[0]}-${range[1]} из ${total} документов`
                      }
                    />
                  </div>
                </>
              ) : (
                <Empty 
                  description="Документы не найдены" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '20px 0' }}
                />
              )}
            </Card>
          </Col>

          {/* Заявки */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <FormOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                  <span style={{ fontSize: '18px', fontWeight: '600' }}>Мои заявки</span>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setRequestModalVisible(true)}
                  style={{ 
                    borderRadius: '25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: '40px',
                    padding: '0 20px',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  Новая заявка
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
              {paginatedRequests.length > 0 ? (
                <>
                  <List
                    dataSource={paginatedRequests}
                    renderItem={(item) => (
                      <List.Item style={{ border: 'none', padding: '12px 0' }}>
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              style={{ backgroundColor: getPriorityColor(item.priority) }}
                              icon={<FormOutlined />}
                            />
                          }
                          title={
                            <Space>
                              <Text strong style={{ fontSize: '14px' }}>
                                {item.title}
                              </Text>
                              <Tag color={
                                item.status === 'approved' ? 'green' :
                                item.status === 'rejected' ? 'red' :
                                item.status === 'in_review' ? 'orange' : 'blue'
                              }>
                                {item.status === 'approved' ? 'Одобрено' :
                                 item.status === 'rejected' ? 'Отклонено' :
                                 item.status === 'in_review' ? 'На рассмотрении' : 'Ожидает'}
                              </Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Paragraph 
                                ellipsis={{ rows: 1 }} 
                                style={{ margin: '4px 0', color: '#666' }}
                              >
                                {item.description}
                              </Paragraph>
                              <Space size="small">
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {dayjs(item.created_at).format('DD.MM.YYYY')}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  {item.type}
                                </Text>
                                {item.approver && (
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Одобрил: {item.approver}
                                  </Text>
                                )}
                              </Space>
                            </div>
                          }
                        />
                        <Dropdown
                          overlay={
                            <Menu>
                              <Menu.Item 
                                key="view" 
                                icon={<EyeOutlined />}
                                onClick={() => setSelectedRequest(item)}
                              >
                                Просмотр
                              </Menu.Item>
                              <Menu.Item 
                                key="export" 
                                icon={<DownloadOutlined />}
                                onClick={() => handleExportData('requests')}
                              >
                                Экспорт
                              </Menu.Item>
                            </Menu>
                          }
                        >
                          <Button type="text" icon={<MoreOutlined />} />
                        </Dropdown>
                      </List.Item>
                    )}
                  />
                  
                  {/* Пагинация для заявок */}
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Pagination
                      current={currentPage}
                      total={filteredRequests.length}
                      pageSize={pageSize}
                      onChange={(page: number, size?: number) => {
                        setCurrentPage(page);
                        setPageSize(size || 10);
                      }}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total: number, range: [number, number]) => 
                        `${range[0]}-${range[1]} из ${total} заявок`
                      }
                    />
                  </div>
                </>
              ) : (
                <Empty 
                  description="Заявки не найдены" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: '20px 0' }}
                />
              )}
            </Card>
          </Col>
        </Row>

        {/* Аналитика */}
        {analytics && (
          <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
            <Col xs={24}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined style={{ color: '#667eea', fontSize: '20px' }} />
                    <span style={{ fontSize: '18px', fontWeight: '600' }}>Аналитика и статистика</span>
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
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Создано обращений"
                      value={analytics.tickets_created}
                      prefix={<MessageOutlined />}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Решено обращений"
                      value={analytics.tickets_resolved}
                      prefix={<CheckCircleOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Среднее время решения"
                      value={analytics.average_resolution_time}
                      suffix="часов"
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <Statistic
                      title="Рейтинг удовлетворенности"
                      value={analytics.satisfaction_rating}
                      suffix="/5"
                      prefix={<StarOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Col>
                </Row>
                
                <Divider />
                
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12}>
                    <Title level={5}>Тренды по месяцам</Title>
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="secondary">График трендов будет здесь</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Title level={5}>Прогресс по задачам</Title>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text>Обращения</Text>
                        <Progress 
                          percent={Math.round((analytics.tickets_resolved / analytics.tickets_created) * 100)} 
                          status="active"
                        />
                      </div>
                      <div>
                        <Text>Заявки</Text>
                        <Progress 
                          percent={Math.round((analytics.requests_approved / requests.length) * 100)} 
                          status="active"
                        />
                      </div>
                      <div>
                        <Text>Документы</Text>
                        <Progress 
                          percent={Math.round((documents.length / 100) * 100)} 
                          status="active"
                        />
                      </div>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}
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
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Введите описание обращения' }]}
          >
            <TextArea 
              rows={4}
              placeholder="Подробно опишите проблему или вопрос"
              style={{ borderRadius: '8px' }}
            />
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
              <Option value="urgent">Срочно</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Отдел"
            name="department"
          >
            <Select placeholder="Выберите отдел" style={{ borderRadius: '8px' }}>
              <Option value="it">IT отдел</Option>
              <Option value="hr">HR</Option>
              <Option value="finance">Финансы</Option>
              <Option value="logistics">Логистика</Option>
              <Option value="general">Общие вопросы</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setTicketModalVisible(false);
                  form.resetFields();
                }}
                style={{ borderRadius: '8px' }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Отправить обращение
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно создания события */}
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
              <CalendarOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Новое событие</span>
          </Space>
        }
        open={eventModalVisible}
        onCancel={() => {
          setEventModalVisible(false);
          eventForm.resetFields();
        }}
        footer={null}
        width={600}
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
          form={eventForm}
          layout="vertical"
          onFinish={handleSubmitEvent}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label="Название события"
            name="title"
            rules={[{ required: true, message: 'Введите название события' }]}
          >
            <Input 
              placeholder="Название события"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder="Описание события (необязательно)"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Дата и время"
            name="date"
            rules={[{ required: true, message: 'Выберите дату и время' }]}
          >
            <DatePicker 
              showTime 
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Тип события"
            name="type"
            initialValue="event"
          >
            <Select style={{ borderRadius: '8px' }}>
              <Option value="event">Событие</Option>
              <Option value="meeting">Встреча</Option>
              <Option value="deadline">Дедлайн</Option>
              <Option value="holiday">Праздник</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setEventModalVisible(false);
                  eventForm.resetFields();
                }}
                style={{ borderRadius: '8px' }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Создать событие
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно редактирования тикета */}
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
              <EditOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Редактировать обращение</span>
          </Space>
        }
        open={ticketEditModalVisible}
        onCancel={() => {
          setTicketEditModalVisible(false);
          ticketEditForm.resetFields();
          setSelectedTicket(null);
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
          form={ticketEditForm}
          layout="vertical"
          onFinish={handleEditTicket}
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
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Введите описание обращения' }]}
          >
            <TextArea 
              rows={4}
              placeholder="Подробно опишите проблему или вопрос"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Приоритет"
            name="priority"
          >
            <Select style={{ borderRadius: '8px' }}>
              <Option value="low">Низкий</Option>
              <Option value="medium">Средний</Option>
              <Option value="high">Высокий</Option>
              <Option value="urgent">Срочно</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Отдел"
            name="department"
          >
            <Select placeholder="Выберите отдел" style={{ borderRadius: '8px' }}>
              <Option value="it">IT отдел</Option>
              <Option value="hr">HR</Option>
              <Option value="finance">Финансы</Option>
              <Option value="logistics">Логистика</Option>
              <Option value="general">Общие вопросы</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setTicketEditModalVisible(false);
                  ticketEditForm.resetFields();
                  setSelectedTicket(null);
                }}
                style={{ borderRadius: '8px' }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Сохранить изменения
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно загрузки документа */}
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
              <UploadOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Загрузить документ</span>
          </Space>
        }
        open={documentModalVisible}
        onCancel={() => {
          setDocumentModalVisible(false);
          documentForm.resetFields();
        }}
        footer={null}
        width={600}
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
          form={documentForm}
          layout="vertical"
          onFinish={handleSubmitDocument}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label="Название документа"
            name="title"
            rules={[{ required: true, message: 'Введите название документа' }]}
          >
            <Input 
              placeholder="Название документа"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
          >
            <TextArea 
              rows={3}
              placeholder="Описание документа (необязательно)"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Категория"
            name="category"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select style={{ borderRadius: '8px' }}>
              <Option value="policy">Политика</Option>
              <Option value="procedure">Процедура</Option>
              <Option value="form">Форма</Option>
              <Option value="report">Отчет</Option>
              <Option value="other">Другое</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Теги"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="Добавьте теги"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Файл"
            name="file"
            rules={[{ required: true, message: 'Выберите файл для загрузки' }]}
          >
            <Upload
              beforeUpload={() => false}
              maxCount={1}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            >
              <Button icon={<UploadOutlined />}>Выбрать файл</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setDocumentModalVisible(false);
                  documentForm.resetFields();
                }}
                style={{ borderRadius: '8px' }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Загрузить документ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно создания заявки */}
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
              <FormOutlined style={{ color: 'white', fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Новая заявка</span>
          </Space>
        }
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          requestForm.resetFields();
        }}
        footer={null}
        width={600}
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
          form={requestForm}
          layout="vertical"
          onFinish={handleSubmitRequest}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label="Название заявки"
            name="title"
            rules={[{ required: true, message: 'Введите название заявки' }]}
          >
            <Input 
              placeholder="Название заявки"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Описание"
            name="description"
            rules={[{ required: true, message: 'Введите описание заявки' }]}
          >
            <TextArea 
              rows={4}
              placeholder="Подробно опишите вашу заявку"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label="Тип заявки"
            name="type"
            rules={[{ required: true, message: 'Выберите тип заявки' }]}
          >
            <Select style={{ borderRadius: '8px' }}>
              <Option value="vacation">Отпуск</Option>
              <Option value="equipment">Оборудование</Option>
              <Option value="access">Доступ</Option>
              <Option value="training">Обучение</Option>
              <Option value="other">Другое</Option>
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
              <Option value="urgent">Срочно</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Желаемые даты"
            name="requested_dates"
          >
            <DatePicker 
              style={{ width: '100%', borderRadius: '8px' }}
              placeholder="Выберите даты"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setRequestModalVisible(false);
                  requestForm.resetFields();
                }}
                style={{ borderRadius: '8px' }}
              >
                Отмена
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                style={{ 
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                Создать заявку
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer с настройками уведомлений */}
      <Drawer
        title={
          <Space>
            <SettingOutlined style={{ color: '#667eea', fontSize: '20px' }} />
            <span style={{ fontSize: '20px', fontWeight: '600' }}>Настройки уведомлений</span>
          </Space>
        }
        placement="right"
        onClose={() => setSettingsDrawerVisible(false)}
        open={settingsDrawerVisible}
        width={400}
        styles={{
          header: {
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '20px'
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={5}>Email уведомления</Title>
            <Switch
              checked={notificationSettings.email_notifications}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                email_notifications: checked
              })}
            />
          </div>
          
          <div>
            <Title level={5}>Push уведомления</Title>
            <Switch
              checked={notificationSettings.push_notifications}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                push_notifications: checked
              })}
            />
          </div>
          
          <div>
            <Title level={5}>Обновления по обращениям</Title>
            <Switch
              checked={notificationSettings.ticket_updates}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                ticket_updates: checked
              })}
            />
          </div>
          
          <div>
            <Title level={5}>Новости компании</Title>
            <Switch
              checked={notificationSettings.news_updates}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                news_updates: checked
              })}
            />
          </div>
          
          <div>
            <Title level={5}>Напоминания о событиях</Title>
            <Switch
              checked={notificationSettings.event_reminders}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                event_reminders: checked
              })}
            />
          </div>
          
          <div>
            <Title level={5}>Ежедневная сводка</Title>
            <Switch
              checked={notificationSettings.daily_summary}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                daily_summary: checked
              })}
            />
          </div>
          
          <div>
            <Title level={5}>Еженедельный отчет</Title>
            <Switch
              checked={notificationSettings.weekly_report}
              onChange={(checked) => handleUpdateNotificationSettings({
                ...notificationSettings,
                weekly_report: checked
              })}
            />
          </div>
        </Space>
      </Drawer>
    </div>
  );
};

export default UserDashboard;

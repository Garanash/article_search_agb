import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Avatar,
  List,
  Spin,
  message,
  Divider,
  Tag,
  Select,
  Modal,
  Row,
  Col,
  Statistic,
  Calendar,
  Badge,
  Tooltip,
  DatePicker,
  Input,
  Form,
  Progress,
  Table,
  Tabs
} from 'antd';
import {
  CustomerServiceOutlined,
  UserOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  UserAddOutlined,
  CalendarOutlined,
  BarChartOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface SupportTicket {
  id: number;
  user_id: number;
  title: string;
  description: string;
  department?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  first_response_at?: string;
  estimated_resolution?: string;
  user_username: string;
  assigned_admin_username?: string;
}

interface SupportEvent {
  id: number;
  ticket_id: number;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
  is_completed: boolean;
  created_at: string;
  start_date?: string;
  end_date?: string;
}

interface SupportAnalytics {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  average_response_time_hours?: number;
  average_resolution_time_hours?: number;
  tickets_by_department: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  tickets_by_status: Record<string, number>;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

const AdminSupportTickets: React.FC = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [events, setEvents] = useState<SupportEvent[]>([]);
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SupportEvent | null>(null);
  const [form] = Form.useForm();
  const [eventForm] = Form.useForm();
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState<dayjs.Dayjs | null>(null);
  const [calendarForm] = Form.useForm();

  // Загружаем данные при инициализации
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      await Promise.all([
        loadTickets(isMounted),
        loadEvents(isMounted),
        loadAnalytics(isMounted),
        loadUsers(isMounted)
      ]);
    };
    loadAll();
    return () => { isMounted = false; };
  }, []);

  const loadTickets = async (isMounted = true) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/support_tickets/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!isMounted) return;
      if (response.ok) {
        const data = await response.json();
        if (isMounted) setTickets(data);
      } else {
        if (isMounted) message.error('Ошибка загрузки обращений');
      }
    } catch (error) {
      if (isMounted) {
        console.error('Ошибка загрузки обращений:', error);
        message.error('Ошибка при загрузке обращений');
      }
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  const loadEvents = async (isMounted = true) => {
    try {
      const response = await fetch('http://localhost:8000/api/support_tickets/calendar/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!isMounted) return;
      if (response.ok) {
        const data = await response.json();
        if (isMounted) setEvents(data);
      }
    } catch (error) {
      if (isMounted) console.error('Ошибка загрузки событий:', error);
    }
  };

  const loadAnalytics = async (isMounted = true) => {
    try {
      const response = await fetch('http://localhost:8000/api/support_tickets/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!isMounted) return;
      if (response.ok) {
        const data = await response.json();
        if (isMounted) setAnalytics(data);
      }
    } catch (error) {
      if (isMounted) console.error('Ошибка загрузки аналитики:', error);
    }
  };

  const loadUsers = async (isMounted = true) => {
    try {
      const response = await fetch('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!isMounted) return;
      if (response.ok) {
        const data = await response.json();
        if (isMounted) setUsers(data);
      }
    } catch (error) {
      if (isMounted) console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const closeTicket = async (ticketId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/support_tickets/${ticketId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        message.success('Обращение закрыто');
        loadTickets();
        loadAnalytics();
      } else {
        message.error('Ошибка при закрытии обращения');
      }
    } catch (error) {
      console.error('Ошибка закрытия обращения:', error);
      message.error('Ошибка при закрытии обращения');
    }
  };

  const updateTicket = async (ticketId: number, updates: any) => {
    try {
      const response = await fetch(`http://localhost:8000/api/support_tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        message.success('Обращение обновлено');
        loadTickets();
        loadAnalytics();
        setTicketModalVisible(false);
      } else {
        message.error('Ошибка при обновлении обращения');
      }
    } catch (error) {
      console.error('Ошибка обновления обращения:', error);
      message.error('Ошибка при обновлении обращения');
    }
  };

  const createEvent = async (ticketId: number, eventData: any) => {
    try {
      const response = await fetch(`http://localhost:8000/api/support_tickets/${ticketId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        message.success('Событие создано');
        loadEvents();
        setEventModalVisible(false);
        eventForm.resetFields();
      } else {
        message.error('Ошибка при создании события');
      }
    } catch (error) {
      console.error('Ошибка создания события:', error);
      message.error('Ошибка при создании события');
    }
  };

  const updateEvent = async (eventId: number, updates: any) => {
    try {
      const response = await fetch(`http://localhost:8000/api/support_tickets/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        message.success('Событие обновлено');
        loadEvents();
        setEventModalVisible(false);
      } else {
        message.error('Ошибка при обновлении события');
      }
    } catch (error) {
      console.error('Ошибка обновления события:', error);
      message.error('Ошибка при обновлении события');
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD.MM.YYYY HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'red';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'urgent': return 'purple';
      default: return 'blue';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Открыто';
      case 'in_progress': return 'В работе';
      case 'resolved': return 'Решено';
      case 'closed': return 'Закрыто';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      case 'urgent': return 'Срочный';
      default: return priority;
    }
  };

  const handleTicketEdit = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    form.setFieldsValue({
      title: ticket.title,
      description: ticket.description,
      department: ticket.department,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to,
      estimated_resolution: ticket.estimated_resolution ? dayjs(ticket.estimated_resolution) : null
    });
    setTicketModalVisible(true);
  };

  const handleEventCreate = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSelectedEvent(null);
    eventForm.resetFields();
    setEventModalVisible(true);
  };

  const handleEventEdit = (event: SupportEvent) => {
    setSelectedEvent(event);
    eventForm.setFieldsValue({
      event_type: event.event_type,
      title: event.title,
      description: event.description,
      event_date: dayjs(event.event_date),
      is_completed: event.is_completed
    });
    setEventModalVisible(true);
  };

  const onFinishTicket = (values: any) => {
    if (selectedTicket) {
      const updates = {
        ...values,
        estimated_resolution: values.estimated_resolution?.toISOString()
      };
      updateTicket(selectedTicket.id, updates);
    }
  };

  const onFinishEvent = (values: any) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, {
        ...values,
        event_date: values.event_date.toISOString()
      });
    } else if (selectedTicket) {
      createEvent(selectedTicket.id, {
        ...values,
        event_date: values.event_date.toISOString()
      });
    }
  };

  // Клик по дню календаря
  const handleCalendarSelect = (value: dayjs.Dayjs) => {
    setCalendarDate(value);
    calendarForm.resetFields();
    calendarForm.setFieldsValue({
      start_date: value,
      end_date: value,
      event_type: 'reminder',
    });
    setCalendarModalVisible(true);
  };

  // Создание события из календаря
  const onFinishCalendarEvent = async (values: any) => {
    try {
      const response = await fetch(`http://localhost:8000/api/support_tickets/0/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_type: values.event_type,
          title: values.title,
          description: values.description,
          start_date: values.start_date.toISOString(),
          end_date: values.end_date.toISOString(),
        })
      });
      if (response.ok) {
        message.success('Событие запланировано');
        setCalendarModalVisible(false);
        loadEvents();
      } else {
        message.error('Ошибка при создании события');
      }
    } catch (error) {
      message.error('Ошибка при создании события');
    }
  };

  // Календарь
  const dateCellRender = (value: dayjs.Dayjs) => {
    // События, которые начинаются или идут в этот день
    const dayEvents = events.filter(event => {
      if (event.start_date && event.end_date) {
        return value.isBetween(dayjs(event.start_date).startOf('day'), dayjs(event.end_date).endOf('day'), null, '[]');
      }
      if (event.start_date) {
        return value.isSame(dayjs(event.start_date), 'day');
      }
      if (event.event_date) {
        return value.isSame(dayjs(event.event_date), 'day');
      }
      return false;
    });

    return (
      <div>
        {dayEvents.map(event => (
          <div key={event.id} style={{ marginBottom: '2px' }}>
            <Badge
              status={event.is_completed ? 'success' : 'processing'}
              text={
                <Tooltip title={event.description || event.title}>
                  <span style={{ fontSize: '10px', cursor: 'pointer' }}>
                    {event.title}
                    {event.start_date && event.end_date &&
                      <span style={{ color: '#1890ff', marginLeft: 4 }}>
                        <CalendarOutlined />
                        {dayjs(event.start_date).format('DD.MM')} - {dayjs(event.end_date).format('DD.MM')}
                      </span>
                    }
                  </span>
                </Tooltip>
              }
            />
          </div>
        ))}
      </div>
    );
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Заголовок',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_username',
      key: 'user_username',
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          {text}
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: 'Департамент',
      dataIndex: 'department',
      key: 'department',
      render: (department: string) => department ? (
        <Tag color="blue">{department}</Tag>
      ) : '-',
    },
    {
      title: 'Создано',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: SupportTicket) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleTicketEdit(record)}
          >
            Редактировать
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleEventCreate(record)}
          >
            Событие
          </Button>
          {record.status !== 'closed' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => closeTicket(record.id)}
            >
              Закрыть
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Для onClick обновления
  const handleReloadTickets = () => { loadTickets(); };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <CustomerServiceOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Управление обращениями
            </Title>
            <Text type="secondary">
              Система управления обращениями с календарем событий
            </Text>
          </div>
          <Button onClick={handleReloadTickets} type="primary">
            Обновить
          </Button>
        </div>

        <Tabs defaultActiveKey="tickets">
          <TabPane tab="Обращения" key="tickets">
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '100px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>Загрузка обращений...</div>
              </div>
            ) : (
              <Table
                dataSource={tickets}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px' }}>
                      <Text strong>Описание:</Text>
                      <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>
                        {record.description}
                      </div>
                      {record.assigned_admin_username && (
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Назначен:</Text> {record.assigned_admin_username}
                        </div>
                      )}
                      {record.estimated_resolution && (
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Ожидаемое решение:</Text> {formatDate(record.estimated_resolution)}
                        </div>
                      )}
                    </div>
                  ),
                }}
              />
            )}
          </TabPane>

          <TabPane tab="Календарь" key="calendar">
            <Card>
              <Calendar
                dateCellRender={dateCellRender}
                style={{ backgroundColor: 'white' }}
                onSelect={handleCalendarSelect}
              />
            </Card>
          </TabPane>

          <TabPane tab="Аналитика" key="analytics">
            {analytics && (
              <div>
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Всего обращений"
                        value={analytics.total_tickets}
                        prefix={<MessageOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Открытых"
                        value={analytics.open_tickets}
                        prefix={<ExclamationCircleOutlined />}
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Закрытых"
                        value={analytics.closed_tickets}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="В работе"
                        value={analytics.in_progress_tickets}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: '24px' }}>
                  <Col span={12}>
                    <Card title="По департаментам">
                      {Object.entries(analytics.tickets_by_department).map(([dept, count]) => (
                        <div key={dept} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text>{dept}</Text>
                            <Text>{count}</Text>
                          </div>
                          <Progress
                            percent={Math.round((count / analytics.total_tickets) * 100)}
                            size="small"
                            showInfo={false}
                          />
                        </div>
                      ))}
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="По приоритетам">
                      {Object.entries(analytics.tickets_by_priority).map(([priority, count]) => (
                        <div key={priority} style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <Text>{getPriorityText(priority)}</Text>
                            <Text>{count}</Text>
                          </div>
                          <Progress
                            percent={Math.round((count / analytics.total_tickets) * 100)}
                            size="small"
                            showInfo={false}
                            strokeColor={getPriorityColor(priority)}
                          />
                        </div>
                      ))}
                    </Card>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Card title="Время реагирования">
                      <Statistic
                        title="Среднее время ответа"
                        value={analytics.average_response_time_hours || 0}
                        suffix="часов"
                        precision={1}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card title="Время решения">
                      <Statistic
                        title="Среднее время решения"
                        value={analytics.average_resolution_time_hours || 0}
                        suffix="часов"
                        precision={1}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            )}
          </TabPane>
        </Tabs>

        {/* Модальное окно редактирования обращения */}
        <Modal
          title="Редактировать обращение"
          open={ticketModalVisible}
          onCancel={() => setTicketModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinishTicket}
          >
            <Form.Item
              name="title"
              label="Заголовок"
              rules={[{ required: true, message: 'Введите заголовок' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Описание"
              rules={[{ required: true, message: 'Введите описание' }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="department" label="Департамент">
                  <Select placeholder="Выберите департамент">
                    <Option value="software">Разработка ПО</Option>
                    <Option value="sysadmin">Системный администратор</Option>
                    <Option value="logistics">Логистика</Option>
                    <Option value="general">Общие вопросы</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priority" label="Приоритет">
                  <Select placeholder="Выберите приоритет">
                    <Option value="low">Низкий</Option>
                    <Option value="medium">Средний</Option>
                    <Option value="high">Высокий</Option>
                    <Option value="urgent">Срочный</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="status" label="Статус">
                  <Select placeholder="Выберите статус">
                    <Option value="open">Открыто</Option>
                    <Option value="in_progress">В работе</Option>
                    <Option value="resolved">Решено</Option>
                    <Option value="closed">Закрыто</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="assigned_to" label="Назначить">
                  <Select placeholder="Выберите администратора">
                    {users.filter(u => u.role === 'admin').map(user => (
                      <Option key={user.id} value={user.id}>{user.username}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="estimated_resolution" label="Ожидаемое время решения">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Сохранить
                </Button>
                <Button onClick={() => setTicketModalVisible(false)}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно создания/редактирования события */}
        <Modal
          title={selectedEvent ? "Редактировать событие" : "Создать событие"}
          open={eventModalVisible}
          onCancel={() => setEventModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={eventForm}
            layout="vertical"
            onFinish={onFinishEvent}
          >
            <Form.Item
              name="event_type"
              label="Тип события"
              rules={[{ required: true, message: 'Выберите тип события' }]}
            >
              <Select placeholder="Выберите тип события">
                <Option value="deadline">Дедлайн</Option>
                <Option value="reminder">Напоминание</Option>
                <Option value="milestone">Веха</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="title"
              label="Заголовок"
              rules={[{ required: true, message: 'Введите заголовок' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Описание"
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item
              name="event_date"
              label="Дата события"
              rules={[{ required: true, message: 'Выберите дату' }]}
            >
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            {selectedEvent && (
              <Form.Item name="is_completed" label="Выполнено" valuePropName="checked">
                <Select>
                  <Option value={true}>Да</Option>
                  <Option value={false}>Нет</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {selectedEvent ? 'Обновить' : 'Создать'}
                </Button>
                <Button onClick={() => setEventModalVisible(false)}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Модальное окно планирования события из календаря */}
        <Modal
          title="Запланировать событие"
          open={calendarModalVisible}
          onCancel={() => setCalendarModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={calendarForm}
            layout="vertical"
            onFinish={onFinishCalendarEvent}
          >
            <Form.Item name="event_type" label="Тип события" rules={[{ required: true, message: 'Выберите тип события' }]}> 
              <Select>
                <Option value="deadline">Дедлайн</Option>
                <Option value="reminder">Напоминание</Option>
                <Option value="milestone">Веха</Option>
              </Select>
            </Form.Item>
            <Form.Item name="title" label="Заголовок" rules={[{ required: true, message: 'Введите заголовок' }]}> 
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Описание"> 
              <TextArea rows={3} />
            </Form.Item>
            <Form.Item label="Начало события" name="start_date" rules={[{ required: true, message: 'Выберите дату начала' }]}> 
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Конец события" name="end_date" rules={[{ required: true, message: 'Выберите дату окончания' }]}> 
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">Запланировать</Button>
                <Button onClick={() => setCalendarModalVisible(false)}>Отмена</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default AdminSupportTickets; 
import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
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
  Form,
  DatePicker
} from 'antd';
import {
  SendOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  UserAddOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface SupportMessage {
  id: number;
  user_id: number;
  message: string;
  department?: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
  user_username: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: number;
  username: string;
  email: string;
}

const AdminSupport: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('general');
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedMessageForTicket, setSelectedMessageForTicket] = useState<SupportMessage | null>(null);
  const [ticketForm] = Form.useForm();

  // Загружаем данные при инициализации
  useEffect(() => {
    loadMessages();
    loadUsers();
    loadDepartments();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support/admin/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        message.error('Ошибка загрузки сообщений');
      }
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      message.error('Ошибка при загрузке сообщений');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/support/departments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        message.error('Ошибка загрузки департаментов');
      }
    } catch (error) {
      console.error('Ошибка загрузки департаментов:', error);
      message.error('Ошибка при загрузке департаментов');
    }
  };

  const sendReply = async () => {
    if (!selectedUser || !replyMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/support/admin/reply/${selectedUser}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: replyMessage,
          department: selectedDepartment
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [newMessage, ...prev]);
        setReplyMessage('');
        setReplyModalVisible(false);
        setSelectedUser(null);
        message.success('Ответ отправлен');
      } else {
        const errorData = await response.json();
        message.error(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка отправки ответа:', error);
      message.error('Ошибка при отправке ответа');
    } finally {
      setSending(false);
    }
  };

  const openReplyModal = (message: SupportMessage) => {
    setSelectedMessage(message);
    setSelectedUser(message.user_id);
    setReplyModalVisible(true);
  };

  const createTicketFromMessage = async (values: any) => {
    if (!selectedMessageForTicket) return;

    try {
      const response = await fetch('/api/support/tickets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: selectedMessageForTicket.user_id,
          title: values.title,
          description: `${selectedMessageForTicket.message}\n\n---\n${values.description || ''}`,
          department: values.department,
          priority: values.priority,
          estimated_resolution: values.estimated_resolution?.toISOString()
        })
      });

      if (response.ok) {
        message.success('Обращение создано');
        setTicketModalVisible(false);
        ticketForm.resetFields();
        setSelectedMessageForTicket(null);
      } else {
        message.error('Ошибка при создании обращения');
      }
    } catch (error) {
      console.error('Ошибка создания обращения:', error);
      message.error('Ошибка при создании обращения');
    }
  };

  const openTicketModal = (message: SupportMessage) => {
    setSelectedMessageForTicket(message);
    ticketForm.setFieldsValue({
      title: `Обращение от ${message.user_username}`,
      department: message.department,
      priority: 'medium'
    });
    setTicketModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  const getDepartmentName = (departmentId: string) => {
    if (!Array.isArray(departments)) return departmentId;
    const dept = departments.find(d => d.id === departmentId);
    return dept ? dept.name : departmentId;
  };

  const getUnreadCount = () => {
    return messages.filter(msg => !msg.is_read && !msg.is_from_admin).length;
  };

  const getTotalMessages = () => {
    return messages.length;
  };

  const getActiveUsers = () => {
    const userIds = new Set(messages.map(msg => msg.user_id));
    return userIds.size;
  };

  // Группируем сообщения по пользователям
  const groupedMessages = messages.reduce((acc, message) => {
    const userId = message.user_id;
    if (!acc[userId]) {
      acc[userId] = [];
    }
    acc[userId].push(message);
    return acc;
  }, {} as Record<number, SupportMessage[]>);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <CustomerServiceOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Администрирование поддержки
            </Title>
            <Text type="secondary">
              Управление сообщениями пользователей
            </Text>
          </div>
          <Button onClick={loadMessages} type="primary">
            Обновить
          </Button>
        </div>

        {/* Статистика */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Всего сообщений"
                value={getTotalMessages()}
                prefix={<MessageOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Непрочитанных"
                value={getUnreadCount()}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Активных пользователей"
                value={getActiveUsers()}
                prefix={<UserAddOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Диалогов"
                value={Object.keys(groupedMessages).length}
                prefix={<CustomerServiceOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Список диалогов */}
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Загрузка сообщений...</div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedMessages).map(([userId, userMessages]) => {
              const user = users.find(u => u.id === parseInt(userId));
              const lastMessage = userMessages[0]; // Самое новое сообщение
              const unreadCount = userMessages.filter(msg => !msg.is_read && !msg.is_from_admin).length;
              
              return (
                <Card 
                  key={userId} 
                  style={{ marginBottom: '16px', cursor: 'pointer' }}
                  onClick={() => openReplyModal(lastMessage)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar 
                        icon={<UserOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {user?.username || `Пользователь ${userId}`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {user?.email}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatDate(lastMessage.created_at)}
                      </div>
                      <Space>
                        {unreadCount > 0 && (
                          <Tag color="red">
                            {unreadCount} новых
                          </Tag>
                        )}
                        <Tag color="blue">
                          {userMessages.length} сообщений
                        </Tag>
                      </Space>
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5', 
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    <strong>Последнее сообщение:</strong> {lastMessage.message.substring(0, 100)}
                    {lastMessage.message.length > 100 && '...'}
                    {lastMessage.department && (
                      <div style={{ marginTop: '4px' }}>
                        <Tag color="purple">
                          {getDepartmentName(lastMessage.department)}
                        </Tag>
                      </div>
                    )}
                    <div style={{ marginTop: '8px' }}>
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTicketModal(lastMessage);
                          }}
                        >
                          Создать обращение
                        </Button>
                      </Space>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Модальное окно для ответа */}
        <Modal
          title="Ответить пользователю"
          open={replyModalVisible}
          onOk={sendReply}
          onCancel={() => {
            setReplyModalVisible(false);
            setSelectedUser(null);
            setReplyMessage('');
          }}
          confirmLoading={sending}
          width={600}
        >
          {selectedMessage && (
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Сообщение пользователя:</Text>
              <div style={{ 
                padding: '8px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '4px',
                marginTop: '4px'
              }}>
                {selectedMessage.message}
                {selectedMessage.department && (
                  <div style={{ marginTop: '8px' }}>
                    <Tag color="purple">
                      {getDepartmentName(selectedMessage.department)}
                    </Tag>
                  </div>
                )}
              </div>
            </div>
          )}
          <div>
            <Text strong>Ваш ответ:</Text>
            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
              <Text strong>Департамент:</Text>
              <Select
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="Выберите департамент"
              >
                {Array.isArray(departments) && departments.map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <TextArea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Введите ваш ответ..."
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ marginTop: '8px' }}
            />
          </div>
        </Modal>

        {/* Модальное окно для создания обращения */}
        <Modal
          title="Создать обращение"
          open={ticketModalVisible}
          onOk={() => ticketForm.submit()}
          onCancel={() => {
            setTicketModalVisible(false);
            ticketForm.resetFields();
            setSelectedMessageForTicket(null);
          }}
          confirmLoading={false}
          width={600}
        >
          <Form
            form={ticketForm}
            layout="vertical"
            onFinish={createTicketFromMessage}
          >
            <Form.Item
              name="title"
              label="Заголовок"
              rules={[{ required: true, message: 'Пожалуйста, введите заголовок обращения' }]}
            >
              <Input placeholder="Введите заголовок обращения" />
            </Form.Item>
            <Form.Item
              name="description"
              label="Описание"
              rules={[{ required: true, message: 'Пожалуйста, введите описание обращения' }]}
            >
              <TextArea
                placeholder="Введите описание обращения"
                autoSize={{ minRows: 3, maxRows: 8 }}
              />
            </Form.Item>
            <Form.Item
              name="department"
              label="Департамент"
              rules={[{ required: true, message: 'Пожалуйста, выберите департамент' }]}
            >
              <Select
                placeholder="Выберите департамент"
                style={{ width: '100%' }}
              >
                {Array.isArray(departments) && departments.map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="priority"
              label="Приоритет"
              rules={[{ required: true, message: 'Пожалуйста, выберите приоритет' }]}
            >
              <Select
                placeholder="Выберите приоритет"
                style={{ width: '100%' }}
              >
                <Select.Option value="low">Низкий</Select.Option>
                <Select.Option value="medium">Средний</Select.Option>
                <Select.Option value="high">Высокий</Select.Option>
                <Select.Option value="urgent">Срочно</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="estimated_resolution"
              label="Ожидаемая дата решения"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default AdminSupport; 
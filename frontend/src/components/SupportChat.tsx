import React, { useState, useRef, useEffect } from 'react';
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
  Badge,
  Tooltip,
  Select
} from 'antd';
import {
  SendOutlined,
  CustomerServiceOutlined,
  UserOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Title, Text } = Typography;

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

const SupportChat: React.FC = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Загружаем сообщения при инициализации
  useEffect(() => {
    loadMessages();
    loadDepartments();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.reverse()); // Показываем в хронологическом порядке
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

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/support/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inputMessage,
          department: selectedDepartment
        })
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setInputMessage('');
        message.success('Сообщение отправлено');
      } else {
        const errorData = await response.json();
        message.error(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      message.error('Ошибка при отправке сообщения');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/support/mark-read/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId ? { ...msg, is_read: true } : msg
          )
        );
      }
    } catch (error) {
      console.error('Ошибка отметки сообщения:', error);
    }
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

  const unreadCount = messages.filter(msg => !msg.is_read && msg.is_from_admin).length;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <CustomerServiceOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Поддержка
            </Title>
            <Text type="secondary">
              Свяжитесь с нашей службой поддержки
            </Text>
          </div>
          <Space>
            {unreadCount > 0 && (
              <Badge count={unreadCount} size="small">
                <Tag color="red">Новые сообщения</Tag>
              </Badge>
            )}
            <Button onClick={loadMessages} size="small">
              Обновить
            </Button>
          </Space>
        </div>

        <Divider />

        {/* Выбор департамента */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Text strong>Департамент:</Text>
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: 300 }}
              placeholder="Выберите департамент"
            >
              {Array.isArray(departments) && departments.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>
                  <div>
                    <div>{dept.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {dept.description}
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Space>
        </div>

        <Divider />

        {/* Область сообщений */}
        <div 
          style={{ 
            height: '400px', 
            overflowY: 'auto', 
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#fafafa'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '16px' }}>Загрузка сообщений...</div>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '100px' }}>
              <CustomerServiceOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>Нет сообщений</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Напишите нам, и мы ответим в ближайшее время
              </div>
            </div>
          ) : (
            <List
              dataSource={messages}
              renderItem={(message) => (
                <List.Item style={{ border: 'none', padding: '8px 0' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    width: '100%',
                    gap: '12px'
                  }}>
                    <Avatar 
                      icon={message.is_from_admin ? <SettingOutlined /> : <UserOutlined />}
                      style={{ 
                        backgroundColor: message.is_from_admin ? '#52c41a' : '#1890ff',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        backgroundColor: message.is_from_admin ? '#f6ffed' : '#e6f7ff',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${message.is_from_admin ? '#b7eb8f' : '#91d5ff'}`
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.message}</div>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatDate(message.created_at)}</span>
                        <Space>
                          {message.is_from_admin && (
                            <Tag color="green">
                              <SettingOutlined /> Администратор
                            </Tag>
                          )}
                          {message.department && (
                            <Tag color="purple">
                              {getDepartmentName(message.department)}
                            </Tag>
                          )}
                          {!message.is_read && !message.is_from_admin && (
                            <Tag color="#FCB813">
                              <ClockCircleOutlined /> Не прочитано
                            </Tag>
                          )}
                          {message.is_read && (
                            <Tag color="blue">
                              <CheckCircleOutlined /> Прочитано
                            </Tag>
                          )}
                          {!message.is_read && message.is_from_admin && (
                            <Tooltip title="Отметить как прочитанное">
                              <Button 
                                type="link" 
                                size="small"
                                onClick={() => markAsRead(message.id)}
                                style={{ padding: 0, height: 'auto' }}
                              >
                                Отметить прочитанным
                              </Button>
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Область ввода */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextArea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Введите ваше сообщение..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={sending}
            />
          </div>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            loading={sending}
            disabled={!inputMessage.trim()}
          >
            Отправить
          </Button>
        </div>

        {/* Информация */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 <strong>Служба поддержки:</strong> Мы отвечаем в течение 24 часов в рабочие дни. 
            Для срочных вопросов укажите это в сообщении.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default SupportChat; 
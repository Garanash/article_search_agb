import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Avatar,
  List,
  Upload,
  Select,
  Spin,
  message,
  Divider,
  Tooltip,
  Popover,
  Tag
} from 'antd';
import {
  SendOutlined,
  UploadOutlined,
  RobotOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface PerplexityModel {
  id: string;
  name: string;
  description: string;
}

const PerplexityChat: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<PerplexityModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('sonar');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загружаем доступные модели при инициализации
  useEffect(() => {
    loadModels();
  }, []);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadModels = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/perplexity/models', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const modelsData = await response.json();
        setModels(modelsData);
      }
    } catch (error) {
      console.error('Ошибка загрузки моделей:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/perplexity/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            ...messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: inputMessage
            }
          ],
          model: selectedModel
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices[0].message.content,
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json();
        message.error(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      message.error('Ошибка при отправке сообщения');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Отправлен файл: ${file.name}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Отправляем только одно сообщение с файлом, без истории
      formData.append('messages', JSON.stringify([
        {
          role: 'user',
          content: `Анализируй этот файл: ${file.name}`
        }
      ]));
      formData.append('model', selectedModel);

      const response = await fetch('http://localhost:8000/api/perplexity/chat-with-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.choices[0].message.content,
          timestamp: new Date(),
          model: selectedModel
        };
        setMessages(prev => [...prev, assistantMessage]);
        message.success('Файл успешно обработан');
      } else {
        const errorData = await response.json();
        message.error(`Ошибка обработки файла: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      message.error('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/perplexity/test-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        message.success('Подключение к Perplexity API работает');
      } else {
        message.error('Ошибка подключения к Perplexity API');
      }
    } catch (error) {
      message.error('Ошибка при проверке подключения');
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileUpload(file);
      return false; // Предотвращаем автоматическую загрузку
    },
    showUploadList: false,
    accept: '.txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <RobotOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Perplexity AI Чат
            </Title>
            <Text type="secondary">
              ИИ-ассистент с доступом к интернету и возможностью анализа файлов
            </Text>
          </div>
          <Space>
            <Tooltip title="Проверить подключение">
              <Button 
                icon={<InfoCircleOutlined />} 
                onClick={testConnection}
                size="small"
              >
                Тест
              </Button>
            </Tooltip>
            <Button onClick={clearChat} size="small">
              Очистить чат
            </Button>
          </Space>
        </div>

        {/* Настройки модели */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Text strong>Модель:</Text>
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              style={{ width: 300 }}
              placeholder="Выберите модель"
            >
              {models.map(model => (
                <Option key={model.id} value={model.id}>
                  <div>
                    <div>{model.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {model.description}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Space>
        </div>

        <Divider />

        {/* Область сообщений */}
        <div 
          style={{ 
            height: '500px', 
            overflowY: 'auto', 
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#fafafa'
          }}
        >
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', marginTop: '100px' }}>
              <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>Начните разговор с Perplexity AI</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Можете задавать вопросы, отправлять файлы для анализа
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
                      icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                      style={{ 
                        backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        backgroundColor: message.role === 'user' ? '#e6f7ff' : '#f6ffed',
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${message.role === 'user' ? '#91d5ff' : '#b7eb8f'}`
                      }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666', 
                        marginTop: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        {message.model && (
                          <Tag color="blue">
                            {models.find(m => m.id === message.model)?.name || message.model}
                          </Tag>
                        )}
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
              placeholder="Введите сообщение..."
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={loading || uploading}
            />
          </div>
          <Space>
            <Upload {...uploadProps}>
              <Tooltip title="Отправить файл">
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploading}
                  disabled={loading}
                >
                  Файл
                </Button>
              </Tooltip>
            </Upload>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={loading}
              disabled={!inputMessage.trim() || uploading}
            >
              Отправить
            </Button>
          </Space>
        </div>

        {/* Информация */}
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            💡 <strong>Возможности:</strong> Поиск информации в интернете, анализ документов, 
            ответы на вопросы, помощь с кодом. Поддерживаются файлы: TXT, PDF, DOC, DOCX, изображения.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default PerplexityChat; 
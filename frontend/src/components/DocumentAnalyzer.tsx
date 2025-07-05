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
  message,
  Divider,
  Tooltip,
  Tag,
  Progress,
  Alert
} from 'antd';
import {
  SendOutlined,
  UploadOutlined,
  RobotOutlined,
  UserOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  DeleteOutlined,
  EyeOutlined
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
  fileInfo?: {
    name: string;
    size: number;
    type: string;
  };
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string; // base64
}

const DocumentAnalyzer: React.FC = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedModel, setSelectedModel] = useState('sonar');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // Если есть загруженные файлы, отправляем их вместе с сообщением
      if (uploadedFiles.length > 0) {
        await sendMessageWithFiles(inputMessage);
      } else {
        await sendSimpleMessage(inputMessage);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      message.error('Ошибка при отправке сообщения');
    } finally {
      setLoading(false);
    }
  };

  const sendSimpleMessage = async (messageText: string) => {
    const response = await fetch('http://localhost:8000/api/perplexity/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Ты - эксперт по анализу документов. Помогай пользователям анализировать документы, извлекать ключевую информацию, находить ошибки и давать рекомендации. ' + messageText
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
  };

  const sendMessageWithFiles = async (messageText: string) => {
    // Отправляем каждый файл отдельно
    for (const file of uploadedFiles) {
      const formData = new FormData();
      
      // Конвертируем base64 обратно в файл
      const byteCharacters = atob(file.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.type });
      
      formData.append('file', blob, file.name);
      // Отправляем только одно сообщение с файлом, без истории
      formData.append('messages', JSON.stringify([
        {
          role: 'user',
          content: `Ты - эксперт по анализу документов. Проанализируй этот документ: ${file.name}. ${messageText}`
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
          content: `**Анализ файла: ${file.name}**\n\n${data.choices[0].message.content}`,
          timestamp: new Date(),
          model: selectedModel,
          fileInfo: {
            name: file.name,
            size: file.size,
            type: file.type
          }
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json();
        message.error(`Ошибка обработки файла ${file.name}: ${errorData.detail || 'Неизвестная ошибка'}`);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Проверяем размер файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error('Файл слишком большой. Максимальный размер: 10MB');
      return;
    }

    setUploading(true);

    try {
      // Конвертируем файл в base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const base64Content = content.split(',')[1]; // Убираем префикс data:...

        const uploadedFile: UploadedFile = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          content: base64Content
        };

        setUploadedFiles(prev => [...prev, uploadedFile]);
        message.success(`Файл ${file.name} загружен`);
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      message.error('Ошибка при загрузке файла');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const clearChat = () => {
    setMessages([]);
    setUploadedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      handleFileUpload(file);
      return false;
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
              <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Анализатор документов
            </Title>
            <Text type="secondary">
              Специализированный ИИ для анализа документов и извлечения информации
            </Text>
          </div>
          <Button onClick={clearChat} size="small">
            Очистить все
          </Button>
        </div>

        {/* Настройки модели */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Text strong>Модель:</Text>
            <Select
              value={selectedModel}
              onChange={setSelectedModel}
              style={{ width: 300 }}
            >
              <Option value="sonar">
                Sonar (Рекомендуется)
              </Option>
              <Option value="sonar-small">
                Sonar Small (Быстрая)
              </Option>
              <Option value="sonar-medium">
                Sonar Medium (Сбалансированная)
              </Option>
              <Option value="sonar-large">
                Sonar Large (Мощная)
              </Option>
            </Select>
          </Space>
        </div>

        <Divider />

        {/* Загруженные файлы */}
        {uploadedFiles.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Загруженные файлы:</Text>
            <div style={{ marginTop: '8px' }}>
              {uploadedFiles.map(file => (
                <Tag
                  key={file.id}
                  closable
                  onClose={() => removeFile(file.id)}
                  style={{ margin: '4px' }}
                >
                  <FileTextOutlined style={{ marginRight: '4px' }} />
                  {file.name} ({formatFileSize(file.size)})
                </Tag>
              ))}
            </div>
          </div>
        )}

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
              <FileTextOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>Загрузите документы для анализа</div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Поддерживаются: PDF, DOC, DOCX, TXT, изображения
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
                        {message.fileInfo && (
                          <Tag color="orange">
                            <FileTextOutlined style={{ marginRight: '4px' }} />
                            {message.fileInfo.name}
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
              placeholder="Задайте вопрос о документах или попросите проанализировать их..."
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
              <Tooltip title="Загрузить документ">
                <Button 
                  icon={<UploadOutlined />} 
                  loading={uploading}
                  disabled={loading}
                >
                  Документ
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
              Анализировать
            </Button>
          </Space>
        </div>

        {/* Информация */}
        <Alert
          message="Возможности анализатора документов"
          description="Извлечение ключевой информации, поиск ошибок, анализ структуры, сравнение документов, генерация отчетов, поиск несоответствий."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Card>
    </div>
  );
};

export default DocumentAnalyzer; 
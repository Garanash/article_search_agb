import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Space, 
  Row, 
  Col,
  Empty,
  Spin,
  message
} from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getUserBots } from '../api/api';

const { Text, Title } = Typography;
const { TextArea } = Input;

interface Bot {
  id: number;
  bot_id: string;
  bot_name: string;
  bot_description: string;
  bot_avatar: string;
  bot_color: string;
  is_active: boolean;
  assigned_at: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: string;
  botId?: string;
}

const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [botsLoading, setBotsLoading] = useState(true);

  // Загружаем ботов пользователя
  useEffect(() => {
    const loadBots = async () => {
      try {
        setBotsLoading(true);
        const botsData = await getUserBots();
        setBots(botsData);
      } catch (error) {
        console.error('Error loading bots:', error);
        message.error('Ошибка при загрузке ботов');
      } finally {
        setBotsLoading(false);
      }
    };

    loadBots();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedBot) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      botId: selectedBot.bot_id
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setLoading(true);

    // Имитация ответа бота
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `Привет! Я ${selectedBot.bot_name}. Это тестовый ответ на ваше сообщение: "${inputMessage}"`,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        botId: selectedBot.bot_id
      };
      setMessages(prev => [...prev, botResponse]);
      setLoading(false);
    }, 1000);
  };

  const handleBotSelect = (bot: Bot) => {
    setSelectedBot(bot);
    setMessages([]); // Очищаем сообщения при смене бота
  };

  // Стили для ботов
  const botCardStyle = {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center' as const,
    backgroundColor: '#fafafa',
    hover: {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      borderColor: '#1890ff'
    }
  };

  const selectedBotStyle = {
    ...botCardStyle,
    border: '2px solid #1890ff',
    backgroundColor: '#e6f7ff',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(24,144,255,0.3)'
  };

  const avatarStyle = (color: string) => ({
    width: 80,
    height: 80,
    fontSize: '32px',
    backgroundColor: color,
    border: '4px solid white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });

  if (botsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Empty
          image={<RobotOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
          description={
            <div>
              <Title level={4}>У вас пока нет назначенных ботов</Title>
              <Text type="secondary">
                Обратитесь к администратору для назначения ботов
              </Text>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        <RobotOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
        Чаты с ботами
      </Title>

      <Row gutter={[24, 24]}>
        {/* Список ботов */}
        <Col xs={24} lg={8}>
          <Card title="Доступные боты" style={{ height: 'fit-content' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {bots.map((bot) => (
                <div
                  key={bot.id}
                  style={selectedBot?.id === bot.id ? selectedBotStyle : botCardStyle}
                  onClick={() => handleBotSelect(bot)}
                  onMouseEnter={(e) => {
                    if (selectedBot?.id !== bot.id) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                      e.currentTarget.style.borderColor = '#1890ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBot?.id !== bot.id) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  <Avatar
                    icon={<RobotOutlined />}
                    style={avatarStyle(bot.bot_color)}
                  />
                  <div style={{ marginTop: '12px' }}>
                    <Title level={5} style={{ margin: '8px 0 4px 0' }}>
                      {bot.bot_name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {bot.bot_description}
                    </Text>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Чат */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              selectedBot ? (
                <Space>
                  <Avatar
                    icon={<RobotOutlined />}
                    style={avatarStyle(selectedBot.bot_color)}
                    size="small"
                  />
                  <span>Чат с {selectedBot.bot_name}</span>
                </Space>
              ) : (
                <span>Выберите бота для начала чата</span>
              )
            }
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
          >
            {selectedBot ? (
              <>
                {/* Сообщения */}
                <div style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  marginBottom: '16px',
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  borderRadius: '8px'
                }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                      <MessageOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                      <div>Начните разговор с {selectedBot.bot_name}</div>
                    </div>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          style={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            marginBottom: '8px'
                          }}
                        >
                          <div
                            style={{
                              maxWidth: '70%',
                              padding: '12px 16px',
                              borderRadius: '18px',
                              backgroundColor: msg.sender === 'user' ? '#1890ff' : '#fff',
                              color: msg.sender === 'user' ? '#fff' : '#000',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              wordWrap: 'break-word'
                            }}
                          >
                            <div>{msg.content}</div>
                            <div style={{ 
                              fontSize: '11px', 
                              opacity: 0.7, 
                              marginTop: '4px',
                              textAlign: msg.sender === 'user' ? 'right' : 'left'
                            }}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <div style={{
                            padding: '12px 16px',
                            borderRadius: '18px',
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}>
                            <Spin size="small" />
                          </div>
                        </div>
                      )}
                    </Space>
                  )}
                </div>

                {/* Поле ввода */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <TextArea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    style={{ height: 'auto' }}
                  >
                    Отправить
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                color: '#999'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <RobotOutlined style={{ fontSize: '64px', marginBottom: '16px' }} />
                  <div>Выберите бота из списка слева для начала чата</div>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ChatInterface; 
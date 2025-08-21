import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Button, message, List, Avatar, Tag, Row, Col, Tabs, Empty, Spin } from 'antd';
import {
  BellOutlined,
  PlusOutlined,
  CalendarOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  PhoneOutlined,
  SettingOutlined,
  BarChartOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface NewsItem {
  id: number;
  title: string;
  content: string;
  date: string;
  category: string;
  author: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  event_date: string;
  event_type: 'meeting' | 'deadline' | 'event' | 'reminder';
}

const Dashboard: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Загрузка новостей
  const loadNews = async () => {
    try {
      setNewsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/news/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newsData = await response.json();
        setNews(newsData);
      } else {
        // Тестовые данные
        setNews([
          {
            id: 1,
            title: 'Обновление системы',
            content: 'Система была обновлена до последней версии.',
            date: '2024-01-15T10:00:00Z',
            category: 'Система',
            author: 'Администратор'
          },
          {
            id: 2,
            title: 'Новый сотрудник',
            content: 'В команду присоединился новый разработчик.',
            date: '2024-01-14T14:30:00Z',
            category: 'Команда',
            author: 'HR отдел'
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки новостей:', error);
      setNews([
        {
          id: 1,
          title: 'Обновление системы',
          content: 'Система была обновлена до последней версии.',
          date: '2024-01-15T10:00:00Z',
          category: 'Система',
          author: 'Администратор'
        },
        {
          id: 2,
          title: 'Новый сотрудник',
          content: 'В команду присоединился новый разработчик.',
          date: '2024-01-14T14:30:00Z',
          category: 'Команда',
          author: 'HR отдел'
        }
      ]);
    } finally {
      setNewsLoading(false);
    }
  };

  // Загрузка событий
  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar-events/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      } else {
        setEvents([
          {
            id: 1,
            title: 'Встреча команды',
            description: 'Еженедельная встреча разработчиков',
            event_date: '2024-01-20T10:00:00Z',
            event_type: 'meeting'
          }
        ]);
      }
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
      setEvents([
        {
          id: 1,
          title: 'Встреча команды',
          description: 'Еженедельная встреча разработчиков',
          event_date: '2024-01-20T10:00:00Z',
          event_type: 'meeting'
        }
      ]);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    loadEvents();
  }, []);

  const handleAddNews = () => {
    message.info('Функция добавления новостей в разработке');
  };

  // Простой календарь
  const SimpleCalendar = ({ events, loading }: { events: CalendarEvent[], loading: boolean }) => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Spin size="large" />
        </div>
      );
    }

    return (
      <div>
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <Title level={4} style={{ margin: '0 0 8px 0', color: '#1890ff' }}>
            Календарь событий
          </Title>
        </div>

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            <CalendarOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
            <div>Событий нет</div>
          </div>
        ) : (
          <List
            dataSource={events}
            renderItem={(event) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size={40} 
                      style={{ backgroundColor: '#1890ff' }} 
                      icon={<CalendarOutlined />} 
                    />
                  }
                  title={event.title}
                  description={
                    <div>
                      <div>{event.description}</div>
                      <Text type="secondary">
                        {new Date(event.event_date).toLocaleDateString('ru-RU')}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    );
  };

  const getTabs = () => {
    const baseTabs = [
      {
        key: 'main',
        label: 'Главная',
        icon: <UserOutlined />,
        children: (
          <div style={{ padding: '24px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
                {isAdmin ? 'Административная панель' : 'Добро пожаловать в корпоративную систему'}
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {isAdmin ? 'Управление корпоративной системой' : 'Ваш персональный дашборд'}
              </Text>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <BellOutlined style={{ color: '#1890ff' }} />
                      <span>Новости компании</span>
                    </Space>
                  }
                  style={{ 
                    height: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: 'none'
                  }}
                  extra={
                    isAdmin && (
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleAddNews}
                      >
                        Добавить
                      </Button>
                    )
                  }
                >
                  {newsLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <Spin size="large" />
                    </div>
                  ) : news.length === 0 ? (
                    <Empty description="Новости не найдены" />
                  ) : (
                    <List
                      dataSource={news}
                      renderItem={(newsItem) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <Avatar 
                                size={48} 
                                style={{ backgroundColor: '#1890ff' }} 
                                icon={<BellOutlined />} 
                              />
                            }
                            title={newsItem.title}
                            description={
                              <div>
                                <div style={{ marginBottom: '12px', lineHeight: '1.6' }}>
                                  {newsItem.content}
                                </div>
                                <Space size="small" wrap>
                                  <Tag color="blue">{newsItem.category}</Tag>
                                  <Text type="secondary">
                                    📅 {new Date(newsItem.date).toLocaleDateString('ru-RU')}
                                  </Text>
                                  <Text type="secondary">
                                    👤 {newsItem.author}
                                  </Text>
                                </Space>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card
                  title={
                    <Space>
                      <CalendarOutlined style={{ color: '#1890ff' }} />
                      <span>Календарь событий</span>
                    </Space>
                  }
                  style={{ 
                    height: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: 'none'
                  }}
                >
                  <SimpleCalendar events={events} loading={eventsLoading} />
                </Card>
              </Col>
            </Row>
          </div>
        )
      },
      {
        key: 'search',
        label: 'Поиск артикулов',
        icon: <FileTextOutlined />,
        children: <div style={{ padding: '24px 0' }}>Поиск артикулов</div>
      },
      {
        key: 'directory',
        label: 'Справочник',
        icon: <PhoneOutlined />,
        children: <div style={{ padding: '24px 0' }}>Телефонный справочник</div>
      },
      {
        key: 'passports',
        label: 'Паспорта изделий',
        icon: <FileTextOutlined />,
        children: <div style={{ padding: '24px 0' }}>Управление паспортами</div>
      }
    ];

    if (isAdmin) {
      baseTabs.push(
        {
          key: 'admin',
          label: 'Администрирование',
          icon: <SecurityScanOutlined />,
          children: <div style={{ padding: '24px 0' }}>Панель администратора</div>
        },
        {
          key: 'analytics',
          label: 'Аналитика',
          icon: <BarChartOutlined />,
          children: <div style={{ padding: '24px 0' }}>Аналитические данные</div>
        },
        {
          key: 'system',
          label: 'Система',
          icon: <SettingOutlined />,
          children: <div style={{ padding: '24px 0' }}>Настройки системы</div>
        }
      );
    }

    return baseTabs;
  };

  return (
    <div style={{ 
      width: '100%',
      maxWidth: '1200px',
      padding: '24px'
    }}>
      <Tabs
        defaultActiveKey="main"
        onChange={(key) => {
          console.log('Tab changed to:', key);
        }}
        items={getTabs()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
        tabBarStyle={{
          marginBottom: '24px'
        }}
      />
    </div>
  );
};

export default Dashboard;

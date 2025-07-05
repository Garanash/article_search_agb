import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Avatar, Typography, Space, Divider, Tag, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth, User } from '../context/AuthContext';
import EditProfile from './EditProfile';

const { Title, Text } = Typography;

interface UserProfileProps {
  onEditProfile?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onEditProfile }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState({
    totalArticles: 0,
    totalSuppliers: 0,
    totalRequests: 0,
    lastActivity: new Date().toLocaleDateString('ru-RU')
  });

  useEffect(() => {
    // Здесь можно загрузить статистику пользователя
    // Пока используем моковые данные
    setUserStats({
      totalArticles: 156,
      totalSuppliers: 1247,
      totalRequests: 23,
      lastActivity: new Date().toLocaleDateString('ru-RU')
    });
  }, []);

  const getRoleColor = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'user': return 'green';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'user': return 'Пользователь';
      default: return 'Пользователь';
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    if (onEditProfile) {
      onEditProfile();
    }
  };

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // Если режим редактирования, показываем форму редактирования
  if (isEditing) {
    return (
      <EditProfile 
        onSave={handleSaveProfile}
        onCancel={handleCancelEdit}
      />
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Личный кабинет</Title>
      
      <Row gutter={[24, 24]}>
        {/* Основная информация о пользователе */}
        <Col xs={24} lg={16}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ marginRight: '16px' }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>{user?.username || 'Пользователь'}</Title>
                <Tag color={getRoleColor(user?.role)} style={{ marginTop: '8px' }}>
                  {getRoleLabel(user?.role)}
                </Tag>
              </div>
              <Button 
                type="primary" 
                style={{ marginLeft: 'auto' }} 
                onClick={handleEditProfile}
                icon={<EditOutlined />}
              >
                Редактировать профиль
              </Button>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Имя пользователя">
                <Text strong>{user?.username || 'Не указано'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Space>
                  <MailOutlined />
                  <Text>{user?.email || 'Не указан'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Роль в системе">
                <Tag color={getRoleColor(user?.role)}>
                  {getRoleLabel(user?.role)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Отдел">
                <Space>
                  <TeamOutlined />
                  <Text>{user?.department || 'Не указан'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Должность">
                <Text>{user?.position || 'Не указана'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Телефон">
                <Space>
                  <PhoneOutlined />
                  <Text>{user?.phone || 'Не указан'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Компания">
                <Text>{user?.company || 'Не указана'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Дата регистрации">
                <Space>
                  <CalendarOutlined />
                  <Text>{user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Не указана'}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Последняя активность">
                <Space>
                  <CalendarOutlined />
                  <Text>{userStats.lastActivity}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Статистика пользователя */}
        <Col xs={24} lg={8}>
          <Card title="Статистика активности">
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#1890ff', margin: 0 }}>{userStats.totalArticles}</Title>
                <Text type="secondary">Артикулов добавлено</Text>
              </div>
              
              <Divider />
              
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#52c41a', margin: 0 }}>{userStats.totalSuppliers}</Title>
                <Text type="secondary">Поставщиков найдено</Text>
              </div>
              
              <Divider />
              
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: '#faad14', margin: 0 }}>{userStats.totalRequests}</Title>
                <Text type="secondary">Запросов создано</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Дополнительная информация */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="Дополнительная информация">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
              <Descriptions.Item label="Статус аккаунта">
                <Tag color="green">Активен</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Время в системе">
                <Text>2 месяца 15 дней</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Последний вход">
                <Text>{new Date().toLocaleString('ru-RU')}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserProfile; 
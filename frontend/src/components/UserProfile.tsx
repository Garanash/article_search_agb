import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Avatar, Typography, Space, Divider, Tag, Row, Col, Upload, Modal, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, TeamOutlined, CalendarOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth, User } from '../context/AuthContext';
import EditProfile from './EditProfile';
import { uploadUserAvatar, updateUserProfile } from '../api/userApi';
import { getUserStatistics } from '../api/api';

const { Title, Text } = Typography;

interface UserProfileProps {
  onEditProfile?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onEditProfile }) => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState({
    totalArticles: 0,
    totalSuppliers: 0,
    totalRequests: 0,
    lastActivity: new Date().toLocaleDateString('ru-RU')
  });
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar_url);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Загружаем статистику пользователя из базы данных
    const loadUserStatistics = async () => {
      setLoading(true);
      try {
        const stats = await getUserStatistics();
        setUserStats({
          totalArticles: stats.total_articles || 0,
          totalSuppliers: stats.total_suppliers || 0,
          totalRequests: stats.total_requests || 0,
          lastActivity: stats.last_activity ? new Date(stats.last_activity).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU')
        });
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        message.error('Не удалось загрузить статистику активности');
        // Используем значения по умолчанию в случае ошибки
        setUserStats({
          totalArticles: 0,
          totalSuppliers: 0,
          totalRequests: 0,
          lastActivity: new Date().toLocaleDateString('ru-RU')
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserStatistics();
    setAvatarUrl(user?.avatar_url);
  }, [user]);

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

  const handleAvatarChange = async (info: any) => {
    const file = info.file.originFileObj || info.file;
    try {
      const url = await uploadUserAvatar(file);
      setAvatarUrl(url);
      if (user) {
        await updateUserProfile({ avatar_url: url });
        updateUser({ ...user, avatar_url: url });
      }
      setIsAvatarModalVisible(false);
      message.success('Аватар успешно обновлён!');
    } catch (e) {
      message.error('Ошибка загрузки аватара');
    }
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

  // Функция для вычисления разницы между датами в годах, месяцах и днях
  function getTimeInSystem(createdAt?: string | Date): string {
    if (!createdAt) return 'Неизвестно';
    const start = new Date(createdAt);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
      months -= 1;
      // Получаем количество дней в предыдущем месяце
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    let result = [];
    if (years > 0) result.push(`${years} ${years === 1 ? 'год' : (years < 5 ? 'года' : 'лет')}`);
    if (months > 0) result.push(`${months} ${months === 1 ? 'месяц' : (months < 5 ? 'месяца' : 'месяцев')}`);
    if (days > 0) result.push(`${days} ${days === 1 ? 'день' : (days < 5 ? 'дня' : 'дней')}`);
    if (result.length === 0) return 'меньше дня';
    return result.join(' ');
  }

  return (
    <>
      <Row gutter={[24, 24]}>
        {/* Основная информация о пользователе */}
        <Col xs={24} lg={16}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <Avatar
                size={80}
                icon={<UserOutlined />}
                src={avatarUrl}
                style={{ marginRight: '16px', cursor: 'pointer' }}
                onClick={() => setIsAvatarModalVisible(true)}
              />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {user?.last_name || user?.first_name || user?.patronymic
                    ? [user?.last_name, user?.first_name, user?.patronymic].filter(Boolean).join(' ')
                    : 'ФИО не указано'}
                </Title>
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
          <Card title="Статистика активности" loading={loading}>
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
                <Text>{getTimeInSystem(user?.created_at)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Последний вход">
                <Text>{new Date().toLocaleString('ru-RU')}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно для смены аватара */}
      <Modal
        title="Изменить аватар"
        open={isAvatarModalVisible}
        onCancel={() => setIsAvatarModalVisible(false)}
        footer={null}
      >
        <Upload
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleAvatarChange}
          accept="image/*"
        >
          <Button icon={<UploadOutlined />}>Выбрать файл</Button>
        </Upload>
        {avatarUrl && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Avatar size={80} src={avatarUrl} />
          </div>
        )}
      </Modal>
    </>
  );
};

export default UserProfile; 
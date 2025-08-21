import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Form, 
  Input, 
  Upload, 
  Avatar, 
  Divider, 
  Space, 
  message, 
  Tag,
  Descriptions,
  Statistic,
  Progress,
  Badge
} from 'antd';
import { 
  UserOutlined, 
  SaveOutlined,
  CameraOutlined,
  EditOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  BankOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TeamOutlined,
  SettingOutlined,
  CrownOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/api';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProfileManagerProps {
  onBack?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onBack }) => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        patronymic: user.patronymic || '',
        department: user.department || '',
        position: user.position || '',
        phone: user.phone || '',
        company: user.company || ''
      });
    }
  }, [user, form]);

  const handleProfileUpdate = async (values: any) => {
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/users/${user?.id}`, values);
      if (response.status >= 200 && response.status < 300) {
        message.success('Профиль успешно обновлен!');
        if (updateUser && user) {
          updateUser({ ...user, ...values });
        }
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      message.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/api/avatar/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status >= 200 && response.status < 300) {
        message.success('Аватар успешно загружен!');
        if (updateUser && user) {
          updateUser({ ...user, avatar_url: response.data.avatar_url });
        }
        setFileList([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error);
      message.error('Ошибка загрузки аватара');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleAvatarDelete = async () => {
    try {
      const response = await apiClient.delete('/api/avatar/');
      if (response.status >= 200 && response.status < 300) {
        message.success('Аватар успешно удален!');
        if (updateUser && user) {
          updateUser({ ...user, avatar_url: undefined });
        }
      }
    } catch (error) {
      console.error('Ошибка удаления аватара:', error);
      message.error('Ошибка удаления аватара');
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Можно загружать только изображения!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Размер файла должен быть меньше 5MB!');
        return false;
      }
      handleAvatarUpload(file);
      return false;
    },
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    showUploadList: false,
  };

  const getUserInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user?.username?.substring(0, 2).toUpperCase() || 'U';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager': return 'orange';
      default: return 'blue';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <CrownOutlined />;
      case 'manager': return <SettingOutlined />;
      default: return <UserOutlined />;
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
      {/* Заголовок страницы */}
      <div style={{ 
        marginBottom: '32px', 
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 24px',
        borderRadius: '20px',
        color: 'white',
        marginTop: '16px'
      }}>
        <Title level={1} style={{ 
          marginBottom: '8px', 
          color: 'white',
          fontSize: '36px',
          fontWeight: '700'
        }}>
          Личный кабинет
        </Title>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.9)', 
          fontSize: '18px',
          fontWeight: '300'
        }}>
          Управление профилем и настройками
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Левая колонка - Основная информация и аватар */}
        <Col xs={24} lg={8}>
          <Card 
            style={{ 
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: 'none',
              overflow: 'hidden'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            {/* Аватар и основная информация */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Badge 
                dot={false}
                offset={[-8, 8]}
                count={
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#52c41a',
                    border: '3px solid white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />
                  </div>
                }
              >
                <Avatar 
                  size={140} 
                  src={user?.avatar_url ? `http://localhost:8000${user.avatar_url}` : undefined}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: user?.avatar_url ? 'transparent' : '#1890ff',
                    border: '6px solid #f0f0f0',
                    fontSize: '56px',
                    fontWeight: '600',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {!user?.avatar_url && getUserInitials()}
                </Avatar>
              </Badge>
            </div>

            {/* Имя и должность */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Title level={2} style={{ 
                marginBottom: '8px', 
                color: '#262626',
                fontSize: '24px',
                fontWeight: '600'
              }}>
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user?.username || 'Пользователь'
                }
              </Title>
              
              <Text style={{ 
                color: '#8c8c8c', 
                fontSize: '16px', 
                marginBottom: '16px', 
                display: 'block',
                fontWeight: '500'
              }}>
                {user?.position || 'Сотрудник'}
              </Text>

              {/* Роль */}
              <Tag 
                color={getRoleColor(user?.role || 'user')}
                icon={getRoleIcon(user?.role || 'user')}
                style={{ 
                  fontSize: '14px', 
                  padding: '8px 16px', 
                  borderRadius: '20px',
                  fontWeight: '600',
                  border: 'none'
                }}
              >
                {user?.role === 'admin' ? 'Администратор' : 
                 user?.role === 'manager' ? 'Менеджер' : 'Пользователь'}
              </Tag>
            </div>

            <Divider />

            {/* Статистика */}
            <div style={{ marginBottom: '24px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="ID пользователя"
                    value={user?.id}
                    valueStyle={{ fontSize: '18px', color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Отдел"
                    value={user?.department || 'Не указан'}
                    valueStyle={{ fontSize: '14px', color: '#8c8c8c' }}
                  />
                </Col>
              </Row>
            </div>

            {/* Прогресс заполнения профиля */}
            <div style={{ marginBottom: '24px' }}>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Заполненность профиля
              </Text>
              <Progress 
                percent={85} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                showInfo={false}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                85% заполнено
              </Text>
            </div>

            {/* Кнопки управления аватаром */}
            <div style={{ marginBottom: '24px' }}>
              <Upload {...uploadProps}>
                <Button 
                  icon={<CameraOutlined />} 
                  type="primary" 
                  loading={avatarLoading}
                  block
                  style={{ 
                    borderRadius: '12px',
                    height: '44px',
                    marginBottom: '12px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    fontWeight: '600'
                  }}
                >
                  Изменить фото
                </Button>
              </Upload>

              {user?.avatar_url && (
                <Button 
                  icon={<DeleteOutlined />} 
                  danger 
                  onClick={handleAvatarDelete}
                  block
                  style={{ 
                    borderRadius: '12px',
                    height: '44px',
                    border: '2px solid #ff4d4f',
                    fontWeight: '600'
                  }}
                >
                  Удалить фото
                </Button>
              )}
            </div>

            {/* Информация о компании */}
            <div style={{ 
              background: 'rgba(24, 144, 255, 0.05)', 
              padding: '20px', 
              borderRadius: '12px',
              border: '1px solid rgba(24, 144, 255, 0.1)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <BankOutlined style={{ color: '#1890ff', marginRight: '8px', fontSize: '16px' }} />
                <Text strong style={{ fontSize: '14px' }}>Компания</Text>
              </div>
              <Text style={{ fontSize: '14px', color: '#666' }}>
                {user?.company || 'ООО "Алмазгеобур"'}
              </Text>
            </div>
          </Card>
        </Col>

        {/* Правая колонка - Форма редактирования */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <EditOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
                <span style={{ fontSize: '18px', fontWeight: '600' }}>
                  {isEditing ? 'Редактирование профиля' : 'Информация о профиле'}
                </span>
              </Space>
            }
            extra={
              <Button
                type={isEditing ? 'default' : 'primary'}
                icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
                onClick={() => {
                  if (isEditing) {
                    form.submit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                loading={loading}
                style={{ 
                  borderRadius: '8px',
                  height: '36px',
                  padding: '0 16px',
                  fontWeight: '600'
                }}
              >
                {isEditing ? 'Сохранить' : 'Редактировать'}
              </Button>
            }
            style={{ 
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              border: 'none'
            }}
            headStyle={{ 
              borderBottom: '1px solid #f0f0f0',
              padding: '24px 32px',
              background: 'rgba(24, 144, 255, 0.02)'
            }}
            bodyStyle={{ padding: '32px' }}
          >
            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
                size="large"
              >
                <Row gutter={[20, 20]}>
                  {/* Основная информация */}
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Имя"
                      name="first_name"
                      rules={[{ required: true, message: 'Введите имя' }]}
                    >
                      <Input 
                        prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Введите имя"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Фамилия"
                      name="last_name"
                      rules={[{ required: true, message: 'Введите фамилию' }]}
                    >
                      <Input 
                        prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Введите фамилию"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Отчество"
                      name="patronymic"
                    >
                      <Input 
                        prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Введите отчество"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Введите email' },
                        { type: 'email', message: 'Введите корректный email' }
                      ]}
                    >
                      <Input 
                        prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Введите email"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Телефон"
                      name="phone"
                    >
                      <Input 
                        prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Введите телефон"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Отдел"
                      name="department"
                    >
                      <Input 
                        placeholder="Введите отдел"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Должность"
                      name="position"
                    >
                      <Input 
                        placeholder="Введите должность"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="Компания"
                      name="company"
                    >
                      <Input 
                        prefix={<BankOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="Введите название компании"
                        style={{ borderRadius: '8px', height: '44px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                {/* Кнопки действий */}
                <div style={{ textAlign: 'right', marginTop: '32px' }}>
                  <Space>
                    <Button 
                      size="large"
                      onClick={() => {
                        setIsEditing(false);
                        form.resetFields();
                      }}
                      style={{ 
                        borderRadius: '8px',
                        height: '44px',
                        padding: '0 24px',
                        fontWeight: '600'
                      }}
                    >
                      Отмена
                    </Button>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading}
                      icon={<SaveOutlined />}
                      size="large"
                      style={{ 
                        borderRadius: '8px',
                        height: '44px',
                        padding: '0 24px',
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        border: 'none',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)'
                      }}
                    >
                      Сохранить изменения
                    </Button>
                  </Space>
                </div>
              </Form>
            ) : (
                             <Descriptions
                 column={2}
                 size="default"
                 bordered
                style={{ background: 'white' }}
                labelStyle={{ 
                  fontWeight: '600', 
                  color: '#262626',
                  fontSize: '14px'
                }}
                contentStyle={{ 
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                <Descriptions.Item label="Имя" span={1}>
                  {user?.first_name || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Фамилия" span={1}>
                  {user?.last_name || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Отчество" span={1}>
                  {user?.patronymic || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Email" span={1}>
                  {user?.email || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Телефон" span={1}>
                  {user?.phone || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Отдел" span={1}>
                  {user?.department || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Должность" span={1}>
                  {user?.position || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Компания" span={1}>
                  {user?.company || 'Не указано'}
                </Descriptions.Item>
                <Descriptions.Item label="Дата регистрации" span={2}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Не указано'}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileManager; 
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip,
  Badge,
  Avatar,
  Drawer,
  Switch,
  Alert,
  Spin
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  EyeOutlined,
  CopyOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { apiClient } from '../api/api';
import UserAvatar from './UserAvatar';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  patronymic?: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  company?: string;
  avatar_url?: string;
  force_password_change: boolean;
  is_active: boolean;
  is_marked_for_deletion: boolean;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [userDetailsVisible, setUserDetailsVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [departmentForm] = Form.useForm();

  // Загрузка данных
  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/users/users');
      if (response.status >= 200 && response.status < 300) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      message.error('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiClient.get('/api/users/roles');
      if (response.status >= 200 && response.status < 300) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await apiClient.get('/api/users/departments');
      if (response.status >= 200 && response.status < 300) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Ошибка загрузки департаментов:', error);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, []);

  // Генерация пароля
  const generatePassword = (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Обязательно включаем по одному символу каждого типа
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Заполняем остальную часть случайными символами
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Перемешиваем пароль
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Создание пользователя
  const handleCreateUser = async (values: any) => {
    try {
      const userData = {
        ...values
      };

      const response = await apiClient.post('/api/users/', userData);
      if (response.status >= 200 && response.status < 300) {
        message.success('Пользователь успешно создан!');
        setModalVisible(false);
        form.resetFields();
        loadUsers();
        
        // Показываем пароль, сгенерированный сервером
        const serverPassword = response.data.generated_password;
        setGeneratedPassword(serverPassword);
        setPasswordModalVisible(true);
      }
    } catch (error: any) {
      console.error('Ошибка создания пользователя:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось создать пользователя';
      message.error(errorMessage);
    }
  };

  // Обновление пользователя
  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;
    
    try {
      const response = await apiClient.put(`/api/users/${editingUser.id}`, values);
      if (response.status >= 200 && response.status < 300) {
        message.success('Пользователь успешно обновлен!');
        setModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        loadUsers();
      }
    } catch (error: any) {
      console.error('Ошибка обновления пользователя:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось обновить пользователя';
      message.error(errorMessage);
    }
  };

  // Удаление пользователя
  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await apiClient.delete(`/api/users/${userId}`);
      if (response.status >= 200 && response.status < 300) {
        message.success('Пользователь успешно удален!');
        loadUsers();
      }
    } catch (error: any) {
      console.error('Ошибка удаления пользователя:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось удалить пользователя';
      message.error(errorMessage);
    }
  };

  // Сброс пароля
  const handleResetPassword = async (userId: number) => {
    try {
      const response = await apiClient.post(`/api/users/${userId}/reset-password`);
      if (response.status >= 200 && response.status < 300) {
        const newPassword = response.data.new_password;
        setGeneratedPassword(newPassword);
        setPasswordModalVisible(true);
        message.success('Пароль успешно сброшен!');
      }
    } catch (error: any) {
      console.error('Ошибка сброса пароля:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось сбросить пароль';
      message.error(errorMessage);
    }
  };

  // Деактивация/активация пользователя
  const handleDeactivateUser = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const isCurrentlyActive = user.is_active;
      const endpoint = isCurrentlyActive ? 'deactivate' : 'activate';
      
      const response = await apiClient.put(`/api/users/${userId}/${endpoint}`);
      if (response.status >= 200 && response.status < 300) {
        const action = isCurrentlyActive ? 'деактивирован' : 'активирован';
        message.success(`Пользователь успешно ${action}!`);
        loadUsers();
      }
    } catch (error: any) {
      console.error('Ошибка изменения статуса пользователя:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось изменить статус пользователя';
      message.error(errorMessage);
    }
  };

  // Пометка/убирание пометки на удаление пользователя
  const handleMarkForDeletion = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const isCurrentlyMarked = user.is_marked_for_deletion;
      const endpoint = isCurrentlyMarked ? 'unmark-for-deletion' : 'mark-for-deletion';
      
      const response = await apiClient.put(`/api/users/${userId}/${endpoint}`);
      if (response.status >= 200 && response.status < 300) {
        const action = isCurrentlyMarked ? 'убрана пометка на удаление' : 'помечен на удаление';
        message.success(`Пользователь ${action}!`);
        loadUsers();
      }
    } catch (error: any) {
      console.error('Ошибка изменения пометки на удаление:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось изменить пометку на удаление';
      message.error(errorMessage);
    }
  };

  // Создание роли
  const handleCreateRole = async (values: any) => {
    try {
      const response = await apiClient.post('/api/users/roles', values);
      if (response.status >= 200 && response.status < 300) {
        message.success('Роль успешно создана!');
        setRoleModalVisible(false);
        roleForm.resetFields();
        loadRoles();
      }
    } catch (error: any) {
      console.error('Ошибка создания роли:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось создать роль';
      message.error(errorMessage);
    }
  };

  // Создание департамента
  const handleCreateDepartment = async (values: any) => {
    try {
      const response = await apiClient.post('/api/users/departments', values);
      if (response.status >= 200 && response.status < 300) {
        message.success('Департамент успешно создан!');
        setDepartmentModalVisible(false);
        departmentForm.resetFields();
        loadDepartments();
      }
    } catch (error: any) {
      console.error('Ошибка создания департамента:', error);
      const errorMessage = error.response?.data?.detail || 'Не удалось создать департамент';
      message.error(errorMessage);
    }
  };

  // Копирование в буфер обмена
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Скопировано в буфер обмена!');
    });
  };

  // Получение цвета роли
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager': return 'orange';
      case 'user': return 'green';
      default: return 'default';
    }
  };

  // Получение названия роли
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'user': return 'Пользователь';
      default: return role;
    }
  };

  // Фильтрация пользователей по статусу
  const getFilteredUsers = () => {
    switch (statusFilter) {
      case 'active':
        return users.filter(user => user.is_active && !user.is_marked_for_deletion);
      case 'inactive':
        return users.filter(user => !user.is_active);
      case 'marked_for_deletion':
        return users.filter(user => user.is_marked_for_deletion);
      case 'force_password_change':
        return users.filter(user => user.force_password_change);
      default:
        return users;
    }
  };

  // Колонки таблицы пользователей
  const userColumns = [
    {
      title: 'Пользователь',
      key: 'user',
      width: '22%',
      render: (record: User) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserAvatar user={record} size="small" />
          <div style={{ lineHeight: '1.2' }}>
            <div style={{ fontWeight: 500 }}>
              {[record.last_name, record.first_name, record.patronymic].filter(Boolean).join(' ')}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>@{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Контакты',
      key: 'contacts',
      width: '20%',
      render: (record: User) => (
        <div style={{ fontSize: 12, lineHeight: '1.2' }}>
          {record.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <MailOutlined style={{ fontSize: 11, color: '#888' }} />
              <span>{record.email}</span>
            </div>
          )}
          {record.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <PhoneOutlined style={{ fontSize: 11, color: '#888' }} />
              <span>{record.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      width: '12%',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{getRoleName(role)}</Tag>
      ),
    },
    {
      title: 'Департамент',
      dataIndex: 'department',
      key: 'department',
      width: '15%',
      render: (department: string) => department || '-',
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      width: '15%',
      render: (position: string) => position || '-',
    },
    {
      title: 'Статус',
      key: 'status',
      width: '15%',
      render: (record: User) => {
        const statuses = [];
        
        if (!record.is_active) {
          statuses.push({ status: 'error', text: 'Деактивирован' });
        } else if (record.force_password_change) {
          statuses.push({ status: 'warning', text: 'Смена пароля' });
        } else {
          statuses.push({ status: 'success', text: 'Активен' });
        }
        
        if (record.is_marked_for_deletion) {
          statuses.push({ status: 'error', text: 'На удаление' });
        }
        
        return (
          <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
            {statuses.map((s, idx) => (
              <Badge 
                key={idx}
                status={s.status as any}
                text={s.text}
                style={{ lineHeight: '1.2' }}
              />
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      width: '140px',
      render: (record: User) => (
        <Space size={4}>
          <Tooltip title="Просмотр">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setUserDetailsVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Изменить">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(record);
                form.setFieldsValue(record);
                setModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Сбросить пароль">
            <Button
              type="text"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record.id)}
            />
          </Tooltip>
          {record.is_active ? (
            <Tooltip title="Деактивировать">
              <Button
                type="text"
                size="small"
                icon={<LockOutlined />}
                onClick={() => handleDeactivateUser(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Активировать">
              <Button
                type="text"
                size="small"
                icon={<UnlockOutlined />}
                onClick={() => handleDeactivateUser(record.id)}
              />
            </Tooltip>
          )}
          {!record.is_marked_for_deletion ? (
            <Tooltip title="Пометить на удаление">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleMarkForDeletion(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Убрать пометку">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleMarkForDeletion(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, width: '100%', maxWidth: '100%' }}>
      <Row gutter={[16, 16]} style={{ width: '100%', margin: 0 }}>
        {/* Главная карточка с пользователями */}
        <Col span={24} style={{ padding: 0 }}>
          <Card style={{ width: '100%' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined />
                <span>Управление пользователями</span>
              </div>
            }
            extra={
              <Space>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 200 }}
                  placeholder="Фильтр по статусу"
                >
                  <Option value="all">Все пользователи</Option>
                  <Option value="active">Активные</Option>
                  <Option value="inactive">Деактивированные</Option>
                  <Option value="marked_for_deletion">Помеченные на удаление</Option>
                  <Option value="force_password_change">Требуют смены пароля</Option>
                </Select>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadUsers}
                  loading={loading}
                >
                  Обновить
                </Button>
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => {
                    setEditingUser(null);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                >
                  Добавить пользователя
                </Button>
              </Space>
            }
          >
            {/* Статистика пользователей */}
            <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
              <Row gutter={[8, 8]} style={{ margin: 0 }}>
                <Col span={6} style={{ padding: '0 4px' }}>
                  <div style={{ textAlign: 'center', padding: '4px 0' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#52c41a', lineHeight: '1' }}>
                      {users.filter(u => u.is_active && !u.is_marked_for_deletion).length}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Активные</div>
                  </div>
                </Col>
                <Col span={6} style={{ padding: '0 4px' }}>
                  <div style={{ textAlign: 'center', padding: '4px 0' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#faad14', lineHeight: '1' }}>
                      {users.filter(u => u.force_password_change).length}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Смена пароля</div>
                  </div>
                </Col>
                <Col span={6} style={{ padding: '0 4px' }}>
                  <div style={{ textAlign: 'center', padding: '4px 0' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#ff4d4f', lineHeight: '1' }}>
                      {users.filter(u => !u.is_active).length}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Деактивированные</div>
                  </div>
                </Col>
                <Col span={6} style={{ padding: '0 4px' }}>
                  <div style={{ textAlign: 'center', padding: '4px 0' }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#ff7875', lineHeight: '1' }}>
                      {users.filter(u => u.is_marked_for_deletion).length}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>На удаление</div>
                  </div>
                </Col>
              </Row>
            </div>
            
            <Table
              columns={userColumns}
              dataSource={getFilteredUsers()}
              rowKey="id"
              loading={loading}
              size="small"
              scroll={{ x: '100%' }}
              style={{ width: '100%' }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Всего: ${total} пользователей`,
                size: "small"
              }}
            />
          </Card>
        </Col>

        {/* Карточки управления ролями и департаментами */}
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SafetyOutlined />
                <span>Роли системы</span>
              </div>
            }
            extra={
              <Button
                type="primary"
                size="small"
                onClick={() => setRoleModalVisible(true)}
              >
                Добавить роль
              </Button>
            }
          >
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {roles.map((role) => (
                <div key={role.id} style={{ marginBottom: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  <div style={{ fontWeight: 600 }}>{role.description}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Права: {role.permissions.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TeamOutlined />
                <span>Департаменты</span>
              </div>
            }
            extra={
              <Button
                type="primary"
                size="small"
                onClick={() => setDepartmentModalVisible(true)}
              >
                Добавить департамент
              </Button>
            }
          >
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {departments.map((dept) => (
                <div key={dept.id} style={{ marginBottom: 8, padding: 8, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  <div style={{ fontWeight: 600 }}>{dept.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{dept.description}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно создания/редактирования пользователя */}
      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingUser ? handleUpdateUser : handleCreateUser}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Логин"
                rules={[{ required: true, message: 'Введите логин' }]}
              >
                <Input prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Неверный формат email' }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="last_name" label="Фамилия">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="first_name" label="Имя">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="patronymic" label="Отчество">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Роль"
                rules={[{ required: true, message: 'Выберите роль' }]}
              >
                <Select>
                  <Option value="user">Пользователь</Option>
                  <Option value="manager">Менеджер</Option>
                  <Option value="admin">Администратор</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Департамент">
                <Select allowClear>
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.name}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="Должность">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Телефон">
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Модальное окно создания роли */}
      <Modal
        title="Создать роль"
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          roleForm.resetFields();
        }}
        onOk={() => roleForm.submit()}
      >
        <Form form={roleForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item
            name="name"
            label="Название роли"
            rules={[{ required: true, message: 'Введите название роли' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="permissions" label="Права доступа">
            <Select mode="multiple" placeholder="Выберите права доступа">
              <Option value="read_own_data">Чтение собственных данных</Option>
              <Option value="create_requests">Создание запросов</Option>
              <Option value="read_department_data">Чтение данных департамента</Option>
              <Option value="approve_documents">Одобрение документов</Option>
              <Option value="manage_users">Управление пользователями</Option>
              <Option value="all">Все права</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно создания департамента */}
      <Modal
        title="Создать департамент"
        open={departmentModalVisible}
        onCancel={() => {
          setDepartmentModalVisible(false);
          departmentForm.resetFields();
        }}
        onOk={() => departmentForm.submit()}
      >
        <Form form={departmentForm} layout="vertical" onFinish={handleCreateDepartment}>
          <Form.Item
            name="name"
            label="Название департамента"
            rules={[{ required: true, message: 'Введите название департамента' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно с паролем */}
      <Modal
        title="Сгенерированный пароль"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={[
          <Button key="copy" onClick={() => copyToClipboard(generatedPassword)}>
            <CopyOutlined /> Копировать
          </Button>,
          <Button key="close" type="primary" onClick={() => setPasswordModalVisible(false)}>
            Закрыть
          </Button>,
        ]}
      >
        <Alert
          message="Важно!"
          description="Сохраните этот пароль в надежном месте. Он больше не будет показан."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ 
          padding: 16, 
          background: '#f5f5f5', 
          border: '1px solid #d9d9d9', 
          borderRadius: 6,
          textAlign: 'center',
          fontSize: 16,
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          {generatedPassword}
        </div>
      </Modal>

      {/* Drawer с деталями пользователя */}
      <Drawer
        title="Детали пользователя"
        placement="right"
        onClose={() => setUserDetailsVisible(false)}
        open={userDetailsVisible}
        width={400}
      >
        {selectedUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <UserAvatar user={selectedUser} size="large" />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {selectedUser.last_name} {selectedUser.first_name} {selectedUser.patronymic}
              </Title>
              <Text type="secondary">@{selectedUser.username}</Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Text strong>Роль:</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color={getRoleColor(selectedUser.role)}>{getRoleName(selectedUser.role)}</Tag>
              </div>
            </div>

            {selectedUser.email && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Email:</Text>
                <div style={{ marginTop: 4 }}>
                  <MailOutlined style={{ marginRight: 8 }} />
                  {selectedUser.email}
                </div>
              </div>
            )}

            {selectedUser.phone && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Телефон:</Text>
                <div style={{ marginTop: 4 }}>
                  <PhoneOutlined style={{ marginRight: 8 }} />
                  {selectedUser.phone}
                </div>
              </div>
            )}

            {selectedUser.department && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Департамент:</Text>
                <div style={{ marginTop: 4 }}>{selectedUser.department}</div>
              </div>
            )}

            {selectedUser.position && (
              <div style={{ marginBottom: 16 }}>
                <Text strong>Должность:</Text>
                <div style={{ marginTop: 4 }}>{selectedUser.position}</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <Text strong>Статус:</Text>
              <div style={{ marginTop: 4 }}>
                <Badge 
                  status={selectedUser.force_password_change ? "warning" : "success"} 
                  text={selectedUser.force_password_change ? "Требуется смена пароля" : "Активен"}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Дата создания:</Text>
              <div style={{ marginTop: 4 }}>
                {new Date(selectedUser.created_at).toLocaleString('ru-RU')}
              </div>
            </div>

            <Divider />

            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                block 
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingUser(selectedUser);
                  form.setFieldsValue(selectedUser);
                  setModalVisible(true);
                  setUserDetailsVisible(false);
                }}
              >
                Редактировать
              </Button>
              <Button 
                block 
                icon={<KeyOutlined />}
                onClick={() => {
                  handleResetPassword(selectedUser.id);
                  setUserDetailsVisible(false);
                }}
              >
                Сбросить пароль
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserManagement;

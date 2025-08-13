import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Popconfirm,
  Divider
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UserAddOutlined,
  TeamOutlined,
  SettingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  department: string;
  is_active: boolean;
  is_marked_for_deletion: boolean;
  created_at: string;
  last_login?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Department {
  id: string;
  name: string;
  description: string;
  manager?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Загрузка данных
  useEffect(() => {
    loadUsers();
    loadRoles();
    loadDepartments();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      message.error('Ошибка при загрузке пользователей');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки департаментов:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editForm.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department
    });
    setEditModalVisible(true);
  };

  const handleSaveUser = async (values: any) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('Пользователь обновлен');
        setEditModalVisible(false);
        editForm.resetFields();
        loadUsers();
      } else {
        message.error('Ошибка при обновлении пользователя');
      }
    } catch (error) {
      message.error('Ошибка при обновлении пользователя');
    }
  };

  const handleResetPassword = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        message.success(`Новый пароль: ${data.generated_password}`);
      } else {
        message.error('Ошибка при сбросе пароля');
      }
    } catch (error) {
      message.error('Ошибка при сбросе пароля');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        message.success('Пользователь деактивирован');
        loadUsers();
      } else {
        message.error('Ошибка при деактивации пользователя');
      }
    } catch (error) {
      message.error('Ошибка при деактивации пользователя');
    }
  };

  const handleActivateUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        message.success('Пользователь активирован');
        loadUsers();
      } else {
        message.error('Ошибка при активации пользователя');
      }
    } catch (error) {
      message.error('Ошибка при активации пользователя');
    }
  };

  const handleMarkForDeletion = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/mark-for-deletion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        message.success('Пользователь помечен на удаление');
        loadUsers();
      } else {
        message.error('Ошибка при пометке на удаление');
      }
    } catch (error) {
      message.error('Ошибка при пометке на удаление');
    }
  };

  const handleUnmarkForDeletion = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/unmark-for-deletion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        message.success('Пользователь убран из списка на удаление');
        loadUsers();
      } else {
        message.error('Ошибка при снятии пометки на удаление');
      }
    } catch (error) {
      message.error('Ошибка при снятии пометки на удаление');
    }
  };

  const getFilteredUsers = () => {
    if (statusFilter === 'all') return users;
    if (statusFilter === 'active') return users.filter(user => user.is_active);
    if (statusFilter === 'inactive') return users.filter(user => !user.is_active);
    if (statusFilter === 'marked') return users.filter(user => user.is_marked_for_deletion);
    return users;
  };

  // Статистика пользователей
  const userStats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    marked: users.filter(u => u.is_marked_for_deletion).length
  };

  // Колонки таблицы
  const userColumns = [
    {
      title: 'Пользователь',
      key: 'user',
      render: (record: User) => (
        <Space>
          <UserAvatar user={record} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.username}</div>
            <div style={{ fontSize: '11px', color: '#666' }}>{record.email}</div>
          </div>
        </Space>
      ),
      width: 200
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color="blue">{role}</Tag>
      ),
      width: 120
    },
    {
      title: 'Департамент',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => (
        <Tag color="green">{dept}</Tag>
      ),
      width: 150
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: User) => (
        <Space>
          {record.is_active ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Активен
            </Tag>
          ) : (
            <Tag color="red" icon={<CloseCircleOutlined />}>
              Неактивен
            </Tag>
          )}
          {record.is_marked_for_deletion && (
            <Tag color="orange" icon={<ExclamationCircleOutlined />}>
              На удаление
            </Tag>
          )}
        </Space>
      ),
      width: 150
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
      width: 120
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: User) => (
        <Space size="small">
          <Tooltip title="Редактировать">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditUser(record)}
            />
          </Tooltip>
          <Tooltip title="Сбросить пароль">
            <Button
              type="text"
              icon={<LockOutlined />}
              size="small"
              onClick={() => handleResetPassword(record.id)}
            />
          </Tooltip>
          {record.is_active ? (
            <Tooltip title="Деактивировать">
              <Button
                type="text"
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => handleDeactivateUser(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Активировать">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleActivateUser(record.id)}
              />
            </Tooltip>
          )}
          {!record.is_marked_for_deletion ? (
            <Tooltip title="Пометить на удаление">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleMarkForDeletion(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Убрать пометку на удаление">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleUnmarkForDeletion(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
      width: 200
    }
  ];

  return (
    <div style={{ 
      padding: 24, 
      width: '100%', 
      maxWidth: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Главная карточка с пользователями - НА ВСЮ ШИРИНУ ЭКРАНА */}
      <div style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          width: '100%'
        }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Управление пользователями
            </Title>
            <Text type="secondary">Администрирование пользователей системы</Text>
          </div>
          <Space>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
              size="small"
            >
              <Option value="all">Все</Option>
              <Option value="active">Активные</Option>
              <Option value="inactive">Неактивные</Option>
              <Option value="marked">На удаление</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              size="small"
              onClick={loadUsers}
            >
              Обновить
            </Button>
          </Space>
        </div>

        {/* Статистика пользователей */}
        <div style={{ 
          marginBottom: 24, 
          padding: '16px', 
          background: '#fafafa', 
          borderRadius: 8,
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <Statistic title="Всего" value={userStats.total} />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <Statistic title="Активных" value={userStats.active} />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <Statistic title="Неактивных" value={userStats.inactive} />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <Statistic title="На удаление" value={userStats.marked} />
          </div>
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
      </div>

      {/* РОЛИ СИСТЕМЫ - НА ВСЮ ШИРИНУ ЭКРАНА */}
      <div style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          width: '100%'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <SettingOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Роли системы
            </Title>
            <Text type="secondary">Управление ролями и правами доступа</Text>
          </div>
          <Button type="primary" icon={<UserAddOutlined />} size="small">
            Добавить роль
          </Button>
        </div>

        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {roles.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              flexWrap: 'wrap'
            }}>
              {roles.map(role => (
                <Card 
                  key={role.id} 
                  size="small" 
                  style={{ 
                    flex: '1', 
                    minWidth: '250px',
                    maxWidth: '300px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {role.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    {role.description}
                  </div>
                  <div>
                    {role.permissions.slice(0, 3).map((perm, index) => (
                      <Tag key={index} style={{ marginBottom: '4px' }}>
                        {perm}
                      </Tag>
                    ))}
                    {role.permissions.length > 3 && (
                      <Tag>+{role.permissions.length - 3}</Tag>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Роли не найдены
            </div>
          )}
        </div>
      </div>

      {/* ДЕПАРТАМЕНТЫ - НА ВСЮ ШИРИНУ ЭКРАНА */}
      <div style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          width: '100%'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Департаменты
            </Title>
            <Text type="secondary">Управление структурой организации</Text>
          </div>
          <Button type="primary" icon={<UserAddOutlined />} size="small">
            Добавить департамент
          </Button>
        </div>

        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {departments.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              flexWrap: 'wrap'
            }}>
              {departments.map(dept => (
                <Card 
                  key={dept.id} 
                  size="small" 
                  style={{ 
                    flex: '1', 
                    minWidth: '250px',
                    maxWidth: '300px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    {dept.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    {dept.description}
                  </div>
                  {dept.manager && (
                    <div style={{ fontSize: '11px', color: '#999' }}>
                      Руководитель: {dept.manager}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Департаменты не найдены
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования пользователя */}
      <Modal
        title="Редактировать пользователя"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalVisible(false);
            editForm.resetFields();
          }}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => editForm.submit()}>
            Сохранить
          </Button>
        ]}
        width={500}
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveUser}>
          <Form.Item
            name="username"
            label="Имя пользователя"
            rules={[{ required: true, message: 'Введите имя пользователя' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select>
              {roles.map(role => (
                <Option key={role.id} value={role.id}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="department"
            label="Департамент"
            rules={[{ required: true, message: 'Выберите департамент' }]}
          >
            <Select>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Компонент аватара пользователя
const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Avatar 
      size="small" 
      style={{ backgroundColor: user.is_active ? '#52c41a' : '#d9d9d9' }}
    >
      {getInitials(user.username)}
    </Avatar>
  );
};

export default UserManagement;

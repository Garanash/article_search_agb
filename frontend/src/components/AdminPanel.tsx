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
  Typography, 
  Tag, 
  Row, 
  Col, 
  Statistic, 
  Progress,
  message,
  Tooltip,
  Popconfirm,
  Dropdown,
  Alert
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  BarChartOutlined,
  TeamOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  UserOutlined,
  RobotOutlined,
  PlusOutlined,
  MinusOutlined,
  LogoutOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getUsersWithBots, assignBotToUser, removeBotFromUser, createUser } from '../api/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  company?: string;
  position?: string;
  phone?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface AdminPanelProps {
  onBack?: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { setToken, setUser, setForcePasswordChange } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'bots'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersWithBots, setUsersWithBots] = useState<any[]>([]);
  const [botsLoading, setBotsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Моковые данные для демонстрации
  useEffect(() => {
    setUsers([
      {
        id: 1,
        username: 'admin',
        email: 'admin@company.com',
        role: 'admin',
        company: 'ООО "Технологии"',
        position: 'Системный администратор',
        phone: '+7 (999) 123-45-67',
        department: 'IT',
        is_active: true,
        created_at: '2024-01-15T10:00:00Z',
        last_login: '2024-12-19T14:30:00Z'
      },
      {
        id: 2,
        username: 'manager1',
        email: 'manager1@company.com',
        role: 'manager',
        company: 'ООО "Технологии"',
        position: 'Менеджер по закупкам',
        phone: '+7 (999) 234-56-78',
        department: 'Закупки',
        is_active: true,
        created_at: '2024-02-20T09:00:00Z',
        last_login: '2024-12-19T12:15:00Z'
      },
      {
        id: 3,
        username: 'user1',
        email: 'user1@company.com',
        role: 'user',
        company: 'ООО "Технологии"',
        position: 'Специалист',
        phone: '+7 (999) 345-67-89',
        department: 'Закупки',
        is_active: true,
        created_at: '2024-03-10T11:00:00Z',
        last_login: '2024-12-19T10:45:00Z'
      }
    ]);
  }, []);

  // Загрузка пользователей с ботами
  useEffect(() => {
    if (activeTab === 'bots') {
      loadUsersWithBots();
    }
  }, [activeTab]);

  const loadUsersWithBots = async () => {
    try {
      setBotsLoading(true);
      const data = await getUsersWithBots();
      setUsersWithBots(data);
    } catch (error) {
      console.error('Error loading users with bots:', error);
      message.error('Ошибка при загрузке пользователей с ботами');
    } finally {
      setBotsLoading(false);
    }
  };

  const handleAssignBot = async (userId: number, botData: any) => {
    try {
      await assignBotToUser({
        user_id: userId,
        bot_id: botData.bot_id,
        bot_name: botData.bot_name,
        bot_description: botData.bot_description,
        bot_avatar: botData.bot_avatar,
        bot_color: botData.bot_color
      });
      message.success(`Бот ${botData.bot_name} назначен пользователю`);
      loadUsersWithBots(); // Перезагружаем данные
    } catch (error) {
      console.error('Error assigning bot:', error);
      message.error('Ошибка при назначении бота');
    }
  };

  const handleRemoveBot = async (userId: number, botId: string) => {
    try {
      await removeBotFromUser(userId, botId);
      message.success('Бот удален у пользователя');
      loadUsersWithBots(); // Перезагружаем данные
    } catch (error) {
      console.error('Error removing bot:', error);
      message.error('Ошибка при удалении бота');
    }
  };

  // Список доступных ботов для назначения
  const availableBots = [
    {
      bot_id: 'ved-bot-1',
      bot_name: 'ВЭД Помощник',
      bot_description: 'Помощник по внешнеэкономической деятельности',
      bot_avatar: '🤖',
      bot_color: '#1890ff'
    },
    {
      bot_id: 'ved-bot-2',
      bot_name: 'Таможенный Эксперт',
      bot_description: 'Эксперт по таможенным вопросам',
      bot_avatar: '📋',
      bot_color: '#52c41a'
    },
    {
      bot_id: 'hr-bot-1',
      bot_name: 'HR Ассистент',
      bot_description: 'Помощник по кадровым вопросам',
      bot_avatar: '👥',
      bot_color: '#722ed1'
    },
    {
      bot_id: 'hr-bot-2',
      bot_name: 'Рекрутер',
      bot_description: 'Помощник по подбору персонала',
      bot_avatar: '🎯',
      bot_color: '#fa8c16'
    },
    {
      bot_id: 'tech-bot-1',
      bot_name: 'IT Поддержка',
      bot_description: 'Техническая поддержка',
      bot_avatar: '💻',
      bot_color: '#13c2c2'
    },
    {
      bot_id: 'finance-bot-1',
      bot_name: 'Финансовый Аналитик',
      bot_description: 'Помощник по финансовым вопросам',
      bot_avatar: '💰',
      bot_color: '#eb2f96'
    }
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'user': return 'green';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'manager': return 'Менеджер';
      case 'user': return 'Пользователь';
      default: return 'Пользователь';
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      position: user.position,
      phone: user.phone,
      company: user.company
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      // TODO: Добавить API для удаления пользователя
      message.success('Пользователь удален');
      // Перезагружаем список пользователей
    } catch (error) {
      message.error('Ошибка при удалении пользователя');
    }
  };

  const handleSubmitUser = async (values: any) => {
    try {
      if (editingUser) {
        // TODO: Добавить API для обновления пользователя
        message.success('Пользователь обновлен');
      } else {
        // Создаем нового пользователя
        const result = await createUser({
          username: values.username,
          email: values.email,
          role: values.role,
          department: values.department,
          position: values.position,
          phone: values.phone,
          company: values.company
        });
        
        message.success(
          <div>
            <div>Пользователь создан успешно!</div>
            <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
              Сгенерированный пароль: <span style={{ color: '#1890ff' }}>{result.generated_password}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Сохраните этот пароль! При первом входе пользователю потребуется его сменить.
            </div>
          </div>,
          10 // Показываем сообщение 10 секунд
        );
      }
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Ошибка при сохранении пользователя');
      }
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setForcePasswordChange(false);
    // Очищаем все данные из localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const userColumns = [
    {
      title: 'Пользователь',
      key: 'username',
      render: (user: User) => (
        <Space>
          <UserOutlined />
          <div>
            <div><strong>{user.username}</strong></div>
            <Text type="secondary">{user.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {getRoleLabel(role)}
        </Tag>
      ),
    },
    {
      title: 'Компания',
      dataIndex: 'company',
      key: 'company',
      render: (company: string) => company || 'Не указана',
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => position || 'Не указана',
    },
    {
      title: 'Статус',
      key: 'status',
      render: (user: User) => (
        <Tag color={user.is_active ? 'green' : 'red'}>
          {user.is_active ? 'Активен' : 'Неактивен'}
        </Tag>
      ),
    },
    {
      title: 'Последний вход',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (lastLogin: string) => 
        lastLogin ? new Date(lastLogin).toLocaleDateString('ru-RU') : 'Никогда',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (user: User) => (
        <Space>
          <Tooltip title="Редактировать">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditUser(user)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить пользователя?"
            description="Это действие нельзя отменить."
            onConfirm={() => handleDeleteUser(user.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Tooltip title="Удалить">
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const analyticsData = {
    totalUsers: 3,
    activeUsers: 3,
    totalArticles: 156,
    totalSuppliers: 1247,
    totalRequests: 23,
    userActivity: [
      { name: 'admin', articles: 45, suppliers: 320, requests: 8 },
      { name: 'manager1', articles: 67, suppliers: 456, requests: 12 },
      { name: 'user1', articles: 44, suppliers: 471, requests: 3 }
    ]
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Панель администратора</Title>
        <Space>
          {onBack && (
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Назад
            </Button>
          )}
          <Button 
            type="primary" 
            danger 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </Space>
      </div>

      {/* Вкладки */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            type={activeTab === 'users' ? 'primary' : 'default'}
            icon={<TeamOutlined />}
            onClick={() => setActiveTab('users')}
          >
            Управление пользователями
          </Button>
          <Button 
            type={activeTab === 'analytics' ? 'primary' : 'default'}
            icon={<BarChartOutlined />}
            onClick={() => setActiveTab('analytics')}
          >
            Аналитика
          </Button>
          <Button 
            type={activeTab === 'bots' ? 'primary' : 'default'}
            icon={<RobotOutlined />}
            onClick={() => setActiveTab('bots')}
          >
            Управление ботами
          </Button>
        </Space>
      </div>

      {activeTab === 'users' && (
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={handleAddUser}
            >
              Добавить пользователя
            </Button>
          </div>

          <Table
            dataSource={users}
            columns={userColumns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} из ${total} пользователей`,
              pageSizeOptions: ['10', '20', '50'],
              size: 'default',
              position: ['bottomCenter'],
              style: { marginTop: '16px' }
            }}
          />
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div>
          {/* Общая статистика */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Всего пользователей"
                  value={analyticsData.totalUsers}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Активных пользователей"
                  value={analyticsData.activeUsers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Всего артикулов"
                  value={analyticsData.totalArticles}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Всего поставщиков"
                  value={analyticsData.totalSuppliers}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Активность пользователей */}
          <Card title="Активность пользователей">
            <Table
              dataSource={analyticsData.userActivity}
              columns={[
                {
                  title: 'Пользователь',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Артикулы',
                  dataIndex: 'articles',
                  key: 'articles',
                  render: (value) => (
                    <div>
                      <Text>{value}</Text>
                      <Progress 
                        percent={Math.round((value / analyticsData.totalArticles) * 100)} 
                        size="small" 
                        showInfo={false}
                      />
                    </div>
                  ),
                },
                {
                  title: 'Поставщики',
                  dataIndex: 'suppliers',
                  key: 'suppliers',
                  render: (value) => (
                    <div>
                      <Text>{value}</Text>
                      <Progress 
                        percent={Math.round((value / analyticsData.totalSuppliers) * 100)} 
                        size="small" 
                        showInfo={false}
                      />
                    </div>
                  ),
                },
                {
                  title: 'Запросы',
                  dataIndex: 'requests',
                  key: 'requests',
                  render: (value) => (
                    <div>
                      <Text>{value}</Text>
                      <Progress 
                        percent={Math.round((value / analyticsData.totalRequests) * 100)} 
                        size="small" 
                        showInfo={false}
                      />
                    </div>
                  ),
                },
              ]}
              rowKey="name"
              pagination={false}
            />
          </Card>
        </div>
      )}

      {activeTab === 'bots' && (
        <Card title="Управление ботами пользователей" loading={botsLoading}>
          <Table
            dataSource={usersWithBots}
            columns={[
              {
                title: 'Пользователь',
                key: 'user',
                render: (_, record) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>{record.username}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {record.email} • {record.role}
                    </div>
                  </div>
                ),
              },
              {
                title: 'Назначенные боты',
                key: 'bots',
                render: (_, record) => (
                  <div>
                    {record.bots.length === 0 ? (
                      <Text type="secondary">Нет назначенных ботов</Text>
                    ) : (
                      <Space wrap>
                        {record.bots.map((bot: any) => (
                          <Tag
                            key={bot.bot_id}
                            color={bot.bot_color}
                            closable
                            onClose={() => handleRemoveBot(record.user_id, bot.bot_id)}
                            style={{ 
                              borderRadius: '16px', 
                              padding: '4px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <span style={{ fontSize: '16px' }}>{bot.bot_avatar}</span>
                            {bot.bot_name}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </div>
                ),
              },
              {
                title: 'Действия',
                key: 'actions',
                render: (_, record) => (
                  <Dropdown
                    menu={{
                      items: availableBots
                        .filter(bot => !record.bots.some((userBot: any) => userBot.bot_id === bot.bot_id))
                        .map(bot => ({
                          key: bot.bot_id,
                          label: (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '16px' }}>{bot.bot_avatar}</span>
                              <div>
                                <div style={{ fontWeight: 500 }}>{bot.bot_name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {bot.bot_description}
                                </div>
                              </div>
                            </div>
                          ),
                          onClick: () => handleAssignBot(record.user_id, bot)
                        }))
                    }}
                    trigger={['click']}
                    disabled={record.bots.length >= availableBots.length}
                  >
                    <Button 
                      type="dashed" 
                      icon={<PlusOutlined />}
                      disabled={record.bots.length >= availableBots.length}
                    >
                      Назначить бота
                    </Button>
                  </Dropdown>
                ),
              },
            ]}
            rowKey="user_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} из ${total} пользователей`
            }}
          />
        </Card>
      )}

      {/* Модальное окно для добавления/редактирования пользователя */}
      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={modalVisible}
        onOk={() => form.validateFields().then(handleSubmitUser)}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        width={600}
        okText={editingUser ? 'Сохранить' : 'Создать'}
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Имя пользователя"
                rules={[{ required: true, message: 'Введите имя пользователя' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
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
              <Form.Item
                name="phone"
                label="Телефон"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company"
                label="Компания"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Должность"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="department"
            label="Отдел"
          >
            <Input />
          </Form.Item>

          {!editingUser && (
            <Alert
              message="Автоматическая генерация пароля"
              description="При создании пользователя будет автоматически сгенерирован пароль. Пользователю потребуется сменить пароль при первом входе в систему."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPanel; 
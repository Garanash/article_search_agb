/* eslint-disable no-undef, no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Popconfirm,
  Avatar,
  Tooltip
} from 'antd';
import { 
  UserAddOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { User } from '../context/AuthContext';

const { Text } = Typography;
const { Option } = Select;

// Дополнительные интерфейсы
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Моковые данные для демонстрации
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        first_name: 'Администратор',
        last_name: 'Системы',
        patronymic: '',
        role: 'admin',
        department: 'IT',
        position: 'Системный администратор',
        phone: '+7 (999) 123-45-67',
        company: 'ООО "Компания"',
        avatar_url: '',
        force_password_change: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const mockRoles: Role[] = [
      {
        id: 1,
        name: 'admin',
        description: 'Администратор системы',
        permissions: ['all'],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    const mockDepartments: Department[] = [
      {
        id: 1,
        name: 'IT',
        description: 'Информационные технологии',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    setUsers(mockUsers);
    setRoles(mockRoles);
    setDepartments(mockDepartments);
  }, []);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Пользователь',
      key: 'user',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{record.last_name} {record.first_name}</div>
            <Text type="secondary">@{record.username}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200
    },
    {
      title: 'Роль',
      key: 'role',
      width: 150,
      render: (_: any, record: User) => {
        const role = roles.find(r => r.name === record.role);
        return (
          <Tag color={record.role === 'admin' ? 'red' : 'blue'}>
            {role?.description || record.role}
          </Tag>
        );
      }
    },
    {
      title: 'Отдел',
      key: 'department',
      width: 150,
      render: (_: any, record: User) => {
        const dept = departments.find(d => d.name === record.department);
        return dept?.description || record.department;
      }
    },
    {
      title: 'Должность',
      dataIndex: 'position',
      key: 'position',
      width: 200
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить пользователя?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Tooltip title="Удалить">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    message.success('Пользователь удален');
  };

  const handleSubmit = (values: any) => {
    if (editingUser) {
      setUsers(prev => 
        prev.map(user => 
          user.id === editingUser.id ? { ...user, ...values } : user
        )
      );
      message.success('Пользователь обновлен');
    } else {
      const newUser: User = {
        ...values,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      message.success('Пользователь создан');
    }
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Управление пользователями</span>
          </Space>
        }
        extra={
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
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} записей`,
            pageSizeOptions: ['10', '20', '50'],
            size: 'default',
            position: ['bottomCenter'],
            style: { marginTop: '16px' }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Имя пользователя"
                name="username"
                rules={[{ required: true, message: 'Введите имя пользователя' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
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
            <Col span={8}>
              <Form.Item
                label="Фамилия"
                name="last_name"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Имя"
                name="first_name"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Отчество"
                name="patronymic"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Роль"
                name="role"
                rules={[{ required: true, message: 'Выберите роль' }]}
              >
                <Select>
                  {roles.map(role => (
                    <Option key={role.name} value={role.name}>
                      {role.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Отдел"
                name="department"
                rules={[{ required: true, message: 'Выберите отдел' }]}
              >
                <Select>
                  {departments.map(dept => (
                    <Option key={dept.name} value={dept.name}>
                      {dept.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Должность"
                name="position"
                rules={[{ required: true, message: 'Введите должность' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Телефон"
                name="phone"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Компания"
            name="company"
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Обновить' : 'Создать'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                form.resetFields();
              }}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;

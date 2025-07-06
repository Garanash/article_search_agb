import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  Typography, 
  message, 
  Divider,
  Row,
  Col,
  Avatar
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  TeamOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useAuth, User } from '../context/AuthContext';
import { updateUserProfile } from '../api/userApi';

const { Title, Text } = Typography;
const { Option } = Select;

interface EditProfileProps {
  onCancel: () => void;
  onSave: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ onCancel, onSave }) => {
  const { user, updateUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Заполняем форму текущими данными пользователя
    form.setFieldsValue({
      username: user?.username || '',
      email: user?.email || '',
      role: user?.role || 'user',
      department: user?.department || '',
      position: user?.position || '',
      phone: user?.phone || '',
      company: user?.company || 'ООО "Алмазгеобур"',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      patronymic: user?.patronymic || '',
    });
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Подготавливаем данные для API
      const profileData: Partial<User> = {
        first_name: values.first_name,
        last_name: values.last_name,
        patronymic: values.patronymic,
        department: values.department,
        position: values.position,
        phone: values.phone,
        company: values.company
      };

      // Отправляем запрос на обновление профиля
      const updatedProfile = await updateUserProfile(profileData);
      
      // Обновляем данные в контексте
      if (updateUser && user) {
        const updatedUser = {
          ...user,
          ...updatedProfile
        };
        updateUser(updatedUser);
      }
      
      message.success('Профиль успешно обновлен');
      onSave();
    } catch (error) {
      message.error('Ошибка при обновлении профиля');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const departments = [
    'IT',
    'Продажи',
    'Маркетинг',
    'HR',
    'Финансы',
    'ВЭД',
    'Логистика',
    'Бухгалтерия',
    'Руководство'
  ];

  const positions = [
    'Сотрудник',
    'Старший сотрудник',
    'Ведущий специалист',
    'Менеджер',
    'Старший менеджер',
    'Руководитель отдела',
    'Директор',
    'Генеральный директор'
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: '16px' }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>Редактирование профиля</Title>
            <Text type="secondary">Измените свои личные данные</Text>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            role: 'user',
            department: '',
            position: ''
          }}
        >
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item
                name="last_name"
                label="Фамилия"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input placeholder="Введите фамилию" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="first_name"
                label="Имя"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input placeholder="Введите имя" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="patronymic"
                label="Отчество"
              >
                <Input placeholder="Введите отчество (необязательно)" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="Имя пользователя (логин)"
              >
                <Input prefix={<UserOutlined />} disabled />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="email@example.com"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Email нельзя изменить. Обратитесь к администратору.
              </Text>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="Роль в системе"
              >
                <Select placeholder="Выберите роль" disabled>
                  <Option value="user">Пользователь</Option>
                  <Option value="manager">Менеджер</Option>
                  <Option value="admin">Администратор</Option>
                </Select>
              </Form.Item>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Роль может изменить только администратор.
              </Text>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="department"
                label="Отдел"
                rules={[
                  { required: true, message: 'Выберите отдел' }
                ]}
              >
                <Select placeholder="Выберите отдел">
                  {departments.map(dept => (
                    <Option key={dept} value={dept}>{dept}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="position"
                label="Должность"
                rules={[
                  { required: true, message: 'Выберите должность' }
                ]}
              >
                <Select placeholder="Выберите должность">
                  {positions.map(pos => (
                    <Option key={pos} value={pos}>{pos}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="Телефон"
                rules={[
                  { pattern: /^[\+]?[0-9\s\-\(\)]+$/, message: 'Введите корректный номер телефона' }
                ]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="+7 (999) 123-45-67"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="company"
            label="Компания"
          >
            <Input 
              prefix={<TeamOutlined />} 
              placeholder='ООО "Алмазгеобур"'
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SaveOutlined />}
              >
                Сохранить изменения
              </Button>
              <Button 
                onClick={handleCancel}
                icon={<CloseOutlined />}
              >
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditProfile; 
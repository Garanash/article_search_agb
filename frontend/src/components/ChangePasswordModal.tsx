import React, { useState } from 'react';
import { Modal, Form, Input, Button, message, Typography } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { changePassword } from '../api/api';

const { Title, Text } = Typography;

interface ChangePasswordModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      message.success('Пароль успешно изменен');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail);
      } else {
        message.error('Ошибка при смене пароля');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <LockOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '8px' }} />
          <span>Смена пароля</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={400}
      centered
      closable={false}
      maskClosable={false}
    >
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Title level={4} style={{ margin: '16px 0 8px 0' }}>
          Измените пароль
        </Title>
        <Text type="secondary">
          Для безопасности введите новый пароль
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          name="currentPassword"
          label="Текущий пароль"
          rules={[
            { required: true, message: 'Введите текущий пароль' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Введите текущий пароль"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Новый пароль"
          rules={[
            { required: true, message: 'Введите новый пароль' },
            { min: 8, message: 'Пароль должен содержать минимум 8 символов' },
            { 
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              message: 'Пароль должен содержать буквы, цифры и специальные символы'
            }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Введите новый пароль"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Подтвердите пароль"
          rules={[
            { required: true, message: 'Подтвердите новый пароль' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Пароли не совпадают'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Повторите новый пароль"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ width: '100%' }}
          >
            Изменить пароль
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal; 
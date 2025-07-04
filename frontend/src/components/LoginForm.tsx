import React, { useState } from "react";
import { login } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, message } from "antd";

const { Title } = Typography;

const LoginForm: React.FC = () => {
  const { setToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.username, values.password);
      setToken(data.access_token);
      message.success("Успешный вход!");
    } catch {
      message.error("Неверный логин или пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Card style={{ width: 350 }}>
        <Title level={3} style={{ textAlign: "center" }}>Вход в систему</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="Логин" rules={[{ required: true, message: "Введите логин" }]}> 
            <Input autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Пароль" rules={[{ required: true, message: "Введите пароль" }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm; 
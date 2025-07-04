import React, { useState } from "react";
import { login } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, message } from "antd";

const { Title } = Typography;

// Адаптивные стили для формы входа
const loginStyles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
  },
  
  card: {
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    borderRadius: "8px",
  },
  
  title: {
    textAlign: "center" as const,
    marginBottom: "24px",
  },
  
  submitButton: {
    height: "40px",
    fontSize: "16px",
  },
};

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
    <div style={loginStyles.container}>
      <Card style={loginStyles.card} className="login-form-card">
        <Title level={3} style={loginStyles.title} className="login-form-title">Вход в систему</Title>
        <Form 
          layout="vertical" 
          onFinish={onFinish}
          size="large"
        >
          <Form.Item 
            name="username" 
            label="Логин" 
            rules={[{ required: true, message: "Введите логин" }]}
          > 
            <Input autoFocus />
          </Form.Item>
          <Form.Item 
            name="password" 
            label="Пароль" 
            rules={[{ required: true, message: "Введите пароль" }]}
          > 
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={loading}
              style={loginStyles.submitButton}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm; 
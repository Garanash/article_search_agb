import React, { useState } from "react";
import { login } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, message } from "antd";

const { Title, Text } = Typography;

// Адаптивные стили для формы входа
const loginStyles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(135deg, #23272f 0%, #181c22 100%)", // тёмный фон
  },
  
  card: {
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.7)",
    borderRadius: "12px",
    background: "#23272f",
    border: "1px solid #343a40",
    color: "#fff",
  },
  
  title: {
    textAlign: "center" as const,
    marginBottom: "16px",
    color: "#f4d03f",
    fontWeight: 700,
    letterSpacing: 1,
  },
  
  submitButton: {
    height: "40px",
    fontSize: "16px",
    background: "linear-gradient(90deg, #d4af37 0%, #f4d03f 100%)",
    border: "none",
    color: "#23272f",
    fontWeight: 600,
  },
  logo: {
    display: "block",
    margin: "0 auto 24px auto",
    width: "150px",
    filter: "drop-shadow(0 2px 8px #0008)",
  },
  label: {
    color: '#f4d03f',
    fontWeight: 500,
  },
  input: {
    background: '#181c22',
    color: '#fff',
    borderColor: '#444',
  },
};

const LoginForm: React.FC = () => {
  const { setToken, setForcePasswordChange } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.username, values.password);
      setToken(data.access_token);
      
      // Если требуется смена пароля, устанавливаем флаг
      if (data.force_password_change) {
        setForcePasswordChange(true);
        message.info('Требуется смена пароля при первом входе');
      }
      
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
        <Title level={3} style={loginStyles.title} className="login-form-title">
          Вход в систему
        </Title>
        <img 
          src="https://almazgeobur.kz/wp-content/uploads/2021/08/agb_logo_h-2.svg"
          alt="AGB Logo"
          style={loginStyles.logo}
        />
        {/* Убрана надпись ООО "Алмазгеобур" */}
        <Form 
          layout="vertical" 
          onFinish={onFinish}
          size="large"
          style={{ color: '#fff' }}
        >
          <Form.Item 
            name="username" 
            label={<span style={loginStyles.label}>Логин</span>} 
            rules={[{ required: true, message: "Введите логин" }]}
          > 
            <Input autoFocus style={loginStyles.input} />
          </Form.Item>
          <Form.Item 
            name="password" 
            label={<span style={loginStyles.label}>Пароль</span>} 
            rules={[{ required: true, message: "Введите пароль" }]}
          > 
            <Input.Password style={loginStyles.input} />
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
        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <Text type="secondary" style={{ fontSize: "12px", color: '#aaa' }}>
            Для входа используйте данные, предоставленные администратором
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginForm; 
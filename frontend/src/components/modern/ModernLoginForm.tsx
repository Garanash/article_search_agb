import React, { useState } from "react";
import { Button, Card, Input, Typography, Form, message, Spin, Divider } from "antd";
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined, LoginOutlined } from "@ant-design/icons";
import { login } from "../../api/api";
import { designSystem } from "../../styles/designSystem";

const { Title, Text, Paragraph } = Typography;

interface ModernLoginFormProps {
  onLogin: (token: string) => void;
}

const ModernLoginForm: React.FC<ModernLoginFormProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      console.log('Attempting login with:', values.username);
      const data = await login(values.username, values.password);
      console.log('Login response:', data);
      
      if (data && data.access_token) {
        onLogin(data.access_token);
        message.success('Добро пожаловать!');
      } else {
        console.error('Invalid response structure:', data);
        message.error("Ошибка ответа сервера");
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = "Неверный логин или пароль";
      
      // Обработка разных типов ошибок
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Фоновые декоративные элементы */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        animation: 'float 20s ease-in-out infinite',
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
        animation: 'float 25s ease-in-out infinite reverse',
      }} />

      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 24,
          border: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1,
        }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        {/* Логотип */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                animation: 'shimmer 3s infinite',
              }}
            />
            <Text
              style={{
                color: 'white',
                fontSize: '32px',
                fontWeight: 800,
                letterSpacing: '-1px',
              }}
            >
              F
            </Text>
          </div>
          
          <div>
            <Title level={2} style={{ 
              margin: 0,
              fontSize: '32px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-1px',
            }}>
              FELIX
            </Title>
            <Text style={{ 
              color: '#64748b',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              PLATFORM
            </Text>
          </div>
        </div>

        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Title level={3} style={{ 
            margin: 0,
            color: '#1e293b',
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: 8,
          }}>
            Добро пожаловать!
          </Title>
          <Paragraph style={{ 
            margin: 0,
            color: '#64748b',
            fontSize: '16px',
          }}>
            Войдите в свой аккаунт для продолжения
          </Paragraph>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
          style={{ marginBottom: 24 }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Пожалуйста, введите имя пользователя!' }
            ]}
            style={{ marginBottom: 24 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#6366f1' }} />}
              placeholder="Имя пользователя"
              style={{
                height: 52,
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Пожалуйста, введите пароль!' }
            ]}
            style={{ marginBottom: 32 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#6366f1' }} />}
              placeholder="Пароль"
              iconRender={(visible) => (
                visible ? <EyeOutlined style={{ color: '#6366f1' }} /> : <EyeInvisibleOutlined style={{ color: '#94a3b8' }} />
              )}
              style={{
                height: 52,
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: '16px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6366f1';
                e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={!loading && <LoginOutlined />}
              block
              style={{
                height: 52,
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontSize: '16px',
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.4)';
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                }
              }}
              onMouseUp={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                }
              }}
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: '24px 0', color: '#94a3b8' }}>
          <Text style={{ color: '#94a3b8', fontSize: '14px' }}>
            Тестовые данные
          </Text>
        </Divider>

        <div style={{ 
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        }}>
          <Text style={{ 
            display: 'block',
            fontSize: '12px',
            color: '#64748b',
            marginBottom: '8px',
            fontWeight: 500,
          }}>
            Для входа используйте:
          </Text>
          <Text style={{ 
            display: 'block',
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#1e293b',
          }}>
            <strong>Админ:</strong> admin / admin123
          </Text>
          <Text style={{ 
            display: 'block',
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#1e293b',
          }}>
            <strong>Пользователь:</strong> user / user123
          </Text>
        </div>
      </Card>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default ModernLoginForm;

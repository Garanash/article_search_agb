import React, { useState } from "react";
import { Button, Card, Input, Typography, Form, message, Spin } from "antd";
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { login } from "../../api/api";
import { professionalDesign, designUtils } from "../../styles/professionalDesign";

const { Title, Text } = Typography;

interface ProfessionalLoginFormProps {
  onLogin: (token: string) => void;
}

const ProfessionalLoginForm: React.FC<ProfessionalLoginFormProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.username, values.password);
      
      if (data && data.access_token) {
        onLogin(data.access_token);
        message.success('Добро пожаловать в систему');
      } else {
        message.error("Ошибка ответа сервера");
      }
    } catch (err: any) {
      let errorMessage = "Неверный логин или пароль";
      
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
    <div style={containerStyle}>
      {/* Фоновый паттерн */}
      <div style={backgroundPatternStyle} />
      
      {/* Главный контейнер */}
      <div style={mainContainerStyle}>
        {/* Левая часть с брендингом */}
        <div style={brandingSectionStyle}>
          <div style={brandingContentStyle}>
            <div style={logoStyle}>
              <div style={logoIconStyle}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="url(#gradient)"/>
                  <path d="M16 20h16v8H16z" fill="white" opacity="0.9"/>
                  <path d="M20 16h8v16h-8z" fill="white" opacity="0.7"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={professionalDesign.colors.primary[500]} />
                      <stop offset="100%" stopColor={professionalDesign.colors.primary[700]} />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <Title level={2} style={logoTextStyle}>
                ArticleSearch
              </Title>
            </div>
            
            <div style={brandingDescriptionStyle}>
              <Title level={4} style={brandingTitleStyle}>
                Профессиональная система управления
              </Title>
              <Text style={brandingSubtitleStyle}>
                Войдите в систему для доступа к инструментам управления контентом, 
                аналитике и административным функциям.
              </Text>
              
              <div style={featuresStyle}>
                {features.map((feature, index) => (
                  <div key={index} style={featureItemStyle}>
                    <div style={featureIconStyle}>✓</div>
                    <Text style={featureTextStyle}>{feature}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Правая часть с формой */}
        <div style={formSectionStyle}>
          <Card style={cardStyle} bordered={false}>
            <div style={formHeaderStyle}>
              <Title level={3} style={formTitleStyle}>
                Вход в систему
              </Title>
              <Text style={formSubtitleStyle}>
                Введите ваши учетные данные для продолжения
              </Text>
            </div>

            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
              style={formStyle}
            >
              <Form.Item
                label={<span style={labelStyle}>Имя пользователя</span>}
                name="username"
                rules={[
                  { required: true, message: 'Пожалуйста, введите имя пользователя' },
                  { min: 2, message: 'Имя пользователя должно содержать минимум 2 символа' }
                ]}
              >
                <Input
                  prefix={<UserOutlined style={iconStyle} />}
                  placeholder="Введите имя пользователя"
                  style={inputStyle}
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label={<span style={labelStyle}>Пароль</span>}
                name="password"
                rules={[
                  { required: true, message: 'Пожалуйста, введите пароль' },
                  { min: 4, message: 'Пароль должен содержать минимум 4 символа' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={iconStyle} />}
                  placeholder="Введите пароль"
                  iconRender={(visible) => 
                    visible ? <EyeOutlined style={iconStyle} /> : <EyeInvisibleOutlined style={iconStyle} />
                  }
                  style={inputStyle}
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={submitButtonStyle}
                  block
                >
                  {loading ? (
                    <>
                      <Spin size="small" style={{ marginRight: 8 }} />
                      Выполняется вход...
                    </>
                  ) : (
                    'Войти в систему'
                  )}
                </Button>
              </Form.Item>
            </Form>

            <div style={footerStyle}>
              <Text style={footerTextStyle}>
                Защищенное соединение • Все данные шифруются
              </Text>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Стили компонента
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${professionalDesign.colors.neutral[50]} 0%, ${professionalDesign.colors.neutral[100]} 100%)`,
  padding: professionalDesign.spacing[4],
  position: 'relative',
  overflow: 'hidden'
};

const backgroundPatternStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `
    radial-gradient(circle at 25% 25%, ${designUtils.alpha(professionalDesign.colors.primary[500], 0.1)} 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, ${designUtils.alpha(professionalDesign.colors.primary[600], 0.1)} 0%, transparent 50%)
  `,
  zIndex: 0
};

const mainContainerStyle: React.CSSProperties = {
  display: 'flex',
  maxWidth: '1200px',
  width: '100%',
  backgroundColor: professionalDesign.colors.neutral[0],
  borderRadius: professionalDesign.borderRadius['2xl'],
  boxShadow: professionalDesign.shadows['2xl'],
  overflow: 'hidden',
  position: 'relative',
  zIndex: 1
};

const brandingSectionStyle: React.CSSProperties = {
  flex: 1,
  background: `linear-gradient(135deg, ${professionalDesign.colors.primary[600]} 0%, ${professionalDesign.colors.primary[800]} 100%)`,
  color: professionalDesign.colors.neutral[0],
  padding: professionalDesign.spacing[12],
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative'
};

const brandingContentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  marginBottom: professionalDesign.spacing[8]
};

const logoIconStyle: React.CSSProperties = {
  marginRight: professionalDesign.spacing[4]
};

const logoTextStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[0],
  margin: 0,
  fontWeight: professionalDesign.typography.fontWeight.bold
};

const brandingDescriptionStyle: React.CSSProperties = {
  maxWidth: '400px'
};

const brandingTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[0],
  marginBottom: professionalDesign.spacing[4],
  fontWeight: professionalDesign.typography.fontWeight.semibold
};

const brandingSubtitleStyle: React.CSSProperties = {
  color: designUtils.alpha(professionalDesign.colors.neutral[0], 0.9),
  fontSize: professionalDesign.typography.fontSize.lg,
  lineHeight: professionalDesign.typography.lineHeight.relaxed,
  marginBottom: professionalDesign.spacing[8]
};

const featuresStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: professionalDesign.spacing[3]
};

const featureItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center'
};

const featureIconStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: designUtils.alpha(professionalDesign.colors.neutral[0], 0.2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: professionalDesign.spacing[3],
  fontSize: '12px',
  fontWeight: professionalDesign.typography.fontWeight.bold
};

const featureTextStyle: React.CSSProperties = {
  color: designUtils.alpha(professionalDesign.colors.neutral[0], 0.9)
};

const formSectionStyle: React.CSSProperties = {
  flex: 1,
  padding: professionalDesign.spacing[12],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  padding: professionalDesign.spacing[8],
  borderRadius: professionalDesign.borderRadius.xl,
  boxShadow: professionalDesign.shadows.lg
};

const formHeaderStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: professionalDesign.spacing[8]
};

const formTitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[900],
  marginBottom: professionalDesign.spacing[2],
  fontWeight: professionalDesign.typography.fontWeight.bold
};

const formSubtitleStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[600],
  fontSize: professionalDesign.typography.fontSize.base
};

const formStyle: React.CSSProperties = {
  marginTop: professionalDesign.spacing[6]
};

const labelStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[700],
  fontWeight: professionalDesign.typography.fontWeight.medium,
  fontSize: professionalDesign.typography.fontSize.sm
};

const inputStyle: React.CSSProperties = {
  height: '48px',
  borderRadius: professionalDesign.borderRadius.lg,
  border: `1px solid ${professionalDesign.colors.neutral[300]}`,
  fontSize: professionalDesign.typography.fontSize.base
};

const iconStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[400]
};

const submitButtonStyle: React.CSSProperties = {
  height: '48px',
  borderRadius: professionalDesign.borderRadius.lg,
  background: `linear-gradient(135deg, ${professionalDesign.colors.primary[500]} 0%, ${professionalDesign.colors.primary[600]} 100%)`,
  border: 'none',
  fontSize: professionalDesign.typography.fontSize.base,
  fontWeight: professionalDesign.typography.fontWeight.medium,
  marginTop: professionalDesign.spacing[6]
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: professionalDesign.spacing[6],
  paddingTop: professionalDesign.spacing[6],
  borderTop: `1px solid ${professionalDesign.colors.neutral[200]}`
};

const footerTextStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[500],
  fontSize: professionalDesign.typography.fontSize.sm
};

// Данные для отображения
const features = [
  'Безопасный доступ к системе',
  'Управление контентом',
  'Аналитика и отчеты',
  'Административная панель'
];

export default ProfessionalLoginForm;

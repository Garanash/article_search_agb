import React, { useState } from 'react';
import { 
  Layout, 
  Avatar, 
  Dropdown, 
  Button, 
  Badge, 
  Space, 
  Typography, 
  Divider,
  Menu,
  Input
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined,
  MenuOutlined,
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { User } from '../../context/AuthContext';
import { professionalDesign, designUtils } from '../../styles/professionalDesign';

const { Header } = Layout;
const { Text } = Typography;

interface ProfessionalHeaderProps {
  user: User | null;
  isAdmin: boolean;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProfessionalHeader: React.FC<ProfessionalHeaderProps> = ({
  user,
  isAdmin,
  onLogout,
  activeTab,
  onTabChange
}) => {
  const [searchVisible, setSearchVisible] = useState(false);

  // Меню пользователя
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль пользователя',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Настройки',
    },
    { 
      type: 'divider' as const,
      key: 'divider2'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: onLogout,
    },
  ];

  // Меню уведомлений
  const notificationMenuItems = [
    {
      key: 'notification1',
      label: (
        <div style={notificationItemStyle}>
          <div style={notificationContentStyle}>
            <Text strong>Новое обращение пользователя</Text>
            <Text type="secondary" style={notificationTimeStyle}>5 минут назад</Text>
          </div>
        </div>
      ),
    },
    {
      key: 'notification2',
      label: (
        <div style={notificationItemStyle}>
          <div style={notificationContentStyle}>
            <Text strong>Обновление системы</Text>
            <Text type="secondary" style={notificationTimeStyle}>1 час назад</Text>
          </div>
        </div>
      ),
    },
    { 
      type: 'divider' as const,
      key: 'divider1'
    },
    {
      key: 'view-all',
      label: 'Посмотреть все уведомления',
    },
  ];

  // Навигационные вкладки
  const navigationTabs = [
    { key: 'dashboard', label: 'Главная', icon: <DashboardOutlined /> },
    { key: 'articles', label: 'Статьи', icon: <FileTextOutlined /> },
    { key: 'users', label: 'Пользователи', icon: <TeamOutlined />, adminOnly: true },
    { key: 'analytics', label: 'Аналитика', icon: <BarChartOutlined />, adminOnly: true },
    { key: 'support', label: 'Поддержка', icon: <MessageOutlined /> },
  ];

  const filteredTabs = navigationTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <Header style={headerStyle}>
      <div style={headerContainerStyle}>
        {/* Логотип и название */}
        <div style={logoSectionStyle}>
          <div style={logoStyle}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#headerGradient)"/>
              <path d="M10 13h12v6H10z" fill="white" opacity="0.9"/>
              <path d="M13 10h6v12h-6z" fill="white" opacity="0.7"/>
              <defs>
                <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={professionalDesign.colors.primary[500]} />
                  <stop offset="100%" stopColor={professionalDesign.colors.primary[700]} />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div style={brandingStyle}>
            <Text style={brandTitleStyle}>ArticleSearch</Text>
            <Text style={brandSubtitleStyle}>Управление системой</Text>
          </div>
        </div>

        {/* Навигация */}
        <div style={navigationStyle}>
          {filteredTabs.map(tab => (
            <Button
              key={tab.key}
              type={activeTab === tab.key ? 'primary' : 'text'}
              icon={tab.icon}
              onClick={() => onTabChange(tab.key)}
              style={{
                ...navigationButtonStyle,
                ...(activeTab === tab.key ? activeNavigationButtonStyle : {})
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Правая секция */}
        <div style={rightSectionStyle}>
          <Space size="middle">
            {/* Поиск */}
            <div style={searchContainerStyle}>
              {searchVisible ? (
                <Input
                  placeholder="Поиск по системе..."
                  prefix={<SearchOutlined style={searchIconStyle} />}
                  style={searchInputStyle}
                  autoFocus
                  onBlur={() => setSearchVisible(false)}
                />
              ) : (
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  onClick={() => setSearchVisible(true)}
                  style={iconButtonStyle}
                  title="Поиск"
                />
              )}
            </div>

            {/* Уведомления */}
            <Dropdown
              menu={{ items: notificationMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Badge count={2} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  style={iconButtonStyle}
                  title="Уведомления"
                />
              </Badge>
            </Dropdown>

            <Divider type="vertical" style={dividerStyle} />

            {/* Профиль пользователя */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div style={userProfileStyle}>
                <Avatar
                  size={36}
                  src={user?.avatar_url}
                  icon={<UserOutlined />}
                  style={avatarStyle}
                />
                <div style={userInfoStyle}>
                  <Text style={userNameStyle}>{user?.username || 'Пользователь'}</Text>
                  <Text style={userRoleStyle}>
                    {user?.role === 'admin' ? 'Администратор' : 
                     user?.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </div>
      </div>
    </Header>
  );
};

// Стили компонента
const headerStyle: React.CSSProperties = {
  backgroundColor: professionalDesign.colors.neutral[0],
  borderBottom: `1px solid ${professionalDesign.colors.neutral[200]}`,
  padding: 0,
  height: '72px',
  lineHeight: 'normal',
  boxShadow: professionalDesign.shadows.sm
};

const headerContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '100%',
  padding: `0 ${professionalDesign.spacing[6]}`,
  maxWidth: '1400px',
  margin: '0 auto'
};

const logoSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: professionalDesign.spacing[3]
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center'
};

const brandingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.lg,
  fontWeight: professionalDesign.typography.fontWeight.bold,
  color: professionalDesign.colors.neutral[900],
  lineHeight: 1.2
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.xs,
  color: professionalDesign.colors.neutral[500],
  lineHeight: 1.2
};

const navigationStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: professionalDesign.spacing[1]
};

const navigationButtonStyle: React.CSSProperties = {
  height: '40px',
  borderRadius: professionalDesign.borderRadius.lg,
  border: 'none',
  fontWeight: professionalDesign.typography.fontWeight.medium,
  transition: professionalDesign.transitions.fast
};

const activeNavigationButtonStyle: React.CSSProperties = {
  backgroundColor: professionalDesign.colors.primary[500],
  color: professionalDesign.colors.neutral[0]
};

const rightSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center'
};

const searchContainerStyle: React.CSSProperties = {
  position: 'relative'
};

const searchInputStyle: React.CSSProperties = {
  width: '300px',
  height: '36px',
  borderRadius: professionalDesign.borderRadius.lg,
  border: `1px solid ${professionalDesign.colors.neutral[300]}`,
  backgroundColor: professionalDesign.colors.neutral[50]
};

const searchIconStyle: React.CSSProperties = {
  color: professionalDesign.colors.neutral[400]
};

const iconButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: professionalDesign.borderRadius.lg,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: professionalDesign.colors.neutral[600],
  transition: professionalDesign.transitions.fast
};

const dividerStyle: React.CSSProperties = {
  height: '24px',
  borderColor: professionalDesign.colors.neutral[300]
};

const userProfileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: professionalDesign.spacing[3],
  padding: professionalDesign.spacing[2],
  borderRadius: professionalDesign.borderRadius.lg,
  cursor: 'pointer',
  transition: professionalDesign.transitions.fast
};

const avatarStyle: React.CSSProperties = {
  backgroundColor: professionalDesign.colors.primary[500],
  border: `2px solid ${professionalDesign.colors.neutral[200]}`
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start'
};

const userNameStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.sm,
  fontWeight: professionalDesign.typography.fontWeight.medium,
  color: professionalDesign.colors.neutral[900],
  lineHeight: 1.2
};

const userRoleStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.xs,
  color: professionalDesign.colors.neutral[500],
  lineHeight: 1.2
};

const notificationItemStyle: React.CSSProperties = {
  padding: professionalDesign.spacing[2],
  width: '280px'
};

const notificationContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column'
};

const notificationTimeStyle: React.CSSProperties = {
  fontSize: professionalDesign.typography.fontSize.xs,
  marginTop: professionalDesign.spacing[1]
};

export default ProfessionalHeader;

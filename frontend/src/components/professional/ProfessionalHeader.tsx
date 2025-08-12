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
  Input,
  Tooltip
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
  MessageOutlined,
  HomeOutlined
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
      label: 'Мой профиль',
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
      label: 'Выйти из системы',
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
            <Text strong>Новое обращение в поддержку</Text>
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
            <Text strong>Система обновлена</Text>
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
      label: 'Все уведомления',
    },
  ];

  // Навигационные вкладки
  const navigationTabs = [
    { key: 'dashboard', label: 'Главная', icon: <HomeOutlined /> },
    { key: 'articles', label: 'Статьи', icon: <FileTextOutlined /> },
    { key: 'users', label: 'Пользователи', icon: <TeamOutlined />, adminOnly: true },
    { key: 'analytics', label: 'Аналитика', icon: <BarChartOutlined />, adminOnly: true },
    { key: 'support', label: 'Поддержка', icon: <MessageOutlined /> },
  ];

  const filteredTabs = navigationTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <Header style={headerStyle}>
      <div style={headerContainerStyle}>
        {/* Логотип и название FELIX */}
        <div style={logoSectionStyle}>
          <div style={logoStyle}>
            <div style={logoIconStyle}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#ffffff' }} />
            </div>
          </div>
          <div style={brandingStyle}>
            <Text style={brandTitleStyle}>FELIX</Text>
            <Text style={brandSubtitleStyle}>Платформа управления</Text>
          </div>
        </div>

        {/* Навигация */}
        <div style={navigationStyle}>
          {filteredTabs.map(tab => (
            <Tooltip key={tab.key} title={tab.label} placement="bottom">
              <Button
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
            </Tooltip>
          ))}
        </div>

        {/* Правая секция */}
        <div style={rightSectionStyle}>
          <Space size="small">
            {/* Поиск */}
            <div style={searchContainerStyle}>
              {searchVisible ? (
                <Input
                  placeholder="Поиск по системе..."
                  prefix={<SearchOutlined style={searchIconStyle} />}
                  style={searchInputStyle}
                  autoFocus
                  onBlur={() => setSearchVisible(false)}
                  onPressEnter={() => setSearchVisible(false)}
                />
              ) : (
                <Tooltip title="Поиск" placement="bottom">
                  <Button
                    type="text"
                    icon={<SearchOutlined />}
                    onClick={() => setSearchVisible(true)}
                    style={iconButtonStyle}
                  />
                </Tooltip>
              )}
            </div>

            {/* Уведомления */}
            <Tooltip title="Уведомления" placement="bottom">
              <Dropdown
                menu={{ items: notificationMenuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Badge count={2} size="small" style={badgeStyle}>
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    style={iconButtonStyle}
                  />
                </Badge>
              </Dropdown>
            </Tooltip>

            <Divider type="vertical" style={dividerStyle} />

            {/* Профиль пользователя */}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <div style={userProfileStyle}>
                <Avatar
                  size={40}
                  src={user?.avatar_url}
                  icon={<UserOutlined />}
                  style={avatarStyle}
                />
                <div style={userInfoStyle}>
                  <Text style={userNameStyle}>{user?.first_name || user?.username || 'Пользователь'}</Text>
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
  backgroundColor: '#1e293b', // Единый темно-синий цвет
  borderBottom: 'none',
  padding: 0,
  height: '64px',
  lineHeight: 'normal',
  boxShadow: 'none',
  position: 'sticky',
  top: 0,
  zIndex: 1000
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
  gap: professionalDesign.spacing[3],
  minWidth: '200px'
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: '#3b82f6', // Синий цвет для логотипа
  border: 'none'
};

const logoIconStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%'
};

const brandingStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
};

const brandTitleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#ffffff',
  lineHeight: 1.2,
  letterSpacing: '0.5px'
};

const brandSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  lineHeight: 1.2
};

const navigationStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: professionalDesign.spacing[1],
  flex: 1,
  justifyContent: 'center'
};

const navigationButtonStyle: React.CSSProperties = {
  height: '40px', // Единый размер для всех кнопок
  borderRadius: '8px',
  border: 'none',
  fontWeight: 500,
  fontSize: '14px',
  padding: '0 16px',
  transition: 'all 0.2s ease',
  color: '#e2e8f0',
  backgroundColor: 'transparent'
};

const activeNavigationButtonStyle: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
};

const rightSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  minWidth: '200px',
  justifyContent: 'flex-end'
};

const searchContainerStyle: React.CSSProperties = {
  position: 'relative'
};

const searchInputStyle: React.CSSProperties = {
  width: '280px',
  height: '40px', // Единый размер
  borderRadius: '8px',
  border: '1px solid #475569',
  backgroundColor: '#334155',
  color: '#ffffff',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
};

const searchIconStyle: React.CSSProperties = {
  color: '#94a3b8'
};

const iconButtonStyle: React.CSSProperties = {
  width: '40px', // Единый размер для всех кнопок
  height: '40px', // Единый размер для всех кнопок
  borderRadius: '8px',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#e2e8f0',
  transition: 'all 0.2s ease',
  backgroundColor: 'transparent'
};

const badgeStyle: React.CSSProperties = {
  cursor: 'pointer'
};

const dividerStyle: React.CSSProperties = {
  height: '24px',
  borderColor: '#475569',
  margin: '0 8px'
};

const userProfileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: professionalDesign.spacing[2],
  padding: '8px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  border: '1px solid #475569',
  backgroundColor: '#334155'
};

const avatarStyle: React.CSSProperties = {
  backgroundColor: '#3b82f6',
  border: '2px solid #475569',
  flexShrink: 0
};

const userInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  minWidth: '80px'
};

const userNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: '#ffffff',
  lineHeight: 1.2
};

const userRoleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#94a3b8',
  lineHeight: 1.2
};

const notificationItemStyle: React.CSSProperties = {
  padding: '12px 16px',
  width: '300px'
};

const notificationContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const notificationTimeStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b'
};

export default ProfessionalHeader;

import React, { useState } from 'react';
import { Layout, Button, Dropdown, Space, Avatar, Badge, Switch, Tooltip, Typography } from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  SunOutlined, 
  MoonOutlined,
  MenuOutlined,
  SearchOutlined,
  HomeOutlined,
  BarChartOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { designSystem } from '../../styles/designSystem';

const { Header } = Layout;
const { Text } = Typography;

interface ModernHeaderProps {
  onMenuClick?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ 
  onMenuClick, 
  activeTab, 
  onTabChange 
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notificationCount] = useState(3); // Заглушка для уведомлений

  const navigationItems = [
    {
      key: 'dashboard',
      label: 'Главная',
      icon: <HomeOutlined />,
    },
    {
      key: 'articles', 
      label: 'Артикулы',
      icon: <BarChartOutlined />,
    },
    {
      key: 'chat',
      label: 'Чат',
      icon: <MessageOutlined />,
    },
    ...(isAdmin ? [{
      key: 'admin',
      label: 'Админ панель',
      icon: <SettingOutlined />,
    }] : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          <span>Профиль</span>
        </Space>
      ),
    },
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          <span>Настройки</span>
        </Space>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          <span>Выйти</span>
        </Space>
      ),
      onClick: logout,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
    } else if (key === 'profile') {
      onTabChange?.('profile');
    } else if (key === 'settings') {
      onTabChange?.('settings');
    }
  };

  return (
    <Header
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: 0,
        height: 'auto',
        minHeight: 72,
        borderBottom: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
        boxShadow: isDark 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 72,
      }}>
        {/* Левая часть - Логотип и навигация */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Логотип */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
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
                  background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                  animation: 'shimmer 3s infinite',
                }}
              />
              <Text
                style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                }}
              >
                F
              </Text>
            </div>
            
            <div>
              <Text
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  background: isDark
                    ? 'linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)'
                    : 'linear-gradient(135deg, #1e293b 0%, #475569 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  letterSpacing: '-0.5px',
                }}
              >
                FELIX
              </Text>
              <div style={{ marginTop: '-4px' }}>
                <Text
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: isDark ? '#94a3b8' : '#64748b',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  PLATFORM
                </Text>
              </div>
            </div>
          </div>

          {/* Навигация - скрываем на мобильных */}
          <nav style={{ display: 'flex', gap: '8px' }}>
            {navigationItems.map((item) => (
              <Button
                key={item.key}
                type={activeTab === item.key ? 'primary' : 'text'}
                icon={item.icon}
                onClick={() => onTabChange?.(item.key)}
                style={{
                  height: 40,
                  borderRadius: 10,
                  fontWeight: 500,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(activeTab === item.key ? {
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  } : {
                    color: isDark ? '#cbd5e1' : '#64748b',
                  })
                }}
                className="modern-button"
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Правая часть - Действия пользователя */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Поиск */}
          <Tooltip title="Поиск">
            <Button
              type="text"
              icon={<SearchOutlined />}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                color: isDark ? '#cbd5e1' : '#64748b',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="modern-button"
            />
          </Tooltip>

          {/* Уведомления */}
          <Tooltip title="Уведомления">
            <Badge count={notificationCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  color: isDark ? '#cbd5e1' : '#64748b',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="modern-button"
              />
            </Badge>
          </Tooltip>

          {/* Переключатель темы */}
          <Tooltip title={isDark ? 'Светлая тема' : 'Темная тема'}>
            <Switch
              checked={isDark}
              onChange={toggleTheme}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              style={{
                background: isDark ? '#4f46e5' : '#e2e8f0',
              }}
            />
          </Tooltip>

          {/* Профиль пользователя */}
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              style={{
                height: 48,
                padding: '0 16px',
                borderRadius: 12,
                background: isDark 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.02)',
                border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              className="modern-button"
            >
              <Avatar
                size={32}
                src={user?.avatar_url}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                }}
              >
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              
              <div style={{ textAlign: 'left', minWidth: 0 }}>
                <Text
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: isDark ? '#f8fafc' : '#1e293b',
                    lineHeight: 1.2,
                  }}
                >
                  {user?.username || 'Пользователь'}
                </Text>
                <Text
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: isDark ? '#94a3b8' : '#64748b',
                    lineHeight: 1.2,
                  }}
                >
                  {isAdmin ? 'Администратор' : 'Пользователь'}
                </Text>
              </div>
            </Button>
          </Dropdown>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
        
        .modern-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15) !important;
        }
        
        .modern-button:active {
          transform: translateY(0);
        }
        
        @media (max-width: 768px) {
          nav {
            display: none !important;
          }
        }
      `}</style>
    </Header>
  );
};

export default ModernHeader;

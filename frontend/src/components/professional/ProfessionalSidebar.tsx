import React from 'react';
import { Layout, Menu, Button, Tooltip, Avatar } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  MessageOutlined,
  FolderOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  AuditOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

interface ProfessionalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isAdmin: boolean;
  user: any;
  onProfileClick: () => void;
}

const ProfessionalSidebar: React.FC<ProfessionalSidebarProps> = ({
  activeTab,
  onTabChange,
  collapsed,
  onCollapse,
  isAdmin,
  user,
  onProfileClick
}) => {
  const mainMenuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Главная', },
    { key: 'articles', icon: <FileTextOutlined />, label: 'Статьи', },
    { key: 'documents', icon: <FolderOutlined />, label: 'Документы', },
    { key: 'support', icon: <MessageOutlined />, label: 'Поддержка', },
    { key: 'directory', icon: <PhoneOutlined />, label: 'Справочник', },
  ];

  const adminMenuItems = [
    { key: 'admin-section', icon: <SecurityScanOutlined />, label: 'Администрирование', children: [
        { key: 'users', icon: <TeamOutlined />, label: 'Пользователи', },
        { key: 'analytics', icon: <BarChartOutlined />, label: 'Аналитика', },
        { key: 'campaigns', icon: <MailOutlined />, label: 'Email кампании', },
        { key: 'audit', icon: <AuditOutlined />, label: 'Аудит', },
        { key: 'system', icon: <SettingOutlined />, label: 'Система', },
      ],
    },
    { key: 'data-section', icon: <DatabaseOutlined />, label: 'Управление данными', children: [
        { key: 'backup', icon: <GlobalOutlined />, label: 'Резервные копии', },
        { key: 'import', icon: <GlobalOutlined />, label: 'Импорт/Экспорт', },
      ],
    },
  ];

  const menuItems = isAdmin ? [...mainMenuItems, ...adminMenuItems] : mainMenuItems;

  const handleMenuClick = ({ key }: { key: string }) => { onTabChange(key); };
  const handleCollapse = () => { onCollapse(!collapsed); };

  return (
    <Sider
      trigger={null} collapsible collapsed={collapsed} width={280}
      style={{ 
        background: '#001529', 
        borderRight: '1px solid #f0f0f0', 
        position: 'fixed', 
        height: '100vh', 
        left: 0, 
        top: 0, 
        zIndex: 999, 
        overflowY: 'auto', 
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Кнопка сворачивания/разворачивания */}
      <div style={{ position: 'absolute', right: -12, top: 20, zIndex: 1000 }}>
        <Tooltip title={collapsed ? 'Развернуть меню' : 'Свернуть меню'} placement="left">
          <Button 
            type="primary" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
            onClick={handleCollapse} 
            size="small" 
            style={{ 
              borderRadius: '50%', 
              width: 24, 
              height: 24, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' 
            }} 
          />
        </Tooltip>
      </div>

      {/* Логотип и название */}
      {!collapsed && (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          borderBottom: '1px solid #303030', 
          marginBottom: '16px',
          marginTop: '16px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffffff', marginBottom: '16px' }}>FELIX</div>
          
          {/* Логотип AGB */}
          <div style={{ marginBottom: '16px' }}>
            <img 
              src="https://almazgeobur.kz/wp-content/uploads/2021/08/agb_logo_h-2.svg" 
              alt="AGB Logo" 
              style={{ 
                width: '120px', 
                height: 'auto',
                filter: 'brightness(0) invert(1)' // Делаем логотип белым
              }} 
            />
          </div>
          
          <div style={{ fontSize: '12px', color: '#8c8c8c', lineHeight: 1.2 }}>Корпоративная система</div>
        </div>
      )}

      {/* Навигационное меню */}
      <div style={{ flex: 1 }}>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[activeTab]} 
          items={menuItems} 
          onClick={handleMenuClick} 
          style={{ background: 'transparent', border: 'none' }} 
          inlineCollapsed={collapsed} 
        />
      </div>

      {/* Кнопка входа в профиль пользователя */}
      <div style={{ 
        padding: '16px', 
        borderTop: '1px solid #303030',
        marginTop: 'auto'
      }}>
        <Button
          type="text"
          onClick={onProfileClick}
          style={{
            width: '100%',
            color: '#ffffff',
            textAlign: 'left',
            height: '48px',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <Avatar 
            size={32} 
            src={user?.avatar_url} 
            icon={<UserOutlined />}
            style={{ 
              backgroundColor: user?.avatar_url ? 'transparent' : '#1890ff',
              border: '2px solid #ffffff'
            }}
          />
          {!collapsed && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#ffffff' }}>
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user?.username || 'Пользователь'
                }
              </div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                {user?.position || 'Сотрудник'}
              </div>
            </div>
          )}
        </Button>
      </div>
    </Sider>
  );
};

export default ProfessionalSidebar;

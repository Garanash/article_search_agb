import React, { useState } from 'react';
import { Tabs, Button, Space, Divider } from 'antd';
import { UserOutlined, SettingOutlined, PhoneOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import AdminPanel from './AdminPanel';
import PhoneDirectory from './PhoneDirectory';
import DocumentManager from './DocumentManager';

const { TabPane } = Tabs;

interface ProfileManagerProps {
  onBack?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = () => {
  const { isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      {/* Заголовок с кнопкой выхода */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <h2 style={{ margin: 0, color: '#262626' }}>Профиль пользователя</h2>
        <Button 
          type="primary" 
          danger 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
          size="large"
        >
          Выйти из системы
        </Button>
      </div>

      <Tabs type="card" size="large">
        <TabPane tab={<span><UserOutlined />Личный кабинет</span>} key="profile">
          <UserProfile />
        </TabPane>
        <TabPane tab={<span><PhoneOutlined />Телефонный справочник</span>} key="phone">
          <PhoneDirectory />
        </TabPane>
        <TabPane tab={<span><FileTextOutlined />Документы</span>} key="documents">
          <DocumentManager />
        </TabPane>
        {/* Панель администратора убрана по требованию */}
      </Tabs>
    </div>
  );
};

export default ProfileManager; 
import React, { useState } from 'react';
import { Tabs } from 'antd';
import { UserOutlined, SettingOutlined, PhoneOutlined, FileTextOutlined } from '@ant-design/icons';
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
  const { isAdmin } = useAuth();
  return (
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
  );
};

export default ProfileManager; 
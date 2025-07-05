import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Typography } from 'antd';
import { UserOutlined, SettingOutlined, ArrowLeftOutlined, PhoneOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import UserProfile from './UserProfile';
import AdminPanel from './AdminPanel';
import PhoneDirectory from './PhoneDirectory';
import DocumentManager from './DocumentManager';

const { Title } = Typography;
const { TabPane } = Tabs;

interface ProfileManagerProps {
  onBack?: () => void;
}

const ProfileManager: React.FC<ProfileManagerProps> = ({ onBack }) => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Управление профилем
        </Title>
        {onBack && (
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Назад
          </Button>
        )}
      </div>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
          size="large"
        >
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Личный кабинет
              </span>
            } 
            key="profile"
          >
            <UserProfile />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <PhoneOutlined />
                Телефонный справочник
              </span>
            } 
            key="phone"
          >
            <PhoneDirectory />
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Документы
              </span>
            } 
            key="documents"
          >
            <DocumentManager />
          </TabPane>
          
          {isAdmin && (
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Панель администратора
                </span>
              } 
              key="admin"
            >
              <AdminPanel onBack={() => setActiveTab('profile')} />
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default ProfileManager; 
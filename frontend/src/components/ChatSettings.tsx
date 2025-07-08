import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

const ChatSettings: React.FC = () => {
  return (
    <Card style={{ marginBottom: 16, background: '#23272f', border: '1px solid #343a40', color: '#fff' }} bodyStyle={{ padding: 16 }}>
      <Title level={5} style={{ color: '#FCB813', marginBottom: 8 }}>Настройки</Title>
      <Text style={{ color: '#fff' }}>Здесь будут настройки и пресеты чата.</Text>
    </Card>
  );
};

export default ChatSettings; 
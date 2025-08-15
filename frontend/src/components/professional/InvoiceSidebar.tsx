import React from 'react';
import { List, Card, Typography, Button, Badge } from 'antd';
import { FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useArticleSearch } from '../../context/ArticleSearchContext';

const { Text } = Typography;

const InvoiceSidebar: React.FC = () => {
  const {
    invoices,
    loading,
    selectedInvoice,
    selectInvoice,
    createInvoice,
    fetchInvoices
  } = useArticleSearch();

  React.useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateNew = () => {
    createInvoice([]);
  };

  return (
    <Card 
      title="Инвойсы"
      bordered={false}
      style={{ height: '100%' }}
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="small"
          onClick={handleCreateNew}
          loading={loading}
        />
      }
    >
      <List
        loading={loading}
        dataSource={invoices}
        renderItem={(invoice) => (
          <List.Item 
            onClick={() => selectInvoice(invoice)}
            style={{
              cursor: 'pointer',
              backgroundColor: selectedInvoice?.id === invoice.id ? '#f0f5ff' : 'inherit',
              padding: '8px 12px',
              borderRadius: 4
            }}
          >
            <List.Item.Meta
              avatar={<FileTextOutlined style={{ fontSize: '18px' }} />}
              title={<Text strong>{invoice.number}</Text>}
              description={
                <>
                  <Text type="secondary">
                    {new Date(invoice.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                  <Badge 
                    count={invoice.article_count} 
                    style={{ 
                      backgroundColor: '#52c41a', 
                      marginLeft: 8 
                    }} 
                  />
                </>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default InvoiceSidebar;

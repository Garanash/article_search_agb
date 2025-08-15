import React from 'react';
import { Input, Button, Table, Card, Typography } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useArticleSearch } from '../../context/ArticleSearchContext';

const { Title } = Typography;

const ArticleSearch: React.FC = () => {
  const {
    articles,
    loading,
    searchArticles,
    addToInvoice,
    createInvoice,
    selectedInvoice
  } = useArticleSearch();

  const [searchText, setSearchText] = React.useState('');
  const [selectedArticles, setSelectedArticles] = React.useState<typeof articles>([]);

  const handleSearch = () => {
    searchArticles(searchText);
  };

  const handleAddToInvoice = (article: typeof articles[0]) => {
    addToInvoice(article);
    setSelectedArticles([...selectedArticles, article]);
  };

  const handleCreateInvoice = () => {
    createInvoice(selectedArticles);
    setSelectedArticles([]);
  };

  const columns = [
    {
      title: 'Артикул',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: typeof articles[0]) => (
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => handleAddToInvoice(record)}
        >
          Добавить
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3}>Поиск артикулов {selectedInvoice && `(Инвойс: ${selectedInvoice.number})`}</Title>
      
      <Card style={{ marginBottom: '24px' }}>
        <Input
          placeholder="Введите артикул"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 300 }}
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={handleSearch}
          loading={loading}
          style={{ marginLeft: 8 }}
        >
          Поиск
        </Button>
      </Card>

      <Card title="Результаты поиска" loading={loading}>
        <Table 
          columns={columns} 
          dataSource={articles} 
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Введите артикул для поиска' }}
        />
      </Card>

      {selectedArticles.length > 0 && (
        <Card 
          title={`Выбранные артикулы (${selectedArticles.length})`} 
          style={{ marginTop: '24px' }}
          extra={
            <Button 
              type="primary" 
              onClick={handleCreateInvoice}
              icon={<PlusOutlined />}
              loading={loading}
            >
              Создать инвойс
            </Button>
          }
        >
          <Table 
            columns={columns.filter(col => col.key !== 'actions')} 
            dataSource={selectedArticles} 
            rowKey="id"
            pagination={false}
          />
        </Card>
      )}
    </div>
  );
};

export default ArticleSearch;

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Table, 
  Space, 
  message, 
  Typography, 
  Modal, 
  Form, 
  Select, 
  Tag, 
  Row, 
  Col,
  List,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  Empty,
  Spin
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  FileTextOutlined, 
  UserOutlined,
  GlobalOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Article {
  id: number;
  code: string;
  request_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Request {
  id: number;
  number: string;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  articles: Article[];
}

interface Supplier {
  id: number;
  article_id: number;
  name: string;
  website: string;
  email: string;
  country: string;
  email_validated: boolean;
  created_at: string;
  updated_at: string;
}

const ArticleSearch: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [suppliers, setSuppliers] = useState<{ [key: number]: Supplier[] }>({});
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState<{ [key: number]: boolean }>({});
  const [newArticleCode, setNewArticleCode] = useState('');
  const [selectedArticles, setSelectedArticles] = useState<number[]>([]);
  const [createRequestModalVisible, setCreateRequestModalVisible] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем артикулы
      const articlesResponse = await apiClient.get('/api/articles');
      setArticles(articlesResponse.data || []);

      // Загружаем запросы (инвойсы)
      const requestsResponse = await apiClient.get('/api/requests');
      setRequests(requestsResponse.data || []);

      // Загружаем поставщиков для всех артикулов
      await loadAllSuppliers();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      message.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const loadAllSuppliers = async () => {
    const allSuppliers: { [key: number]: Supplier[] } = {};
    
    for (const article of articles) {
      try {
        const response = await apiClient.get(`/api/articles/${article.id}/suppliers`);
        allSuppliers[article.id] = response.data || [];
      } catch (error) {
        allSuppliers[article.id] = [];
      }
    }
    
    setSuppliers(allSuppliers);
  };

  // Добавление нового артикула
  const handleAddArticle = async () => {
    if (!newArticleCode.trim()) {
      message.warning('Введите код артикула');
      return;
    }

    try {
      const response = await apiClient.post('/api/articles', {
        code: newArticleCode.trim()
      });
      
      message.success('Артикул успешно добавлен');
      setNewArticleCode('');
      await loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка добавления артикула:', error);
      message.error('Ошибка добавления артикула');
    }
  };

  // Поиск поставщиков для артикула
  const handleSearchSuppliers = async (articleId: number) => {
    setSearchLoading(prev => ({ ...prev, [articleId]: true }));
    
    try {
      // Здесь будет интеграция с Perplexity для поиска поставщиков
      // Пока создаем тестовые данные
      const mockSuppliers: Supplier[] = [
        {
          id: Date.now() + Math.random(),
          article_id: articleId,
          name: 'Поставщик 1',
          website: 'https://supplier1.com',
          email: 'info@supplier1.com',
          country: 'Россия',
          email_validated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: Date.now() + Math.random() + 1,
          article_id: articleId,
          name: 'Поставщик 2',
          website: 'https://supplier2.com',
          email: 'contact@supplier2.com',
          country: 'Китай',
          email_validated: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      // Сохраняем поставщиков в базу
      for (const supplier of mockSuppliers) {
        await apiClient.post(`/api/articles/${articleId}/suppliers`, supplier);
      }

      // Обновляем локальное состояние
      setSuppliers(prev => ({
        ...prev,
        [articleId]: [...(prev[articleId] || []), ...mockSuppliers]
      }));

      message.success('Поставщики найдены и сохранены');
    } catch (error) {
      console.error('Ошибка поиска поставщиков:', error);
      message.error('Ошибка поиска поставщиков');
    } finally {
      setSearchLoading(prev => ({ ...prev, [articleId]: false }));
    }
  };

  // Создание запроса (инвойса)
  const handleCreateRequest = async () => {
    if (selectedArticles.length === 0) {
      message.warning('Выберите артикулы для инвойса');
      return;
    }

    try {
      // Создаем запрос
      const requestResponse = await apiClient.post('/api/requests', {
        number: generateRequestNumber()
      });

      const requestId = requestResponse.data.id;

      // Добавляем артикулы в запрос
      for (const articleId of selectedArticles) {
        await apiClient.post(`/api/requests/${requestId}/articles/${articleId}`);
      }

      message.success('Инвойс успешно создан');
      setCreateRequestModalVisible(false);
      setSelectedArticles([]);
      await loadData(); // Перезагружаем данные
    } catch (error) {
      console.error('Ошибка создания инвойса:', error);
      message.error('Ошибка создания инвойса');
    }
  };

  // Генерация уникального номера инвойса
  const generateRequestNumber = (): string => {
    const now = dayjs();
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ВЭД-${now.format('YYYYMMDD')}-${randomPart}`;
  };

  // Фильтрация артикулов по активному запросу
  const filteredArticles = activeRequestId 
    ? articles.filter(article => article.request_id === activeRequestId)
    : articles.filter(article => !article.request_id);

  // Колонки таблицы артикулов
  const articleColumns = [
    {
      title: 'Код артикула',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Text strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          {code}
        </Text>
      )
    },
    {
      title: 'Статус',
      key: 'status',
      render: (article: Article) => (
        <Tag color={article.request_id ? 'green' : 'blue'}>
          {article.request_id ? 'В инвойсе' : 'Не распределен'}
        </Tag>
      )
    },
    {
      title: 'Дата добавления',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm')
    },
    {
      title: 'Поставщики',
      key: 'suppliers',
      render: (article: Article) => {
        const articleSuppliers = suppliers[article.id] || [];
        return (
          <Space direction="vertical" size="small">
            <div>
              <Text type="secondary">Найдено: {articleSuppliers.length}</Text>
            </div>
            {articleSuppliers.length > 0 && (
              <Button 
                size="small" 
                type="link" 
                onClick={() => setActiveRequestId(article.request_id)}
              >
                Просмотреть
              </Button>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (article: Article) => (
        <Space>
          <Button
            type="primary"
            size="small"
            loading={searchLoading[article.id]}
            onClick={() => handleSearchSuppliers(article.id)}
            icon={<SearchOutlined />}
          >
            Найти поставщиков
          </Button>
          {!article.request_id && (
            <Button
              size="small"
              onClick={() => setSelectedArticles(prev => 
                prev.includes(article.id) 
                  ? prev.filter(id => id !== article.id)
                  : [...prev, article.id]
              )}
            >
              {selectedArticles.includes(article.id) ? 'Отменить выбор' : 'Выбрать'}
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px', color: '#1890ff' }}>
        <FileTextOutlined style={{ marginRight: '12px' }} />
        Поиск артикулов
      </Title>

      {/* Добавление нового артикула */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Введите код артикула"
              value={newArticleCode}
              onChange={(e) => setNewArticleCode(e.target.value)}
              onPressEnter={handleAddArticle}
              size="large"
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAddArticle}
              loading={loading}
            >
              Добавить артикул
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Создание инвойса */}
      {selectedArticles.length > 0 && (
        <Card style={{ marginBottom: '24px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Text strong>
                Выбрано артикулов: {selectedArticles.length}
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<FileTextOutlined />}
                onClick={() => setCreateRequestModalVisible(true)}
              >
                Создать инвойс
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Основной контент */}
      <Row gutter={24}>
        {/* Таблица артикулов */}
        <Col xs={24} lg={16}>
          <Card title="Артикулы" style={{ marginBottom: '24px' }}>
            <Table
              dataSource={filteredArticles}
              columns={articleColumns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true
              }}
              rowSelection={!activeRequestId ? {
                selectedRowKeys: selectedArticles,
                onChange: (selectedRowKeys) => setSelectedArticles(selectedRowKeys as number[]),
                getCheckboxProps: (article) => ({
                  disabled: !!article.request_id
                })
              } : undefined}
            />
          </Card>
        </Col>

        {/* Боковое меню с инвойсами */}
        <Col xs={24} lg={8}>
          <Card title="Инвойсы" style={{ marginBottom: '24px' }}>
            {requests.length > 0 ? (
              <List
                dataSource={requests}
                renderItem={(request) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      background: activeRequestId === request.id ? '#e6f7ff' : 'transparent',
                      borderRadius: '8px',
                      padding: '12px',
                      margin: '4px 0'
                    }}
                    onClick={() => setActiveRequestId(activeRequestId === request.id ? null : request.id)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: '#1890ff' }}
                          icon={<FileTextOutlined />}
                        />
                      }
                      title={
                        <Text strong style={{ fontSize: '14px' }}>
                          {request.number}
                        </Text>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(request.created_at).format('DD.MM.YYYY')}
                          </Text>
                          <br />
                          <Tag color="green">
                            {request.articles?.length || 0} артикулов
                          </Tag>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty 
                description="Нет созданных инвойсов" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>

          {/* Статистика */}
          <Card title="Статистика">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Всего артикулов:</Text>
                <br />
                <Text strong style={{ fontSize: '18px' }}>
                  {articles.length}
                </Text>
              </div>
              <div>
                <Text type="secondary">Не распределено:</Text>
                <br />
                <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                  {articles.filter(a => !a.request_id).length}
                </Text>
              </div>
              <div>
                <Text type="secondary">В инвойсах:</Text>
                <br />
                <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                  {articles.filter(a => a.request_id).length}
                </Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Модальное окно создания инвойса */}
      <Modal
        title="Создание инвойса"
        open={createRequestModalVisible}
        onCancel={() => setCreateRequestModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setCreateRequestModalVisible(false)}>
            Отмена
          </Button>,
          <Button 
            key="create" 
            type="primary" 
            onClick={handleCreateRequest}
            loading={loading}
          >
            Создать инвойс
          </Button>
        ]}
      >
        <div>
          <Text>Выбранные артикулы:</Text>
          <List
            size="small"
            dataSource={articles.filter(a => selectedArticles.includes(a.id))}
            renderItem={(article) => (
              <List.Item>
                <Text code>{article.code}</Text>
              </List.Item>
            )}
          />
          <Divider />
          <Text>Номер инвойса будет сгенерирован автоматически</Text>
        </div>
      </Modal>
    </div>
  );
};

export default ArticleSearch;

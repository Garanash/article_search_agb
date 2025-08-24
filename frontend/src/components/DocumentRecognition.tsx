import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  DatePicker,
  message,
  Modal,
  Descriptions,
  Divider,
  Upload,
  Form,
  Select,
  Checkbox,
  Statistic,
  Calendar,
  Badge,
  Tooltip,
  Popconfirm
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  CalendarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CarOutlined,
  HomeOutlined,
  TeamOutlined,
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface ChildInfo {
  id: string;
  name?: string;
  age?: number;
  birthDate?: string;
}

interface OcrPhoto {
  id: string;
  telegramUserId: number;
  fileId: string;
  extractedText: string;
  receivedAt: string;
  imageData?: string;
  representativePhone?: string;
  email?: string;
  city?: string;
  birthDate?: string;
  carBrand?: string;
  carNumber?: string;
  isMarried: boolean;
  spouseFullName?: string;
  spouseBirthDate?: string;
  hasChildren: boolean;
  childrenCount?: number;
  children: ChildInfo[];
}

const DocumentRecognition: React.FC = () => {
  const [documents, setDocuments] = useState<OcrPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<OcrPhoto | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [calendarDate, setCalendarDate] = useState(dayjs());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortOrder, setSortOrder] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'ascend' | 'descend'>('ascend');

  // Моковые данные для демонстрации
  useEffect(() => {
    const mockDocuments: OcrPhoto[] = [
      {
        id: '1',
        telegramUserId: 123456789,
        fileId: 'file_001',
        extractedText: 'Паспорт РФ Иванов Иван Иванович 01.01.1990 Москва',
        receivedAt: '2024-01-15T10:30:00Z',
        representativePhone: '+7 (999) 123-45-67',
        email: 'ivanov@email.com',
        city: 'Москва',
        birthDate: '1990-01-01',
        carBrand: 'BMW',
        carNumber: 'А123БВ77',
        isMarried: true,
        spouseFullName: 'Иванова Мария Петровна',
        spouseBirthDate: '1992-05-15',
        hasChildren: true,
        childrenCount: 2,
        children: [
          { id: '1', name: 'Иванов Петр', age: 5, birthDate: '2019-03-20' },
          { id: '2', name: 'Иванова Анна', age: 3, birthDate: '2021-07-10' }
        ]
      },
      {
        id: '2',
        telegramUserId: 987654321,
        fileId: 'file_002',
        extractedText: 'Водительское удостоверение Петров Петр Петрович 15.03.1985 СПб',
        receivedAt: '2024-01-16T14:20:00Z',
        representativePhone: '+7 (999) 987-65-43',
        email: 'petrov@email.com',
        city: 'Санкт-Петербург',
        birthDate: '1985-03-15',
        carBrand: 'Mercedes',
        carNumber: 'В456ГД78',
        isMarried: false,
        spouseFullName: undefined,
        spouseBirthDate: undefined,
        hasChildren: false,
        childrenCount: 0,
        children: []
      }
    ];
    setDocuments(mockDocuments);
  }, []);

  // Фильтрация документов
  const filteredDocuments = documents.filter(doc => {
    if (!searchText) return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      doc.id.toLowerCase().includes(searchLower) ||
      doc.extractedText.toLowerCase().includes(searchLower) ||
      (doc.city && doc.city.toLowerCase().includes(searchLower)) ||
      (doc.representativePhone && doc.representativePhone.includes(searchText)) ||
      (doc.email && doc.email.toLowerCase().includes(searchLower)) ||
      (doc.carBrand && doc.carBrand.toLowerCase().includes(searchLower)) ||
      (doc.carNumber && doc.carNumber.toLowerCase().includes(searchLower)) ||
      (doc.spouseFullName && doc.spouseFullName.toLowerCase().includes(searchLower))
    );
  });

  // Сортировка
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let aValue: any = a[sortOrder as keyof OcrPhoto];
    let bValue: any = b[sortOrder as keyof OcrPhoto];
    
    if (sortOrder === 'children') {
      aValue = a.children.length;
      bValue = b.children.length;
    }
    
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'ascend' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'ascend' ? 1 : -1;
    return 0;
  });

  // Пагинация
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Статистика
  const stats = {
    total: documents.length,
    withPhones: documents.filter(d => d.representativePhone).length,
    withCities: documents.filter(d => d.city).length,
    withChildren: documents.filter(d => d.hasChildren).length,
    married: documents.filter(d => d.isMarried).length
  };

  // Дни рождения на сегодня
  const today = dayjs();
  const todayBirthdays = documents.filter(doc => {
    if (doc.birthDate && dayjs(doc.birthDate).format('MM-DD') === today.format('MM-DD')) return true;
    if (doc.spouseBirthDate && dayjs(doc.spouseBirthDate).format('MM-DD') === today.format('MM-DD')) return true;
    if (doc.children.some(child => child.birthDate && dayjs(child.birthDate).format('MM-DD') === today.format('MM-DD'))) return true;
    return false;
  });

  // Обработчики
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortOrder === column) {
      setSortDirection(sortDirection === 'ascend' ? 'descend' : 'ascend');
    } else {
      setSortOrder(column);
      setSortDirection('ascend');
    }
  };

  const handleViewDetails = (document: OcrPhoto) => {
    setSelectedDocument(document);
    setDetailModalVisible(true);
  };

  const handleEdit = (document: OcrPhoto) => {
    setSelectedDocument(document);
    setEditModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    message.success('Документ удален');
  };

  const handleUpload = (file: any) => {
    // Здесь будет логика загрузки и распознавания
    message.success('Файл загружен и обработан');
    return false;
  };

  // Календарь дней рождения
  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = value.format('MM-DD');
    const dayBirthdays = documents.filter(doc => {
      if (doc.birthDate && dayjs(doc.birthDate).format('MM-DD') === dateStr) return true;
      if (doc.spouseBirthDate && dayjs(doc.spouseBirthDate).format('MM-DD') === dateStr) return true;
      if (doc.children.some(child => child.birthDate && dayjs(child.birthDate).format('MM-DD') === dateStr)) return true;
      return false;
    });

    if (dayBirthdays.length > 0) {
      return (
        <div>
          {dayBirthdays.map(doc => (
            <Badge 
              key={doc.id} 
              color="green" 
              text={`${doc.extractedText.split(' ').slice(0, 2).join(' ')}`}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  // Колонки таблицы
  const columns: ColumnsType<OcrPhoto> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: true,
      sortOrder: sortOrder === 'id' ? sortDirection : undefined,
      onHeaderCell: () => ({ onClick: () => handleSort('id') })
    },
    {
      title: 'Извлеченный текст',
      dataIndex: 'extractedText',
      key: 'extractedText',
      width: 300,
      ellipsis: true,
      sorter: true,
      sortOrder: sortOrder === 'extractedText' ? sortDirection : undefined,
      onHeaderCell: () => ({ onClick: () => handleSort('extractedText') })
    },
    {
      title: 'Город',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      sorter: true,
      sortOrder: sortOrder === 'city' ? sortDirection : undefined,
      onHeaderCell: () => ({ onClick: () => handleSort('city') })
    },
    {
      title: 'Телефон',
      dataIndex: 'representativePhone',
      key: 'representativePhone',
      width: 150,
      render: (phone: string) => phone ? <Tag color="blue">{phone}</Tag> : '-'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (email: string) => email ? <Tag color="green">{email}</Tag> : '-'
    },
    {
      title: 'Дата рождения',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 120,
      sorter: true,
      sortOrder: sortOrder === 'birthDate' ? sortDirection : undefined,
      onHeaderCell: () => ({ onClick: () => handleSort('birthDate') }),
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'Автомобиль',
      key: 'car',
      width: 150,
      render: (_: any, record: OcrPhoto) => (
        <div>
          {record.carBrand && <div>{record.carBrand}</div>}
          {record.carNumber && <Tag color="orange">{record.carNumber}</Tag>}
        </div>
      )
    },
    {
      title: 'Семья',
      key: 'family',
      width: 120,
      render: (_: any, record: OcrPhoto) => (
        <div>
          {record.isMarried && <Tag color="purple">Женат</Tag>}
          {record.hasChildren && <Tag color="cyan">{record.childrenCount} детей</Tag>}
        </div>
      )
    },
    {
      title: 'Дата получения',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      width: 120,
      sorter: true,
      sortOrder: sortOrder === 'receivedAt' ? sortDirection : undefined,
      onHeaderCell: () => ({ onClick: () => handleSort('receivedAt') }),
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: any, record: OcrPhoto) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Удалить документ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Tooltip title="Удалить">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        Распознавание и учет документов
      </Title>

      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px', width: '100%' }}>
        <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Всего документов"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="С телефонами"
              value={stats.withPhones}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="С городами"
              value={stats.withCities}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="С детьми"
              value={stats.withChildren}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
          <Card style={{ width: '100%' }}>
            <Statistic
              title="Женатые"
              value={stats.married}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Дни рождения на сегодня */}
      {todayBirthdays.length > 0 && (
        <Card 
          title={
            <Space>
              <CalendarOutlined />
              <span>Дни рождения сегодня</span>
              <Tag color="green">{todayBirthdays.length}</Tag>
            </Space>
          }
          style={{ marginBottom: '24px', background: '#f6ffed', border: '1px solid #b7eb8f' }}
        >
          <Row gutter={[16, 16]}>
            {todayBirthdays.map(doc => (
              <Col xs={24} sm={12} md={8} key={doc.id}>
                <Card size="small">
                  <div>
                    <Text strong>{doc.extractedText.split(' ').slice(0, 3).join(' ')}</Text>
                    <br />
                    <Text type="secondary">
                      {doc.birthDate && dayjs(doc.birthDate).format('DD.MM.YYYY')}
                      {doc.spouseBirthDate && ` / ${dayjs(doc.spouseBirthDate).format('DD.MM.YYYY')}`}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Поиск и фильтры */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px', width: '100%' }}>
        <Row gutter={[16, 16]} align="middle" style={{ width: '100%' }}>
          <Col xs={24} sm={12} md={8} style={{ width: '100%' }}>
            <Input
              placeholder="Поиск по тексту, городу, телефону, email..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setCurrentPage(1)}
              style={{ width: '100%' }}
            >
              Применить фильтры
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('');
                setCurrentPage(1);
                setSortOrder('id');
                setSortDirection('ascend');
              }}
              style={{ width: '100%' }}
            >
              Сбросить
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setUploadModalVisible(true)}
              style={{ width: '100%' }}
            >
              Загрузить документ
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4} style={{ width: '100%' }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => message.info('Экспорт в разработке')}
              style={{ width: '100%' }}
            >
              Экспорт
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Таблица документов */}
      <Card
        title={
          <Space>
            <span>Список документов</span>
            <Tag color="blue">{filteredDocuments.length} записей</Tag>
          </Space>
        }
        style={{ borderRadius: '12px', width: '100%', marginBottom: '24px' }}
      >
        <Table
          columns={columns}
          dataSource={paginatedDocuments}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredDocuments.length,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} записей`,
            pageSizeOptions: ['10', '20', '50'],
            size: 'default',
            position: ['bottomCenter'],
            style: { marginTop: '16px' },
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            }
          }}
          scroll={{ x: 1400 }}
          size="small"
          style={{ width: '100%' }}
        />
      </Card>

      {/* Календарь дней рождения */}
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Календарь дней рождения</span>
          </Space>
        }
        style={{ borderRadius: '12px', width: '100%' }}
      >
        <Calendar
          value={calendarDate}
          onChange={setCalendarDate}
          dateCellRender={dateCellRender}
          style={{ width: '100%' }}
        />
      </Card>

      {/* Модальное окно с деталями документа */}
      <Modal
        title={`Документ #${selectedDocument?.id}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Закрыть
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            onClick={() => {
              setDetailModalVisible(false);
              setEditModalVisible(true);
            }}
          >
            Редактировать
          </Button>
        ]}
        width={800}
      >
        {selectedDocument && (
          <div>
            <Descriptions title="Основная информация" bordered column={2}>
              <Descriptions.Item label="ID">
                {selectedDocument.id}
              </Descriptions.Item>
              <Descriptions.Item label="Telegram User ID">
                {selectedDocument.telegramUserId}
              </Descriptions.Item>
              <Descriptions.Item label="Дата получения">
                {dayjs(selectedDocument.receivedAt).format('DD.MM.YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Извлеченный текст" span={2}>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedDocument.extractedText}
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Контактная информация" bordered column={2}>
              <Descriptions.Item label="Телефон">
                {selectedDocument.representativePhone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedDocument.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Город">
                {selectedDocument.city || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Дата рождения">
                {selectedDocument.birthDate ? dayjs(selectedDocument.birthDate).format('DD.MM.YYYY') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Автомобиль" bordered column={2}>
              <Descriptions.Item label="Марка">
                {selectedDocument.carBrand || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Номер">
                {selectedDocument.carNumber || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Семейное положение" bordered column={2}>
              <Descriptions.Item label="Женат/Замужем">
                <Tag color={selectedDocument.isMarried ? 'green' : 'red'}>
                  {selectedDocument.isMarried ? 'Да' : 'Нет'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Супруг(а)">
                {selectedDocument.spouseFullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Дата рождения супруга">
                {selectedDocument.spouseBirthDate ? dayjs(selectedDocument.spouseBirthDate).format('DD.MM.YYYY') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Есть дети">
                <Tag color={selectedDocument.hasChildren ? 'green' : 'red'}>
                  {selectedDocument.hasChildren ? 'Да' : 'Нет'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedDocument.hasChildren && selectedDocument.children.length > 0 && (
              <>
                <Divider />
                <Descriptions title="Дети" bordered column={2}>
                  {selectedDocument.children.map((child, index) => (
                    <React.Fragment key={child.id}>
                      <Descriptions.Item label={`Ребенок ${index + 1} - Имя`}>
                        {child.name || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={`Ребенок ${index + 1} - Возраст`}>
                        {child.age || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={`Ребенок ${index + 1} - Дата рождения`}>
                        {child.birthDate ? dayjs(child.birthDate).format('DD.MM.YYYY') : '-'}
                      </Descriptions.Item>
                    </React.Fragment>
                  ))}
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Модальное окно загрузки документа */}
      <Modal
        title="Загрузить документ для распознавания"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
            Отмена
          </Button>
        ]}
        width={600}
      >
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Upload
            beforeUpload={handleUpload}
            accept="image/*"
            showUploadList={false}
          >
            <div style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '40px' }}>
              <UploadOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
              <div style={{ fontSize: '16px', color: '#666' }}>
                Нажмите или перетащите изображение документа
              </div>
              <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                Поддерживаются форматы: JPG, PNG, PDF
              </div>
            </div>
          </Upload>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentRecognition;

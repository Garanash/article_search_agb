import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Select,
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
  Divider
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface OrderRequest {
  id: string;
  contactPerson: string;
  contactPhone: string;
  customerName: string;
  region: string;
  city: string;
  district: string;
  field: string;
  equipmentType: 'geological' | 'drilling';
  equipmentModel: string;
  problemType: string;
  problemDescription: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  estimatedCompletion?: string;
  notes?: string;
}

const OrdersArchive: React.FC = () => {
  const [orders, setOrders] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Моковые данные для демонстрации
  useEffect(() => {
    const mockOrders: OrderRequest[] = [
      {
        id: '1',
        contactPerson: 'Иван Иванов',
        contactPhone: '+7 (999) 123-45-67',
        customerName: 'ООО "Газпром"',
        region: 'Московская область',
        city: 'Москва',
        district: 'Центральный',
        field: 'Московское месторождение',
        equipmentType: 'geological',
        equipmentModel: 'LF90',
        problemType: 'Поломка двигателя',
        problemDescription: 'Двигатель не запускается, слышны посторонние звуки при попытке запуска',
        status: 'in_progress',
        priority: 'high',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-16T14:20:00Z',
        assignedTo: 'Сергей Петров',
        estimatedCompletion: '2024-01-20T18:00:00Z',
        notes: 'Заказаны запчасти, ожидаем поставку'
      },
      {
        id: '2',
        contactPerson: 'Петр Сидоров',
        contactPhone: '+7 (999) 987-65-43',
        customerName: 'ООО "Лукойл"',
        region: 'Тюменская область',
        city: 'Тюмень',
        district: 'Ленинский',
        field: 'Тюменское месторождение',
        equipmentType: 'drilling',
        equipmentModel: 'DM',
        problemType: 'Неисправность гидравлики',
        problemDescription: 'Утечка гидравлической жидкости, снижение давления в системе',
        status: 'pending',
        priority: 'urgent',
        createdAt: '2024-01-17T08:15:00Z',
        updatedAt: '2024-01-17T08:15:00Z',
        notes: 'Требует срочного выезда специалиста'
      },
      {
        id: '3',
        contactPerson: 'Анна Козлова',
        contactPhone: '+7 (999) 555-44-33',
        customerName: 'ООО "Роснефть"',
        region: 'Ханты-Мансийский АО',
        city: 'Ханты-Мансийск',
        district: 'Центральный',
        field: 'Ханты-Мансийское месторождение',
        equipmentType: 'geological',
        equipmentModel: 'CS14',
        problemType: 'Техническое обслуживание',
        problemDescription: 'Плановое техническое обслуживание оборудования согласно графику',
        status: 'completed',
        priority: 'medium',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-12T16:30:00Z',
        assignedTo: 'Михаил Соколов',
        estimatedCompletion: '2024-01-12T16:30:00Z',
        notes: 'Работы выполнены в полном объеме, оборудование работает нормально'
      }
    ];
    setOrders(mockOrders);
  }, []);

  // Фильтрация заявок
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchText === '' || 
      order.contactPerson.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      order.equipmentModel.toLowerCase().includes(searchText.toLowerCase()) ||
      order.problemType.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    const matchesDate = !dateRange || (
      new Date(order.createdAt) >= new Date(dateRange[0]) &&
      new Date(order.createdAt) <= new Date(dateRange[1])
    );
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  // Статистика
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in_progress': return 'blue';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  // Получение текста статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Отменено';
      default: return status;
    }
  };

  // Получение цвета приоритета
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'green';
      case 'medium': return 'blue';
      case 'high': return 'orange';
      case 'urgent': return 'red';
      default: return 'default';
    }
  };

  // Получение текста приоритета
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Низкий';
      case 'medium': return 'Средний';
      case 'high': return 'Высокий';
      case 'urgent': return 'Срочный';
      default: return priority;
    }
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDateRange(null);
  };

  // Просмотр деталей заявки
  const handleViewDetails = (order: OrderRequest) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  // Экспорт в Excel
  const handleExportToExcel = () => {
    if (filteredOrders.length === 0) {
      message.warning('Нет заявок для выгрузки');
      return;
    }

    try {
      const headers = [
        'ID',
        'Контактное лицо',
        'Телефон',
        'Заказчик',
        'Регион',
        'Город',
        'Тип оборудования',
        'Модель',
        'Проблема',
        'Статус',
        'Приоритет',
        'Дата создания'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredOrders.map(order => [
          order.id,
          `"${order.contactPerson}"`,
          `"${order.contactPhone}"`,
          `"${order.customerName}"`,
          `"${order.region}"`,
          `"${order.city}"`,
          `"${order.equipmentType === 'geological' ? 'Геологоразведочное' : 'Буровзрывное'}"`,
          `"${order.equipmentModel}"`,
          `"${order.problemType}"`,
          `"${getStatusText(order.status)}"`,
          `"${getPriorityText(order.priority)}"`,
          new Date(order.createdAt).toLocaleDateString('ru-RU')
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `заявки_на_услуги_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Файл успешно выгружен');
    } catch (error) {
      message.error('Ошибка при выгрузке файла');
    }
  };

  // Колонки таблицы
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Контактное лицо',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Заказчик',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Тип оборудования',
      key: 'equipmentType',
      width: 120,
      render: (_: any, record: OrderRequest) => (
        <Tag color={record.equipmentType === 'geological' ? 'green' : 'blue'}>
          {record.equipmentType === 'geological' ? 'Геологоразведочное' : 'Буровзрывное'}
        </Tag>
      )
    },
    {
      title: 'Модель',
      dataIndex: 'equipmentModel',
      key: 'equipmentModel',
      width: 100
    },
    {
      title: 'Проблема',
      dataIndex: 'problemType',
      key: 'problemType',
      width: 150,
      ellipsis: true
    },
    {
      title: 'Статус',
      key: 'status',
      width: 120,
      render: (_: any, record: OrderRequest) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      )
    },
    {
      title: 'Приоритет',
      key: 'priority',
      width: 100,
      render: (_: any, record: OrderRequest) => (
        <Tag color={getPriorityColor(record.priority)}>
          {getPriorityText(record.priority)}
        </Tag>
      )
    },
    {
      title: 'Дата создания',
      key: 'createdAt',
      width: 120,
      render: (_: any, record: OrderRequest) => (
        <Text>{new Date(record.createdAt).toLocaleDateString('ru-RU')}</Text>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record: OrderRequest) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
          >
            Просмотр
          </Button>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          Архив заявок на услуги
        </Title>
        <Text type="secondary">
          Управление и отслеживание заявок на техническое обслуживание оборудования
        </Text>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ 
        marginBottom: '24px', 
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap'
      }}>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>{stats.total}</Title>
              <Text>Всего заявок</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#faad14' }}>{stats.pending}</Title>
              <Text>Ожидают</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#1890ff' }}>{stats.inProgress}</Title>
              <Text>В работе</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#52c41a' }}>{stats.completed}</Title>
              <Text>Завершено</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>{stats.cancelled}</Title>
              <Text>Отменено</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters and search */}
      <div style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle" style={{ 
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap'
        }}>
          <Col xs={24} sm={12} md={6} style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <Input
              placeholder="Поиск по контакту, заказчику, модели..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <Select
              placeholder="Статус"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: '100%' }}
            >
              <Option value="all">Все статусы</Option>
              <Option value="pending">Ожидает</Option>
              <Option value="in_progress">В работе</Option>
              <Option value="completed">Завершено</Option>
              <Option value="cancelled">Отменено</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <Select
              placeholder="Приоритет"
              value={priorityFilter}
              onChange={(value) => setPriorityFilter(value)}
              style={{ width: '100%' }}
            >
              <Option value="all">Все приоритеты</Option>
              <Option value="low">Низкий</Option>
              <Option value="medium">Средний</Option>
              <Option value="high">Высокий</Option>
              <Option value="urgent">Срочный</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <RangePicker
              placeholder={['Дата от', 'Дата до']}
              onChange={(dates) => {
                if (dates) {
                  const [start, end] = dates;
                  setDateRange([
                    start?.toISOString() || '',
                    end?.toISOString() || ''
                  ]);
                } else {
                  setDateRange(null);
                }
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <Space style={{ width: '100%', justifyContent: 'center' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleResetFilters}
                style={{ width: '100%' }}
              >
                Сброс
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Actions */}
      <div style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={handleExportToExcel}
            disabled={filteredOrders.length === 0}
          >
            Экспорт в Excel
          </Button>
        </Space>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} из ${total} записей`,
          pageSizeOptions: ['10', '20', '50'],
          size: 'default',
          position: ['bottomCenter'],
          style: { marginTop: '16px' }
        }}
        scroll={{ x: 1200 }}
        title={() => `Найдено заявок: ${filteredOrders.length}`}
      />

      {/* Модальное окно с деталями заявки */}
      <Modal
        title={`Заявка #${selectedOrder?.id}`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Descriptions title="Основная информация" bordered column={2}>
              <Descriptions.Item label="Контактное лицо">
                {selectedOrder.contactPerson}
              </Descriptions.Item>
              <Descriptions.Item label="Телефон">
                {selectedOrder.contactPhone}
              </Descriptions.Item>
              <Descriptions.Item label="Заказчик">
                {selectedOrder.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={getStatusColor(selectedOrder.status)}>
                  {getStatusText(selectedOrder.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Приоритет">
                <Tag color={getPriorityColor(selectedOrder.priority)}>
                  {getPriorityText(selectedOrder.priority)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Дата создания">
                {new Date(selectedOrder.createdAt).toLocaleDateString('ru-RU')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Расположение объекта" bordered column={2}>
              <Descriptions.Item label="Регион">
                {selectedOrder.region}
              </Descriptions.Item>
              <Descriptions.Item label="Город">
                {selectedOrder.city}
              </Descriptions.Item>
              <Descriptions.Item label="Район">
                {selectedOrder.district}
              </Descriptions.Item>
              <Descriptions.Item label="Месторождение">
                {selectedOrder.field}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Оборудование и проблема" bordered column={2}>
              <Descriptions.Item label="Тип оборудования">
                <Tag color={selectedOrder.equipmentType === 'geological' ? 'green' : 'blue'}>
                  {selectedOrder.equipmentType === 'geological' ? 'Геологоразведочное' : 'Буровзрывное'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Модель">
                {selectedOrder.equipmentModel}
              </Descriptions.Item>
              <Descriptions.Item label="Тип проблемы">
                {selectedOrder.problemType}
              </Descriptions.Item>
              <Descriptions.Item label="Описание проблемы" span={2}>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedOrder.problemDescription}
                </div>
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.assignedTo && (
              <>
                <Divider />
                <Descriptions title="Исполнение" bordered column={2}>
                  <Descriptions.Item label="Назначен">
                    {selectedOrder.assignedTo}
                  </Descriptions.Item>
                  {selectedOrder.estimatedCompletion && (
                    <Descriptions.Item label="Ожидаемое завершение">
                      {new Date(selectedOrder.estimatedCompletion).toLocaleDateString('ru-RU')}
                    </Descriptions.Item>
                  )}
                  {selectedOrder.notes && (
                    <Descriptions.Item label="Примечания" span={2}>
                      <div style={{ 
                        padding: '8px', 
                        backgroundColor: '#f5f5f5', 
                        borderRadius: '4px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {selectedOrder.notes}
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default OrdersArchive;

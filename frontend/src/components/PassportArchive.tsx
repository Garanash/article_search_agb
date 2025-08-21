import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Modal,
  message,
  DatePicker,
  Select,
  Tooltip,
  Badge,
  Statistic,
  Divider
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilterOutlined,
  ReloadOutlined,
  PrinterOutlined,
  DeleteOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { usePassports, GeneratedPassport } from '../context/PassportContext';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PassportArchive: React.FC = () => {
  const { 
    passports, 
    updatePassportStatus, 
    deletePassport 
  } = usePassports();
  
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedPassport, setSelectedPassport] = useState<GeneratedPassport | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Фильтрация паспортов на основе поиска и фильтров
  const filteredPassports = passports.filter(passport => {
    const matchesSearch = searchText === '' || 
      passport.passport_number.toLowerCase().includes(searchText.toLowerCase()) ||
      passport.product_data.code_1c.toLowerCase().includes(searchText.toLowerCase()) ||
      passport.product_data.article.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || passport.status === statusFilter;
    
    const matchesDate = !dateRange || (
      new Date(passport.created_at) >= new Date(dateRange[0]) &&
      new Date(passport.created_at) <= new Date(dateRange[1])
    );
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Обновляем пагинацию при изменении фильтров
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total: filteredPassports.length,
      current: 1
    }));
  }, [filteredPassports]);

  // Обработка поиска
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Обработка фильтров
  const handleFilterChange = (type: string, value: any) => {
    if (type === 'status') {
      setStatusFilter(value);
    } else if (type === 'date') {
      setDateRange(value);
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDateRange(null);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // Предварительный просмотр паспорта
  const handlePreviewPassport = (passport: GeneratedPassport) => {
    setSelectedPassport(passport);
    setPreviewModalVisible(true);
  };

  // Выгрузка в Excel
  const handleExportToExcel = () => {
    if (filteredPassports.length === 0) {
      message.warning('Нет паспортов для выгрузки');
      return;
    }

    try {
      // Создаем CSV контент
      const headers = [
        'Номер паспорта',
        'Код 1С',
        'Наименование',
        'Артикул',
        'Матрица',
        'Глубина бурения',
        'Высота',
        'Резьба',
        'Дата создания',
        'Статус'
      ];

      const csvContent = [
        headers.join(','),
        ...filteredPassports.map(passport => [
          `"${passport.passport_number}"`,
          `"${passport.product_data.code_1c}"`,
          `"${passport.product_data.name}"`,
          `"${passport.product_data.article}"`,
          `"${passport.product_data.matrix}"`,
          `"${passport.product_data.drilling_depth || ''}"`,
          `"${passport.product_data.height || ''}"`,
          `"${passport.product_data.thread || ''}"`,
          `"${new Date(passport.created_at).toLocaleDateString('ru-RU')}"`,
          `"${passport.status === 'active' ? 'Активен' : 'Архив'}"`
        ].join(','))
      ].join('\n');

      // Создаем Blob и скачиваем файл
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `архив_паспортов_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Выгрузка в Excel успешно завершена');
    } catch (error) {
      console.error('Ошибка выгрузки в Excel:', error);
      message.error('Ошибка выгрузки в Excel');
    }
  };

  // Печать паспорта
  const handlePrintPassport = (passport: GeneratedPassport) => {
    message.success(`Печать паспорта ${passport.passport_number}`);
  };

  // Архивирование паспорта
  const handleArchivePassport = async (passport: GeneratedPassport) => {
    try {
      updatePassportStatus(passport.id, 'archived');
      message.success('Паспорт успешно архивирован');
    } catch (error) {
      console.error('Ошибка архивирования:', error);
      message.error('Ошибка архивирования паспорта');
    }
  };

  // Удаление паспорта
  const handleDeletePassport = async (passport: GeneratedPassport) => {
    try {
      deletePassport(passport.id);
      message.success('Паспорт успешно удален');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      message.error('Ошибка удаления паспорта');
    }
  };

  // Колонки таблицы
  const columns: ColumnsType<GeneratedPassport> = [
    {
      title: 'Номер паспорта',
      dataIndex: 'passport_number',
      key: 'passport_number',
      render: (text: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
          {text}
        </Tag>
      ),
      sorter: (a, b) => a.passport_number.localeCompare(b.passport_number)
    },
    {
      title: 'Код 1С',
      dataIndex: ['product_data', 'code_1c'],
      key: 'code_1c',
      width: 120
    },
    {
      title: 'Наименование',
      dataIndex: ['product_data', 'name'],
      key: 'name',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Артикул',
      dataIndex: ['product_data', 'article'],
      key: 'article',
      width: 100
    },
    {
      title: 'Матрица',
      dataIndex: ['product_data', 'matrix'],
      key: 'matrix',
      width: 80
    },
    {
      title: 'Глубина',
      dataIndex: ['product_data', 'drilling_depth'],
      key: 'drilling_depth',
      width: 100,
      render: (text: string) => text || '-'
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={status === 'active' ? 'Активен' : 'Архив'}
        />
      ),
      filters: [
        { text: 'Активен', value: 'active' },
        { text: 'Архив', value: 'archived' }
      ]
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('ru-RU'),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record: GeneratedPassport) => (
        <Space size="small">
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreviewPassport(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Печать">
            <Button
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => handlePrintPassport(record)}
              size="small"
            />
          </Tooltip>
          {record.status === 'active' ? (
            <Tooltip title="Архивировать">
              <Button
                type="text"
                icon={<InboxOutlined />}
                onClick={() => handleArchivePassport(record)}
                size="small"
                danger
              />
            </Tooltip>
          ) : (
            <Tooltip title="Удалить">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => handleDeletePassport(record)}
                size="small"
                danger
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Статистика
  const getStatistics = () => {
    const total = filteredPassports.length;
    const active = filteredPassports.filter(p => p.status === 'active').length;
    const archived = filteredPassports.filter(p => p.status === 'archived').length;
    
    return { total, active, archived };
  };

  const stats = getStatistics();

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 16px' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        Архив паспортов бурового оборудования
      </Title>

      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Всего паспортов"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Активных"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="В архиве"
              value={stats.archived}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Фильтры и поиск */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Поиск по номеру паспорта, коду 1С, артикулу..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Статус"
              value={statusFilter}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
            >
              <Option value="all">Все статусы</Option>
              <Option value="active">Активные</Option>
              <Option value="archived">Архив</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
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
          <Col xs={24} sm={12} md={6}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={handleResetFilters}
              >
                Сбросить
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setPagination(prev => ({ ...prev, current: 1 }))}
                loading={loading}
              >
                Обновить
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Таблица паспортов */}
      <Card
        title={
          <Space>
            <span>Список паспортов</span>
            <Tag color="blue">{filteredPassports.length} записей</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportToExcel}
              type="primary"
              ghost
              disabled={filteredPassports.length === 0}
            >
              Выгрузить в Excel
            </Button>
          </Space>
        }
        style={{ borderRadius: '12px' }}
      >
        <Table
          columns={columns}
          dataSource={filteredPassports}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredPassports.length,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} из ${total} записей`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 20
              }));
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({
                ...prev,
                current: 1,
                pageSize: size
              }));
            }
          }}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>

      {/* Модальное окно предварительного просмотра */}
      <Modal
        title="Предварительный просмотр паспорта"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedPassport && (
          <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>ООО "Алмазгеобур"</h3>
              <p>125362, г. Москва, улица Водников, дом 2, стр. 14, оф. 11</p>
              <p>тел.: +7 495 229 82 94</p>
              <p>e-mail: contact@almazgeobur.ru</p>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: '20px' }}>
              <h4>Паспорт бурового оборудования</h4>
              <p><strong>Номер паспорта:</strong> {selectedPassport.passport_number}</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Код 1С</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.code_1c}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Наименование</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.name}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Артикул</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.article}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Матрица</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.matrix}</td>
                </tr>
                {selectedPassport.product_data.drilling_depth && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Глубина бурения</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.drilling_depth}</td>
                  </tr>
                )}
                {selectedPassport.product_data.height && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Высота</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.height}</td>
                  </tr>
                )}
                {selectedPassport.product_data.thread && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Резьба</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{selectedPassport.product_data.thread}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p>Дата создания: {new Date(selectedPassport.created_at).toLocaleDateString('ru-RU')}</p>
              <p>Статус: <Tag color={selectedPassport.status === 'active' ? 'green' : 'default'}>
                {selectedPassport.status === 'active' ? 'Активен' : 'Архив'}
              </Tag></p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PassportArchive;

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  DatePicker,
  Tag,
  message,
  Tooltip,
  Modal,
  Descriptions
} from 'antd';
import {
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface PassportData {
  id: string;
  productName: string;
  productCode: string;
  manufacturer: string;
  specifications: string;
  materials: string;
  dimensions: string;
  weight: string;
  dateCreated: string;
  dateIssued: string;
  status: 'draft' | 'approved' | 'issued';
  issuedBy: string;
  recipient: string;
}

const PassportCatalog: React.FC = () => {
  const [passports, setPassports] = useState<PassportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedPassport, setSelectedPassport] = useState<PassportData | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  // Загрузка данных (имитация)
  useEffect(() => {
    loadPassports();
  }, []);

  const loadPassports = async () => {
    setLoading(true);
    try {
      // Имитация загрузки данных
      const mockPassports: PassportData[] = [
        {
          id: 'PAS-001',
          productName: 'Буровая коронка 76мм',
          productCode: 'BK-76-001',
          manufacturer: 'ООО "АлмазГеоБур"',
          specifications: 'Буровая коронка для бурения скважин диаметром 76мм',
          materials: 'Сталь 45Х, алмазное напыление',
          dimensions: '76мм x 300мм',
          weight: '2.5',
          dateCreated: '2024-01-15',
          dateIssued: '2024-01-20',
          status: 'issued',
          issuedBy: 'Иванов И.И.',
          recipient: 'ООО "ГеоСтрой"'
        },
        {
          id: 'PAS-002',
          productName: 'Буровое долото 89мм',
          productCode: 'BD-89-002',
          manufacturer: 'ООО "АлмазГеоБур"',
          specifications: 'Буровое долото для бурения скважин диаметром 89мм',
          materials: 'Сталь 40Х, твердосплавные вставки',
          dimensions: '89мм x 400мм',
          weight: '4.2',
          dateCreated: '2024-02-10',
          dateIssued: '2024-02-15',
          status: 'issued',
          issuedBy: 'Петров П.П.',
          recipient: 'ООО "СтройМонтаж"'
        }
      ];
      setPassports(mockPassports);
    } catch (error) {
      message.error('Ошибка при загрузке паспортов');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPassport = (passport: PassportData) => {
    setSelectedPassport(passport);
    setViewModalVisible(true);
  };

  const handlePrintPassport = (passport: PassportData) => {
    message.info(`Печать паспорта ${passport.id}`);
  };

  const handleDownloadPassport = (passport: PassportData) => {
    message.info(`Скачивание паспорта ${passport.id}`);
  };

  const getFilteredPassports = () => {
    let filtered = passports;

    // Фильтр по тексту поиска
    if (searchText) {
      filtered = filtered.filter(passport =>
        passport.productName.toLowerCase().includes(searchText.toLowerCase()) ||
        passport.productCode.toLowerCase().includes(searchText.toLowerCase()) ||
        passport.manufacturer.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(passport => passport.status === statusFilter);
    }

    // Фильтр по дате
    if (dateRange) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(passport => {
        const passportDate = dayjs(passport.dateIssued);
        return passportDate.isAfter(startDate) && passportDate.isBefore(endDate);
      });
    }

    return filtered;
  };

  const columns = [
    {
      title: 'ID паспорта',
      dataIndex: 'id',
      key: 'id',
      width: 120
    },
    {
      title: 'Название изделия',
      dataIndex: 'productName',
      key: 'productName',
      width: 200
    },
    {
      title: 'Код изделия',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 150
    },
    {
      title: 'Производитель',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 180
    },
    {
      title: 'Дата выдачи',
      dataIndex: 'dateIssued',
      key: 'dateIssued',
      width: 120,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY')
    },
    {
      title: 'Статус',
      key: 'status',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const statusColors = {
          draft: 'orange',
          approved: 'blue',
          issued: 'green'
        };
        const statusLabels = {
          draft: 'Черновик',
          approved: 'Утвержден',
          issued: 'Выдан'
        };
        return (
          <Tag color={statusColors[status as keyof typeof statusColors]}>
            {statusLabels[status as keyof typeof statusLabels]}
          </Tag>
        );
      }
    },
    {
      title: 'Получатель',
      dataIndex: 'recipient',
      key: 'recipient',
      width: 150
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: any, record: PassportData) => (
        <Space size="small">
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewPassport(record)}
            />
          </Tooltip>
          <Tooltip title="Печать">
            <Button
              type="text"
              icon={<PrinterOutlined />}
              size="small"
              onClick={() => handlePrintPassport(record)}
            />
          </Tooltip>
          <Tooltip title="Скачать">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size="small"
              onClick={() => handleDownloadPassport(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Заголовок */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        width: '100%'
      }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            Каталог выданных паспортов
          </Title>
          <Text type="secondary">Просмотр и управление выданными паспортами изделий</Text>
        </div>
      </div>

      {/* Фильтры */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        background: '#fafafa', 
        borderRadius: '8px',
        width: '100%'
      }}>
        <Space size="large" wrap style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="Поиск по названию, коду или производителю"
              allowClear
              style={{ width: 400 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="large"
            />
            <Button 
              type="primary" 
              icon={<FilterOutlined />}
              onClick={loadPassports}
              size="large"
            >
              Обновить
            </Button>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              placeholder="Статус"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              size="large"
            >
              <Option value="all">Все статусы</Option>
              <Option value="draft">Черновик</Option>
              <Option value="approved">Утвержден</Option>
              <Option value="issued">Выдан</Option>
            </Select>
            <RangePicker
              placeholder={['Дата начала', 'Дата окончания']}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              style={{ width: 280 }}
              size="large"
            />
          </div>
        </Space>
      </div>

      {/* Таблица паспортов */}
      <div style={{ width: '100%' }}>
        <Table
          dataSource={getFilteredPassports()}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} паспортов`,
            size: "small"
          }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
                <div style={{ color: '#666' }}>Паспорта не найдены</div>
              </div>
            )
          }}
        />
      </div>

      {/* Модальное окно просмотра паспорта */}
      <Modal
        title={`Паспорт изделия ${selectedPassport?.id}`}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => {
            if (selectedPassport) handlePrintPassport(selectedPassport);
          }}>
            Печать
          </Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={() => {
            if (selectedPassport) handleDownloadPassport(selectedPassport);
          }}>
            Скачать
          </Button>,
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedPassport && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID паспорта" span={2}>
              {selectedPassport.id}
            </Descriptions.Item>
            <Descriptions.Item label="Название изделия">
              {selectedPassport.productName}
            </Descriptions.Item>
            <Descriptions.Item label="Код изделия">
              {selectedPassport.productCode}
            </Descriptions.Item>
            <Descriptions.Item label="Производитель" span={2}>
              {selectedPassport.manufacturer}
            </Descriptions.Item>
            <Descriptions.Item label="Технические характеристики" span={2}>
              {selectedPassport.specifications}
            </Descriptions.Item>
            <Descriptions.Item label="Материалы">
              {selectedPassport.materials}
            </Descriptions.Item>
            <Descriptions.Item label="Габариты">
              {selectedPassport.dimensions}
            </Descriptions.Item>
            <Descriptions.Item label="Вес (кг)">
              {selectedPassport.weight}
            </Descriptions.Item>
            <Descriptions.Item label="Дата создания">
              {dayjs(selectedPassport.dateCreated).format('DD.MM.YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Дата выдачи">
              {dayjs(selectedPassport.dateIssued).format('DD.MM.YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Выдан">
              {selectedPassport.issuedBy}
            </Descriptions.Item>
            <Descriptions.Item label="Получатель">
              {selectedPassport.recipient}
            </Descriptions.Item>
            <Descriptions.Item label="Статус" span={2}>
              <Tag color={
                selectedPassport.status === 'issued' ? 'green' : 
                selectedPassport.status === 'approved' ? 'blue' : 'orange'
              }>
                {selectedPassport.status === 'issued' ? 'Выдан' : 
                 selectedPassport.status === 'approved' ? 'Утвержден' : 'Черновик'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PassportCatalog;

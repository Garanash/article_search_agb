import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  InputNumber,
  Upload,
  message,
  Card,
  Divider,
  Table,
  Tag,
  DatePicker
} from 'antd';
import {
  FileTextOutlined,
  SaveOutlined,
  UploadOutlined,
  DownloadOutlined,
  PrinterOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ProductData {
  id: string;
  orderNumber: string;
  orderDate: string;
  productType: 'crown' | 'shoe' | 'expander';
  article: string;
  name: string;
  size: string;
  matrix?: string;
  matrixHeight?: number;
  quantity: number;
  supplier: string;
  serialNumbers: string[];
}

interface SerialNumberData {
  orderNumber: string;
  orderDateTime: string;
  article: string;
  name: string;
  serialNumber: string;
}

const PassportCreator: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<SerialNumberData[]>([]);
  const [productType, setProductType] = useState<'crown' | 'shoe' | 'expander' | null>(null);

  // Справочник типоразмеров для коронок
  const crownSizes = [
    'HQ (60.3 мм)', 'NQ (47.6 мм)', 'BQ (36.5 мм)', 'PQ (85.0 мм)',
    'HQ3 (60.3 мм)', 'NQ3 (47.6 мм)', 'BQ3 (36.5 мм)',
    'HQ6 (60.3 мм)', 'NQ6 (47.6 мм)', 'BQ6 (36.5 мм)'
  ];

  // Справочник типоразмеров для башмаков и расширителей
  const shoeExpanderSizes = [
    'HWT (60.3 мм)', 'NWT (47.6 мм)', 'BWT (36.5 мм)',
    'HWE (60.3 мм)', 'NWE (47.6 мм)', 'BWE (36.5 мм)'
  ];

  // Справочник матриц
  const matrices = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

  const handleProductTypeChange = (value: 'crown' | 'shoe' | 'expander') => {
    setProductType(value);
    // Очищаем поля матрицы при смене типа изделия
    if (value !== 'crown') {
      form.setFieldsValue({ matrix: undefined, matrixHeight: undefined });
    }
  };

  const handleCreateOrder = async (values: any) => {
    setLoading(true);
    try {
      const currentYear = dayjs().format('YY');
      const newProduct: ProductData = {
        id: `PROD-${Date.now()}`,
        orderNumber: values.orderNumber,
        orderDate: values.orderDate ? values.orderDate.format('DD.MM.YY') : dayjs().format('DD.MM.YY'),
        productType: values.productType,
        article: values.article,
        name: values.name,
        size: values.size,
        matrix: values.matrix,
        matrixHeight: values.matrixHeight,
        quantity: values.quantity,
        supplier: 'ООО "Алмазгеобур"',
        serialNumbers: []
      };

      // Генерация серийных номеров
      const generatedSerialNumbers: string[] = [];
      for (let i = 1; i <= values.quantity; i++) {
        let serialNumber = '';
        
        if (values.productType === 'crown') {
          // Формат для коронок: AGB Матрица-Типоразмер XXXXXX Год
          const sizeCode = values.size.split(' ')[0]; // Берем только код (HQ, NQ, BQ)
          const paddedNumber = String(i).padStart(6, '0');
          serialNumber = `AGB ${values.matrix}-${sizeCode} ${paddedNumber} ${currentYear}`;
        } else {
          // Формат для башмаков и расширителей: AGB Типоразмер XXXXXX Год
          const sizeCode = values.size.split(' ')[0]; // Берем только код (HWT, NWT, BWT, HWE, NWE, BWE)
          const paddedNumber = String(i).padStart(6, '0');
          serialNumber = `AGB ${sizeCode} ${paddedNumber} ${currentYear}`;
        }
        
        generatedSerialNumbers.push(serialNumber);
      }

      newProduct.serialNumbers = generatedSerialNumbers;
      setProducts([...products, newProduct]);

      // Добавляем в таблицу серийных номеров
      const newSerialNumbers: SerialNumberData[] = generatedSerialNumbers.map((serial, index) => ({
        orderNumber: values.orderNumber,
        orderDateTime: `${values.orderDate ? values.orderDate.format('DD.MM.YY') : dayjs().format('DD.MM.YY')} ${values.orderTime || '00:00'}`,
        article: values.article,
        name: values.name,
        serialNumber: serial
      }));

      setSerialNumbers([...serialNumbers, ...newSerialNumbers]);
      message.success('Заказ создан успешно!');
      form.resetFields();
    } catch (error) {
      message.error('Ошибка при создании заказа');
    } finally {
      setLoading(false);
    }
  };

  const handleExportXML = () => {
    if (serialNumbers.length === 0) {
      message.warning('Нет данных для экспорта');
      return;
    }

    // Создание XML файла
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<SerialNumbers>
${serialNumbers.map(item => `  <Item>
    <OrderNumber>${item.orderNumber}</OrderNumber>
    <OrderDateTime>${item.orderDateTime}</OrderDateTime>
    <Article>${item.article}</Article>
    <Name>${item.name}</Name>
    <SerialNumber>${item.serialNumber}</SerialNumber>
  </Item>`).join('\n')}
</SerialNumbers>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial_numbers_${dayjs().format('YYYY-MM-DD_HH-mm')}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('XML файл экспортирован успешно!');
  };

  const handlePrintPassport = (product: ProductData) => {
    message.info(`Печать паспорта для заказа ${product.orderNumber}`);
    // Здесь будет логика печати паспорта
  };

  const columns = [
    {
      title: 'Номер заказа',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120
    },
    {
      title: 'Дата заказа',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 100
    },
    {
      title: 'Тип изделия',
      key: 'productType',
      dataIndex: 'productType',
      width: 120,
      render: (type: string) => {
        const labels = {
          crown: 'Коронка',
          shoe: 'Башмак',
          expander: 'Расширитель'
        };
        const colors = {
          crown: 'blue',
          shoe: 'green',
          expander: 'orange'
        };
        return <Tag color={colors[type as keyof typeof colors]}>{labels[type as keyof typeof labels]}</Tag>;
      }
    },
    {
      title: 'Артикул',
      dataIndex: 'article',
      key: 'article',
      width: 120
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Типоразмер',
      dataIndex: 'size',
      key: 'size',
      width: 120
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100
    },
    {
      title: 'Серийные номера',
      key: 'serialNumbers',
      dataIndex: 'serialNumbers',
      width: 200,
      render: (serialNumbers: string[]) => (
        <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
          {serialNumbers.map((serial, index) => (
            <div key={index} style={{ fontSize: '11px', marginBottom: '2px' }}>
              {serial}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_: any, record: ProductData) => (
        <Button
          type="text"
          icon={<PrinterOutlined />}
          size="small"
          onClick={() => handlePrintPassport(record)}
        />
      )
    }
  ];

  const serialNumberColumns = [
    {
      title: 'Номер заказа поставщику',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 150
    },
    {
      title: 'Дата и время',
      dataIndex: 'orderDateTime',
      key: 'orderDateTime',
      width: 120
    },
    {
      title: 'Артикул',
      dataIndex: 'article',
      key: 'article',
      width: 120
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 200
    },
    {
      title: 'Серийный номер',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 200
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
            Формирование паспортов на буровые коронки, башмаки и расширители серии ALFA
          </Title>
          <Text type="secondary">Создание заказов поставщику и генерация серийных номеров</Text>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        width: '100%',
        alignItems: 'flex-start'
      }}>
        {/* Форма создания заказа */}
        <div style={{ flex: '2', minWidth: '0' }}>
          <Card title="Данные заказа поставщику" style={{ marginBottom: '24px' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateOrder}
              style={{ width: '100%' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="orderNumber"
                    label="Номер заказа поставщику"
                    rules={[{ required: true, message: 'Введите номер заказа' }]}
                  >
                    <Input placeholder="Введите номер заказа" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="orderDate"
                    label="Дата заказа"
                    rules={[{ required: true, message: 'Выберите дату заказа' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="productType"
                    label="Тип изделия"
                    rules={[{ required: true, message: 'Выберите тип изделия' }]}
                  >
                    <Select placeholder="Выберите тип изделия" onChange={handleProductTypeChange}>
                      <Option value="crown">Буровая коронка</Option>
                      <Option value="shoe">Башмак</Option>
                      <Option value="expander">Расширитель</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="article"
                    label="Артикул"
                    rules={[{ required: true, message: 'Введите артикул' }]}
                  >
                    <Input placeholder="Введите артикул" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Наименование"
                    rules={[{ required: true, message: 'Введите наименование' }]}
                  >
                    <Input placeholder="Введите наименование изделия" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="size"
                    label="Типоразмер"
                    rules={[{ required: true, message: 'Выберите типоразмер' }]}
                  >
                    <Select placeholder="Выберите типоразмер">
                      {crownSizes.map(size => (
                        <Option key={size} value={size}>{size}</Option>
                      ))}
                      {shoeExpanderSizes.map(size => (
                        <Option key={size} value={size}>{size}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="matrix"
                    label="Матрица"
                    rules={[
                      {
                        required: productType === 'crown',
                        message: 'Введите матрицу для коронки'
                      }
                    ]}
                  >
                    <Select 
                      placeholder="Выберите матрицу" 
                      disabled={productType !== 'crown'}
                    >
                      {matrices.map(matrix => (
                        <Option key={matrix} value={matrix}>{matrix}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="matrixHeight"
                    label="Высота матрицы (мм)"
                    rules={[
                      {
                        required: productType === 'crown',
                        message: 'Введите высоту матрицы'
                      }
                    ]}
                  >
                    <InputNumber 
                      placeholder="Высота матрицы" 
                      min={1} 
                      max={100}
                      disabled={productType !== 'crown'}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="quantity"
                    label="Количество изделий"
                    rules={[{ required: true, message: 'Введите количество' }]}
                  >
                    <InputNumber 
                      placeholder="Количество" 
                      min={1} 
                      max={1000}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="orderTime"
                    label="Время заказа"
                  >
                    <Input placeholder="00:00" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SaveOutlined />}
                    loading={loading}
                  >
                    Создать заказ
                  </Button>
                  <Button onClick={() => form.resetFields()}>
                    Очистить
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* Информация о компании */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <Card title="Информация о компании" size="small">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <img 
                src="https://almazgeobur.kz/wp-content/uploads/2021/08/agb_logo_h-2.svg" 
                alt="AGB Logo" 
                style={{ width: '80px', height: 'auto' }} 
              />
            </div>
            <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                ООО "Алмазгеобур"
              </div>
              <div style={{ marginBottom: '4px' }}>
                125362, г. Москва, улица Водников, дом 2, стр. 14, оф. 11
              </div>
              <div style={{ marginBottom: '8px' }}>
                тел.: +7 495 229 82 94
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                LLP "Almazgeobur"
              </div>
              <div style={{ marginBottom: '4px' }}>
                125362, Moscow, Vodnikov Street, 2, building. 14, of. 11
              </div>
              <div>
                tel.: +7 495 229 82 94
              </div>
            </div>
          </Card>

          <Card title="Экспорт данных" size="small" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />} 
                onClick={handleExportXML}
                style={{ width: '100%' }}
                disabled={serialNumbers.length === 0}
              >
                Экспорт XML
              </Button>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Скачать файл с серийными номерами для поставщика
              </Text>
            </Space>
          </Card>
        </div>
      </div>

      {/* Таблица созданных заказов */}
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          width: '100%'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Созданные заказы
            </Title>
            <Text type="secondary">Список всех созданных заказов поставщику</Text>
          </div>
        </div>

        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 300 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <FileTextOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                <div style={{ color: '#666', fontSize: '12px' }}>Заказы не созданы</div>
              </div>
            )
          }}
        />
      </div>

      {/* Таблица серийных номеров */}
      <div style={{ width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          width: '100%'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              <FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Сгенерированные серийные номера
            </Title>
            <Text type="secondary">Таблица серийных номеров для экспорта в XML</Text>
          </div>
        </div>

        <Table
          dataSource={serialNumbers}
          columns={serialNumberColumns}
          rowKey={(record, index) => `${record.orderNumber}-${record.serialNumber}-${index}`}
          size="small"
          pagination={false}
          scroll={{ y: 200 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <FileTextOutlined style={{ fontSize: '24px', color: '#d9d9d9', marginBottom: '8px' }} />
                <div style={{ color: '#666', fontSize: '12px' }}>Серийные номера не сгенерированы</div>
              </div>
            )
          }}
        />
      </div>
    </div>
  );
};

export default PassportCreator;

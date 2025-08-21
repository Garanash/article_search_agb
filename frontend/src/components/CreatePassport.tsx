import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  Typography,
  Row,
  Col,
  Space,
  message,
  Divider,
  Tag,
  Alert,
  Modal
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { usePassports, ProductData, GeneratedPassport } from '../context/PassportContext';

const { Title, Text } = Typography;
const { Option } = Select;

const CreatePassport: React.FC = () => {
  const { addPassports, getNextSequenceNumber } = usePassports();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedPassports, setGeneratedPassports] = useState<GeneratedPassport[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewPassport, setPreviewPassport] = useState<GeneratedPassport | null>(null);

  // Данные продуктов из 1С
  const productsData: ProductData[] = [
    { code_1c: 'УТ-00047870', name: 'Коронка импрегнированная', article: '3501040', matrix: 'NQ', drilling_depth: '03-05', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047871', name: 'Коронка импрегнированная', article: '3501041', matrix: 'NQ', drilling_depth: '05-07', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047872', name: 'Коронка импрегнированная', article: '3501042', matrix: 'NQ', drilling_depth: '07-09', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047873', name: 'Коронка импрегнированная', article: '3501043', matrix: 'NQ', drilling_depth: '09-12', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047874', name: 'Коронка импрегнированная', article: '3501044', matrix: 'HQ', drilling_depth: '11-13', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047875', name: 'Коронка импрегнированная', article: '3501045', matrix: 'HQ', drilling_depth: '03-05', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047876', name: 'Коронка импрегнированная', article: '3501046', matrix: 'HQ', drilling_depth: '05-07', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047877', name: 'Коронка импрегнированная', article: '3501047', matrix: 'HQ', drilling_depth: '07-09', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047878', name: 'Коронка импрегнированная', article: '3501048', matrix: 'HQ', drilling_depth: '09-12', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047879', name: 'Коронка импрегнированная', article: '3501049', matrix: 'HQ', drilling_depth: '11-13', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047880', name: 'Коронка импрегнированная', article: '3501050', matrix: 'PQ', drilling_depth: '03-05', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047881', name: 'Коронка импрегнированная', article: '3501051', matrix: 'PQ', drilling_depth: '05-07', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047882', name: 'Коронка импрегнированная', article: '3501052', matrix: 'PQ', drilling_depth: '07-09', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047883', name: 'Коронка импрегнированная', article: '3501053', matrix: 'PQ', drilling_depth: '09-12', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047884', name: 'Коронка импрегнированная', article: '3501054', matrix: 'PQ', drilling_depth: '11-13', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00050693', name: 'Коронка импрегнированная', article: '3501062', matrix: 'HQ3', drilling_depth: '05-07', height: '12 мм', thread: '' },
    { code_1c: 'УТ-00047885', name: 'Расширитель алмазный', article: '3501055', matrix: 'NQ', drilling_depth: '', height: '', thread: '' },
    { code_1c: 'УТ-00047886', name: 'Расширитель алмазный', article: '3501056', matrix: 'HQ', drilling_depth: '', height: '', thread: '' },
    { code_1c: 'УТ-00047887', name: 'Расширитель алмазный', article: '3501057', matrix: 'PQ', drilling_depth: '', height: '', thread: '' },
    { code_1c: 'УТ-00047888', name: 'Башмак обсадной', article: '3501058', matrix: 'NW', drilling_depth: '', height: '', thread: '' },
    { code_1c: 'УТ-00047889', name: 'Башмак обсадной', article: '3501059', matrix: 'HW', drilling_depth: '', height: '', thread: '' },
    { code_1c: 'УТ-00047890', name: 'Башмак обсадной', article: '3501060', matrix: 'HWT', drilling_depth: '', height: '', thread: 'WT' },
    { code_1c: 'УТ-00047891', name: 'Башмак обсадной', article: '3501061', matrix: 'PWT', drilling_depth: '', height: '', thread: 'WT' }
  ];

  // Генерация номера паспорта по правилам
  const generatePassportNumber = (product: ProductData, sequenceNumber: number): string => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    if (product.name.includes('Коронка')) {
      // Для коронок: AGB + глубина бурения + матрица + порядковый номер + год
      return `AGB ${product.drilling_depth} ${product.matrix} ${sequenceNumber.toString().padStart(7, '0')}${currentYear}`;
    } else if (product.name.includes('Расширитель')) {
      // Для расширителей: AGB + матрица + порядковый номер + год
      return `AGB ${product.matrix} ${sequenceNumber.toString().padStart(7, '0')}${currentYear}`;
    } else if (product.name.includes('Башмак')) {
      // Для башмаков: AGB + матрица + порядковый номер + год
      return `AGB ${product.matrix} ${sequenceNumber.toString().padStart(7, '0')}${currentYear}`;
    }
    
    return `AGB ${sequenceNumber.toString().padStart(7, '0')}${currentYear}`;
  };

  // Обработка создания паспортов
  const handleCreatePassports = async (values: any) => {
    if (!selectedProduct) {
      message.error('Выберите продукт');
      return;
    }

    setLoading(true);
    try {
      const passports: GeneratedPassport[] = [];
      const currentDate = new Date().toISOString();
      
      // Получаем базовый номер для первого паспорта
      let baseSequenceNumber = getNextSequenceNumber();
      
      // Генерируем паспорта с последовательными номерами
      for (let i = 0; i < values.quantity; i++) {
        // Каждый следующий паспорт получает номер на 100 больше предыдущего
        const sequenceNumber = baseSequenceNumber + (i * 100);
        const passportNumber = generatePassportNumber(selectedProduct, sequenceNumber);
        
        // Создаем уникальный ID с timestamp и индексом
        const uniqueId = `passport_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`;
        
        passports.push({
          id: uniqueId,
          passport_number: passportNumber,
          product_data: selectedProduct,
          quantity: 1,
          created_at: currentDate,
          status: 'active'
        });
      }

      setGeneratedPassports(passports);
      
      // Добавляем паспорта в общий контекст
      addPassports(passports);
      
      message.success(`Создано ${values.quantity} паспортов`);
      
    } catch (error) {
      console.error('Ошибка создания паспортов:', error);
      message.error('Ошибка создания паспортов');
    } finally {
      setLoading(false);
    }
  };

  // Сохранение паспортов в БД (заглушка для будущей интеграции)
  const savePassportsToDatabase = async (passports: GeneratedPassport[]) => {
    try {
      // Здесь будет реальная интеграция с backend API
      console.log('Паспорта готовы для сохранения в БД:', passports);
      message.success('Паспорта успешно созданы и готовы для сохранения в БД');
    } catch (error) {
      console.error('Ошибка сохранения в БД:', error);
      message.warning('Паспорта созданы, но не сохранены в БД');
    }
  };

  // Выгрузка в Excel
  const handleExportToExcel = () => {
    if (generatedPassports.length === 0) {
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
        ...generatedPassports.map(passport => [
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
      link.setAttribute('download', `паспорта_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Предварительный просмотр паспорта
  const handlePreviewPassport = (passport: GeneratedPassport) => {
    setPreviewPassport(passport);
    setPreviewModalVisible(true);
  };

  // Колонки таблицы
  const columns = [
    {
      title: 'Номер паспорта',
      dataIndex: 'passport_number',
      key: 'passport_number',
      render: (text: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Код 1С',
      dataIndex: ['product_data', 'code_1c'],
      key: 'code_1c'
    },
    {
      title: 'Наименование',
      dataIndex: ['product_data', 'name'],
      key: 'name'
    },
    {
      title: 'Артикул',
      dataIndex: ['product_data', 'article'],
      key: 'article'
    },
    {
      title: 'Матрица',
      dataIndex: ['product_data', 'matrix'],
      key: 'matrix'
    },
    {
      title: 'Глубина бурения',
      dataIndex: ['product_data', 'drilling_depth'],
      key: 'drilling_depth'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: GeneratedPassport) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handlePreviewPassport(record)}
            size="small"
          >
            Просмотр
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        Создание паспортов бурового оборудования
      </Title>

      <Alert
        message="Информация о формировании паспортов"
        description="Паспорта формируются автоматически на основе данных из 1С. Номер паспорта генерируется по схеме: AGB + параметры + порядковый номер + год производства."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[16, 16]}>
        {/* Форма создания паспортов */}
        <Col xs={24}>
          <Card title="Параметры создания" style={{ borderRadius: '12px' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreatePassports}
            >
              <Row gutter={[16, 0]} align="bottom">
                <Col xs={24} sm={12} md={10}>
                  <Form.Item
                    label="Выберите продукт"
                    name="product"
                    rules={[{ required: true, message: 'Выберите продукт' }]}
                  >
                    <Select
                      placeholder="Выберите продукт из списка"
                      onChange={(value) => {
                        const product = productsData.find(p => p.code_1c === value);
                        setSelectedProduct(product || null);
                      }}
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {productsData.map(product => (
                        <Option key={product.code_1c} value={product.code_1c}>
                          {product.code_1c} - {product.name} ({product.article})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12} md={4}>
                  <Form.Item
                    label="Количество паспортов"
                    name="quantity"
                    rules={[{ required: true, message: 'Укажите количество' }]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      style={{ width: '100%' }}
                      placeholder="Количество"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={24} md={10}>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      icon={<PlusOutlined />}
                      size="large"
                      style={{
                        borderRadius: '8px',
                        height: '44px',
                        padding: '0 32px',
                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        border: 'none',
                        fontWeight: '600'
                      }}
                    >
                      Создать паспорта
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>

            {selectedProduct && (
              <Card size="small" style={{ marginTop: '12px', background: '#f8f9fa' }}>
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12} md={6}>
                    <Text strong>Артикул:</Text>
                    <br />
                    <Text>{selectedProduct.article}</Text>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Text strong>Матрица:</Text>
                    <br />
                    <Text>{selectedProduct.matrix}</Text>
                  </Col>
                  {selectedProduct.drilling_depth && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Глубина:</Text>
                      <br />
                      <Text>{selectedProduct.drilling_depth}</Text>
                    </Col>
                  )}
                  {selectedProduct.height && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Высота:</Text>
                      <br />
                      <Text>{selectedProduct.height}</Text>
                    </Col>
                  )}
                  {selectedProduct.thread && (
                    <Col xs={24} sm={12} md={6}>
                      <Text strong>Резьба:</Text>
                      <br />
                      <Text>{selectedProduct.thread}</Text>
                    </Col>
                  )}
                </Row>
              </Card>
            )}
          </Card>
        </Col>

        {/* Список созданных паспортов */}
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <span>Созданные паспорта</span>
                {generatedPassports.length > 0 && (
                  <Tag color="green">{generatedPassports.length} шт.</Tag>
                )}
              </Space>
            }
            extra={
              generatedPassports.length > 0 && (
                <Space>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleExportToExcel}
                    type="primary"
                    ghost
                  >
                    Выгрузить в Excel
                  </Button>
                </Space>
              )
            }
            style={{ borderRadius: '12px' }}
          >
            {generatedPassports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#8c8c8c' }}>
                <FileExcelOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <Text>Созданные паспорта появятся здесь</Text>
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={generatedPassports}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
              />
            )}
          </Card>
        </Col>
      </Row>

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
        {previewPassport && (
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
              <p><strong>Номер паспорта:</strong> {previewPassport.passport_number}</p>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Код 1С</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.code_1c}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Наименование</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.name}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Артикул</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.article}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Матрица</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.matrix}</td>
                </tr>
                {previewPassport.product_data.drilling_depth && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Глубина бурения</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.drilling_depth}</td>
                  </tr>
                )}
                {previewPassport.product_data.height && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Высота</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.height}</td>
                  </tr>
                )}
                {previewPassport.product_data.thread && (
                  <tr>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Резьба</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{previewPassport.product_data.thread}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p>Дата создания: {new Date(previewPassport.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CreatePassport;

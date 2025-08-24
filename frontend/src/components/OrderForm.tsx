import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  message,
  Typography,
  Divider
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  BankOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface OrderFormData {
  contactPerson: string;
  contactPhone: string;
  customerName: string;
  customCustomerName: string;
  region: string;
  city: string;
  district: string;
  field: string;
  equipmentType: 'geological' | 'drilling' | null;
  geologicalEquipment: string;
  drillingEquipment: string;
  customEquipment: string;
  problemType: string;
  problemDescription: string;
}

const OrderForm: React.FC = () => {
  const [form] = Form.useForm();
  const [equipmentType, setEquipmentType] = useState<'geological' | 'drilling' | null>(null);
  const [loading, setLoading] = useState(false);

  // Моковые данные для демонстрации
  const mockCustomers = [
    'ООО "Газпром"',
    'ООО "Лукойл"',
    'ООО "Роснефть"',
    'ООО "Сургутнефтегаз"',
    'ООО "Татнефть"',
    'ООО "Башнефть"',
    'ООО "Новатэк"',
    'ООО "РуссНефть"'
  ];

  const geologicalEquipment = [
    'LF90',
    'LF70', 
    'CS14',
    'CS10',
    'RS90',
    'LM90',
    'RU90',
    'Другое'
  ];

  const drillingEquipment = [
    'DM',
    'DML',
    'FLEXYROC',
    'Другое'
  ];

  const problemTypes = [
    'Поломка двигателя',
    'Неисправность гидравлики',
    'Проблемы с электрикой',
    'Износ деталей',
    'Техническое обслуживание',
    'Калибровка оборудования',
    'Замена комплектующих',
    'Другое'
  ];

  const onFinish = async (values: OrderFormData) => {
    setLoading(true);
    
    try {
      // Проверяем, что указано либо название из списка, либо кастомное название
      if (!values.customerName && !values.customCustomerName) {
        message.error('Укажите название заказчика');
        setLoading(false);
        return;
      }

      // Имитация отправки заявки
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('Спасибо! Ваша заявка отправлена');
      form.resetFields();
      setEquipmentType(null);
      
    } catch (error) {
      message.error('Ошибка при отправке заявки');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentTypeChange = (value: 'geological' | 'drilling') => {
    setEquipmentType(value);
    form.setFieldsValue({
      geologicalEquipment: undefined,
      drillingEquipment: undefined,
      customEquipment: undefined
    });
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        Форма заказа услуг
      </Title>

      <Card style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            equipmentType: null,
            geologicalEquipment: undefined,
            drillingEquipment: undefined,
            customEquipment: undefined
          }}
        >
          {/* Контактная информация */}
          <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
            <UserOutlined style={{ marginRight: '8px' }} />
            Контактная информация
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPerson"
                label="Контактное лицо (Имя Фамилия)"
                rules={[{ required: true, message: 'Введите имя и фамилию' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Иван Иванов"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPhone"
                label="Контактный телефон"
                rules={[{ required: true, message: 'Введите номер телефона' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="+7 (999) 123-45-67"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Информация о заказчике */}
          <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
            <BankOutlined style={{ marginRight: '8px' }} />
            Информация о заказчике
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="customerName"
                label="Название заказчика"
                rules={[{ required: true, message: 'Выберите или введите название заказчика' }]}
              >
                <Select
                  showSearch
                  placeholder="Выберите заказчика или введите название"
                  size="large"
                  allowClear
                  showArrow
                  filterOption={(input, option) =>
                    String(option?.children).toLowerCase().includes(input.toLowerCase())
                  }
                  onSearch={(value) => {
                    // Если пользователь вводит текст, которого нет в списке, добавляем его
                    if (value && !mockCustomers.includes(value)) {
                      // Можно добавить логику для добавления нового клиента в базу
                      console.log('Новый клиент:', value);
                    }
                  }}
                  onSelect={(value) => {
                    // Если выбрано существующее значение, очищаем кастомное
                    if (mockCustomers.includes(value)) {
                      form.setFieldsValue({ customCustomerName: undefined });
                    }
                  }}
                >
                  {mockCustomers.map(customer => (
                    <Option key={customer} value={customer}>
                      {customer}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Поле для ввода названия компании, если нет в списке */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="customCustomerName"
                label="Или введите название компании"
                rules={[
                  {
                    validator: (_, value) => {
                      const customerName = form.getFieldValue('customerName');
                      if (!customerName && !value) {
                        return Promise.reject(new Error('Выберите заказчика или введите название'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input 
                  placeholder="Введите название компании, если её нет в списке" 
                  size="large"
                  onChange={(e) => {
                    // Если вводится кастомное название, очищаем выбор из списка
                    if (e.target.value) {
                      form.setFieldsValue({ customerName: undefined });
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Расположение объекта */}
          <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
            <EnvironmentOutlined style={{ marginRight: '8px' }} />
            Расположение объекта
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Form.Item
                name="region"
                label="Регион/Область"
                rules={[{ required: true, message: 'Введите регион' }]}
              >
                <Input placeholder="Московская область" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="city"
                label="Город"
                rules={[{ required: true, message: 'Введите город' }]}
              >
                <Input placeholder="Москва" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="district"
                label="Район"
                rules={[{ required: true, message: 'Введите район' }]}
              >
                <Input placeholder="Центральный" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="field"
                label="Месторождение"
                rules={[{ required: true, message: 'Введите месторождение' }]}
              >
                <Input placeholder="Название месторождения" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Тип оборудования */}
          <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
            <ToolOutlined style={{ marginRight: '8px' }} />
            Тип оборудования
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="equipmentType"
                label="Категория оборудования"
                rules={[{ required: true, message: 'Выберите тип оборудования' }]}
              >
                <Select
                  placeholder="Выберите категорию"
                  size="large"
                  onChange={handleEquipmentTypeChange}
                >
                  <Option value="geological">Геологоразведочное</Option>
                  <Option value="drilling">Буровзрывное</Option>
                </Select>
              </Form.Item>
            </Col>
            
            {equipmentType === 'geological' && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="geologicalEquipment"
                  label="Тип геологоразведочного оборудования"
                  rules={[{ required: true, message: 'Выберите тип оборудования' }]}
                >
                  <Select
                    placeholder="Выберите тип оборудования"
                    size="large"
                    onChange={(value) => {
                      if (value === 'Другое') {
                        form.setFieldsValue({ customEquipment: undefined });
                      }
                    }}
                  >
                    {geologicalEquipment.map(equipment => (
                      <Option key={equipment} value={equipment}>
                        {equipment}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
            
            {equipmentType === 'drilling' && (
              <Col xs={24} md={12}>
                <Form.Item
                  name="drillingEquipment"
                  label="Тип буровзрывного оборудования"
                  rules={[{ required: true, message: 'Выберите тип оборудования' }]}
                >
                  <Select
                    placeholder="Выберите тип оборудования"
                    size="large"
                    onChange={(value) => {
                      if (value === 'Другое') {
                        form.setFieldsValue({ customEquipment: undefined });
                      }
                    }}
                  >
                    {drillingEquipment.map(equipment => (
                      <Option key={equipment} value={equipment}>
                        {equipment}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* Поле для ввода названия станка */}
          {((equipmentType === 'geological' && form.getFieldValue('geologicalEquipment') === 'Другое') ||
            (equipmentType === 'drilling' && form.getFieldValue('drillingEquipment') === 'Другое')) && (
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="customEquipment"
                  label="Название станка"
                  rules={[{ required: true, message: 'Введите название станка' }]}
                >
                  <Input 
                    placeholder="Введите название станка" 
                    size="large"
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider />

          {/* Описание проблемы */}
          <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
            <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
            Описание проблемы
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="problemType"
                label="Тип неисправности"
                rules={[{ required: true, message: 'Выберите тип неисправности' }]}
              >
                <Select
                  placeholder="Выберите тип неисправности"
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.children).toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {problemTypes.map(problem => (
                    <Option key={problem} value={problem}>
                      {problem}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Описание проблемы в свободной форме */}
          <Title level={4} style={{ marginBottom: '16px', color: '#1890ff' }}>
            <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
            Подробное описание проблемы
          </Title>
          
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                name="problemDescription"
                label="Опишите проблему подробно"
                rules={[{ required: true, message: 'Опишите проблему' }]}
              >
                <TextArea
                  rows={8}
                  placeholder="Подробно опишите возникшую проблему, укажите симптомы, когда началась, что предшествовало поломке, и другую важную информацию..."
                  size="large"
                  style={{ fontSize: '16px' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          {/* Кнопка отправки */}
          <Row>
            <Col xs={24} style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SendOutlined />}
                loading={loading}
                style={{
                  height: '48px',
                  padding: '0 32px',
                  fontSize: '16px',
                  borderRadius: '8px'
                }}
              >
                Отправить заявку
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default OrderForm;

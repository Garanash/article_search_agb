import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Upload,
  message,
  Space,
  DatePicker,
  Checkbox,
  Alert
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  ReadOutlined,
  TeamOutlined,
  FileTextOutlined,
  SendOutlined,
  UploadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface JobApplicationData {
  // Личная информация
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  
  // Образование
  education: string;
  institution: string;
  graduationYear: string;
  specialty: string;
  
  // Опыт работы
  experience: string;
  lastPosition: string;
  lastCompany: string;
  workExperience: string;
  
  // Желаемая позиция
  desiredPosition: string;
  desiredSalary: string;
  readyToRelocate: boolean;
  readyToBusinessTrips: boolean;
  
  // Дополнительно
  skills: string;
  languages: string;
  additionalInfo: string;
  
  // Файлы
  resume: any[];
  coverLetter: any[];
}

const JobApplicationForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Обработка отправки формы
  const onFinish = async (values: JobApplicationData) => {
    setLoading(true);
    
    try {
      // Здесь будет логика отправки данных на сервер
      console.log('Данные формы:', values);
      
      // Имитация отправки
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      message.success('Ваша заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.');
      setSubmitted(true);
      form.resetFields();
    } catch (error) {
      message.error('Произошла ошибка при отправке заявки. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  // Настройки загрузки файлов
  const uploadProps = {
    beforeUpload: (file: any) => {
      const isPDF = file.type === 'application/pdf';
      const isDOC = file.type === 'application/msword';
      const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      
      if (!isPDF && !isDOC && !isDOCX) {
        message.error('Можно загружать только PDF, DOC или DOCX файлы!');
        return false;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Файл должен быть меньше 5MB!');
        return false;
      }
      
      return false; // Предотвращаем автоматическую загрузку
    },
    onChange: (info: any) => {
      if (info.file.status === 'removed') {
        message.info('Файл удален');
      }
    },
  };

  if (submitted) {
    return (
      <div style={{ width: '100%', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: 600, textAlign: 'center' }}>
          <div style={{ fontSize: '64px', color: '#52c41a', marginBottom: '24px' }}>✅</div>
          <Title level={2} style={{ color: '#52c41a' }}>Заявка отправлена!</Title>
          <Text style={{ fontSize: '16px', color: '#666' }}>
            Спасибо за ваш интерес к нашей компании. Мы рассмотрим вашу заявку и свяжемся с вами в ближайшее время.
          </Text>
          <Divider />
          <Button 
            type="primary" 
            size="large" 
            onClick={() => setSubmitted(false)}
            style={{ marginTop: '16px' }}
          >
            Отправить еще одну заявку
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        Форма для соискателя
      </Title>

      <Alert
        message="Информация о подаче заявки"
        description="Заполните все обязательные поля (отмечены звездочкой *). После отправки мы рассмотрим вашу заявку и свяжемся с вами."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ width: '100%' }}
      >
        {/* Личная информация */}
        <Card title="Личная информация" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Фамилия"
                name="lastName"
                rules={[{ required: true, message: 'Введите фамилию' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Введите фамилию"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Имя"
                name="firstName"
                rules={[{ required: true, message: 'Введите имя' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Введите имя"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Отчество"
                name="middleName"
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="Введите отчество"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Введите email' },
                  { type: 'email', message: 'Введите корректный email' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="example@email.com"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="Телефон"
                name="phone"
                rules={[{ required: true, message: 'Введите телефон' }]}
              >
                <Input 
                  prefix={<PhoneOutlined />} 
                  placeholder="+7 (999) 123-45-67"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="Дата рождения"
                name="birthDate"
                rules={[{ required: true, message: 'Выберите дату рождения' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  size="large"
                  placeholder="Выберите дату"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Form.Item
                label="Город"
                name="city"
                rules={[{ required: true, message: 'Введите город' }]}
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder="Введите город"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Адрес"
                name="address"
              >
                <Input 
                  prefix={<HomeOutlined />} 
                  placeholder="Введите полный адрес"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Образование */}
        <Card title="Образование" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Уровень образования"
                name="education"
                rules={[{ required: true, message: 'Выберите уровень образования' }]}
              >
                <Select 
                  placeholder="Выберите уровень"
                  size="large"
                >
                  <Option value="secondary">Среднее</Option>
                  <Option value="secondary_special">Среднее специальное</Option>
                  <Option value="incomplete_higher">Неполное высшее</Option>
                  <Option value="higher">Высшее</Option>
                  <Option value="postgraduate">Послевузовское</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Учебное заведение"
                name="institution"
                rules={[{ required: true, message: 'Введите название учебного заведения' }]}
              >
                <Input 
                  prefix={<ReadOutlined />} 
                  placeholder="Название ВУЗа/колледжа"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Год окончания"
                name="graduationYear"
                rules={[{ required: true, message: 'Введите год окончания' }]}
              >
                <Input 
                  placeholder="2024"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Специальность"
                name="specialty"
                rules={[{ required: true, message: 'Введите специальность' }]}
              >
                <Input 
                  placeholder="Введите специальность по диплому"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Опыт работы */}
        <Card title="Опыт работы" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Опыт работы"
                name="experience"
                rules={[{ required: true, message: 'Выберите опыт работы' }]}
              >
                <Select 
                  placeholder="Выберите опыт"
                  size="large"
                >
                  <Option value="no_experience">Без опыта</Option>
                  <Option value="less_1">Менее 1 года</Option>
                  <Option value="1_3">1-3 года</Option>
                  <Option value="3_6">3-6 лет</Option>
                  <Option value="more_6">Более 6 лет</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Последняя должность"
                name="lastPosition"
              >
                <Input 
                  prefix={<TeamOutlined />} 
                  placeholder="Введите должность"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Последняя компания"
                name="lastCompany"
              >
                <Input 
                  prefix={<TeamOutlined />} 
                  placeholder="Название компании"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Описание опыта работы"
                name="workExperience"
              >
                <TextArea
                  rows={4}
                  placeholder="Опишите ваш опыт работы, ключевые проекты и достижения..."
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Желаемая позиция */}
        <Card title="Желаемая позиция" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Желаемая должность"
                name="desiredPosition"
                rules={[{ required: true, message: 'Введите желаемую должность' }]}
              >
                <Input 
                  prefix={<TeamOutlined />} 
                  placeholder="Введите должность"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Желаемая зарплата"
                name="desiredSalary"
                rules={[{ required: true, message: 'Введите желаемую зарплату' }]}
              >
                <Input 
                  placeholder="Введите сумму в рублях"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Готовность к командировкам"
                name="readyToBusinessTrips"
                valuePropName="checked"
              >
                <Checkbox>Готов к командировкам</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Готовность к переезду"
                name="readyToRelocate"
                valuePropName="checked"
              >
                <Checkbox>Готов к переезду</Checkbox>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Дополнительная информация */}
        <Card title="Дополнительная информация" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item
                label="Профессиональные навыки"
                name="skills"
              >
                <TextArea
                  rows={4}
                  placeholder="Опишите ваши профессиональные навыки, владение программами, технологиями..."
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Знание языков"
                name="languages"
              >
                <TextArea
                  rows={3}
                  placeholder="Укажите языки, которыми владеете, и уровень владения..."
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="Дополнительная информация"
                name="additionalInfo"
              >
                <TextArea
                  rows={4}
                  placeholder="Любая дополнительная информация, которую считаете важной..."
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Файлы */}
        <Card title="Документы" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Резюме"
                name="resume"
                rules={[{ required: true, message: 'Загрузите резюме' }]}
              >
                <Upload {...uploadProps} maxCount={1}>
                  <Button 
                    icon={<UploadOutlined />} 
                    size="large"
                    style={{ width: '100%' }}
                  >
                    Загрузить резюме (PDF, DOC, DOCX)
                  </Button>
                </Upload>
                <Text type="secondary">Максимальный размер: 5MB</Text>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Сопроводительное письмо"
                name="coverLetter"
              >
                <Upload {...uploadProps} maxCount={1}>
                  <Button 
                    icon={<UploadOutlined />} 
                    size="large"
                    style={{ width: '100%' }}
                  >
                    Загрузить сопроводительное письмо
                  </Button>
                </Upload>
                <Text type="secondary">Необязательно</Text>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Кнопка отправки */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
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
              borderRadius: '8px',
              minWidth: '200px'
            }}
          >
            Отправить заявку
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default JobApplicationForm;

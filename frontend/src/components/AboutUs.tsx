import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  Divider,
  Tag,
  Button,
  Descriptions,
  Avatar,
  Statistic
} from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface BranchOffice {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  type: 'office' | 'branch' | 'service-center';
  region: string;
}

const AboutUs: React.FC = () => {
  // Данные о компании на основе сайта https://almazgeobur.ru/contacts
  const companyInfo = {
    name: 'ООО «Алмазгеобур»',
    description: 'Компания обеспечивает комплексную поставку бурового оборудования и инструмента для предприятий горнодобывающей отрасли.',
    slogan: 'Вместе мы свернем горы!',
    founded: '2005',
    employees: '150+',
    projects: '500+',
    experience: '18+ лет'
  };

  const branches: BranchOffice[] = [
    {
      id: '1',
      name: 'Центральный офис',
      city: 'Москва',
      address: 'Россия, 119421, г. Москва, Ленинский проспект, 111/1, офис 317',
      phone: '+7 495 229 82 94',
      type: 'office',
      region: 'Центральный'
    },
    {
      id: '2',
      name: 'Филиал Дальний Восток',
      city: 'Хабаровск',
      address: 'Россия, 680013, Хабаровский край, г. Хабаровск, ул. Ленинградская, 28, литера Я',
      phone: '+7 421 240 07 99',
      type: 'branch',
      region: 'Дальневосточный'
    },
    {
      id: '3',
      name: 'Сибирский филиал',
      city: 'Красноярск',
      address: 'Россия, 660075, г. Красноярск, ул. Маерчака, д 16, оф. 519',
      phone: '+7 (391) 204 64 34 доб. 701',
      type: 'branch',
      region: 'Сибирский'
    },
    {
      id: '4',
      name: 'Северо-восточный филиал',
      city: 'Магадан',
      address: 'Россия, 685000, г. Магадан, ул. Пролетарская, 55а',
      phone: '+7 985 177 77 76',
      type: 'branch',
      region: 'Дальневосточный'
    },
    {
      id: '5',
      name: 'Северо-западный филиал',
      city: 'Апатиты',
      address: 'г. Апатиты, Ленина, 22, офис 302',
      phone: '+7 985 740 00 34',
      type: 'branch',
      region: 'Северо-Западный'
    },
    {
      id: '6',
      name: 'Сервисный центр Чита',
      city: 'Чита',
      address: 'г. Чита, ул. Пограничная, 13',
      phone: '+7 985 177 77 74',
      type: 'service-center',
      region: 'Сибирский'
    },
    {
      id: '7',
      name: 'Сервисный центр Певек',
      city: 'Певек',
      address: 'г. Певек, ул. Обручева, 10',
      phone: '+7 985 177 77 72',
      type: 'service-center',
      region: 'Дальневосточный'
    },
    {
      id: '8',
      name: 'Сервисный центр Норильск',
      city: 'Норильск',
      address: 'г. Норильск, проезд Котульского, 21',
      phone: '+7 985 177 77 72',
      type: 'service-center',
      region: 'Сибирский'
    },
    {
      id: '9',
      name: 'Сервисный центр Новосибирск',
      city: 'Новосибирск',
      address: 'г. Новосибирск, ул. Станционная, 60',
      phone: '+7 495 229 82 94',
      type: 'service-center',
      region: 'Сибирский'
    },
    {
      id: '10',
      name: 'Филиал Узбекистан',
      city: 'Ташкент',
      address: 'Узбекистан, 10015, г. Ташкент, ул. Айбека, 38а',
      phone: '+998 97 036 72 76',
      type: 'branch',
      region: 'Международный'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'office': return 'blue';
      case 'branch': return 'green';
      case 'service-center': return 'orange';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'office': return 'Центральный офис';
      case 'branch': return 'Филиал';
      case 'service-center': return 'Сервисный центр';
      default: return type;
    }
  };

  const getRegionColor = (region: string) => {
    const colors: { [key: string]: string } = {
      'Центральный': 'blue',
      'Дальневосточный': 'cyan',
      'Сибирский': 'green',
      'Северо-Западный': 'purple',
      'Международный': 'gold'
    };
    return colors[region] || 'default';
  };

  return (
    <>
      {/* Заголовок и основная информация */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '16px' }}>
          <TrophyOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
          О компании
        </Title>
        <Paragraph style={{ textAlign: 'center', fontSize: '18px', color: '#666' }}>
          {companyInfo.description}
        </Paragraph>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Title level={3} style={{ color: '#1890ff', fontStyle: 'italic' }}>
            {companyInfo.slogan}
          </Title>
        </div>
      </div>

      {/* Статистика компании */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title="Год основания"
              value={companyInfo.founded}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title="Сотрудников"
              value={companyInfo.employees}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title="Реализованных проектов"
              value={companyInfo.projects}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ textAlign: 'center', borderRadius: '8px' }}>
            <Statistic
              title="Опыт работы"
              value={companyInfo.experience}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Основные направления деятельности */}
      <Card title="Основные направления деятельности" style={{ marginBottom: '24px', borderRadius: '8px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <ToolOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>Буровое оборудование</Title>
              <Text>Поставка современного бурового оборудования для горнодобывающей отрасли</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <SafetyOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4}>Буровой инструмент</Title>
              <Text>Качественный инструмент для различных типов бурения</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <TeamOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
              <Title level={4}>Сервисное обслуживание</Title>
              <Text>Техническая поддержка и обслуживание оборудования</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* География присутствия */}
      <Card title="География присутствия" style={{ marginBottom: '24px', borderRadius: '8px' }}>
        <Row gutter={[16, 16]}>
          {Array.from(new Set(branches.map(b => b.region))).map(region => (
            <Col xs={24} sm={12} md={6} key={region}>
              <Card 
                size="small" 
                style={{ 
                  textAlign: 'center', 
                  borderRadius: '8px',
                  border: `2px solid ${getRegionColor(region) === 'default' ? '#d9d9d9' : '#1890ff'}`
                }}
              >
                <Tag color={getRegionColor(region)} style={{ marginBottom: '8px' }}>
                  {region}
                </Tag>
                <div>
                  <Text strong>
                    {branches.filter(b => b.region === region).length} {branches.filter(b => b.region === region).length === 1 ? 'представительство' : 'представительства'}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Филиалы и представительства */}
      <Card title="Филиалы и представительства" style={{ marginBottom: '24px', borderRadius: '8px' }}>
        <Row gutter={[16, 16]}>
          {branches.map(branch => (
            <Col xs={24} lg={12} key={branch.id}>
              <Card 
                size="small" 
                style={{ 
                  marginBottom: '16px', 
                  borderRadius: '8px',
                  border: `1px solid #f0f0f0`
                }}
                title={
                  <Space>
                    <EnvironmentOutlined style={{ color: '#1890ff' }} />
                    <Text strong>{branch.name}</Text>
                    <Tag color={getTypeColor(branch.type)}>
                      {getTypeLabel(branch.type)}
                    </Tag>
                  </Space>
                }
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Город">
                    <Text strong>{branch.city}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Адрес">
                    <Text>{branch.address}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Телефон">
                    <Space>
                      <PhoneOutlined style={{ color: '#52c41a' }} />
                      <Text copyable>{branch.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Регион">
                    <Tag color={getRegionColor(branch.region)}>
                      {branch.region}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Контактная информация */}
      <Card title="Контактная информация" style={{ borderRadius: '8px' }}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <MailOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '16px' }} />
              <Title level={4}>Email</Title>
              <Text copyable style={{ fontSize: '16px' }}>
                contact@almazgeobur.ru
              </Text>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <PhoneOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '16px' }} />
              <Title level={4}>Телефон</Title>
              <Text copyable style={{ fontSize: '16px' }}>
                +7 495 229 82 94
              </Text>
            </div>
          </Col>
        </Row>
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<GlobalOutlined />}
            onClick={() => window.open('https://almazgeobur.ru', '_blank')}
          >
            Перейти на официальный сайт
          </Button>
        </div>
      </Card>
    </>
  );
};

export default AboutUs;

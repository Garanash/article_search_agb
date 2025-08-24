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
  Select,
  message,
  Modal,
  Descriptions,
  Divider,
  Avatar,
  Rate,
  Tooltip,
  Popconfirm,
  Badge,
  Progress,
  Statistic
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownloadOutlined,
  StarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  ReadOutlined,
  TeamOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  city: string;
  birthDate: string;
  age: number;
  photo?: string;
  
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
  totalExperience: number;
  
  // Желаемая позиция
  desiredPosition: string;
  desiredSalary: string;
  readyToRelocate: boolean;
  readyToBusinessTrips: boolean;
  
  // Навыки и рейтинг
  skills: string[];
  languages: string[];
  rating: number;
  status: 'active' | 'hired' | 'rejected' | 'interviewing';
  lastActivity: string;
  
  // Дополнительно
  additionalInfo: string;
  notes?: string;
}

const ApplicantsCatalog: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [experienceFilter, setExperienceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Моковые данные для демонстрации
  useEffect(() => {
    const mockApplicants: Applicant[] = [
      {
        id: '1',
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: 'Иванович',
        email: 'ivanov@email.com',
        phone: '+7 (999) 123-45-67',
        city: 'Москва',
        birthDate: '1990-01-01',
        age: 34,
        education: 'Высшее',
        institution: 'МГУ им. Ломоносова',
        graduationYear: '2012',
        specialty: 'Информационные технологии',
        experience: '3-6 лет',
        lastPosition: 'Senior Developer',
        lastCompany: 'ООО "Технологии"',
        workExperience: 'Разработка веб-приложений, управление командой, архитектура систем',
        totalExperience: 5,
        desiredPosition: 'Team Lead',
        desiredSalary: '150 000 руб.',
        readyToRelocate: true,
        readyToBusinessTrips: true,
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'PostgreSQL', 'Docker'],
        languages: ['Русский (родной)', 'Английский (B2)'],
        rating: 4.8,
        status: 'active',
        lastActivity: '2024-01-20T10:30:00Z',
        additionalInfo: 'Активно участвую в open-source проектах, веду технический блог',
        notes: 'Отличный кандидат для позиции Team Lead'
      },
      {
        id: '2',
        firstName: 'Мария',
        lastName: 'Петрова',
        middleName: 'Петровна',
        email: 'petrova@email.com',
        phone: '+7 (999) 987-65-43',
        city: 'Санкт-Петербург',
        birthDate: '1988-05-15',
        age: 35,
        education: 'Высшее',
        institution: 'СПбГУ',
        graduationYear: '2010',
        specialty: 'Экономика',
        experience: 'Более 6 лет',
        lastPosition: 'Финансовый директор',
        lastCompany: 'ООО "Финансы"',
        workExperience: 'Управление финансами компании, бюджетирование, финансовое планирование',
        totalExperience: 8,
        desiredPosition: 'CFO',
        desiredSalary: '200 000 руб.',
        readyToRelocate: false,
        readyToBusinessTrips: true,
        skills: ['1С:Предприятие', 'Excel', 'Финансовое моделирование', 'Бюджетирование'],
        languages: ['Русский (родной)', 'Английский (C1)'],
        rating: 4.9,
        status: 'interviewing',
        lastActivity: '2024-01-19T15:45:00Z',
        additionalInfo: 'Сертифицированный специалист по 1С, опыт работы в крупных компаниях',
        notes: 'Проходит второй этап собеседования'
      },
      {
        id: '3',
        firstName: 'Алексей',
        lastName: 'Сидоров',
        middleName: 'Александрович',
        email: 'sidorov@email.com',
        phone: '+7 (999) 555-44-33',
        city: 'Екатеринбург',
        birthDate: '1995-08-20',
        age: 28,
        education: 'Высшее',
        institution: 'УрФУ',
        graduationYear: '2017',
        specialty: 'Менеджмент',
        experience: '1-3 года',
        lastPosition: 'Менеджер по продажам',
        lastCompany: 'ООО "Продажи"',
        workExperience: 'Работа с клиентами, проведение презентаций, заключение договоров',
        totalExperience: 2,
        desiredPosition: 'Руководитель отдела продаж',
        desiredSalary: '80 000 руб.',
        readyToRelocate: true,
        readyToBusinessTrips: true,
        skills: ['CRM системы', 'Презентации', 'Переговоры', 'Аналитика продаж'],
        languages: ['Русский (родной)', 'Английский (A2)'],
        rating: 4.2,
        status: 'active',
        lastActivity: '2024-01-18T12:15:00Z',
        additionalInfo: 'Мотивированный специалист, готов к развитию и обучению',
        notes: 'Потенциальный кандидат для развития'
      }
    ];
    setApplicants(mockApplicants);
  }, []);

  // Фильтрация соискателей
  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = !searchText || 
      applicant.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
      applicant.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
      applicant.desiredPosition.toLowerCase().includes(searchText.toLowerCase()) ||
      applicant.skills.some(skill => skill.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;
    const matchesExperience = experienceFilter === 'all' || 
      (experienceFilter === '0-1' && applicant.totalExperience < 1) ||
      (experienceFilter === '1-3' && applicant.totalExperience >= 1 && applicant.totalExperience < 3) ||
      (experienceFilter === '3-5' && applicant.totalExperience >= 3 && applicant.totalExperience < 5) ||
      (experienceFilter === '5+' && applicant.totalExperience >= 5);
    const matchesCity = cityFilter === 'all' || applicant.city === cityFilter;
    
    return matchesSearch && matchesStatus && matchesExperience && matchesCity;
  });

  // Статистика
  const stats = {
    total: applicants.length,
    active: applicants.filter(a => a.status === 'active').length,
    interviewing: applicants.filter(a => a.status === 'interviewing').length,
    hired: applicants.filter(a => a.status === 'hired').length,
    rejected: applicants.filter(a => a.status === 'rejected').length,
    averageRating: applicants.reduce((sum, a) => sum + a.rating, 0) / applicants.length
  };

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'blue';
      case 'interviewing': return 'orange';
      case 'hired': return 'green';
      case 'rejected': return 'red';
      default: return 'default';
    }
  };

  // Получение текста статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Активен';
      case 'interviewing': return 'Собеседование';
      case 'hired': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  // Получение цвета опыта
  const getExperienceColor = (experience: number) => {
    if (experience < 1) return 'green';
    if (experience < 3) return 'blue';
    if (experience < 5) return 'purple';
    return 'red';
  };

  // Получение текста опыта
  const getExperienceText = (experience: number) => {
    if (experience < 1) return '0-1 год';
    if (experience < 3) return '1-3 года';
    if (experience < 5) return '3-5 лет';
    return '5+ лет';
  };

  // Обработчики
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleViewDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setDetailModalVisible(true);
  };

  const handleEdit = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setEditModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setApplicants(prev => prev.filter(a => a.id !== id));
    message.success('Соискатель удален из каталога');
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setApplicants(prev => 
      prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a)
    );
    message.success('Статус обновлен');
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setExperienceFilter('all');
    setCityFilter('all');
    setCurrentPage(1);
  };

  const handleExportToExcel = () => {
    message.info('Экспорт в Excel в разработке');
  };

  // Колонки таблицы
  const columns = [
    {
      title: 'Фото',
      key: 'photo',
      width: 80,
      render: (_: any, record: Applicant) => (
        <Avatar 
          size={50} 
          src={record.photo}
          icon={<UserOutlined />}
          style={{ backgroundColor: '#1890ff' }}
        />
      )
    },
    {
      title: 'ФИО',
      key: 'name',
      width: 200,
      render: (_: any, record: Applicant) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.lastName} {record.firstName} {record.middleName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.age} лет, {record.city}
          </div>
        </div>
      ),
      sorter: (a: Applicant, b: Applicant) => 
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
    },
    {
      title: 'Желаемая позиция',
      dataIndex: 'desiredPosition',
      key: 'desiredPosition',
      width: 180,
      ellipsis: true
    },
    {
      title: 'Опыт',
      key: 'experience',
      width: 120,
      render: (_: any, record: Applicant) => (
        <Tag color={getExperienceColor(record.totalExperience)}>
          {getExperienceText(record.totalExperience)}
        </Tag>
      ),
      sorter: (a: Applicant, b: Applicant) => a.totalExperience - b.totalExperience
    },
    {
      title: 'Навыки',
      key: 'skills',
      width: 200,
      render: (_: any, record: Applicant) => (
        <div>
          {record.skills.slice(0, 3).map(skill => (
            <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
              {skill}
            </Tag>
          ))}
          {record.skills.length > 3 && (
            <Tag color="default">+{record.skills.length - 3}</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Рейтинг',
      key: 'rating',
      width: 120,
      render: (_: any, record: Applicant) => (
        <div>
          <Rate disabled defaultValue={record.rating} style={{ fontSize: '14px' }} />
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.rating.toFixed(1)}
          </div>
        </div>
      ),
      sorter: (a: Applicant, b: Applicant) => a.rating - b.rating
    },
    {
      title: 'Статус',
      key: 'status',
      width: 140,
      render: (_: any, record: Applicant) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusText(record.status)}
        </Tag>
      ),
      filters: [
        { text: 'Активен', value: 'active' },
        { text: 'Собеседование', value: 'interviewing' },
        { text: 'Принят', value: 'hired' },
        { text: 'Отклонен', value: 'rejected' }
      ],
      onFilter: (value: any, record: Applicant) => record.status === value
    },
    {
      title: 'Последняя активность',
      key: 'lastActivity',
      width: 140,
      render: (_: any, record: Applicant) => (
        <div>
          <div>{dayjs(record.lastActivity).format('DD.MM.YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(record.lastActivity).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: (a: Applicant, b: Applicant) => 
        dayjs(a.lastActivity).unix() - dayjs(b.lastActivity).unix()
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 200,
      render: (_: any, record: Applicant) => (
        <Space>
          <Tooltip title="Просмотр профиля">
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
          <Select
            value={record.status}
            onChange={(value) => handleStatusChange(record.id, value)}
            style={{ width: 120 }}
            size="small"
          >
            <Option value="active">Активен</Option>
            <Option value="interviewing">Собеседование</Option>
            <Option value="hired">Принять</Option>
            <Option value="rejected">Отклонить</Option>
          </Select>
          <Popconfirm
            title="Удалить соискателя?"
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
    <>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <UserOutlined style={{ marginRight: '8px' }} />
          Каталог соискателей
        </Title>
        <Text type="secondary">
          Управление базой данных кандидатов и их профессиональными профилями
        </Text>
      </div>

      {/* Статистика */}
      <Row gutter={[16, 16]} style={{ 
        marginBottom: '24px', 
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap'
      }}>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Всего соискателей"
              value={stats.total}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Активных"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="На собеседовании"
              value={stats.interviewing}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Принятых"
              value={stats.hired}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
          <Card style={{ width: '100%', height: '100%', borderRadius: '8px' }}>
            <Statistic
              title="Средний рейтинг"
              value={stats.averageRating.toFixed(1)}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Фильтры и поиск */}
      <div style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle" style={{ 
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap'
        }}>
          <Col xs={24} sm={12} md={6} style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <Input
              placeholder="Поиск по имени, позиции, навыкам..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <Select
              placeholder="Статус"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Все статусы</Option>
              <Option value="active">Активные</Option>
              <Option value="interviewing">На собеседовании</Option>
              <Option value="hired">Принятые</Option>
              <Option value="rejected">Отклоненные</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4} style={{ flex: '1 1 auto', minWidth: '200px' }}>
            <Select
              placeholder="Опыт работы"
              value={experienceFilter}
              onChange={setExperienceFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">Любой опыт</Option>
              <Option value="0-1">0-1 год</Option>
              <Option value="1-3">1-3 года</Option>
              <Option value="3-5">3-5 лет</Option>
              <Option value="5+">5+ лет</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6} style={{ flex: '1 1 auto', minWidth: '250px' }}>
            <Select
              placeholder="Город"
              value={cityFilter}
              onChange={setCityFilter}
              style={{ width: '100%' }}
              allowClear
            >
              {Array.from(new Set(applicants.map(a => a.city))).map(city => (
                <Option key={city} value={city}>{city}</Option>
              ))}
            </Select>
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

      {/* Действия */}
      <div style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={() => setEditModalVisible(true)}
          >
            Добавить соискателя
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={handleExportToExcel}
            disabled={filteredApplicants.length === 0}
          >
            Экспорт в Excel
          </Button>
        </Space>
      </div>

      {/* Таблица соискателей */}
      <Table
        columns={columns}
        dataSource={filteredApplicants}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredApplicants.length,
          showSizeChanger: true,
          showQuickJumper: true,
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
        scroll={{ x: 1200 }}
        title={() => `Найдено соискателей: ${filteredApplicants.length}`}
      />

      {/* Модальное окно с деталями соискателя */}
      <Modal
        title={`Профиль соискателя: ${selectedApplicant?.lastName} ${selectedApplicant?.firstName}`}
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
        width={900}
      >
        {selectedApplicant && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Avatar 
                    size={120} 
                    src={selectedApplicant.photo}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#1890ff', marginBottom: '16px' }}
                  />
                  <div>
                    <Title level={4}>{selectedApplicant.lastName} {selectedApplicant.firstName}</Title>
                    <Text type="secondary">{selectedApplicant.age} лет, {selectedApplicant.city}</Text>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Rate disabled defaultValue={selectedApplicant.rating} />
                    <div style={{ marginTop: '8px' }}>
                      <Tag color={getStatusColor(selectedApplicant.status)}>
                        {getStatusText(selectedApplicant.status)}
                      </Tag>
                    </div>
                  </div>
                </div>
              </Col>
              <Col span={16}>
                <Descriptions title="Контактная информация" bordered column={1}>
                  <Descriptions.Item label="Email">
                    {selectedApplicant.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Телефон">
                    {selectedApplicant.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Город">
                    {selectedApplicant.city}
                  </Descriptions.Item>
                  <Descriptions.Item label="Дата рождения">
                    {dayjs(selectedApplicant.birthDate).format('DD.MM.YYYY')}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider />

            <Descriptions title="Образование" bordered column={2}>
              <Descriptions.Item label="Уровень">
                {selectedApplicant.education}
              </Descriptions.Item>
              <Descriptions.Item label="Учебное заведение">
                {selectedApplicant.institution}
              </Descriptions.Item>
              <Descriptions.Item label="Год окончания">
                {selectedApplicant.graduationYear}
              </Descriptions.Item>
              <Descriptions.Item label="Специальность">
                {selectedApplicant.specialty}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Опыт работы" bordered column={2}>
              <Descriptions.Item label="Общий стаж">
                <Tag color={getExperienceColor(selectedApplicant.totalExperience)}>
                  {selectedApplicant.totalExperience} лет
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Последняя должность">
                {selectedApplicant.lastPosition}
              </Descriptions.Item>
              <Descriptions.Item label="Последняя компания">
                {selectedApplicant.lastCompany}
              </Descriptions.Item>
              <Descriptions.Item label="Описание опыта" span={2}>
                <div style={{ 
                  padding: '8px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedApplicant.workExperience}
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Желаемая позиция" bordered column={2}>
              <Descriptions.Item label="Должность">
                {selectedApplicant.desiredPosition}
              </Descriptions.Item>
              <Descriptions.Item label="Зарплата">
                {selectedApplicant.desiredSalary}
              </Descriptions.Item>
              <Descriptions.Item label="Готов к переезду">
                <Tag color={selectedApplicant.readyToRelocate ? 'green' : 'red'}>
                  {selectedApplicant.readyToRelocate ? 'Да' : 'Нет'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Готов к командировкам">
                <Tag color={selectedApplicant.readyToBusinessTrips ? 'green' : 'red'}>
                  {selectedApplicant.readyToBusinessTrips ? 'Да' : 'Нет'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Навыки и языки" bordered column={2}>
              <Descriptions.Item label="Профессиональные навыки" span={2}>
                <div style={{ marginBottom: '8px' }}>
                  {selectedApplicant.skills.map(skill => (
                    <Tag key={skill} color="blue" style={{ marginBottom: '4px' }}>
                      {skill}
                    </Tag>
                  ))}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Знание языков" span={2}>
                <div>
                  {selectedApplicant.languages.map(lang => (
                    <Tag key={lang} color="green" style={{ marginBottom: '4px' }}>
                      {lang}
                    </Tag>
                  ))}
                </div>
              </Descriptions.Item>
            </Descriptions>

            {selectedApplicant.additionalInfo && (
              <>
                <Divider />
                <Descriptions title="Дополнительная информация" bordered column={1}>
                  <Descriptions.Item>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '4px',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedApplicant.additionalInfo}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {selectedApplicant.notes && (
              <>
                <Divider />
                <Descriptions title="Заметки HR" bordered column={1}>
                  <Descriptions.Item>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#fff7e6', 
                      borderRadius: '4px',
                      border: '1px solid #ffd591',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {selectedApplicant.notes}
                    </div>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ApplicantsCatalog;

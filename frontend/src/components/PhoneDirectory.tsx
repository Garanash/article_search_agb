import React, { useState } from 'react';
import { 
  Card, 
  Input, 
  Table, 
  Space, 
  Button, 
  Typography, 
  Avatar, 
  Tag, 
  Tooltip,
  Modal,
  Descriptions,
  Divider,
  Row,
  Col,
  Select,
  message
} from 'antd';
import { 
  SearchOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  UserOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons';

const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

// Моковые данные для телефонного справочника
const mockEmployees = [
  {
    id: 1,
    name: 'Иванов Иван Иванович',
    position: 'Генеральный директор',
    department: 'Руководство',
    phone: '+7 (495) 123-45-67',
    mobile: '+7 (916) 123-45-67',
    email: 'ivanov@company.ru',
    office: 'Главный офис',
    floor: '5 этаж',
    room: '501',
    extension: '1001',
    isFavorite: true,
    status: 'online',
    avatar: 'ИИ'
  },
  {
    id: 2,
    name: 'Петрова Анна Сергеевна',
    position: 'Финансовый директор',
    department: 'Финансы',
    phone: '+7 (495) 123-45-68',
    mobile: '+7 (916) 123-45-68',
    email: 'petrova@company.ru',
    office: 'Главный офис',
    floor: '4 этаж',
    room: '401',
    extension: '1002',
    isFavorite: false,
    status: 'online',
    avatar: 'ПА'
  },
  {
    id: 3,
    name: 'Сидоров Алексей Петрович',
    position: 'Начальник отдела продаж',
    department: 'Продажи',
    phone: '+7 (495) 123-45-69',
    mobile: '+7 (916) 123-45-69',
    email: 'sidorov@company.ru',
    office: 'Главный офис',
    floor: '3 этаж',
    room: '301',
    extension: '1003',
    isFavorite: true,
    status: 'away',
    avatar: 'СА'
  },
  {
    id: 4,
    name: 'Козлова Елена Владимировна',
    position: 'HR менеджер',
    department: 'HR',
    phone: '+7 (495) 123-45-70',
    mobile: '+7 (916) 123-45-70',
    email: 'kozlova@company.ru',
    office: 'Главный офис',
    floor: '2 этаж',
    room: '201',
    extension: '1004',
    isFavorite: false,
    status: 'offline',
    avatar: 'КЕ'
  },
  {
    id: 5,
    name: 'Морозов Дмитрий Александрович',
    position: 'Ведущий разработчик',
    department: 'IT',
    phone: '+7 (495) 123-45-71',
    mobile: '+7 (916) 123-45-71',
    email: 'morozov@company.ru',
    office: 'Технопарк',
    floor: '1 этаж',
    room: '101',
    extension: '1005',
    isFavorite: true,
    status: 'online',
    avatar: 'МД'
  },
  {
    id: 6,
    name: 'Волкова Мария Игоревна',
    position: 'Менеджер по ВЭД',
    department: 'ВЭД',
    phone: '+7 (495) 123-45-72',
    mobile: '+7 (916) 123-45-72',
    email: 'volkova@company.ru',
    office: 'Главный офис',
    floor: '3 этаж',
    room: '302',
    extension: '1006',
    isFavorite: false,
    status: 'online',
    avatar: 'ВМ'
  },
  {
    id: 7,
    name: 'Лебедев Сергей Николаевич',
    position: 'Логист',
    department: 'Логистика',
    phone: '+7 (495) 123-45-73',
    mobile: '+7 (916) 123-45-73',
    email: 'lebedev@company.ru',
    office: 'Склад',
    floor: '1 этаж',
    room: 'С-01',
    extension: '1007',
    isFavorite: false,
    status: 'away',
    avatar: 'ЛС'
  },
  {
    id: 8,
    name: 'Новикова Ольга Дмитриевна',
    position: 'Бухгалтер',
    department: 'Бухгалтерия',
    phone: '+7 (495) 123-45-74',
    mobile: '+7 (916) 123-45-74',
    email: 'novikova@company.ru',
    office: 'Главный офис',
    floor: '4 этаж',
    room: '402',
    extension: '1008',
    isFavorite: false,
    status: 'online',
    avatar: 'НО'
  }
];

// Отделы
const departments = [
  'Все отделы',
  'Руководство',
  'Финансы',
  'Продажи',
  'HR',
  'IT',
  'ВЭД',
  'Логистика',
  'Бухгалтерия'
];

// Статусы
const statusColors = {
  online: 'green',
  away: 'orange',
  offline: 'red'
};

const statusLabels = {
  online: 'В сети',
  away: 'Отошел',
  offline: 'Не в сети'
};

const PhoneDirectory: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('Все отделы');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [employees, setEmployees] = useState(mockEmployees);

  // Фильтрация сотрудников
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchText.toLowerCase()) ||
                         employee.phone.includes(searchText) ||
                         employee.email.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'Все отделы' || employee.department === selectedDepartment;
    const matchesFavorites = !showFavoritesOnly || employee.isFavorite;
    
    return matchesSearch && matchesDepartment && matchesFavorites;
  });

  // Переключение избранного
  const toggleFavorite = (employeeId: number) => {
    setEmployees(prev => 
      prev.map(emp => 
        emp.id === employeeId 
          ? { ...emp, isFavorite: !emp.isFavorite }
          : emp
      )
    );
    message.success('Список избранного обновлен');
  };

  // Показать детали сотрудника
  const showEmployeeDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setIsModalVisible(true);
  };

  // Колонки таблицы
  const columns = [
    {
      title: 'Сотрудник',
      key: 'name',
      render: (record: any) => (
        <Space>
          <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
            {record.avatar}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.position}</div>
            <div style={{ fontSize: '11px', color: '#999' }}>{record.department}</div>
          </div>
        </Space>
      ),
      width: 250
    },
    {
      title: 'Контакты',
      key: 'contacts',
      render: (record: any) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <PhoneOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
            <Text copyable>{record.phone}</Text>
            {record.extension && (
              <Tag style={{ marginLeft: '8px' }}>
                доб. {record.extension}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <PhoneOutlined style={{ marginRight: '4px' }} />
            {record.mobile}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            <MailOutlined style={{ marginRight: '4px' }} />
            {record.email}
          </div>
        </div>
      ),
      width: 200
    },
    {
      title: 'Расположение',
      key: 'location',
      render: (record: any) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <EnvironmentOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
            {record.office}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.floor}, каб. {record.room}
          </div>
        </div>
      ),
      width: 150
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: any) => (
        <Tag color={statusColors[record.status as keyof typeof statusColors]}>
          {statusLabels[record.status as keyof typeof statusLabels]}
        </Tag>
      ),
      width: 100
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title={record.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}>
            <Button
              type="text"
              icon={record.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={() => toggleFavorite(record.id)}
            />
          </Tooltip>
          <Tooltip title="Подробная информация">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => showEmployeeDetails(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 100
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Title level={3}>
            <TeamOutlined style={{ marginRight: '8px' }} />
            Телефонный справочник
          </Title>
          <Text type="secondary">
            Поиск и контакты сотрудников компании
          </Text>
        </div>

        {/* Фильтры и поиск */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Поиск по имени, должности, телефону или email..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedDepartment}
              onChange={setSelectedDepartment}
              style={{ width: '100%' }}
              placeholder="Выберите отдел"
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              type={showFavoritesOnly ? 'primary' : 'default'}
              icon={<StarOutlined />}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{ width: '100%' }}
            >
              {showFavoritesOnly ? 'Все контакты' : 'Только избранные'}
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Text type="secondary">
              Найдено: {filteredEmployees.length}
            </Text>
          </Col>
        </Row>

        {/* Таблица сотрудников */}
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} из ${total} сотрудников`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Модальное окно с деталями сотрудника */}
      <Modal
        title={
          <Space>
            <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
              {selectedEmployee?.avatar}
            </Avatar>
            <span>{selectedEmployee?.name}</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={600}
      >
        {selectedEmployee && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Должность">
                {selectedEmployee.position}
              </Descriptions.Item>
              <Descriptions.Item label="Отдел">
                <Tag color="blue">{selectedEmployee.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={statusColors[selectedEmployee.status as keyof typeof statusColors]}>
                  {statusLabels[selectedEmployee.status as keyof typeof statusLabels]}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Title level={5}>
              <PhoneOutlined style={{ marginRight: '8px' }} />
              Контактная информация
            </Title>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Рабочий телефон">
                <Text copyable>{selectedEmployee.phone}</Text>
                {selectedEmployee.extension && (
                  <Tag style={{ marginLeft: '8px' }}>
                    доб. {selectedEmployee.extension}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Мобильный телефон">
                <Text copyable>{selectedEmployee.mobile}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Text copyable>{selectedEmployee.email}</Text>
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Title level={5}>
              <EnvironmentOutlined style={{ marginRight: '8px' }} />
              Расположение
            </Title>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Офис">
                {selectedEmployee.office}
              </Descriptions.Item>
              <Descriptions.Item label="Этаж">
                {selectedEmployee.floor}
              </Descriptions.Item>
              <Descriptions.Item label="Кабинет">
                {selectedEmployee.room}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PhoneDirectory; 
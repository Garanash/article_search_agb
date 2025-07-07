import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Table, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Select, 
  Upload, 
  message, 
  Row, 
  Col,
  Divider,
  Descriptions,
  Badge,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  FileTextOutlined, 
  PlusOutlined, 
  EyeOutlined, 
  DownloadOutlined, 
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  LogoutOutlined,
  FileProtectOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Типы документов
const documentTypes = {
  vacation: {
    title: 'Заявление на отпуск',
    icon: <CalendarOutlined />,
    color: 'blue',
    fields: [
      { name: 'vacationType', label: 'Тип отпуска', type: 'select', required: true },
      { name: 'startDate', label: 'Дата начала', type: 'date', required: true },
      { name: 'endDate', label: 'Дата окончания', type: 'date', required: true },
      { name: 'reason', label: 'Причина', type: 'textarea', required: false }
    ],
    options: {
      vacationType: [
        { value: 'annual', label: 'Ежегодный оплачиваемый отпуск' },
        { value: 'sick', label: 'Больничный лист' },
        { value: 'unpaid', label: 'Отпуск без сохранения зарплаты' },
        { value: 'maternity', label: 'Декретный отпуск' },
        { value: 'study', label: 'Учебный отпуск' }
      ]
    }
  },
  payment: {
    title: 'Заявление на выплаты',
    icon: <DollarOutlined />,
    color: 'green',
    fields: [
      { name: 'paymentType', label: 'Тип выплаты', type: 'select', required: true },
      { name: 'amount', label: 'Сумма', type: 'input', required: true },
      { name: 'reason', label: 'Обоснование', type: 'textarea', required: true },
      { name: 'urgency', label: 'Срочность', type: 'select', required: true }
    ],
    options: {
      paymentType: [
        { value: 'bonus', label: 'Премия' },
        { value: 'overtime', label: 'Сверхурочные' },
        { value: 'travel', label: 'Командировочные' },
        { value: 'compensation', label: 'Компенсация расходов' },
        { value: 'other', label: 'Прочие выплаты' }
      ],
      urgency: [
        { value: 'low', label: 'Обычная' },
        { value: 'medium', label: 'Средняя' },
        { value: 'high', label: 'Высокая' }
      ]
    }
  },
  resignation: {
    title: 'Заявление на увольнение',
    icon: <LogoutOutlined />,
    color: 'red',
    fields: [
      { name: 'resignationDate', label: 'Дата увольнения', type: 'date', required: true },
      { name: 'reason', label: 'Причина увольнения', type: 'textarea', required: true },
      { name: 'noticePeriod', label: 'Срок предупреждения', type: 'select', required: true }
    ],
    options: {
      noticePeriod: [
        { value: '2_weeks', label: '2 недели' },
        { value: '1_month', label: '1 месяц' },
        { value: '2_months', label: '2 месяца' },
        { value: 'immediate', label: 'По согласованию' }
      ]
    }
  },
  instruction: {
    title: 'Служебная инструкция',
    icon: <FileProtectOutlined />,
    color: 'purple',
    fields: [],
    isPrintable: true
  }
};

// Моковые данные документов
const mockDocuments = [
  {
    id: 1,
    type: 'vacation',
    title: 'Заявление на отпуск',
    status: 'pending',
    createdBy: 'Иванов И.И.',
    createdDate: '2024-01-15',
    lastModified: '2024-01-15',
    approver: 'Петрова А.С.',
    data: {
      vacationType: 'annual',
      startDate: '2024-02-01',
      endDate: '2024-02-14',
      reason: 'Ежегодный отпуск'
    }
  },
  {
    id: 2,
    type: 'payment',
    title: 'Заявление на выплаты',
    status: 'approved',
    createdBy: 'Сидоров А.П.',
    createdDate: '2024-01-10',
    lastModified: '2024-01-12',
    approver: 'Иванов И.И.',
    data: {
      paymentType: 'bonus',
      amount: '50000',
      reason: 'Премия за отличную работу в Q4 2023',
      urgency: 'medium'
    }
  },
  {
    id: 3,
    type: 'resignation',
    title: 'Заявление на увольнение',
    status: 'rejected',
    createdBy: 'Козлова Е.В.',
    createdDate: '2024-01-08',
    lastModified: '2024-01-10',
    approver: 'Иванов И.И.',
    data: {
      resignationDate: '2024-02-01',
      reason: 'Переход на другую работу',
      noticePeriod: '1_month'
    }
  }
];

// Статусы документов
const statusConfig = {
  pending: { color: '#FCB813', label: 'На согласовании', icon: <ClockCircleOutlined /> },
  approved: { color: 'green', label: 'Согласовано', icon: <CheckOutlined /> },
  rejected: { color: 'red', label: 'Отклонено', icon: <CloseOutlined /> },
  draft: { color: 'default', label: 'Черновик', icon: <FileTextOutlined /> }
};

const DocumentManager: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [documents, setDocuments] = useState(mockDocuments);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [form] = Form.useForm();

  // Фильтрация документов
  const myDocuments = documents.filter(doc => doc.createdBy === (user?.username || ''));
  const pendingApprovals = documents.filter(doc => 
    doc.status === 'pending' && doc.approver === (user?.username || '')
  );

  // Создание нового документа
  const handleCreateDocument = (type: string) => {
    setSelectedDocumentType(type);
    setIsCreateModalVisible(true);
    form.resetFields();
  };

  // Отправка документа на согласование
  const handleSubmitDocument = async (values: any) => {
    const newDocument = {
      id: Date.now(),
      type: selectedDocumentType,
      title: documentTypes[selectedDocumentType as keyof typeof documentTypes].title,
      status: 'pending',
      createdBy: user?.username || '',
      createdDate: dayjs().format('YYYY-MM-DD'),
      lastModified: dayjs().format('YYYY-MM-DD'),
      approver: 'Иванов И.И.', // В реальной системе - руководитель подразделения
      data: values
    };

    setDocuments(prev => [newDocument, ...prev]);
    setIsCreateModalVisible(false);
    message.success('Документ отправлен на согласование');
  };

  // Просмотр документа
  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsViewModalVisible(true);
  };

  // Согласование документа
  const handleApproveDocument = (documentId: number, approved: boolean) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { 
              ...doc, 
              status: approved ? 'approved' : 'rejected',
              lastModified: dayjs().format('YYYY-MM-DD')
            }
          : doc
      )
    );
    message.success(approved ? 'Документ согласован' : 'Документ отклонен');
  };

  // Печать служебной инструкции
  const handlePrintInstruction = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Служебная инструкция</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h3 { color: #1890ff; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Служебная инструкция</h1>
              <p>Сотрудник: ${user?.username || 'Не указан'}</p>
              <p>Должность: ${user?.position || 'Не указана'}</p>
              <p>Дата печати: ${dayjs().format('DD.MM.YYYY')}</p>
            </div>
            
            <div class="section">
              <h3>1. Общие положения</h3>
              <p>Настоящая служебная инструкция определяет обязанности, права и ответственность сотрудника.</p>
            </div>
            
            <div class="section">
              <h3>2. Должностные обязанности</h3>
              <ul>
                <li>Выполнение поручений руководителя</li>
                <li>Соблюдение трудовой дисциплины</li>
                <li>Соблюдение правил техники безопасности</li>
                <li>Выполнение норм выработки</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>3. Права</h3>
              <ul>
                <li>Получение информации, необходимой для выполнения обязанностей</li>
                <li>Внесение предложений по улучшению работы</li>
                <li>Требование создания условий для выполнения обязанностей</li>
              </ul>
            </div>
            
            <div class="section">
              <h3>4. Ответственность</h3>
              <p>Сотрудник несет ответственность за качество и своевременность выполнения возложенных обязанностей.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Колонки для таблицы документов
  const documentColumns = [
    {
      title: 'Документ',
      key: 'title',
      render: (record: any) => (
        <Space>
          <span style={{ color: documentTypes[record.type as keyof typeof documentTypes]?.color }}>
            {documentTypes[record.type as keyof typeof documentTypes]?.icon}
          </span>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.title}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Создан: {dayjs(record.createdDate).format('DD.MM.YYYY')}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: 'Статус',
      key: 'status',
      render: (record: any) => {
        const status = statusConfig[record.status as keyof typeof statusConfig];
        return (
          <Badge 
            status={status.color as any} 
            text={
              <Space>
                {status.icon}
                {status.label}
              </Space>
            }
          />
        );
      }
    },
    {
      title: 'Согласующий',
      key: 'approver',
      render: (record: any) => (
        <Space>
          <UserOutlined />
          {record.approver}
        </Space>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDocument(record)}
            />
          </Tooltip>
          {record.status === 'approved' && (
            <Tooltip title="Скачать">
              <Button
                type="text"
                icon={<DownloadOutlined />}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // Колонки для согласований
  const approvalColumns = [
    ...documentColumns.slice(0, -1),
    {
      title: 'Действия',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDocument(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Согласовать документ?"
            onConfirm={() => handleApproveDocument(record.id, true)}
          >
            <Button type="primary" icon={<CheckOutlined />}>
              Согласовать
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Отклонить документ?"
            onConfirm={() => handleApproveDocument(record.id, false)}
          >
            <Button danger icon={<CloseOutlined />}>
              Отклонить
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <Title level={3}>
          <FileTextOutlined style={{ marginRight: '8px' }} />
          Документы и заявления
        </Title>
        <Text type="secondary">
          Управление служебными документами и заявлениями
        </Text>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleCreateDocument('vacation')}
          >
            Заявление на отпуск
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleCreateDocument('payment')}
          >
            Заявление на выплаты
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleCreateDocument('resignation')}
          >
            Заявление на увольнение
          </Button>
          <Button 
            icon={<PrinterOutlined />}
            onClick={handlePrintInstruction}
          >
            Печать инструкции
          </Button>
        </Space>
      </div>

      <Table
        dataSource={myDocuments}
        columns={documentColumns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        title={() => 'Мои документы'}
      />

      {isAdmin && (
        <Table
          dataSource={pendingApprovals}
          columns={approvalColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          title={() => 'Документы на согласование'}
        />
      )}

      {/* Модальное окно создания документа */}
      <Modal
        title={`Создание ${selectedDocumentType ? documentTypes[selectedDocumentType as keyof typeof documentTypes]?.title : ''}`}
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitDocument}
        >
          {selectedDocumentType && documentTypes[selectedDocumentType as keyof typeof documentTypes]?.fields.map((field: any) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={field.required ? [{ required: true, message: `Поле "${field.label}" обязательно` }] : []}
            >
              {field.type === 'select' ? (
                <Select placeholder={`Выберите ${field.label.toLowerCase()}`}>
                  {(documentTypes[selectedDocumentType as keyof typeof documentTypes] as any)?.options?.[field.name]?.map((option: any) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              ) : field.type === 'date' ? (
                <DatePicker style={{ width: '100%' }} />
              ) : field.type === 'textarea' ? (
                <TextArea rows={4} />
              ) : (
                <Input />
              )}
            </Form.Item>
          ))}
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                Отправить на согласование
              </Button>
              <Button onClick={() => setIsCreateModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно просмотра документа */}
      <Modal
        title={
          <Space>
            {selectedDocument && documentTypes[selectedDocument.type as keyof typeof documentTypes]?.icon}
            {selectedDocument?.title}
          </Space>
        }
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={600}
      >
        {selectedDocument && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Статус">
                <Badge 
                  status={statusConfig[selectedDocument.status as keyof typeof statusConfig].color as any} 
                  text={statusConfig[selectedDocument.status as keyof typeof statusConfig].label}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Создан">
                {dayjs(selectedDocument.createdDate).format('DD.MM.YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Последнее изменение">
                {dayjs(selectedDocument.lastModified).format('DD.MM.YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Согласующий">
                {selectedDocument.approver}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider />
            
            <Title level={5}>Данные документа</Title>
            <Descriptions column={1} bordered>
              {Object.entries(selectedDocument.data).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {String(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
};

export default DocumentManager; 
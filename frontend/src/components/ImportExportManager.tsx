import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Typography, 
  Row, 
  Col, 
  Upload,
  Checkbox,
  Divider,
  Alert,
  Progress,
  Tabs,
  List,
  Descriptions
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface TableInfo {
  name: string;
  display_name: string;
  record_count: number;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  name: string;
  display_name: string;
  type: string;
  nullable: boolean;
  is_primary: boolean;
}

interface ImportJob {
  id: string;
  table_name: string;
  file_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  records_processed?: number;
  records_total?: number;
}

interface ExportJob {
  id: string;
  table_name: string;
  format: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  completed_at?: string;
  download_url?: string;
  file_size?: number;
}

const ImportExportManager: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableInfo | null>(null);
  const [importForm] = Form.useForm();
  const [exportForm] = Form.useForm();
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  useEffect(() => {
    loadTables();
    loadImportJobs();
    loadExportJobs();
  }, []);

  const loadTables = async () => {
    try {
      const response = await fetch('/api/import-export/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      } else {
        message.error('Ошибка загрузки списка таблиц');
      }
    } catch (error) {
      console.error('Ошибка загрузки таблиц:', error);
      message.error('Ошибка загрузки таблиц');
    }
  };

  const loadImportJobs = async () => {
    try {
      const response = await fetch('/api/import-export/import-jobs');
      if (response.ok) {
        const data = await response.json();
        setImportJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач импорта:', error);
    }
  };

  const loadExportJobs = async () => {
    try {
      const response = await fetch('/api/import-export/export-jobs');
      if (response.ok) {
        const data = await response.json();
        setExportJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки задач экспорта:', error);
    }
  };

  const handleImport = async (values: any) => {
    if (!selectedTable) return;

    try {
      const formData = new FormData();
      formData.append('table_name', selectedTable.name);
      formData.append('file', values.file[0].originFileObj);
      formData.append('columns', JSON.stringify(selectedColumns));
      formData.append('options', JSON.stringify({
        skip_header: values.skip_header,
        delimiter: values.delimiter,
        encoding: values.encoding
      }));

      const response = await fetch('/api/import-export/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        message.success('Импорт запущен');
        setImportModalVisible(false);
        importForm.resetFields();
        setSelectedColumns([]);
        loadImportJobs();
      } else {
        const error = await response.json();
        message.error(error.detail || 'Ошибка запуска импорта');
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      message.error('Ошибка импорта');
    }
  };

  const handleExport = async (values: any) => {
    if (!selectedTable) return;

    try {
      const response = await fetch('/api/import-export/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: selectedTable.name,
          format: values.format,
          columns: selectedColumns,
          filters: values.filters,
          options: {
            include_headers: values.include_headers,
            date_format: values.date_format,
            number_format: values.number_format
          }
        })
      });

      if (response.ok) {
        message.success('Экспорт запущен');
        setExportModalVisible(false);
        exportForm.resetFields();
        setSelectedColumns([]);
        loadExportJobs();
      } else {
        const error = await response.json();
        message.error(error.detail || 'Ошибка запуска экспорта');
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      message.error('Ошибка экспорта');
    }
  };

  const downloadExport = async (job: ExportJob) => {
    if (!job.download_url) return;

    try {
      const response = await fetch(job.download_url);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${job.table_name}_${dayjs(job.created_at).format('YYYY-MM-DD_HH-mm')}.${job.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        message.error('Ошибка скачивания файла');
      }
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      message.error('Ошибка скачивания файла');
    }
  };

  const deleteJob = async (jobId: string, type: 'import' | 'export') => {
    try {
      const endpoint = type === 'import' ? 'import-jobs' : 'export-jobs';
      const response = await fetch(`/api/import-export/${endpoint}/${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        message.success('Задача удалена');
        if (type === 'import') {
          loadImportJobs();
        } else {
          loadExportJobs();
        }
      } else {
        message.error('Ошибка удаления задачи');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      message.error('Ошибка удаления задачи');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'pending': return 'default';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'in_progress': return <ReloadOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      case 'failed': return <ExclamationCircleOutlined />;
      default: return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const importColumns = [
    {
      title: 'Таблица',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Файл',
      dataIndex: 'file_name',
      key: 'file_name',
      render: (text: string) => <Text>{text}</Text>
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status === 'completed' ? 'Завершено' : 
           status === 'in_progress' ? 'В процессе' : 
           status === 'pending' ? 'Ожидает' : 'Ошибка'}
        </Tag>
      )
    },
    {
      title: 'Прогресс',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: ImportJob) => (
        <div>
          <Progress percent={progress} size="small" />
          {record.records_processed && record.records_total && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.records_processed} / {record.records_total}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm')
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: ImportJob) => (
        <Space>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => deleteJob(record.id, 'import')}
          >
            Удалить
          </Button>
        </Space>
      )
    }
  ];

  const exportColumns = [
    {
      title: 'Таблица',
      dataIndex: 'table_name',
      key: 'table_name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Формат',
      dataIndex: 'format',
      key: 'format',
      render: (format: string) => <Tag color="blue">{format.toUpperCase()}</Tag>
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status === 'completed' ? 'Завершено' : 
           status === 'in_progress' ? 'В процессе' : 
           status === 'pending' ? 'Ожидает' : 'Ошибка'}
        </Tag>
      )
    },
    {
      title: 'Прогресс',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => <Progress percent={progress} size="small" />
    },
    {
      title: 'Размер файла',
      dataIndex: 'file_size',
      key: 'file_size',
      render: (size: number) => size ? formatFileSize(size) : '-'
    },
    {
      title: 'Дата создания',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm')
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: ExportJob) => (
        <Space>
          {record.status === 'completed' && record.download_url && (
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => downloadExport(record)}
            >
              Скачать
            </Button>
          )}
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => deleteJob(record.id, 'export')}
          >
            Удалить
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Импорт и экспорт данных</Title>
      
      <Tabs defaultActiveKey="import" onChange={() => {}}>
        <TabPane tab="Импорт данных" key="import">
          <Card style={{ marginBottom: 24 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<UploadOutlined />} 
                onClick={() => setImportModalVisible(true)}
              >
                Импортировать данные
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadImportJobs}
              >
                Обновить
              </Button>
            </Space>
          </Card>

          <Card title="Задачи импорта">
            <Table
              columns={importColumns}
              dataSource={importJobs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Всего: ${total} задач`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Экспорт данных" key="export">
          <Card style={{ marginBottom: 24 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={() => setExportModalVisible(true)}
              >
                Экспортировать данные
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadExportJobs}
              >
                Обновить
              </Button>
            </Space>
          </Card>

          <Card title="Задачи экспорта">
            <Table
              columns={exportColumns}
              dataSource={exportJobs}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Всего: ${total} задач`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Структура БД" key="structure">
          <Card title="Доступные таблицы">
            <List
              dataSource={tables}
              renderItem={(table) => (
                <List.Item
                  actions={[
                    <Button 
                      key="import" 
                      type="link" 
                      onClick={() => {
                        setSelectedTable(table);
                        setImportModalVisible(true);
                      }}
                    >
                      Импорт
                    </Button>,
                    <Button 
                      key="export" 
                      type="link" 
                      onClick={() => {
                        setSelectedTable(table);
                        setExportModalVisible(true);
                      }}
                    >
                      Экспорт
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={table.display_name}
                    description={
                      <div>
                        <Text type="secondary">Таблица: {table.name}</Text>
                        <br />
                        <Text type="secondary">Записей: {table.record_count}</Text>
                        <br />
                        <Text type="secondary">Колонок: {table.columns.length}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Модальное окно импорта */}
      <Modal
        title={`Импорт в таблицу: ${selectedTable?.display_name || ''}`}
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTable && (
          <Form form={importForm} onFinish={handleImport} layout="vertical">
            <Form.Item name="file" label="Файл для импорта" rules={[{ required: true, message: 'Выберите файл' }]}>
              <Upload.Dragger
                name="file"
                accept=".csv,.xlsx,.xls,.json"
                beforeUpload={() => false}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">Нажмите или перетащите файл для загрузки</p>
                <p className="ant-upload-hint">
                  Поддерживаемые форматы: CSV, Excel, JSON
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item label="Выберите колонки для импорта">
              <Checkbox.Group
                value={selectedColumns}
                onChange={setSelectedColumns}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 8]}>
                  {selectedTable.columns.map((column) => (
                    <Col span={8} key={column.name}>
                      <Checkbox value={column.name}>
                        <div>
                          <Text strong>{column.display_name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {column.name} ({column.type})
                            {column.is_primary && <Tag color="red">PK</Tag>}
                            {!column.nullable && <Tag color="orange">NOT NULL</Tag>}
                          </Text>
                        </div>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item name="skip_header" label="Параметры импорта">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox name="skip_header">Пропустить заголовок</Checkbox>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="delimiter" label="Разделитель">
                      <Select defaultValue=",">
                        <Option value=",">Запятая (,)</Option>
                        <Option value=";">Точка с запятой (;)</Option>
                        <Option value="\t">Табуляция</Option>
                        <Option value="|">Вертикальная черта (|)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="encoding" label="Кодировка">
                      <Select defaultValue="utf-8">
                        <Option value="utf-8">UTF-8</Option>
                        <Option value="windows-1251">Windows-1251</Option>
                        <Option value="iso-8859-1">ISO-8859-1</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Space>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Начать импорт
                </Button>
                <Button onClick={() => setImportModalVisible(false)}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Модальное окно экспорта */}
      <Modal
        title={`Экспорт из таблицы: ${selectedTable?.display_name || ''}`}
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTable && (
          <Form form={exportForm} onFinish={handleExport} layout="vertical">
            <Form.Item name="format" label="Формат экспорта" rules={[{ required: true, message: 'Выберите формат' }]}>
              <Select placeholder="Выберите формат">
                <Option value="csv">CSV</Option>
                <Option value="xlsx">Excel (XLSX)</Option>
                <Option value="json">JSON</Option>
                <Option value="xml">XML</Option>
                <Option value="sql">SQL</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Выберите колонки для экспорта">
              <Checkbox.Group
                value={selectedColumns}
                onChange={setSelectedColumns}
                style={{ width: '100%' }}
              >
                <Row gutter={[16, 8]}>
                  {selectedTable.columns.map((column) => (
                    <Col span={8} key={column.name}>
                      <Checkbox value={column.name}>
                        <div>
                          <Text strong>{column.display_name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {column.name} ({column.type})
                          </Text>
                        </div>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Form.Item name="filters" label="Фильтры (опционально)">
              <Input.TextArea 
                rows={3} 
                placeholder="SQL WHERE условие (например: status = 'active' AND created_at > '2024-01-01')"
              />
            </Form.Item>

            <Form.Item name="options" label="Дополнительные опции">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox name="include_headers" defaultChecked>Включить заголовки колонок</Checkbox>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="date_format" label="Формат даты">
                      <Select defaultValue="YYYY-MM-DD">
                        <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                        <Option value="DD.MM.YYYY">DD.MM.YYYY</Option>
                        <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="number_format" label="Формат чисел">
                      <Select defaultValue="standard">
                        <Option value="standard">Стандартный</Option>
                        <Option value="decimal">С запятой</Option>
                        <Option value="scientific">Научный</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Space>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Начать экспорт
                </Button>
                <Button onClick={() => setExportModalVisible(false)}>
                  Отмена
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ImportExportManager;

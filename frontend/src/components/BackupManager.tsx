import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Space, 
  Tag, 
  Progress, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Alert,
  Divider
} from 'antd';
import { 
  CloudUploadOutlined, 
  CloudDownloadOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface BackupInfo {
  id: string;
  name: string;
  type: 'full' | 'database' | 'files' | 'system';
  size: number;
  status: 'completed' | 'in_progress' | 'failed';
  created_at: string;
  description?: string;
  compression_ratio?: number;
  backup_path?: string;
}

interface BackupStats {
  total_backups: number;
  total_size: number;
  last_backup: string;
  next_scheduled: string;
  success_rate: number;
}

const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [createForm] = Form.useForm();
  const [restoreForm] = Form.useForm();

  useEffect(() => {
    loadBackups();
    loadStats();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/backup/list');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        message.error('Ошибка загрузки списка резервных копий');
      }
    } catch (error) {
      console.error('Ошибка загрузки резервных копий:', error);
      message.error('Ошибка загрузки резервных копий');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/backup/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const createBackup = async (values: any) => {
    try {
      const response = await fetch('/api/backup/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('Резервная копия создается...');
        setCreateModalVisible(false);
        createForm.resetFields();
        loadBackups();
        loadStats();
      } else {
        const error = await response.json();
        message.error(error.detail || 'Ошибка создания резервной копии');
      }
    } catch (error) {
      console.error('Ошибка создания резервной копии:', error);
      message.error('Ошибка создания резервной копии');
    }
  };

  const restoreBackup = async (values: any) => {
    if (!selectedBackup) return;

    try {
      const response = await fetch(`/api/backup/restore/${selectedBackup.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        message.success('Восстановление запущено...');
        setRestoreModalVisible(false);
        restoreForm.resetFields();
        setSelectedBackup(null);
      } else {
        const error = await response.json();
        message.error(error.detail || 'Ошибка восстановления');
      }
    } catch (error) {
      console.error('Ошибка восстановления:', error);
      message.error('Ошибка восстановления');
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/backup/delete/${backupId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        message.success('Резервная копия удалена');
        loadBackups();
        loadStats();
      } else {
        message.error('Ошибка удаления резервной копии');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      message.error('Ошибка удаления резервной копии');
    }
  };

  const downloadBackup = async (backup: BackupInfo) => {
    try {
      const response = await fetch(`/api/backup/download/${backup.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${backup.name}_${dayjs(backup.created_at).format('YYYY-MM-DD_HH-mm')}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        message.error('Ошибка скачивания резервной копии');
      }
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      message.error('Ошибка скачивания резервной копии');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'processing';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleOutlined />;
      case 'in_progress': return <ClockCircleOutlined />;
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

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: BackupInfo) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div><Text type="secondary" style={{ fontSize: '12px' }}>{record.description}</Text></div>
          )}
        </div>
      )
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeLabels = {
          'full': 'Полная',
          'database': 'База данных',
          'files': 'Файлы',
          'system': 'Система'
        };
        return <Tag color="blue">{typeLabels[type as keyof typeof typeLabels] || type}</Tag>;
      }
    },
    {
      title: 'Размер',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status === 'completed' ? 'Завершено' : 
           status === 'in_progress' ? 'В процессе' : 'Ошибка'}
        </Tag>
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
                  render: (_: any, record: BackupInfo) => (
        <Space>
          <Button 
            type="primary" 
            icon={<CloudDownloadOutlined />} 
            size="small"
            onClick={() => downloadBackup(record)}
            disabled={record.status !== 'completed'}
          >
            Скачать
          </Button>
          <Button 
            type="default" 
            icon={<ReloadOutlined />} 
            size="small"
            onClick={() => {
              setSelectedBackup(record);
              setRestoreModalVisible(true);
            }}
            disabled={record.status !== 'completed'}
          >
            Восстановить
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => deleteBackup(record.id)}
          >
            Удалить
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Управление резервными копиями</Title>
      
      {/* Статистика */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Всего копий" 
                value={stats.total_backups} 
                prefix={<DatabaseOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Общий размер" 
                value={formatFileSize(stats.total_size)} 
                prefix={<FileTextOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Последний бэкап" 
                value={dayjs(stats.last_backup).format('DD.MM.YYYY')} 
                prefix={<CheckCircleOutlined />} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Успешность" 
                value={stats.success_rate} 
                suffix="%" 
                prefix={<CheckCircleOutlined />} 
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Кнопки управления */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<CloudUploadOutlined />} 
            onClick={() => setCreateModalVisible(true)}
          >
            Создать резервную копию
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadBackups}
          >
            Обновить
          </Button>
        </Space>
      </Card>

      {/* Таблица резервных копий */}
      <Card title="Список резервных копий">
        <Table
          columns={columns}
          dataSource={backups}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Всего: ${total} копий`
          }}
        />
      </Card>

      {/* Модальное окно создания резервной копии */}
      <Modal
        title="Создать резервную копию"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={createForm} onFinish={createBackup} layout="vertical">
          <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input placeholder="Например: Полная копия системы" />
          </Form.Item>
          
          <Form.Item name="type" label="Тип резервной копии" rules={[{ required: true, message: 'Выберите тип' }]}>
            <Select placeholder="Выберите тип">
              <Option value="full">Полная копия (система + БД + файлы)</Option>
              <Option value="database">Только база данных</Option>
              <Option value="files">Только файлы</Option>
              <Option value="system">Только системные файлы</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="description" label="Описание">
            <Input.TextArea rows={3} placeholder="Дополнительное описание" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Создать
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно восстановления */}
      <Modal
        title="Восстановить из резервной копии"
        open={restoreModalVisible}
        onCancel={() => setRestoreModalVisible(false)}
        footer={null}
      >
        <Alert
          message="Внимание!"
          description="Восстановление из резервной копии перезапишет текущие данные. Убедитесь, что у вас есть актуальная резервная копия."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={restoreForm} onFinish={restoreBackup} layout="vertical">
          <Form.Item name="confirm" label="Подтверждение" rules={[{ required: true, message: 'Подтвердите восстановление' }]}>
            <Input placeholder="Введите 'ВОССТАНОВИТЬ' для подтверждения" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                Восстановить
              </Button>
              <Button onClick={() => setRestoreModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BackupManager;

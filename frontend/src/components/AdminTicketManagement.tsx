import React, { useState, useEffect } from 'react';
import { Table, Button, Select, Space, Row, Col, Tag, Modal, Typography, message } from 'antd';
import { apiClient } from '../api/api';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;

interface SupportTicket {
  id: number;
  user_id: number;
  title: string;
  description: string;
  department?: string;
  status: string;
  priority: string;
  assigned_to?: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  first_response_at?: string;
  estimated_resolution?: string;
  user_username: string;
  assigned_admin_username?: string;
}

const AdminTicketManagement: React.FC = () => {
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketDetailVisible, setTicketDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  useEffect(() => {
    loadUserTickets();
  }, [statusFilter, priorityFilter]);

  const loadUserTickets = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/support_tickets', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined
        }
      });
      setUserTickets(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
      message.error('Ошибка загрузки обращений');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      await apiClient.patch(`/api/support_tickets/${ticketId}`, { status });
      message.success('Статус обращения обновлен');
      loadUserTickets();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      message.error('Ошибка обновления статуса');
    }
  };

  const assignTicket = async (ticketId: number, adminId: number) => {
    try {
      await apiClient.patch(`/api/support_tickets/${ticketId}`, { assigned_to: adminId });
      message.success('Обращение назначено');
      loadUserTickets();
    } catch (error) {
      console.error('Ошибка назначения обращения:', error);
      message.error('Ошибка назначения обращения');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'blue';
      case 'in_progress': return 'orange';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const ticketColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Тема',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_username',
      key: 'user_username',
      width: 120,
    },
    {
      title: 'Отдел',
      dataIndex: 'department',
      key: 'department',
      width: 100,
      render: (department: string) => department || 'Не указан',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === 'open' ? 'Открыто' :
           status === 'in_progress' ? 'В работе' :
           status === 'resolved' ? 'Решено' : 'Закрыто'}
        </Tag>
      ),
    },
    {
      title: 'Приоритет',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority === 'urgent' ? 'Срочный' :
           priority === 'high' ? 'Высокий' :
           priority === 'medium' ? 'Средний' : 'Низкий'}
        </Tag>
      ),
    },
    {
      title: 'Создано',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (record: SupportTicket) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setSelectedTicket(record);
              setTicketDetailVisible(true);
            }}
          >
            Просмотр
          </Button>
          <Select
            size="small"
            value={record.status}
            style={{ width: 100 }}
            onChange={(value) => updateTicketStatus(record.id, value)}
          >
            <Option value="open">Открыто</Option>
            <Option value="in_progress">В работе</Option>
            <Option value="resolved">Решено</Option>
            <Option value="closed">Закрыто</Option>
          </Select>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="Фильтр по статусу"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">Все статусы</Option>
            <Option value="open">Открыто</Option>
            <Option value="in_progress">В работе</Option>
            <Option value="resolved">Решено</Option>
            <Option value="closed">Закрыто</Option>
          </Select>
        </Col>
        <Col>
          <Select
            placeholder="Фильтр по приоритету"
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 150 }}
          >
            <Option value="all">Все приоритеты</Option>
            <Option value="urgent">Срочный</Option>
            <Option value="high">Высокий</Option>
            <Option value="medium">Средний</Option>
            <Option value="low">Низкий</Option>
          </Select>
        </Col>
        <Col>
          <Button onClick={loadUserTickets} loading={loading}>
            Обновить
          </Button>
        </Col>
      </Row>

      <Table
        columns={ticketColumns}
        dataSource={userTickets}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Всего: ${total} обращений`,
        }}
        scroll={{ x: 1000 }}
      />

      {/* Модальное окно с деталями обращения */}
      <Modal
        title={`Обращение #${selectedTicket?.id}`}
        open={ticketDetailVisible}
        onCancel={() => {
          setTicketDetailVisible(false);
          setSelectedTicket(null);
        }}
        footer={[
          <Button key="close" onClick={() => setTicketDetailVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedTicket && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Пользователь: </Text>
                <Text>{selectedTicket.user_username}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Отдел: </Text>
                <Text>{selectedTicket.department || 'Не указан'}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong>Статус: </Text>
                <Tag color={getStatusColor(selectedTicket.status)}>
                  {selectedTicket.status === 'open' ? 'Открыто' :
                   selectedTicket.status === 'in_progress' ? 'В работе' :
                   selectedTicket.status === 'resolved' ? 'Решено' : 'Закрыто'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong>Приоритет: </Text>
                <Tag color={getPriorityColor(selectedTicket.priority)}>
                  {selectedTicket.priority === 'urgent' ? 'Срочный' :
                   selectedTicket.priority === 'high' ? 'Высокий' :
                   selectedTicket.priority === 'medium' ? 'Средний' : 'Низкий'}
                </Tag>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Text strong>Тема: </Text>
                <Text>{selectedTicket.title}</Text>
              </Col>
            </Row>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Text strong>Описание: </Text>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTicket.description}
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Создано: </Text>
                <Text>{dayjs(selectedTicket.created_at).format('DD.MM.YYYY HH:mm')}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Обновлено: </Text>
                <Text>{dayjs(selectedTicket.updated_at).format('DD.MM.YYYY HH:mm')}</Text>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTicketManagement;

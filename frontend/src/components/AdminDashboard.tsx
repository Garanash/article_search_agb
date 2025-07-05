import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tabs, Table, Button, Upload, message, Statistic, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined, DatabaseOutlined, CalendarOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { getAdminMetrics, exportTableCsv, importTableCsv } from '../api/adminApi';
import AdminSupportTickets from './AdminSupportTickets';

const { TabPane } = Tabs;

const TABLES = [
  { key: 'users', label: 'Пользователи' },
  { key: 'articles', label: 'Артикулы' },
  { key: 'suppliers', label: 'Поставщики' },
  { key: 'requests', label: 'Запросы' },
  { key: 'analytics', label: 'Аналитика' },
  { key: 'bots', label: 'Боты' },
  { key: 'support_messages', label: 'Сообщения поддержки' },
  { key: 'tickets', label: 'Тикеты' },
  { key: 'events', label: 'События' },
  { key: 'documents', label: 'Документы' },
  { key: 'email_templates', label: 'Email шаблоны' },
];

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTable, setActiveTable] = useState('users');
  const [csvLoading, setCsvLoading] = useState(false);

  useEffect(() => {
    getAdminMetrics().then(setMetrics).finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setCsvLoading(true);
    try {
      const blob = await exportTableCsv(activeTable);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTable}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      message.error('Ошибка экспорта CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleImport = async (file: any) => {
    setCsvLoading(true);
    try {
      await importTableCsv(activeTable, file);
      message.success('Импорт завершён');
    } catch (e) {
      message.error('Ошибка импорта CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  if (loading) return <Spin size="large" style={{ marginTop: 100 }} />;

  return (
    <div style={{ padding: 24 }}>
      <h2>Админ-дэшборд</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}><Card><Statistic title="Пользователи" value={metrics.users} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="Артикулы" value={metrics.articles} prefix={<FileTextOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="Поставщики" value={metrics.suppliers} prefix={<DatabaseOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="Тикеты" value={metrics.tickets} prefix={<DatabaseOutlined />} /></Card></Col>
        <Col span={4}><Card><Statistic title="События" value={metrics.events} prefix={<CalendarOutlined />} /></Card></Col>
      </Row>
      <Tabs defaultActiveKey="tables">
        <TabPane tab="Таблицы (CSV)" key="tables">
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col>
              <select value={activeTable} onChange={e => setActiveTable(e.target.value)}>
                {TABLES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Col>
            <Col>
              <Button icon={<DownloadOutlined />} loading={csvLoading} onClick={handleExport}>Экспорт CSV</Button>
            </Col>
            <Col>
              <Upload beforeUpload={file => { handleImport(file); return false; }} showUploadList={false} accept=".csv">
                <Button icon={<UploadOutlined />} loading={csvLoading}>Импорт CSV</Button>
              </Upload>
            </Col>
          </Row>
          {/* Здесь будет таблица данных (можно реализовать позже) */}
          <div style={{ color: '#888', marginTop: 16 }}>Таблица данных появится здесь...</div>
        </TabPane>
        <TabPane tab="Календарь событий" key="calendar">
          <div style={{ color: '#888', marginTop: 16 }}>Календарь появится здесь...</div>
        </TabPane>
        <TabPane tab="Админка поддержки" key="support">
          <AdminSupportTickets />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminDashboard; 